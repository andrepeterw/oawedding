/* Shared storage for the planner (Vercel Function, Node.js, no npm packages).

   The planner keeps working fully offline in each browser. When you turn on
   Sync, this function stores ONE copy of the planner in a free Upstash Redis
   database so your devices and Kev's can share it.

   How the "sync code" works: the code is never sent here. The browser sends only
   a SHA 256 hash of it (64 hex characters) as the storage address. Without the
   code nobody can guess the address, so there is no login screen. Anyone who
   has the code can read and change the planner, so share it only with Kev.

   Setup (once): in the Vercel dashboard add an Upstash Redis database to this
   project (Storage, Create Database, Upstash for Redis, connect to the project).
   That adds the REST URL and token as environment variables, then redeploy.
   Open /api/planner?status=1 to check: it answers {"configured":true}.

   GET  /api/planner?id=HASH           returns {rev, data}
   PUT  /api/planner  {id, baseRev, data}   saves only if baseRev is still the
        current revision, otherwise answers 409 with the newer {rev, data}. */

const MAX_BYTES = 700000;          // far above a real planner (about 35 KB)
const ID_RE = /^[a-f0-9]{64}$/;

// Finds the Upstash REST credentials however Vercel named them (it can add a prefix).
function credentials() {
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

async function redis(creds, command) {
  const res = await fetch(creds.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${creds.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(json.error || `redis_http_${res.status}`);
  return json.result;
}

// Compare and set: save only when the stored revision still equals ARGV[1].
// Returns the new revision, or 0 when someone saved in between.
const SAVE_IF_CURRENT = `
local rev = tonumber(redis.call('GET', KEYS[2]) or '0')
if rev ~= tonumber(ARGV[1]) then return 0 end
redis.call('SET', KEYS[1], ARGV[2])
redis.call('SET', KEYS[2], rev + 1)
return rev + 1
`;

async function readCurrent(creds, id) {
  const [raw, rev] = await Promise.all([
    redis(creds, ['GET', `planner:${id}:data`]),
    redis(creds, ['GET', `planner:${id}:rev`])
  ]);
  return { rev: Number(rev) || 0, data: raw ? JSON.parse(raw) : null };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const send = (code, body) => res.status(code).json(body);

  try {
    const creds = credentials();
    if (req.method === 'GET' && req.query && req.query.status) return send(200, { configured: !!creds });
    if (!creds) return send(503, { error: 'not_configured' });

    if (req.method === 'GET') {
      const id = String((req.query && req.query.id) || '');
      if (!ID_RE.test(id)) return send(400, { error: 'bad_id' });
      return send(200, await readCurrent(creds, id));
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      let body;
      try { body = req.body; } catch (e) { return send(400, { error: 'bad_json' }); }
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { return send(400, { error: 'bad_json' }); } }
      const { id, baseRev, data } = body || {};
      if (!ID_RE.test(String(id))) return send(400, { error: 'bad_id' });
      if (!Number.isInteger(baseRev) || baseRev < 0) return send(400, { error: 'bad_rev' });
      if (!data || typeof data !== 'object' || !Array.isArray(data.tasks)) return send(400, { error: 'bad_data' });
      const text = JSON.stringify(data);
      if (text.length > MAX_BYTES) return send(413, { error: 'too_big' });

      const newRev = Number(await redis(creds, ['EVAL', SAVE_IF_CURRENT, '2', `planner:${id}:data`, `planner:${id}:rev`, String(baseRev), text]));
      if (newRev > 0) return send(200, { rev: newRev });
      return send(409, { error: 'conflict', ...(await readCurrent(creds, id)) });
    }

    res.setHeader('Allow', 'GET, PUT');
    return send(405, { error: 'method_not_allowed' });
  } catch (e) {
    return send(500, { error: 'server_error' });
  }
};
