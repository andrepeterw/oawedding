/* Shared storage for the planner (Vercel Function, Node.js).

   The planner keeps working fully offline in each browser. When you turn on
   Sync, this function stores ONE copy of the planner in Redis so your devices
   and Kev's can share it.

   How the "sync code" works: the code is never sent here. The browser sends only
   a SHA 256 hash of it (64 hex characters) as the storage address. Without the
   code nobody can guess the address, so there is no login screen. Anyone who
   has the code can read and change the planner, so share it only with Kev.

   Databases it understands (whichever is connected to the Vercel project):
   1. Redis from the Vercel Marketplace (Redis Cloud): a REDIS_URL variable,
      reached with the official "redis" npm package.
   2. Upstash for Redis: KV_REST_API_URL / UPSTASH_REDIS_REST_URL plus token,
      reached over HTTPS (kept so an older setup still works).
   Open /api/planner?status=1 to check: it answers {"configured":true,"kind":"..."}.

   GET  /api/planner?id=HASH           returns {rev, data}
   PUT  /api/planner  {id, baseRev, data}   saves only if baseRev is still the
        current revision, otherwise answers 409 with the newer {rev, data}. */

const MAX_BYTES = 700000;          // far above a real planner (about 35 KB)
const ID_RE = /^[a-f0-9]{64}$/;

// Compare and set: save only when the stored revision still equals ARGV[1].
// Returns the new revision, or 0 when someone saved in between.
const SAVE_IF_CURRENT = `
local rev = tonumber(redis.call('GET', KEYS[2]) or '0')
if rev ~= tonumber(ARGV[1]) then return 0 end
redis.call('SET', KEYS[1], ARGV[2])
redis.call('SET', KEYS[2], rev + 1)
return rev + 1
`;

/* ---------- finding the database ---------- */

// A redis:// or rediss:// address, however Vercel named it (it can add a prefix).
function redisUrl() {
  const env = process.env;
  if (env.REDIS_URL) return env.REDIS_URL;
  for (const key of Object.keys(env)) {
    if (/REDIS_URL$/.test(key) && /^rediss?:\/\//.test(env[key] || '')) return env[key];
  }
  return null;
}

// Upstash REST credentials, however Vercel named them.
function restCredentials() {
  const env = process.env;
  const pairs = [
    ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
    ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']
  ];
  for (const [u, t] of pairs) if (env[u] && env[t]) return { url: env[u], token: env[t] };
  for (const key of Object.keys(env)) {
    const m = key.match(/^(.*)(KV_REST_API_URL|REDIS_REST_URL)$/);
    if (!m || !env[key]) continue;
    const tokenKey = key.replace(/URL$/, 'TOKEN');
    if (env[tokenKey]) return { url: env[key], token: env[tokenKey] };
  }
  return null;
}

/* ---------- two small adapters with the same three operations ---------- */

// 1. Direct Redis connection (REDIS_URL). One connection, reused while the function stays warm.
let clientPromise = null;
function tcpStore(url) {
  const getClient = () => {
    if (!clientPromise) {
      const { createClient } = require('redis');
      const client = createClient({ url, socket: { connectTimeout: 8000 } });
      client.on('error', err => console.error('Redis error:', err.message));
      clientPromise = client.connect().then(() => client).catch(err => { clientPromise = null; throw err; });
    }
    return clientPromise;
  };
  return {
    kind: 'redis',
    async get(key) { return (await getClient()).get(key); },
    async saveIfCurrent(dataKey, revKey, baseRev, text) {
      const c = await getClient();
      return Number(await c.eval(SAVE_IF_CURRENT, { keys: [dataKey, revKey], arguments: [String(baseRev), text] }));
    }
  };
}

// 2. Upstash over HTTPS (no package needed).
function restStore(creds) {
  const call = async command => {
    const res = await fetch(creds.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${creds.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) throw new Error(json.error || `redis_http_${res.status}`);
    return json.result;
  };
  return {
    kind: 'upstash',
    get: key => call(['GET', key]),
    async saveIfCurrent(dataKey, revKey, baseRev, text) {
      return Number(await call(['EVAL', SAVE_IF_CURRENT, '2', dataKey, revKey, String(baseRev), text]));
    }
  };
}

function store() {
  const url = redisUrl();
  if (url) return tcpStore(url);
  const creds = restCredentials();
  if (creds) return restStore(creds);
  return null;
}

async function readCurrent(db, id) {
  const [raw, rev] = await Promise.all([db.get(`planner:${id}:data`), db.get(`planner:${id}:rev`)]);
  return { rev: Number(rev) || 0, data: raw ? JSON.parse(raw) : null };
}

/* ---------- the endpoint ---------- */

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const send = (code, body) => res.status(code).json(body);

  try {
    const db = store();
    if (req.method === 'GET' && req.query && req.query.status) return send(200, { configured: !!db, kind: db ? db.kind : null });
    if (!db) return send(503, { error: 'not_configured' });

    if (req.method === 'GET') {
      const id = String((req.query && req.query.id) || '');
      if (!ID_RE.test(id)) return send(400, { error: 'bad_id' });
      return send(200, await readCurrent(db, id));
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { return send(400, { error: 'bad_json' }); } }
      const { id, baseRev, data } = body || {};
      if (!ID_RE.test(String(id))) return send(400, { error: 'bad_id' });
      if (!Number.isInteger(baseRev) || baseRev < 0) return send(400, { error: 'bad_rev' });
      if (!data || typeof data !== 'object' || !Array.isArray(data.tasks)) return send(400, { error: 'bad_data' });
      const text = JSON.stringify(data);
      if (text.length > MAX_BYTES) return send(413, { error: 'too_big' });

      const newRev = await db.saveIfCurrent(`planner:${id}:data`, `planner:${id}:rev`, baseRev, text);
      if (newRev > 0) return send(200, { rev: newRev });
      return send(409, { error: 'conflict', ...(await readCurrent(db, id)) });
    }

    res.setHeader('Allow', 'GET, PUT');
    return send(405, { error: 'method_not_allowed' });
  } catch (e) {
    console.error(e);
    return send(500, { error: 'server_error' });
  }
};
