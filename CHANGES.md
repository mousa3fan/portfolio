# Mobile Optimization — What Changed

Goal: make the portfolio read perfectly on iOS Safari and every Android browser,
with the PDF shown **as part of the page** (page-by-page, clickable controls,
download button). Nothing was rebuilt — the design, hero, tracking, email
notifications and the `?admin=1` dashboard are untouched.

## Files changed

| File | Change |
| --- | --- |
| `src/components/PdfViewer.tsx` | **NEW** — PDF.js page-by-page viewer (replaces the broken `<iframe>` embed) |
| `src/app/page.tsx` | `<iframe>` swapped for `<PdfViewer />`; small tap-target bump on the Download button; safe-area classes on hero / portfolio / footer |
| `src/app/layout.tsx` | `viewport` export: `viewportFit: cover` (edge-to-edge under the notch), `themeColor` (Safari/Chrome UI tint), Android keyboard `interactiveWidget`; apple-touch-icon |
| `src/app/globals.css` | Mobile rules appended at the bottom (dvh, safe areas, tap highlight, reduced-motion) |
| `package.json` / `bun.lock` | Added dependency `pdfjs-dist@^4.10.38` (legacy build = supports older phones) |
| `public/pdfjs/…` | **NEW** — `pdf.worker.min.mjs` + `standard_fonts/` (16 fallback font files — your PDF's Helvetica text needs them). The optional `cmaps/` folder (169 CJK files) was deliberately **not** included since the PDF is English-only. |
| `.gitignore` | Added `prisma/db/` (local SQLite test DB) |

## Why the iframe was replaced

- **Android Chrome / Firefox / Samsung Internet do not render PDFs inside
  `<iframe>` at all** — visitors saw an empty grey box (or a download prompt).
- **iOS Safari renders only the first page** inside an iframe, and scrolling
  inside it is unreliable; pinch-zoom breaks the layout.

The new viewer renders every page with PDF.js onto a canvas, so it behaves the
same in **every** mobile browser.

## What the viewer does

- Page-by-page display starting at page 1 — crisp on retina (renders at
  devicePixelRatio, capped at 3x).
- **Clickable controls:** `‹ Prev` / `Next ›` buttons, **10 tappable page dots**
  (jump straight to any page), `⤢` opens the raw PDF in a new tab for native
  pinch-zoom, and the `⬇ Download PDF` button keeps your `/api/download` tracking.
- **Swipe left / right** to turn pages on touch screens (vertical scrolling is
  never hijacked; boundary pages don't loop).
- Keyboard ← / → on desktop.
- Adjacent pages are pre-rendered so swiping feels instant (cache of 3 pages,
  memory freed on evict — safe for low-RAM phones).
- Orientation change / resize re-fits automatically.
- Fallback: if a very old browser can't run PDF.js, the old iframe embed is
  shown with a direct link, so nothing is lost.

## Mobile browser fixes included

- `100dvh` hero height — tracks the collapsing Safari URL bar (no more content
  hidden behind it).
- Safe-area padding for notched iPhones / camera cut-outs (top of hero, bottom
  of the portfolio section and footer) — works with `viewport-fit=cover`.
- `-webkit-text-size-adjust: 100%` (stops iOS landscape text inflation).
- `-webkit-tap-highlight-color: transparent` + `:active` scale feedback on the
  big buttons (no grey flash on Android).
- 44px+ tap targets: Prev/Next/dots/fullscreen/download all meet the
  Apple/Google minimum.
- `prefers-reduced-motion` respected (bounce/spinner disabled for users who
  turn off animations).
- Status bar / Chrome toolbar tint matches the page (`themeColor`, light+dark).
- When Android users focus the dashboard PIN field, the keyboard resizes the
  page instead of covering it (`interactiveWidget: resizes-content`).

## Deploy

```bash
bun install        # pulls pdfjs-dist (lockfile already updated)
bun run build      # or push to GitHub → Vercel as before
```

No environment variables, DB or Vercel settings need to change.

## Verified in-browser (390×844 iPhone, 360×640 Android, 1440×900 desktop)

- Page 1 → 10 navigation via buttons, dots, swipe and keyboard
- Zero horizontal overflow at all three widths
- Download button click still logged in the dashboard (tested end-to-end)
- Admin dashboard unchanged and working
