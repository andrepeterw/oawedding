# Context for Claude: the Kev and Andre Peter wedding website (current version)

Paste this whole file at the start of a Claude chat, or attach it, so Claude knows where the website stands. It describes the live version as of 10 November 2026. If something here disagrees with what you see on the site, the site wins, and please tell Claude so it can correct itself.

## What this is

A bilingual (English and Portuguese) wedding website for Oghenekevwe ("Kev") and Andre Peter. It tells one love story in two homes, with God at the center, and is open to guests of every background. Tone: elegant, timeless, warm and intimate. The couple is Christian and evangelical.

There are two linked celebrations:

1. **Nigerian Ceremony**: Urhobo traditional ceremony and church (white) wedding, the same day, on **June 12, 2027, in Lagos, Nigeria**.
2. **Brazilian Reception**: a smaller gathering at a beach house on **June 19, 2027, in Salvador, Bahia**. The venue is not chosen yet. Espaco Tropicalia is no longer the plan.

Guests are Brazilian, Nigerian (mostly Urhobo), American and Namibian. Some guests are expected to travel from Nigeria to Brazil.

The repository is public on GitHub (andrepeterw/oawedding) and deploys on Vercel from the `main` branch. Every push redeploys.

## Naming rules

- Andre Peter is called "Peter" by Brazilian family and friends and "Andre" by Nigerian ones, so the site always shows the full name **Andre Peter**.
- Kev's full name, **Oghenekevwe**, appears only in page `<title>` tags and on the Home page. Everywhere else in the body, the footer and calendar entries she is **Kev**.
- Hashtag: **#OurAlliance2027** (a play on "aliança", the Portuguese word for wedding ring and covenant). Still to confirm with Kev before it goes on signage.
- Monogram: an "OA" monogram in deep teal and copper. It sits on the Home hero, to the left of the names in the header, and is the favicon.

## Writing style (important)

No em dashes, en dashes or hyphens used as punctuation, in site copy and in chat replies. Rewrite with commas, periods, or "and" and "including". The only exception is a citation attribution, such as a Bible verse reference. Hyphens inside code (class names, attributes) and inside proper names or established terms ("aso-ebi") are fine. Do not invent facts. Where something is unknown, leave a clearly marked placeholder.

## Site map (public pages)

| Page | File | Notes |
|---|---|---|
| Home | `index.html` | Full page sunrise background that builds as you scroll and ends at the footer, content in front of it. Both dates and cities, countdown to June 12, the God centered line, two event cards with add to calendar, hashtag and share buttons. |
| Our Story | `our-story.html` | How they met, the journey, a favorite memory, and a painting below the text. The long proposal story was removed in November 2026. |
| Our Alliance | `our-alliance.html` | The couple, the wedding party, the family (including a late stepfather, Aloísio Vaz), and a tribute "In Loving Memory" to Kev's father. |
| Our Faith | `our-faith.html` | Both faith stories, Philippians 1:6, ceremony songs, a welcome for guests of any background. |
| Nigerian Ceremony | `nigerian-ceremony.html` | The livestream card is at the top. Venue, time, dress code, address and officiant are "coming soon" or to be announced. Traditions, a glossary, dishes, add to calendar. |
| Brazilian Reception | `brazilian-reception.html` | Beach house to be announced, semi formal dress, a draft order of the day, Brazilian dishes. |
| Getting to Lagos | `getting-to-lagos.html` | Nigeria visa guidance by passport, lodging, map. |
| Getting to Salvador | `getting-to-salvador.html` | Brazil visa guidance (with a reconfirm note for United States, Canadian and Australian passports), suggested stays, map. |
| RSVP | `rsvp.html` | Live form, see "RSVP flow" below. Reply by 19th February. |
| Registry | `registry.html` | Honeymoon or cash fund. Pix key live, international option pending. |
| Gallery | `gallery.html` | One shared Google Photos album per city, links pending. |
| FAQ | `faq.html` | Twelve entries. |
| Contact | `contact.html` | Disabled form preview. No private contact details are published. |

The navigation has two dropdown groups: **Our Ceremonies** (Nigerian Ceremony, Brazilian Reception) and **Travel and Accommodation** (Getting to Lagos, Getting to Salvador). A footer with small flowers sits in the **bottom right** corner of every page.

Retired pages (Meet the Couple, Wedding Party, Traditions and Menu, Schedule, Event Details, Travel) redirect permanently through `vercel.json`.

## Stack and files

Plain HTML, CSS with variables, and vanilla JavaScript. No framework and no build step. The sandbox this project is built in cannot reach the npm registry. The one npm package is `redis`, used by the serverless functions.

