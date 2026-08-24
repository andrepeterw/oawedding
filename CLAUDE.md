This project is a bilingual (English and Portuguese) wedding website for Kev
and Peter, marrying at Tropicalia Eventos in Salvador, Bahia, likely late
June-mid July 2027 (date not yet confirmed — treat as a placeholder
everywhere). The full content and design brief lives in
content-briefing.md, read that first in every session. Tone: elegant and
timeless, warm and intimate. The couple is Christian, evangelical, and
wants faith visibly at the center of the site without excluding guests of
other backgrounds. Guests are Brazilian, Nigerian (mostly Urhobo), and
American (plus some from Namibia). Build mobile first, static, fast, and
simple. Do not add a backend database, use third party tools for RSVP
(Tally/Formspree) and photo uploads (shared Google Photos album) instead.

Stack: Astro (static output), plain CSS with variables, minimal JS.
Shared Layout component handles nav, footer, and the EN/PT language
toggle so every page reuses them. Content-briefing.md lists several open
items (exact date, Peter's bio, hashtag, etc.) — leave clearly marked
placeholders for these rather than inventing facts.
