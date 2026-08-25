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
