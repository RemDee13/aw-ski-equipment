# CLAUDE.md — AW Ski Equipment conventions

Conventions and **invariants** for any session that builds this site. Read [`DOCUMENTATION.md`](./DOCUMENTATION.md) for the full spec; this file is the short, load-bearing rule set.

## Project framing
- Portfolio **demo** e-commerce site, third in the **AW** series (sibling: `../AW House Flipping`). Not a real shop.
- **Do NOT touch the sibling projects** (`AW House Flipping`, etc.). This repo is self-contained.
- Site language: **English** (all shipped copy). Guidance docs may be Russian.

## Stack (parity with sibling)
`React 18` + `TypeScript` + `Vite 5` + `Tailwind 3` + `Lenis` + **`GSAP ScrollTrigger`** (new vs sibling) + `lucide-react`. Fonts `Inter` + `Playfair Display`. Component-per-section.

## File / component map (target)
```
src/
  App.tsx                  # Lenis init (reduced-motion guard), ribbon, layout
  components/
    PortfolioRibbon.tsx    # fixed top ribbon (parity copy, recolored • )
    Navbar.tsx             # glass pill nav + CTA
    ScrollCinematic.tsx    # pinned host for the scrubbed-video acts
    ProductCard.tsx        # liquid-glass card (left/right variant)
    ConnectorLine.tsx      # SVG line from card to gear anchor
    Catalog.tsx            # 6-tile product grid
    FAQ.tsx                # accordion (button + aria-expanded)
    Contact.tsx            # Web3Forms (copied from sibling, strings swapped)
    Footer.tsx             # portfolio credit + marquee
  hooks/
    useVideoScrubber.ts    # scroll-progress -> video.currentTime (rVFC + rAF lerp)
    useCoverAnchor.ts      # fraction-of-frame -> screen xy through cover-crop
  data/
    products.ts            # typed product list — source of truth = CONTENT.md
```
`src/data/products.ts` mirrors the sibling's `data/hotspots.ts` shape (a typed array). CONTENT.md is the authoritative copy.

## Deploy invariants
- `vite.config.ts` → `base: '/'` (custom domain at root).
- `public/CNAME` → `awski.pavlov-ai.online` (single line, no scheme).
- `.github/workflows/deploy.yml` — copy sibling verbatim (checkout → setup-node 20 → `npm ci` → `npm run build` → `upload-pages-artifact` from `dist` → `deploy-pages`). Push to `main` deploys.
- One-time (not inherited from sibling): create DNS `CNAME` record `awski` → the same GitHub Pages target as `awhome`; set the custom domain in the new repo's Pages settings; wait for cert; enable **Enforce HTTPS**.
- **`.nojekyll`:** not needed because Vite's `dist/` has no paths starting with `_` or `.`. **If you ever add an asset path starting with `_`, add `public/.nojekyll`** or Pages' Jekyll pass will silently drop it.

## Media policy (critical — differs from sibling, which had tiny media)
- **No Git LFS.** GitHub Pages serves LFS pointer files, not bytes → broken video. Hard rule.
- Every committed media file `< 50 MB` (target) / `< 100 MB` (git hard limit). Total committed media `< ~300–400 MB`.
- **Never commit draft/intermediate encodes** — binary mp4 stays in `.git` history forever. Only final files.
- Local assets referenced via `` `${import.meta.env.BASE_URL}clip.mp4` `` (parity). **Exception:** if media is hosted on an external bucket/CDN (D3), use the absolute URL and do **not** prefix `BASE_URL`.
- Encode flags are non-negotiable (Safari): `-movflags +faststart`, short GOP (`-g` ~1–5 frames for scrub), `-pix_fmt yuv420p`, H.264 baseline/main, `-an` (strip audio). Provide desktop (1080p) + mobile (720p) variants.

## Web3Forms policy
- Copy `Contact.tsx` from sibling; change only `ACCESS_KEY`, the hidden `subject` / `from_name`, and `FALLBACK_EMAIL`.
- Access key (provided): `ACCESS_KEY = '9ca61ce9-166c-4793-ad84-1aa5f8f3be0f'`. New key, not the sibling's. The `startsWith('YOUR_')` mailto fallback stays in code for safety but won't trigger.
- The key is a **public client-side id** — safe to commit, not a secret. Spam protection is the `botcheck` honeypot. Keep the honeypot.
- Strings: `subject = "New inquiry — AW Ski Equipment"`, `from_name = "AW Ski Equipment website"`. Status strings reuse sibling wording (see CONTENT.md).

## Head / meta checklist (per DOCUMENTATION → Head/SEO)
`<title>`, `meta description`, `link canonical https://awski.pavlov-ai.online/`, full OG block (`og:type/site_name/url/title/description/image` + `image:width=1200/height=630/alt`), Twitter `summary_large_image`, `theme-color` = winter bg, `favicon.svg` + `apple-touch-icon`. OG image = `public/og-image.jpg` (1200×630). Mirror sibling `index.html` structure.

## Accessibility musts
- `prefers-reduced-motion` kills Lenis + scrub + marquee + card auto-anim; shows poster + reveals all 6 cards in normal flow (mirror sibling's reduced-motion CSS block).
- Keyboard reachable + visible focus (yellow `gear` ring) on nav, cards, FAQ, form. FAQ = `<button aria-expanded>`. Decorative hero video `aria-hidden`; poster has descriptive `alt`. Touch targets ≥44px. Over-video text only on glass or scrim (WCAG AA).

## Animation tech reminder
Scroll-scrubbed video (NOT real-time 3D, NOT mouse-spotlight). `useVideoScrubber` maps each pinned act's scroll progress → its clip's `currentTime` via `requestVideoFrameCallback` + a rAF lerp (like the sibling's spotlight lerp). Detect video `stalled`/play-failure → switch to image-sequence/poster path.
