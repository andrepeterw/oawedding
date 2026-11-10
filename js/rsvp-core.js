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
    var guests = Math.floor(Number(body.guests));
    if (!(guests >= 1 && guests <= 10)) guests = 1;
    var dietKey = String(body.dietary || 'none');
    if (!DIET_MAP[dietKey]) return { ok: false };
    return {
      ok: true,
      sub: {
        name: name,
        attending: attending,
        event: attending ? EVENT_MAP[choice] : '',
        guests: attending ? guests : 0,
        diet: attending ? DIET_MAP[dietKey] : 'No restrictions',
        dietOther: attending && dietKey === 'other' ? cleanText(body.dietaryOther, 200) : '',
        travelHelp: attending && body.travelHelp === true
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
    return bits.join('; ');
  }

  // Update a guest row in place from an answer (also used for a brand new row).
  function applyToGuest(g, sub, nowIso) {
    if (sub.attending) {
      g.rsvp = 'Attending';
      g.event = sub.event;
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

  // A new guest row. The side stays blank, the form cannot know it.
  function newGuest(sub, id, nowIso) {
    var g = { id: id, name: sub.name, side: '', country: 'Other', event: sub.event || 'Lagos', rsvp: 'Not sent', diet: 'No restrictions', plusOnes: 0, notes: '' };
    return applyToGuest(g, sub, nowIso);
  }

  // A review queue entry for the planner.
  function inboxEntry(sub, id, nowIso) {
    return {
      id: id, name: sub.name, attending: sub.attending, event: sub.event, guests: sub.guests,
      diet: sub.diet, dietOther: sub.dietOther, travelHelp: sub.travelHelp,
      at: nowIso, status: 'needs review'
    };
  }

  return { EVENT_MAP: EVENT_MAP, DIET_MAP: DIET_MAP, normName: normName, parseSubmission: parseSubmission, applyToGuest: applyToGuest, newGuest: newGuest, inboxEntry: inboxEntry };
});
