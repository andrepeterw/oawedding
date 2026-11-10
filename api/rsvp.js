/* Public RSVP endpoint (Vercel Function, Node.js). POST only.

   A guest fills in the RSVP page. This function writes the answer into the same
   Redis record the private planner syncs with, so "Attending" or "Declined" shows up
   in the planner's Guests tab without anyone retyping it.

   - The record is found from the PLANNER_KEY environment variable (the couple's sync code),
     hashed exactly like the planner does. Guests never see or type it. It is only read here.
   - It can only WRITE an answer. There is no way to read the guest list, budget or
     checklist through it. The planner's own endpoint (api/planner.js) still needs the hash.
   - Exact name match (trimmed, case and accent folded, punctuation stripped) to exactly one
     guest: that row is updated. No match, or more than one: nothing existing is touched,
     the answer goes to data.rsvpInbox for the couple to review in the planner.
   - Saving uses the same compare and set on the revision as the planner. On a conflict it
     reads the newest copy and applies the same answer again, up to 5 times.
   - The guest always gets the same thank you, matched or not.
   - Honeypot: a hidden "website" field. Filled in means a bot, the request is dropped quietly.
     That only stops basic bots, it is not real security. Flooding is slowed by counters in Redis
     (per name and per visitor, the visitor stored only as a hash). */

const crypto = require('crypto');
const { MAX_BYTES, store, readCurrent, hashCode } = require('./_lib/store');
const core = require('../js/rsvp-core.js');

const MAX_BODY = 8000;           // a real submission is under 1 KB
const MAX_ATTEMPTS = 5;
const MAX_INBOX = 500;
const NAME_LIMIT = { max: 5, seconds: 600 };       // per guest name, per 10 minutes
const VISITOR_LIMIT = { max: 40, seconds: 3600 };  // per visitor, per hour

const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const newId = () => crypto.randomBytes(6).toString('hex');

// Put one submission into the planner data. Returns the changed data, or null when the planner
// record has no usable shape. Pure apart from the clock.
function applySubmission(data, sub, now) {
  data.guests = Array.isArray(data.guests) ? data.guests : [];
  const key = core.normName(sub.name);
  const matches = data.guests.filter(g => g && core.normName(g.name) === key);
  if (matches.length === 1) {
    core.applyToGuest(matches[0], sub, now);
    return 'matched';
  }
  data.rsvpInbox = Array.isArray(data.rsvpInbox) ? data.rsvpInbox : [];
  const same = data.rsvpInbox.findIndex(e => e && core.normName(e.name) === key);
  if (same >= 0) {                         // a repeat (a double click, or a changed answer): keep one entry
    data.rsvpInbox[same] = core.inboxEntry(sub, data.rsvpInbox[same].id || newId(), now);
    return 'queued';
  }
  if (data.rsvpInbox.length >= MAX_INBOX) return 'full';
  data.rsvpInbox.push(core.inboxEntry(sub, newId(), now));
  return 'queued';
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const send = (code, body) => res.status(code).json(body);

  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return send(405, { error: 'method_not_allowed' });
    }

    if (Number(req.headers && req.headers['content-length']) > MAX_BODY) return send(413, { error: 'too_big' });
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { return send(400, { error: 'invalid' }); } }
    if (!body || typeof body !== 'object') return send(400, { error: 'invalid' });
    if (JSON.stringify(body).length > MAX_BODY) return send(413, { error: 'too_big' });

    // Honeypot: real guests never see this field. Say thanks, save nothing.
    if (String(body.website || '').trim() !== '') return send(200, { ok: true });

    const parsed = core.parseSubmission(body);
    if (!parsed.ok) return send(400, { error: 'invalid' });
    const sub = parsed.sub;

    const code = String(process.env.PLANNER_KEY || '').trim();
    const db = store();
    if (!code || !db) return send(503, { error: 'not_ready' });
    const id = hashCode(code);

    // Flood control. If the counters themselves fail, carry on rather than lose a real RSVP.
    try {
      const fwd = String((req.headers && req.headers['x-forwarded-for']) || '').split(',')[0].trim();
      const byName = await db.countWithTtl(`rsvp:rl:n:${sha(core.normName(sub.name))}`, NAME_LIMIT.seconds);
      const byVisitor = await db.countWithTtl(`rsvp:rl:v:${sha('v:' + fwd)}`, VISITOR_LIMIT.seconds);
      if (byName > NAME_LIMIT.max || byVisitor > VISITOR_LIMIT.max) return send(429, { error: 'too_many' });
    } catch (e) { console.error('rate limit check failed:', e.message); }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const { rev, data } = await readCurrent(db, id);
      if (!data || typeof data !== 'object') return send(503, { error: 'not_ready' });   // sync was never turned on
      const outcome = applySubmission(data, sub, new Date().toISOString());
      if (outcome === 'full') return send(503, { error: 'try_again' });
      const text = JSON.stringify(data);
      if (text.length > MAX_BYTES) return send(413, { error: 'too_big' });
      const newRev = await db.saveIfCurrent(`planner:${id}:data`, `planner:${id}:rev`, rev, text);
      if (newRev > 0) return send(200, { ok: true });   // same answer whether matched or queued
      await sleep(30 + Math.floor(Math.random() * 90) * attempt);   // someone saved first, read the newest and go again
    }
    return send(503, { error: 'try_again' });
  } catch (e) {
    console.error(e);
    return send(500, { error: 'server_error' });
  }
};

module.exports.applySubmission = applySubmission;
