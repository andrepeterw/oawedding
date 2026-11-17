/* The rules for turning an RSVP answer into a planner guest row.

   One file, two users, so the two can never drift apart:
   1. api/rsvp.js (the server) requires it when a guest submits the public form.
   2. planner/planner.js loads it with a script tag when the couple settles an entry
      from the review queue (Match to an existing guest, or Add as a new guest).

   It only contains pure functions. No network, no storage. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RsvpCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // What the public form sends  ->  the words the planner already uses
  var EVENT_MAP = { lagos: 'Lagos', salvador: 'Brazil', both: 'Both' };
  var DIET_MAP = {
    none: 'No restrictions',
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    pescatarian: 'Pescatarian',
    halal: 'Halal',
    gluten_free: 'Gluten free',
    dairy_free: 'Lactose free',
    nut_allergy: 'Nut allergy',
    other: 'Other (see notes)'
  };
  var NOTE_TAG = 'RSVP form:';

  // Trim, collapse spaces, fold case and accents, strip basic punctuation.
  function normName(s) {
    return String(s == null ? '' : s)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/['’`.,]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function cleanText(s, max) {
    return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  }

  // Check a request body from the public form. Returns { ok: true, sub } or { ok: false }.
  function parseSubmission(body) {
    if (!body || typeof body !== 'object') return { ok: false };
    var name = cleanText(body.name, 120);
    if (name.length < 2 || !normName(name)) return { ok: false };
    var choice = String(body.event || '');
    var attending = choice !== 'no';
    if (attending && !EVENT_MAP[choice]) return { ok: false };
    // Two pages post here: RSVP Lagos (only Lagos or no) and RSVP Salvador (the full choice).
    var page = body.page === 'lagos' || body.page === 'salvador' ? body.page : '';
    if (page === 'lagos' && attending && choice !== 'lagos') return { ok: false };
    var guests = Math.floor(Number(body.guests));
    if (!(guests >= 1 && guests <= 10)) guests = 1;
    var dietKey = String(body.dietary || 'none');
    if (!DIET_MAP[dietKey]) return { ok: false };
    return {
      ok: true,
      sub: {
        name: name,
        attending: attending,
        page: page,
        // a "no" from RSVP Lagos is a no to Lagos. From RSVP Salvador it stays unspecific.
        event: attending ? EVENT_MAP[choice] : (page === 'lagos' ? 'Lagos' : ''),
        guests: attending ? guests : 0,
        diet: attending ? DIET_MAP[dietKey] : 'No restrictions',
        dietOther: attending && dietKey === 'other' ? cleanText(body.dietaryOther, 200) : '',
        travelHelp: attending && body.travelHelp === true,
        // "Have you been invited to the chosen celebration(s)?" Only recorded, nothing is blocked.
        invited: attending && (body.invited === 'yes' || body.invited === 'no') ? body.invited : ''
      }
    };
  }

  function setNote(notes, text) {
    var parts = String(notes || '').split(' | ').filter(function (p) { return p && p.indexOf(NOTE_TAG) !== 0; });
    if (text) parts.push(NOTE_TAG + ' ' + text);
    return parts.join(' | ');
  }

  function noteText(sub) {
    var bits = [];
    if (sub.dietOther) bits.push('diet: ' + sub.dietOther);
    if (sub.travelHelp) bits.push('would like travel or visa help');
    if (sub.invited === 'no') bits.push('says they were not invited');
    return bits.join('; ');
  }

  // Update a guest row in place from an answer (also used for a brand new row).
  function applyToGuest(g, sub, nowIso, eventOverride) {
    if (sub.attending) {
      g.rsvp = 'Attending';
      g.event = eventOverride || sub.event;
      g.diet = sub.diet;
      g.plusOnes = Math.max(0, (Number(sub.guests) || 1) - 1);
    } else {
      // A guest who cannot come stays on the list. Their event is left as it was.
      g.rsvp = 'Declined';
      g.plusOnes = 0;
      g.diet = 'No restrictions';
    }
    g.notes = setNote(g.notes, sub.attending ? noteText(sub) : '');
    g.lastRsvpAt = nowIso;
    g.source = 'rsvp-form';
    return g;
  }

  // Two forms can reach the same guest, but a guest row holds one status and one event.
  // This decides whether a new answer can be applied as it is, or must wait for a person.
  //  - not answered yet (anything but Attending or Declined): apply
  //  - Attending again: apply. If the answer came through the form and names the other
  //    celebration, the guest is going to both, so the event becomes Both
  //  - Declined again: apply
  //  - Attending changed to Declined, or Declined to Attending: conflict, a person decides
  //  - Attending set by hand in the planner (no form answer yet) with a different event: conflict,
  //    because the planner's default event is not something the guest chose
  function unionEvent(a, b) {
    if (!a || a === b) return b;
    if (!b) return a;
    return 'Both';
  }
  function resolve(g, sub) {
    var confirmed = g.rsvp === 'Attending' || g.rsvp === 'Declined';
    if (!confirmed) return { action: 'apply' };
    if (g.rsvp === 'Attending' && sub.attending) {
      if (g.source === 'rsvp-form') return { action: 'apply', event: unionEvent(g.event, sub.event) };
      return g.event === sub.event ? { action: 'apply' } : { action: 'conflict', reason: 'different celebration' };
    }
    if (g.rsvp === 'Declined' && !sub.attending) return { action: 'apply' };
    return { action: 'conflict', reason: sub.attending ? 'now attending' : 'now declining' };
  }

  // A new guest row. The side stays blank, the form cannot know it.
  function newGuest(sub, id, nowIso) {
    var g = { id: id, name: sub.name, side: '', country: 'Other', event: sub.event || 'Lagos', rsvp: 'Not sent', diet: 'No restrictions', plusOnes: 0, notes: '' };
    return applyToGuest(g, sub, nowIso);
  }

  // A review queue entry for the planner.
  function inboxEntry(sub, id, nowIso, extra) {
    var entry = {
      id: id, name: sub.name, page: sub.page || '', attending: sub.attending, event: sub.event, guests: sub.guests,
      diet: sub.diet, dietOther: sub.dietOther, travelHelp: sub.travelHelp, invited: sub.invited || '',
      at: nowIso, status: 'needs review'
    };
    // conflict: true, reason, matchedGuestId and existing (the row as it was) when it clashed with an earlier answer
    if (extra) for (var k in extra) entry[k] = extra[k];
    return entry;
  }

  return { EVENT_MAP: EVENT_MAP, DIET_MAP: DIET_MAP, normName: normName, parseSubmission: parseSubmission, resolve: resolve, unionEvent: unionEvent, applyToGuest: applyToGuest, newGuest: newGuest, inboxEntry: inboxEntry };
});