- `css/tokens.css`: shared design tokens (colors, fonts, spacing). `css/style.css`: the public site styles. `planner/planner.css`: the planner's own styles, kept separate.
- `js/main.js`: loads `partials/nav.html` and `partials/footer.html` into every page, runs the EN/PT toggle and the mobile nav. `js/home.js`: sunrise, countdown, sharing. `js/rsvp.js` and `js/rsvp-core.js`: the RSVP form and the shared answer rules.
- Language toggle: `<span class="lang-en">` and `<span class="lang-pt">`, shown or hidden by `html[data-lang]`. The choice is saved in localStorage.
- `calendar/*.ics`: add to calendar files. `images/`: monogram, favicons, the painting on Our Story.
- Palette: sand and cream, deep ocean teal, sunset coral (a darker coral for text and buttons so contrast passes), blush, muted gold, plus dawn lavender, dawn rose and sunrise gold for the Home sky. Fonts: Playfair Display for headings, Inter for body.
- Accessibility: contrast was audited, reduced motion gives a still sunrise, the layout is mobile first.

## The private planner (/planner)

A planning tool for the couple only, not linked from the public site, set to noindex and disallowed in `robots.txt`. It has no password. Files: `planner/index.html`, `planner.js`, `planner.css`, `tasks.js` (87 seed tasks), `sw.js`.

- Tabs: Checklist, Budget, Guests, Documents. Interface labels are in English and Portuguese, task text stays English. Title: "Planner | Kev & Andre".
- Data lives in the browser (localStorage key `kp-wedding-planner-v1`). All reads and writes go through `load()` and `save()`. Keep the key and the `mergeState` and `STATE_VERSION` migration.
- **Never commit real money amounts, guest names or phone numbers.** Amounts stay 0 in `freshState()`. Real data goes in through the Backup and data panel.
- Guests tab: a summary, a **Headcount by event chart** (Both, Lagos only, Brazil only, with attending versus not confirmed yet, and totals for Lagos and Salvador), an **RSVP review queue**, and the guest table (side, country, event, RSVP status, diet, plus ones, notes).
- **Sync between devices** (optional): `api/planner.js` stores one copy in Redis. The browser sends only a SHA 256 hash of the sync code as the address, so there is no login. Saves use compare and set on a revision number. The client is local first, debounced, and merges three ways per record and per field. The `ui` part of the state is never synced.

## RSVP flow

1. A guest fills in `rsvp.html`: full name, which celebration (Lagos, Salvador, both, or cannot come), number of guests, a dietary dropdown (No dietary restrictions, Vegetarian, Vegan, Pescatarian, Halal, Gluten free, Dairy free, Nut allergy, Other with a text box), and a travel or visa help checkbox. A hidden honeypot field catches basic bots.
2. The page posts to `api/rsvp.js`, a write only function. It finds the planner's Redis record from the `PLANNER_KEY` environment variable (the couple's sync code, set in Vercel and never in the repo).
3. An exact name match to exactly one guest (case, extra spaces, punctuation and accents ignored) updates that row: Attending or Declined, event, diet, plus ones. Declined guests stay on the list. No match, or more than one match, adds the answer to a review queue in the planner (Match to an existing guest, or Add as new guest), with a count badge on the Guests tab.
4. Guests see a thank you either way. Guests who decline see a different message from guests who are coming. They never see whether they were matched.
5. Safety: size limit, per name and per visitor limits stored in Redis, up to 5 retries on a save conflict. The honeypot is a light deterrent, not real security.
6. The function returns a short reference if saving fails (for example `no_planner_key`, `no_planner_record`, `no_database`), which the page shows in brackets.

Environment variables on Vercel: `PLANNER_KEY` (the sync code), and the Redis connection (`REDIS_URL` from the Redis integration, or Upstash `KV_REST_API_URL` and token). The shared Redis code is in `api/_lib/store.js`, and the rules for turning an answer into a guest row are in `js/rsvp-core.js`, used by both the server and the planner.

## Where things stand

Done: all pages above, the sunrise Home, monogram and favicon, bilingual content, calendar files, redirects, the planner with Documents, sync, headcount chart and review queue, the live RSVP form connected to the planner (confirmed working on the live site).

Placeholders by design (do not invent content for these):
- Nigerian Ceremony: church, venue, time, address and map, dress code.
- Brazilian Reception: the beach house, its address and map, and the draft order of the day (some rows may no longer apply).
- Livestream link for Lagos, Gallery album links, the registry's international payment link.
- Travel content: lodging, budget and things to do for both cities, and step by step visa guides.
- Contact: a way to reach the couple that does not publish personal details, and a connected form.

Open decisions: who is invited to which event, outfit change between the two celebrations, final wording for adapted traditions (aso-ebi and money spraying), confirming the hashtag with Kev, the domain name, a photoshoot, and reconfirming the Brazil and Nigeria visa rules before launch. The RSVP deadline is 19th February (2027).

## How to work with me on this

- Read `CLAUDE.md` and `content-briefing.md` in the repository first. They are the source of truth, along with this file.
- Keep it simple: static, mobile first, no new frameworks, no new database for the public site.
- Match the existing style and the writing rules above. Provide Portuguese for any new public text.
- Check changes at phone width and desktop width before saying something is done. Say plainly what was and was not tested.
- Never put real guest data, money amounts, passwords, the sync code or API keys into files. I add secrets in Vercel myself.
- Ask before pushing live or doing anything hard to undo.
