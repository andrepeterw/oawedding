# Context for Claude: the Kev and Andre Peter wedding website (current version)

Paste this whole file at the start of a Claude chat, or attach it, so Claude knows where the website stands. It describes the live version as of 17 November 2026 (after commit b6d756c). If something here disagrees with what you see on the site, the site wins, and please tell Claude so it can correct itself.

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
- Monogram: an "OA" monogram in deep teal and copper. It sits on the Home hero (under the "Our Alliance" line above the names), to the left of the names in the header, and is the favicon.

## Writing style (important)

No em dashes, en dashes or hyphens used as punctuation, in site copy and in chat replies. Rewrite with commas, periods, or "and" and "including". The only exception is a citation attribution, such as a Bible verse reference. Hyphens inside code (class names, attributes) and inside proper names or established terms ("aso-ebi") are fine. Do not invent facts. Where something is unknown, leave a clearly marked placeholder.

## Site map (public pages)

| Page | File | Notes |
|---|---|---|
| Home | `index.html` | Full page sunrise background that builds as you scroll and ends at the footer, content in front of it. Both dates and cities, countdown to June 12, the God centered line, then a "Find your way around" section with three cards: Our Story, Our Alliance, Our Faith. The event cards and the hashtag and share buttons were removed from Home. |
| Our Story | `our-story.html` | A painting right below the page title, then three blocks of text (How we met, Our journey together, A favorite memory) separated by gold lines. The favorite memory invites guests to ask the couple about the proposal. The long proposal story was removed in November 2026. |
| Our Alliance | `our-alliance.html` | The couple, the wedding party (Sister of the Bride, Bridesmaids, Brother of the Groom, Groomsmen with first names only), the family (Kev's family includes a nephew, Andre Peter's includes a late stepfather, Aloísio Vaz), and a tribute "In Loving Memory" to Kev's father. |
| Our Faith | `our-faith.html` | Everything centered. Both faith stories, a welcome for guests of any background, and one card with the verse (Philippians 1:6, the reference on its own line). The Ceremony worship and Officiant cards were removed. |
| Our Ceremony (Lagos) | `our-ceremony.html` | Links to RSVP Lagos. Formerly nigerian-ceremony.html. The livestream card is at the top. Venue, time, dress code, address and officiant are "coming soon" or to be announced (Andre Peter's father will no longer officiate). Below the livestream, a Vimeo video titled "Learn about the Urhobo Ceremony" (an introduction for Brazilian guests, with an intro paragraph whose first "Urhobo" links to Wikipedia), and a small caption saying the video was made with AI, with its five sources. Then traditions and add to calendar. The glossary and the menu sections were removed. |
| Our Reception (Salvador) | `our-reception.html` | Links to Getting to Salvador and RSVP Salvador. Formerly brazilian-reception.html. Beach house to be announced, semi formal dress (the "by invitation only" box was removed), an order of the day placeholder. |
| Getting to Salvador (subpage of Our Reception, not in the navigation) | `getting-to-salvador.html` | Brazil visa guidance (with a reconfirm note for United States, Canadian and Australian passports), suggested stays, map. |
| RSVP Lagos and RSVP Salvador (subpages, not in the navigation) | `rsvp-lagos.html`, `rsvp-salvador.html` | Live forms, see "RSVP flow" below. "Please reply by 19th February." The old rsvp.html redirects to RSVP Lagos. |
| Registry | `registry.html` | Honeymoon or cash fund. Pix key live, a card with GBP bank details at Wise for UK and international transfers (the numbers are on the page, not repeated here), and a PayPal style link still pending. No USD details yet. |
| Gallery | `gallery.html` | One shared Google Photos album per city, links pending. |
| FAQ | `faq.html` | Twelve entries. |
| Contact | `contact.html` | Disabled form preview. No private contact details are published. |

The navigation is flat, with no dropdowns: Home, Our Story, Our Alliance, Our Faith, Our Ceremony, Our Reception, Registry, Gallery, FAQ, Contact. Getting to Salvador and the two RSVP pages are reached from the ceremony pages and the Home page buttons (RSVP Lagos and RSVP Salvador). Getting to Lagos was deleted. A footer with small flowers sits in the **bottom right** corner of every page.

Retired pages (Meet the Couple, Wedding Party, Traditions and Menu, Schedule, Event Details, Travel, Getting to Lagos, and the old file names of the ceremony pages and RSVP) redirect permanently through `vercel.json`.

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

1. A guest fills in one of two pages. **RSVP Lagos** asks "Will you join Our Ceremony?" (Yes or No). **RSVP Salvador** asks which celebration (Lagos, Salvador, both, or cannot come). Both ask the number of guests, a dietary dropdown (No dietary restrictions, Vegetarian, Vegan, Pescatarian, Halal, Gluten free, Dairy free, Nut allergy, Other with a text box) and a travel or visa help checkbox, and have a hidden honeypot field. One script (`js/rsvp.js`) serves both and tags each answer with its page.
2. The page posts to `api/rsvp.js`, a write only function. It finds the planner's Redis record from the `PLANNER_KEY` environment variable (the couple's sync code, set in Vercel and never in the repo).
3. An exact name match to exactly one guest (case, extra spaces, punctuation and accents ignored) updates that row: Attending or Declined, event, diet, plus ones. Declined guests stay on the list. A second answer is checked first: a repeat applies, an Attending answer for the other celebration makes the event Both, but a change of status (Yes after a No, or a No after a Yes) goes to the review queue as a conflict and the row is left alone. No match, or more than one match, adds the answer to a review queue in the planner (Match to an existing guest, or Add as new guest), with a count badge on the Guests tab.
4. Guests see a thank you either way. Guests who decline see a different message from guests who are coming. They never see whether they were matched.
5. Safety: size limit, per name and per visitor limits stored in Redis, up to 5 retries on a save conflict. The honeypot is a light deterrent, not real security.
6. The function returns a short reference if saving fails (for example `no_planner_key`, `no_planner_record`, `no_database`), which the page shows in brackets.

