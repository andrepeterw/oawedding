This project is a bilingual (English and Portuguese) wedding website for Oghenekevwe
and Andre Peter, marrying at Tropicalia Eventos in Salvador, Bahia, likely
late June to mid July 2027 (date not yet confirmed, treat as a placeholder
everywhere). The full content and design brief lives in content-briefing.md,
read that first in every session. Tone: elegant and timeless, warm and
intimate. The couple is Christian, evangelical, and wants faith visibly at
the center of the site without excluding guests of other backgrounds.
Guests are Brazilian, Nigerian (mostly Urhobo), and American (plus some
from Namibia). Build mobile first, static, fast, and simple. Do not add a
backend database, use third party tools for RSVP (Tally/Formspree) and
photo uploads (shared Google Photos album) instead.

Naming: Andre Peter goes by "Peter" to Brazilian family and friends and
"Andre" to Nigerian family and friends. The couple has chosen to display
his full name, "Andre Peter," everywhere on the site rather than picking
one, so it reads as one name to everyone rather than favoring either side.

Writing style: no em dashes, en dashes, or hyphens used as punctuation in
any site copy or in chat responses. Rewrite around them with commas,
periods, or "and"/"including" instead. The one exception is a citation
attribution (e.g. a Bible verse reference). Hyphens inside HTML/CSS/JS
identifiers (class names, attributes) are unaffected, that's code, not
prose. Proper names that happen to contain a hyphen (a person's given
name, an established term like "aso ebi" if spelled with one) are also
left alone rather than respelled.

Stack: plain HTML, CSS (with variables), and vanilla JS. No build step, no
npm dependencies (this environment's sandbox blocks the npm registry, so
avoid framework scaffolding that requires installing packages). A shared
js/main.js fetches partials/nav.html and partials/footer.html into every
page and handles the EN/PT language toggle (via .lang-en/.lang-pt spans
and html[data-lang]) and the mobile nav. Content-briefing.md lists several
open items (exact date, Andre Peter's bio, hashtag, etc.), leave clearly
marked placeholders for these rather than inventing facts.

Planner (added Nov 2026): a couples planning tool at /planner (planner/index.html,
planner.css, planner.js, tasks.js, sw.js). It is not linked from the public nav or
footer, has noindex, and robots.txt disallows it, but it has no password. Never
commit real figures, guest names or phone numbers: all money amounts stay 0 in
freshState(), real data goes in through the Backup and data panel (restore a
JSON backup). Data lives in the browser only (localStorage key
kp-wedding-planner-v1, keep the key and the mergeState and STATE_VERSION
migration). Every read and write goes through load() and save(), so a shared
store can replace them later. Interface labels are English and Portuguese from
a dictionary in planner.js, task text stays English. Colors and fonts come from
the shared css/tokens.css, and the planner's own stylesheet is separate so the
public page rules do not leak in.

Planner sync (optional): api/planner.js is a Vercel Function that stores one copy
of the planner in a free Upstash Redis database (the REST URL and token are
added to the Vercel project by the Redis integration, the function finds them
by name pattern). The browser sends only a SHA 256 hash of the user's sync code
as the storage address, so there is no login. Writes use compare and set on a
revision number. The client (the SYNC section of planner.js) is local first,
debounced, and merges three ways per record and per field, so both people can
edit at once. The ui section of the state is never synced. Without the database
the planner keeps working on one device and the Sync panel explains why sync is
off. No npm packages, keep it that way.
