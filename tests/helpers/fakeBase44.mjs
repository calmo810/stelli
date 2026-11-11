/**
 * An in-memory stand-in for the Base44 client the backend functions use.
 *
 * It keeps records per entity and understands the handful of query shapes the
 * code relies on: plain equality, $in (where null also matches a missing
 * field, as in MongoDB) and $ne. That last detail matters: the booking lock
 * depends on "payout_lock is empty or missing" matching exactly one writer.
 *
 * Every entity call is async and yields, so two flows started together really
 * do interleave, the way two requests do on the server.
 */
let nextId = 1;

const tick = () => new Promise((resolve) => setImmediate(resolve));

function matches(record, query = {}) {
  return Object.entries(query).every(([field, want]) => {
    const have = record[field];
    if (want && typeof want === 'object' && !Array.isArray(want)) {
      if ('$in' in want) {
        return want.$in.some((v) => (v === null ? have === null || have === undefined : v === have));
      }
      if ('$ne' in want) return have !== want.$ne;
      throw new Error(`fakeBase44: unsupported operator in ${JSON.stringify(want)}`);
    }
    return have === want;
  });
}

function sorted(rows, sort) {
  if (!sort) return rows;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...rows].sort((a, b) => {
    const [x, y] = [a[field] ?? '', b[field] ?? ''];
    return (x < y ? -1 : x > y ? 1 : 0) * (desc ? -1 : 1);
  });
}

function entityStore(name) {
  const rows = new Map();
  const api = {
    _rows: rows,
    async get(id) {
      await tick();
      const row = rows.get(id);
      if (!row) {
        const error = new Error(`${name} ${id} not found`);
        error.status = 404;
        throw error;
      }
      return { ...row };
    },
    async filter(query = {}, sort, limit = 500) {
      await tick();
      return sorted([...rows.values()].filter((row) => matches(row, query)), sort)
        .slice(0, limit)
        .map((row) => ({ ...row }));
    },
    async list(sort, limit = 500) {
      return api.filter({}, sort, limit);
    },
    async create(data) {
      await tick();
      const id = data.id || `${name.toLowerCase()}_${nextId++}`;
      const row = { created_date: new Date().toISOString(), ...data, id };
      rows.set(id, row);
      return { ...row };
    },
    async bulkCreate(list) {
      const out = [];
      for (const data of list) out.push(await api.create(data));
      return out;
    },
    async update(id, patch) {
      await tick();
      const row = rows.get(id);
      if (!row) throw new Error(`${name} ${id} not found`);
      Object.assign(row, patch);
      return { ...row };
    },
    /** Each matching record is checked and written in one step, like the database does. */
    async updateMany(query, change) {
      await tick();
      let modified = 0;
      for (const row of rows.values()) {
        if (!matches(row, query)) continue;
        Object.assign(row, change.$set || {});
        for (const field of Object.keys(change.$unset || {})) delete row[field];
        modified += 1;
      }
      return { modified };
    },
    async delete(id) {
      await tick();
      rows.delete(id);
    },
    async deleteMany(query) {
      await tick();
      for (const [id, row] of rows) if (matches(row, query)) rows.delete(id);
    },
  };
  return api;
}

export function createFakeBase44({ user = null } = {}) {
  const stores = new Map();
  const entities = new Proxy(
    {},
    {
      get(_target, name) {
        if (!stores.has(name)) stores.set(name, entityStore(name));
        return stores.get(name);
      },
    }
  );

  const emails = [];
  const integrations = {
    Core: {
      async SendEmail(email) {
        emails.push(email);
        return { ok: true };
      },
      /** Tests set client.llm to see the prompt and choose the reply. */
      async InvokeLLM(request) {
        client.llmCalls.push(request);
        return client.llm ? client.llm(request) : { bubbles: ['ok'] };
      },
      async CreateFileSignedUrl({ file_uri }) {
        return { signed_url: `https://files.example/${encodeURIComponent(file_uri)}?sig=1` };
      },
    },
  };

  const client = {
    emails,
    llm: null,
    llmCalls: [],
    currentUser: user,
    entities,
    integrations,
    auth: {
      async me() {
        if (!client.currentUser) {
          const error = new Error('Unauthorized');
          error.status = 401;
          throw error;
        }
        return { ...client.currentUser };
      },
    },
    asServiceRole: { entities, integrations },
    /** Run a backend function as a given user with a JSON body. */
    async call(handler, body, asUser) {
      if (asUser !== undefined) client.currentUser = asUser;
      globalThis.__base44 = client;
      const response = await handler(
        new Request('https://stelli.test/fn', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body || {}),
        })
      );
      return { status: response.status, data: await response.json() };
    },
  };
  globalThis.__base44 = client;
  return client;
}
