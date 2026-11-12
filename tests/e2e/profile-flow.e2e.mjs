#!/usr/bin/env node
/**
 * The creator profile, clicked through in a real browser against the mock
 * backend: build a page in the wizard, see it in the creator portal, see it
 * the way a client does, then edit it and see the change everywhere.
 *
 * Needs the mock backend and Vite running (npm run dev:mock) and Playwright
 * available to Node. Not part of `npm test`.
 *
 *   node tests/e2e/profile-flow.e2e.mjs [baseUrl] [mockUrl]
 */
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';

const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.argv[2] || 'http://localhost:5173';
const MOCK = process.argv[3] || 'http://localhost:8787';
const SHOTS = process.env.E2E_SHOTS || '';

/** A small solid PNG, so uploads are real image files. */
function png(r, g, b, size = 96) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const head = Buffer.alloc(13);
  head.writeUInt32BE(size, 0);
  head.writeUInt32BE(size, 4);
  head[8] = 8;
  head[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: size }, () => [r, g, b]).flat())]);
  const raw = Buffer.concat(Array.from({ length: size }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', head),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
const file = (name, rgb) => ({ name, mimeType: 'image/png', buffer: png(...rgb) });

async function contextFor(browser, userId, viewport = { width: 1280, height: 860 }) {
  const context = await browser.newContext({ viewport });
  await context.route('https://files.stelli.test/**', async (route) => {
    const url = new URL(route.request().url());
    const res = await fetch(`${MOCK}/files${url.pathname}`);
    await route.fulfill({ status: res.status, contentType: res.headers.get('content-type'), body: Buffer.from(await res.arrayBuffer()) });
  });
  await context.addInitScript((id) => {
    if (id) {
      localStorage.setItem('base44_access_token', `mock.${id}`);
      localStorage.setItem('token', `mock.${id}`);
    }
  }, userId);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    // Signed-out checks answer 401 by design.
    if (/401|Unauthorized|Error data/.test(text)) return;
    errors.push(text);
  });
  return { context, page, errors };
}