Environment variables on Vercel: `PLANNER_KEY` (the sync code), and the Redis connection (`REDIS_URL` from the Redis integration, or Upstash `KV_REST_API_URL` and token). The shared Redis code is in `api/_lib/store.js`, and the rules for turning an answer into a guest row are in `js/rsvp-core.js`, used by both the server and the planner.

## Recent changes (November 2026)

- Home: event cards and the Share section removed, three explore cards (Our Story, Our Alliance, Our Faith).
- Our Ceremony: Urhobo video embedded (Vimeo), new heading and intro, AI caption with sources in small type. Playback was not verified in the local preview, so check it on the live site and allow the domain in Vimeo embed privacy if needed.
- Our Reception: "by invitation only" note removed.
- Brazil only links: the Our Reception menu item, the footer and Home links to the Salvador pages, a few FAQ sentences and the Traveling with us block on Our Alliance appear only to visitors detected in Brazil (an IP based guess through `/api/country`, kept in a cookie). The pages themselves stay open by direct address.

- Home: a full page sunrise with the content in front, the OA monogram, hero line "Our Alliance". Footer flowers moved to the bottom right.
- Our Story: new painting under the title, proposal story removed, even spacing and gold lines between the three text blocks.
- Our Alliance: wedding party titles and names updated, nephew added to Kev's family, Andre Peter's bio shortened.
- Our Faith: all centered, officiant and worship cards removed.
- Nigerian Ceremony: livestream first, then the video, menu and glossary removed, officiant to be announced.
- Brazilian Reception: sea and music sections removed, order of the day is a placeholder.
- RSVP: reply by 19th February, two separate pages (RSVP Lagos and RSVP Salvador), a different thank you for guests who decline.
- Registry: GBP bank details card added.
- Planner: headcount by event chart and an RSVP review queue, connected to the live RSVP form.

## Where things stand

Done: all pages above, the sunrise Home, monogram and favicon, bilingual content, calendar files, redirects, the planner with Documents, sync, headcount chart and review queue, the live RSVP form connected to the planner (confirmed working on the live site).

Placeholders by design (do not invent content for these):
- Nigerian Ceremony: church, venue, time, address and map, dress code.
- Brazilian Reception: the beach house, its address and map, and the order of the day (a placeholder).
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
