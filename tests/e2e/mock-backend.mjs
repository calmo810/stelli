#!/usr/bin/env node
/**
 * A local Stelli backend for clicking through the app without touching the
 * live one.
 *
 * It speaks the same REST shape the Base44 SDK calls, keeps its records in the
 * in-memory database the unit tests use, and runs the REAL backend functions
 * from base44/functions against it (with the fake Stripe underneath, so no
 * money ever moves). Nothing is saved: restart it and the seed data is back.
 *
 *   npm run dev:mock        starts this and Vite together
 *
 * Sign in with any seeded email (see tests/e2e/seed.mjs) and any password, or
 * open the app with ?access_token=mock.<userId>, e.g. mock.u_creator.
 *
 * Uploaded files are served from /files on this server. The real profile rules
 * only accept https image addresses, so uploads are named
 * https://files.stelli.test/...; the e2e script maps that host back to here.
 */
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { createFakeBase44 } from '../helpers/fakeBase44.mjs';
import { installFakeStripe } from '../helpers/fakeStripe.mjs';
import { seed } from './seed.mjs';
import { seedImage } from './seedImages.mjs';

const PORT = Number(process.env.MOCK_PORT || 8787);
export const FILES_ORIGIN = 'https://files.stelli.test';

globalThis.__secrets = {
  STRIPE_SECRET_KEY: 'sk_live_fake',
  STRIPE_TEST_SECRET_KEY: 'sk_test_fake',
  STRIPE_LIVE_WEBHOOK_SECRET: 'whsec_mock',
  STRIPE_MODE: 'test',
  BASE44_APP_ID: 'app_mock',
};
installFakeStripe({ livemode: false });

const db = createFakeBase44();
const uploads = new Map(); // id -> { type, bytes }

/** Stores an upload and hands back the https address the app will keep. */
db.integrations.Core.UploadFile = async ({ file }) => {
  const id = `${randomUUID().slice(0, 8)}-${String(file?.name || 'file').replace(/[^a-z0-9.]+/gi, '-')}`;
  uploads.set(id, { type: file?.type || 'application/octet-stream', bytes: Buffer.from(await file.arrayBuffer()) });
  return { file_url: `${FILES_ORIGIN}/uploads/${id}` };
};
db.integrations.Core.UploadPrivateFile = async ({ file }) => {
  const { file_url } = await db.integrations.Core.UploadFile({ file });
  return { file_uri: file_url };
};
db.integrations.Core.CreateFileSignedUrl = async ({ file_uri }) => ({ signed_url: file_uri });

const ENTITIES = readdirSync(new URL('../../base44/entities/', import.meta.url)).map((name) => name.replace(/\.jsonc$/, ''));

/** Back to the seed data: every record wiped, then the starting set put back. */
async function reset() {
  for (const name of ENTITIES) db.entities[name]._rows.clear();
  uploads.clear();
  db.emails.length = 0;
  await seed(db, FILES_ORIGIN);
}
await reset();

/* ---------- who is asking ---------- */

async function userFor(req) {
  const header = req.headers.authorization || '';
  const match = /^Bearer mock\.(.+)$/.exec(header);
  if (!match) return null;
  const [user] = await db.entities.User.filter({ id: match[1] });
  return user || null;
}

/** Records only their people may read. Everything else is public, as on the site. */
const PRIVATE = {
  Booking: ['client_id', 'creator_id'],
  Message: ['client_id', 'creator_id'],
  Quote: ['client_id', 'creator_id'],
  BookingContract: ['client_id', 'creator_id', 'creator_user_id'],
  PhotoRelease: ['client_id', 'creator_id'],
  AgreementAcceptance: ['user_id'],
  ManualPayout: ['creator_user_id'],
  DeliveryPhoto: ['client_id', 'creator_id'],
};
const ADMIN_ONLY = ['CreatorContact', 'AdminAuditLog', 'Report', 'StrayPayment', 'OneOffCharge', 'User'];
/** Fields on a creator record only its owner and founders see. */
const LENSMAN_PRIVATE = ['stripe_account_id', 'payouts_enabled', 'under_review_reason', 'pricing_tiers', 'profile_views'];

