/* Shared Redis helpers for the planner endpoints (api/planner.js and api/rsvp.js).
   Files and folders starting with an underscore are not deployed as functions,
   they are only imported by the real endpoints.

   Databases it understands (whichever is connected to the Vercel project):
   1. Redis from the Vercel Marketplace (Redis Cloud): a REDIS_URL variable,
      reached with the official "redis" npm package.
   2. Upstash for Redis: KV_REST_API_URL / UPSTASH_REDIS_REST_URL plus token,
      reached over HTTPS (kept so an older setup still works). */

const crypto = require('crypto');

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

// Count something for a limited time (used to slow down floods). Returns the new count.
const COUNT_WITH_TTL = `
local n = redis.call('INCR', KEYS[1])
if n == 1 then redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1])) end
return n
`;

/* ---------- the storage address ---------- */

// The same address the planner's browser code computes from the sync code
// (SHA 256 of "kp-planner-sync:" plus the code, in hex). See hashCode() in planner/planner.js.
function hashCode(code) {
  return crypto.createHash('sha256').update('kp-planner-sync:' + code).digest('hex');
}

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

/* ---------- two small adapters with the same operations ---------- */

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
    async getPair(a, b) { return (await getClient()).mGet([a, b]); },
    async saveIfCurrent(dataKey, revKey, baseRev, text) {
      const c = await getClient();
      return Number(await c.eval(SAVE_IF_CURRENT, { keys: [dataKey, revKey], arguments: [String(baseRev), text] }));
    },
    async countWithTtl(key, seconds) {
      const c = await getClient();
      return Number(await c.eval(COUNT_WITH_TTL, { keys: [key], arguments: [String(seconds)] }));
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
    getPair: (a, b) => call(['MGET', a, b]),
    async saveIfCurrent(dataKey, revKey, baseRev, text) {
      return Number(await call(['EVAL', SAVE_IF_CURRENT, '2', dataKey, revKey, String(baseRev), text]));
    },
    async countWithTtl(key, seconds) {
      return Number(await call(['EVAL', COUNT_WITH_TTL, '1', key, String(seconds)]));
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

// Data and revision are read in ONE command, so they always belong together. Two separate
// reads could return old data with a newer revision, and a save built on that would silently
// overwrite someone else's change.
async function readCurrent(db, id) {
  const [raw, rev] = await db.getPair(`planner:${id}:data`, `planner:${id}:rev`);
  return { rev: Number(rev) || 0, data: raw ? JSON.parse(raw) : null };
}

module.exports = { MAX_BYTES, ID_RE, hashCode, store, readCurrent };
