# Tomato's Zim Trip — Claude Code instructions

A static, zero-build trivia game for ExploreLocally. The tomato cycles across a cartoon map of
Zimbabwe; each of 10 stops has 5 questions and a 60-second clock. It will live at
**https://zimtrivia.explorelocally.co.zw**.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole game: markup, CSS, map art and game logic. No framework, no build step. |
| `questions.js` | The question bank (`PLACES`). **Edit questions here, not in `index.html`.** |
| `favicon.svg` | Tomato icon. |
| `og-image.png` | 1200×630 link-preview image for WhatsApp/Facebook. |
| `vercel.json` | Static hosting config (headers, caching). |

### Question format (`questions.js`)
- Each stop: `{ id, name, lon, lat, link, linkLabel, src, blurb, qs: [...] }`.
- Each question: `{ q, o: [correct, wrong, wrong, wrong], f, s? }`.
  - **The first option in `o` is always the correct answer.** Options are shuffled at runtime.
  - `f` = one-line fact shown after answering and in the Source pop-up.
  - `s` = optional source URL; falls back to the stop's `src` (a Wikipedia page).
- Keep **at least 15 questions per stop** — players get unseen questions first (tracked in
  `localStorage` key `zimtrip-seen`), so 15 = three runs without a repeat.
- `link` is a path on explorelocally.co.zw (UTM tags are added automatically).
- Stop `id`s are tied to map artwork and layout in `index.html` (`ART` and `LAYOUT`). Don't rename them.

## Hard rules
- **British English** in all copy.
- Keep it a single static page — no frameworks, no bundler, no tracking scripts added without asking.
- **DNS caution:** when touching Cloudflare, only add/change the `zimtrivia` record.
  **Never modify MX, TXT (SPF/DKIM/DMARC) or the apex/`www` records** of explorelocally.co.zw.

---

## First-time setup (do these in order, confirm each step before moving on)

Assumes `gh`, the Vercel CLI (or Vercel MCP) and Cloudflare access are already authenticated.

### 1. GitHub repo
```bash
git init -b main
git add .
git commit -m "Tomato's Zim Trip: initial release"
gh repo create zim-trivia --public --source=. --remote=origin --push \
  --description "Tomato's Zim Trip – a Zimbabwe trivia ride by ExploreLocally"
```
(Use `--private` instead if Rufaro prefers; Vercel works with either.)

### 2. Vercel project
- Import the `zim-trivia` GitHub repo as a new Vercel project (Framework preset: **Other**,
  no build command, output directory = repo root).
  CLI equivalent: `vercel link` → `vercel --prod`.
- Production branch: `main`. Preview deployments per branch are fine as-is.
- Add the domain: `vercel domains add zimtrivia.explorelocally.co.zw` (or Project → Settings → Domains).
  Note the DNS target Vercel shows (normally a CNAME to `cname.vercel-dns.com`).

### 3. Cloudflare DNS (zone: explorelocally.co.zw)
- Add **one** record:
  - Type `CNAME`, Name `zimtrivia`, Target `cname.vercel-dns.com` (or whatever Vercel showed),
  - Proxy status: **DNS only (grey cloud)** so Vercel can issue the SSL certificate.
  - TTL: Auto.
- Before saving, list existing records and confirm nothing else is being changed.

### 4. Verify
- Wait for Vercel to show the domain as **Valid Configuration** and the certificate as issued.
- Open https://zimtrivia.explorelocally.co.zw and check:
  - Start → ride to Victoria Falls → Start the clock → answer questions (right answers auto-advance, wrong ones show Next).
  - "Source" button opens the fact-check card with a Wikipedia link.
  - On a phone-width window the map pops up during rides and the page doesn't scroll sideways.
  - `https://zimtrivia.explorelocally.co.zw/og-image.png` loads (link previews).
- Report back the live URL, the GitHub repo URL and the Vercel project name.

---

## Everyday changes
- Edit `questions.js` (or `index.html`), commit, `git push` → Vercel redeploys automatically.
- If you change the look of the start screen, regenerate `og-image.png` (1200×630 screenshot of the start screen).
- Test locally by opening `index.html` directly in a browser, or `npx serve .`.

## Nice-to-haves already discussed (not built yet)
- Link from the main explorelocally.co.zw site (nav or a "Play the Zim trivia" banner).
- Shared leaderboard.
- Harder later stops (shorter clock), sound effects with a mute toggle.
- Destination pages on explorelocally.co.zw for Mana Pools, Chimanimani and Gonarezhou — then update their `link` in `questions.js` (currently `/listings/parks/` and `/listings/hiking-trails/`).
