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

   The database adapters live in api/_lib/store.js, shared with api/rsvp.js.

   GET  /api/planner?id=HASH           returns {rev, data}
   PUT  /api/planner  {id, baseRev, data}   saves only if baseRev is still the
        current revision, otherwise answers 409 with the newer {rev, data}. */

const { MAX_BYTES, ID_RE, store, readCurrent } = require('./_lib/store');

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