const step = async (name, run) => {
  process.stdout.write(`  ${name} … `);
  await run();
  console.log('ok');
};
const shot = async (page, name) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
};
const api = async (path, userId, init = {}) => {
  const res = await fetch(`${MOCK}/api/apps/x/${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', authorization: `Bearer mock.${userId}`, ...(init.headers || {}) },
  });
  return res.json();
};

// Start from the seed data, whatever an earlier run left behind.
await fetch(`${MOCK}/__mock/reset`, { method: 'POST' });

const browser = await chromium.launch();
const allErrors = [];
try {
  console.log('Create a profile (sam@example.com, a creator with no page yet)');
  const sam = await contextFor(browser, 'u_new');
  const { page } = sam;
  const next = () => page.getByRole('button', { name: 'Continue', exact: true }).click();

  await step('the portal offers the application', async () => {
    await page.goto(`${BASE}/portal`);
    await page.getByRole('link', { name: /Apply to shoot/ }).click();
    await page.waitForURL('**/apply');
    await page.getByRole('button', { name: 'Start building' }).click();
  });

  await step('photo', async () => {
    await page.locator('input[type=file]').setInputFiles(file('me.png', [200, 120, 90]));
    await page.getByRole('img', { name: 'Your profile photo' }).waitFor();
    await next();
  });

  await step('name cannot be blank, and writes the link', async () => {
    await next();
    await page.getByRole('alert').filter({ hasText: 'Add a name' }).waitFor();
    await page.getByLabel('Display name').fill('Sam R');
    await page.getByText('sam-r', { exact: true }).waitFor();
    await next();
  });

  await step('one-liner refuses contact details', async () => {
    await page.getByLabel('One-liner').fill('dm me @samshoots');
    await next();
    await page.getByRole('alert').filter({ hasText: 'Contact details stay private' }).waitFor();
    await page.getByLabel('One-liner').fill('Flash on, hands up.');
    await page.getByRole('button', { name: '+ candid' }).click();
    await next();
  });

  await step('where and what', async () => {
    await page.getByRole('button', { name: /Fonville Fountain/ }).click();
    await next();
    await page.getByRole('button', { name: 'Portraits', exact: true }).click();
    await page.getByRole('button', { name: 'Events', exact: true }).click();
    await next();
  });

  await step('portfolio: three uploads, the second starred as cover', async () => {
    await page.locator('input[type=file]').setInputFiles([
      file('a.png', [240, 200, 120]),
      file('b.png', [120, 180, 240]),
      file('c.png', [200, 140, 220]),
    ]);
    await page.getByText('3 shots').waitFor();
    await page.getByRole('button', { name: 'Make shot 2 the cover' }).click();
    await next();
  });

  await step('packages', async () => {
    await page.getByPlaceholder('0').first().fill('75');
    await next();
  });

  await step('bio, kit, prompt, don\'t shoot', async () => {
    await page.getByLabel('Bio').fill('I keep sessions relaxed and quick.');
    await next();
    await page.getByLabel('Equipment').fill('Sony A7IV, 35mm');
    await page.getByLabel('Years shooting').fill('3');
    await next();
    await page.getByRole('radio', { name: 'Clients always tell me…' }).click();
    await page.getByLabel('Finish the sentence').fill('it felt easy.');
    await next();
    await page.getByLabel("What I don't shoot").fill('No weddings.');
    await next();
  });

  await step('the look changes the live preview', async () => {
    await page.getByRole('radio', { name: 'Grid' }).click();
    await page.getByRole('radio', { name: 'Cyan' }).click();
    await next();
  });

  await step('private details: the name is required', async () => {
    await page.getByRole('button', { name: 'Review my page' }).click();
    await page.getByRole('alert').filter({ hasText: 'Add your full name' }).waitFor();
    await page.getByLabel('Full name').fill('Sam Rivera');
    await page.getByRole('button', { name: 'Review my page' }).click();
    await page.getByRole('heading', { name: 'This is your page.' }).waitFor();
  });

  await step('the preview is the public page component, and shows no prices', async () => {
    const preview = page.locator('.phone .cp');
    await preview.getByText('Sam R', { exact: true }).first().waitFor();
    await preview.getByText('How booking Sam works').waitFor();
    assert.equal(await preview.getByText('$75').count(), 0, 'packages are private');
    await shot(page, 'wizard-review');
  });

  await step('publish', async () => {
    await page.getByRole('button', { name: 'Publish profile' }).click();
    await page.getByRole('heading', { name: /You're in, Sam R\./ }).waitFor();
    await page.getByText('/creators/sam-r').waitFor();
    await shot(page, 'wizard-share');
  });

  console.log('View it as the creator');
  await step('the portal profile tab shows the page, in review', async () => {
    await page.getByRole('link', { name: 'Go to your portal' }).click();
    await page.waitForURL('**/lensman-dashboard/profile');
    await page.getByText('In review', { exact: true }).waitFor();
    await page.getByText('/creators/sam-r').waitFor();
    await page.getByText('3 photos up').waitFor();
    await shot(page, 'portal-profile-pending');
  });

  await step('the creator can open their own page before it is approved', async () => {
    await page.getByRole('link', { name: /Preview page/ }).click();
    await page.waitForURL('**/creators/sam-r');
    await page.getByText('Only you can see this page until Stelli approves it.').waitFor();
    await page.getByRole('heading', { name: 'Sam R', level: 1 }).waitFor();
  });

  console.log('View it from the client side');
  const lensman = (await api('entities/Lensman?q=' + encodeURIComponent(JSON.stringify({ slug: 'sam-r' })), 'u_new'))[0];
  assert.ok(lensman?.id, 'the profile was saved');
  assert.equal(lensman.status, 'pending');
  assert.equal(lensman.cover_image, lensman.portfolio_images[0]);

  const jordan = await contextFor(browser, 'u_client');
  await step('a client cannot see a page that is not approved', async () => {
    await jordan.page.goto(`${BASE}/creators/sam-r`);
    await jordan.page.getByText('Creator not found.').waitFor();
  });

  await step('a founder approves it', async () => {
    const result = await api('functions/reviewCreatorApplication', 'u_admin', {
      method: 'POST',
      body: JSON.stringify({ lensmanId: lensman.id, decision: 'approved' }),
    });
    assert.ok(!result.error, result.error);
  });

  await step('now the client finds it in browse and opens it', async () => {
    await jordan.page.goto(`${BASE}/creators`);
    await jordan.page.getByText('Sam R').first().waitFor();
    await jordan.page.goto(`${BASE}/creators/sam-r`);
    await jordan.page.getByRole('heading', { name: 'Sam R', level: 1 }).waitFor();
    await jordan.page.getByText('I keep sessions relaxed and quick.').waitFor();
    await jordan.page.getByRole('link', { name: 'Request a date' }).first().waitFor();
    await shot(jordan.page, 'public-profile');
  });

  console.log('Edit it');
  await step('a checklist line in the portal opens the wizard on that step', async () => {
    await page.goto(`${BASE}/lensman-dashboard/profile`);
    await page.getByText('Live', { exact: true }).waitFor();
    await page.getByRole('link', { name: /About you/ }).click();
    await page.waitForURL('**/edit-profile');
    await page.getByLabel('Bio').waitFor();
    assert.equal(await page.getByLabel('Bio').inputValue(), 'I keep sessions relaxed and quick.');
  });

  await step('an edit is "unpublished" until it is saved, and survives a reload', async () => {
    await page.getByLabel('Bio').fill('Edited: relaxed, quick, and a little loud.');
    await page.getByText('Unpublished changes').waitFor();
    await page.reload();
    await page.getByRole('heading', { name: 'Your live page.' }).waitFor();
    await page.locator('.phone .cp').getByText('Edited: relaxed, quick, and a little loud.').waitFor();
  });

  await step('update the live page', async () => {
    await page.getByRole('button', { name: 'Update live page' }).click();
    await page.getByRole('heading', { name: /You're live, Sam R\./ }).waitFor();
  });

  await step('the change shows for the client and in the portal', async () => {
    await jordan.page.reload();
    await jordan.page.getByText('Edited: relaxed, quick, and a little loud.').waitFor();
    await page.getByRole('link', { name: 'Go to your portal' }).click();
    await page.getByText('Written').waitFor();
  });

  await step('editing again starts clean: nothing to save', async () => {
    await page.getByRole('link', { name: /Edit profile/ }).click();
    await page.getByRole('heading', { name: 'Your live page.' }).waitFor();
    await page.getByText('Up to date').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Update live page' }).isDisabled(), true);
  });

  allErrors.push(...sam.errors, ...jordan.errors);
} finally {
  await browser.close();
}

if (allErrors.length) {
  console.error('\nConsole errors during the flow:');
  for (const error of allErrors) console.error(' -', error);
  process.exit(1);
}
console.log('\nProfile flow: all steps passed, no console errors.');