function visible(entity, rows, user) {
  if (user?.role === 'admin') return rows;
  if (ADMIN_ONLY.includes(entity)) return [];
  if (PRIVATE[entity]) {
    if (!user) return [];
    return rows.filter((row) => PRIVATE[entity].some((field) => row[field] && row[field] === user.id));
  }
  if (entity === 'Lensman') {
    // Same read rule as the real record: approved and not on hold, or your own.
    const readable = rows.filter(
      (row) => (row.status === 'approved' && row.under_review !== true) || (row.user_id && row.user_id === user?.id)
    );
    return readable.map((row) => {
      if (row.user_id && row.user_id === user?.id) return row;
      const copy = { ...row };
      for (const field of LENSMAN_PRIVATE) delete copy[field];
      return copy;
    });
  }
  return rows;
}

/* ---------- plumbing ---------- */

function send(res, status, body, headers = {}) {
  const payload = body === undefined ? '' : typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': '*',
    'cache-control': 'no-store',
    ...headers,
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const asJson = (buffer) => {
  if (!buffer.length) return {};
  try {
    return JSON.parse(buffer.toString('utf8'));
  } catch {
    return {};
  }
};

const withDates = (data) => ({ updated_date: new Date().toISOString(), ...data });

// Backend functions read "the current user" from one shared client, so they
// run one at a time.
let line = Promise.resolve();
function inLine(task) {
  const run = line.then(task, task);
  line = run.catch(() => {});
  return run;
}

const handlers = new Map();
async function loadFunction(name) {
  if (!handlers.has(name)) {
    const module = await import(new URL(`../../base44/functions/${name}/entry.ts`, import.meta.url).href);
    handlers.set(name, module.default);
  }
  return handlers.get(name);
}

/* ---------- routes ---------- */

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method.toUpperCase();
  if (method === 'OPTIONS') return send(res, 204);

  // POST /__mock/reset puts the seed data back, so a test run starts clean.
  if (path === '/__mock/reset' && method === 'POST') {
    await reset();
    return send(res, 200, { ok: true });
  }

  // Seed pictures and uploads.
  if (path.startsWith('/files/')) {
    const name = decodeURIComponent(path.slice('/files/'.length));
    if (name.startsWith('uploads/')) {
      const file = uploads.get(name.slice('uploads/'.length));
      if (!file) return send(res, 404, { message: 'No such file' });
      return send(res, 200, file.bytes, { 'content-type': file.type, 'cache-control': 'max-age=3600' });
    }
    return send(res, 200, seedImage(name), { 'content-type': 'image/svg+xml', 'cache-control': 'max-age=3600' });
  }

  if (/^\/api\/apps\/public\/prod\/public-settings\/by-id\//.test(path)) {
    return send(res, 200, { id: path.split('/').pop(), public_settings: {} });
  }
  if (/^\/api\/apps\/public\/login-info\/by-id\//.test(path)) {
    return send(res, 200, { auth_config: { mfa_policy: 'off' } });
  }
  if (path.startsWith('/api/app-logs/')) return send(res, 200, {});

  const match = /^\/api\/apps\/([^/]+)\/(.+)$/.exec(path);
  if (!match) return send(res, 404, { message: `No mock route for ${path}` });
  const rest = match[2];
  const user = await userFor(req);
  const raw = method === 'GET' ? Buffer.alloc(0) : await readBody(req);

  /* auth */
  if (rest === 'auth/login') {
    const { email } = asJson(raw);
    const [found] = await db.entities.User.filter({ email: String(email || '').trim().toLowerCase() });
    if (!found) return send(res, 401, { detail: 'Invalid email or password' });
    return send(res, 200, { access_token: `mock.${found.id}`, user: found });
  }
  if (rest === 'auth/register') {
    const { email } = asJson(raw);
    const clean = String(email || '').trim().toLowerCase();
    const [taken] = await db.entities.User.filter({ email: clean });
    if (taken) return send(res, 400, { detail: 'An account with this email already exists.' });
    await db.entities.User.create({ email: clean, full_name: clean.split('@')[0], role: 'user' });
    return send(res, 200, { ok: true });
  }
  if (rest === 'auth/verify-otp') {
    const { email } = asJson(raw);
    const [found] = await db.entities.User.filter({ email: String(email || '').trim().toLowerCase() });
    if (!found) return send(res, 400, { detail: 'Invalid verification code' });
    return send(res, 200, { access_token: `mock.${found.id}`, user: found });
  }
  if (rest.startsWith('auth/')) return send(res, 200, { ok: true });
  if (rest.startsWith('analytics') || rest.startsWith('agents')) return send(res, 200, {});

  /* the signed-in account */
  if (rest === 'entities/User/me') {
    if (!user) return send(res, 401, { message: 'Unauthorized' });
    if (method === 'PUT') return send(res, 200, await db.entities.User.update(user.id, withDates(asJson(raw))));
    return send(res, 200, user);
  }

  /* uploads */
  if (rest === 'integration-endpoints/Core/UploadFile') {
    const form = await new Request('http://mock/upload', {
      method: 'POST',
      headers: { 'content-type': req.headers['content-type'] },
      body: raw,
    }).formData();
    return send(res, 200, await db.integrations.Core.UploadFile({ file: form.get('file') }));
  }
  if (rest.startsWith('integration-endpoints/')) return send(res, 200, {});

  /* backend functions: the real code */
  const fn = /^functions\/([^/]+)$/.exec(rest);
  if (fn) {
    let handler;
    try {
      handler = await loadFunction(fn[1]);
    } catch (error) {
      return send(res, 404, { error: `No such function: ${fn[1]} (${error.message})` });
    }
    const result = await inLine(async () => {
      db.currentUser = user;
      globalThis.__base44 = db;
      const response = await handler(
        new Request(`http://mock/functions/${fn[1]}${url.search}`, {
          method: 'POST',
          headers: { 'content-type': req.headers['content-type'] || 'application/json', origin: req.headers.origin || '' },
          body: raw.length ? raw : '{}',
        })
      );
      return { status: response.status, type: response.headers.get('content-type'), body: Buffer.from(await response.arrayBuffer()) };
    });
    return send(res, result.status, result.body, { 'content-type': result.type || 'application/json' });
  }

  /* entities */
  const entity = /^entities\/([^/]+)(?:\/(.+))?$/.exec(rest);
  if (entity) {
    const [, name, tail] = entity;
    const store = db.entities[name];
    if (method === 'GET' && !tail) {
      const query = url.searchParams.get('q') ? JSON.parse(url.searchParams.get('q')) : {};
      const limit = Number(url.searchParams.get('limit')) || 500;
      const rows = await store.filter(query, url.searchParams.get('sort') || undefined, 5000);
      return send(res, 200, visible(name, rows, user).slice(0, limit));
    }
    if (method === 'GET' && tail === 'count') {
      const query = url.searchParams.get('q') ? JSON.parse(url.searchParams.get('q')) : {};
      return send(res, 200, { count: visible(name, await store.filter(query), user).length });
    }
    if (method === 'GET') {
      const [row] = visible(name, await store.filter({ id: tail }), user);
      return row ? send(res, 200, row) : send(res, 404, { message: `${name} not found` });
    }
    if (!user) return send(res, 401, { message: 'Unauthorized' });
    if (method === 'POST' && !tail) {
      const now = new Date().toISOString();
      return send(res, 200, await store.create({ created_by: user.email, created_date: now, updated_date: now, ...asJson(raw) }));
    }
    if (method === 'PUT' && tail) return send(res, 200, await store.update(tail, withDates(asJson(raw))));
    if (method === 'DELETE' && tail) {
      await store.delete(tail);
      return send(res, 200, { ok: true });
    }
  }

  return send(res, 404, { message: `No mock route for ${method} ${path}` });
}

http
  .createServer((req, res) => {
    route(req, res).catch((error) => {
      console.error(`[mock] ${req.method} ${req.url} failed:`, error);
      send(res, 500, { message: error.message });
    });
  })
  .listen(PORT, () => {
    console.log(`[mock] Stelli mock backend on http://localhost:${PORT}`);
  });
