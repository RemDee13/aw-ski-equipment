# DOCUMENTATION — AW Ski Equipment (master spec)

Master specification for the build. Companion docs: [`SCROLL-STORYBOARD`](./SCROLL-STORYBOARD.md) (numbers), [`ASSETS-PROMPTS`](./ASSETS-PROMPTS.md) (assets), [`CONTENT`](./CONTENT.md) (copy/data), [`DESIGN-TOKENS`](./DESIGN-TOKENS.md) (style), [`DECISIONS`](./DECISIONS.md) (open/risk), [`CLAUDE`](./CLAUDE.md) (invariants).

---

## 1. Goal & framing
A portfolio **demo** e-commerce experience for snowboard gear — the third AW-series site, sibling to AW House Flipping. The hook is a **scroll-scrubbed cinematic**: scrolling drives a video of a snowboarder gearing up, focusing on three zones; at each, two glass product cards split out with connector lines; it ends on a behind-the-rider mountain reveal. Below the fold: catalog, FAQ, contact, footer. Fictional brand, framed by the portfolio ribbon.

## 2. Reference analysis & how we differ
Reference `i-want-fable.vercel.app` (cosmonaut) = scroll-scrubbed pre-rendered video (Lenis + GSAP), `currentTime` tied to scroll, with glass overlay blocks at scroll stops. We adopt the **same mechanism** but:
- 3 focus stops, each revealing **two** cards that split left/right (vs the reference's single blocks).
- A camera that pans top→bottom through the rider, then **orbits behind** to reveal a mountain.
- Assets are AI-generated stills animated via first/last-frame conditioning (not filmed).

We deliberately do **not** use real-time 3D (no model pipeline, heavier mobile) — video keeps it cinematic and static-host-friendly.

## 3. Stack & architecture
Parity with sibling: `React 18` + `TypeScript` + `Vite 5` + `Tailwind 3` + `Lenis` + **`GSAP ScrollTrigger`** (new) + `lucide-react`; `Inter` + `Playfair Display`. Component-per-section.

**File / component map** (also in CLAUDE.md):
```
src/App.tsx                      Lenis init (reduced-motion guard), ribbon, layout, IntersectionObserver reveals
src/components/
  PortfolioRibbon.tsx            fixed top ribbon (parity copy, • recolored brand)
  Navbar.tsx                     glass pill nav + "Shop the kit" CTA
  ScrollCinematic.tsx            pinned host; mounts the act <video>s + overlays; owns scroll progress
  ProductCard.tsx                liquid-glass card; props: product, side('left'|'right'), visible
  ConnectorLine.tsx              SVG line from card inner edge to gear anchor (screen coords)
  Catalog.tsx                    6-tile product grid (#gear)
  FAQ.tsx                        accordion (button + aria-expanded) (#faq)
  Contact.tsx                    Web3Forms (copied from sibling, strings swapped) (#contact)
  Footer.tsx                     portfolio credit + marquee
src/hooks/
  useVideoScrubber.ts            scroll progress -> video.currentTime (rVFC + rAF lerp)
  useCoverAnchor.ts              fraction-of-frame -> screen xy through object-fit:cover transform
src/data/products.ts             typed Product[] (source of truth = CONTENT.md §2)
```
`products.ts` mirrors the sibling's `data/hotspots.ts` pattern (typed array, fractional anchors).

## 4. Media delivery & budget (GitHub Pages) — **read before adding video**
- **No Git LFS.** Pages serves LFS pointer text, not bytes → broken video. Hard rule.
- Per file `< 50 MB` target (`100 MB` = git hard reject). Total committed media `< ~300–400 MB` (repo soft cap ~1 GB).
- **Bandwidth:** Pages soft cap **100 GB/month**. Byte budget per page load: **desktop ≤ 15–20 MB**, **mobile ≤ 6–8 MB**. Eager-load only `idle` + `s1`; lazy-load `s2`–`s4` as the user approaches each act.
- Don't commit draft/intermediate encodes (permanent `.git` bloat).
- **Hosting decided (D3): GitHub Pages `public/`.** Pages is fronted by **Fastly CDN** (Range + edge caching) so delivery is fast worldwide for a low-traffic flagship. External bucket is only a fallback if the 100 GB/mo bandwidth cap is ever hit (then absolute URL, no `BASE_URL` prefix).

## 4a. Low-end device & fast-load optimization (this is the flagship — make it light)
On weak devices the bottleneck is **video decode during scrub**, not bandwidth. Decode cost ∝ pixels × keyframe density, so:
- **Scrub at modest resolution, sharpen at rest.** Encode scrub clips at **720p desktop / ~540p mobile** (full-bleed still looks clean) and rely on **crisp full-res poster stills (K1–K4, AVIF/WebP)** at each stop where motion is parked. The eye reads sharpness at the stops, motion in between.
- **Few, short clips:** 4 acts × ~3–5 s @ 24 fps. Fewer total frames = less to decode/download.
- **Preload discipline:** `idle` + `s1` eager (`preload="auto"`); `s2`–`s4` `preload="none"` and lazily `load()` as the user nears each act. Target **first-load transfer ≤ ~5–6 MB** so first paint is fast.
- **Smooth seeks:** `requestVideoFrameCallback` + rAF lerp (never raw `currentTime` per scroll event); dense keyframes (`-g 4`) so seeks don't replay a long GOP.
- **Posters/images:** AVIF or WebP, sized per breakpoint, `loading="lazy"` below fold, explicit `width/height` to avoid layout shift.
- **Decode budget:** only **one** act `<video>` actively scrubbing at a time; pause/`removeAttribute('src')` off-screen clips on very low-end (detect via `navigator.hardwareConcurrency` / `deviceMemory`).
- **Hard reliability path:** if decode/seek stalls (low-power, old device), the image-sequence/poster fallback (§6) takes over — the cinematic degrades to crisp stills, never to a frozen black `<video>`.
- Lighthouse target: LCP ≤ ~2.5 s on mid-tier mobile; the LCP element is the **poster image**, not a video, so it paints immediately.

## 5. iOS / Safari encode + render recipe
Scrub on iOS Safari is fragile; pin these:
- **Encode** (full recipe in ASSETS-PROMPTS §10): `-movflags +faststart` (Safari won't render/seek without a front moov atom), dense keyframes (`-g 4 -keyint_min 4 -sc_threshold 0`) for smooth seeking, `-pix_fmt yuv420p`, H.264 main, `-an`.
- **Playback:** `<video muted playsinline preload>`. Drive seeks through `requestVideoFrameCallback` + a **rAF lerp** (`current += (target-current)*0.1`), **not** a raw `currentTime` set on every scroll event (that stutters).
- GitHub Pages/Fastly **do** honor HTTP Range, so static hosting is fine — the scrub works *because* of faststart + Range.
- Mobile gets a downscaled (720p) and/or 9:16 variant under the byte budget.

## 6. Fallback architecture (first-class, not optional)
iOS **Low Power Mode disables `<video>` seeking entirely** — a real slice of users. Detect failure (video `stalled` / `play()` rejection / no `requestVideoFrameCallback` progress) and switch to the **poster path**:
- Render keyframe stills **K1–K3** stacked vertically; under each, its two product cards in normal flow (no absolute connector, or a short static line). **K4** closes as the hero image + finale copy + CTA.
- The **same** still set serves `<video poster>`, `prefers-reduced-motion`, and low-power.
- **All 6 cards + all copy remain reachable** with zero scrub. (Layout in SCROLL-STORYBOARD → Fallback.)
- `prefers-reduced-motion`: also disable Lenis, marquee, card auto-animation, reveal-up (mirror the sibling's reduced-motion CSS block).

## 7. Dual-card anchoring & segment swapping
- Each stop shows **two** cards (left + right), each with its own SVG connector to its gear anchor.
- **Anchor model:** store each anchor as a **fraction of the video frame** (0..1). At runtime, `useCoverAnchor` computes the `object-fit: cover` transform (scale + translate from comparing the video's intrinsic ratio to the viewport) and maps the fraction to screen coords — same idea as the sibling's shared media transform for hotspots. **Redraw connectors on scroll + resize.**
- Keep the rider centered; the K1–K3 prompts reserve left/right safe-zones so cards never cover the focus element.
- **Mobile (`<768px`):** collapse the pair into two stacked bottom-sheet cards (or a 2-tab switch), no connector lines.
- **Segment swap (no flash):** keep adjacent `<video>` mounted; cross-hold the outgoing clip's last frame while the next seeks to frame 0, then swap opacity. Because `K_n` is shared as last-of-S_n / first-of-S_{n+1}, the held frame and the next first frame match.

## 8. Responsive
Breakpoints **375 / 768 / 1024 / 1440 / 1920+**. Define a cinematic **focal safe-area** so the rider and each focus stay framed from phone to ultrawide; on very wide screens cap the stage or letterbox rather than over-cropping `cover`. Pick the 16:9 vs 9:16 master by viewport ratio. Catalog grid: 1→2→3 columns.

## 9. Accessibility
- Keyboard-reachable with a visible **yellow (`gear`) focus ring** on nav, cards, FAQ, form, CTAs.
- FAQ = `<button aria-expanded>` accordion; Esc/Enter behavior.
- Decorative hero video `aria-hidden`; poster has descriptive `alt`. Cards are real focusable elements with readable labels.
- **Contrast:** over-video text only on `.glass` or the hero scrim; target WCAG **AA** (≥4.5:1 body, ≥3:1 large). Never bare text over bright snow.
- Touch targets ≥44px. Respect `prefers-reduced-motion` (§6).

## 10. Head / SEO / social
Reproduce sibling `index.html` structure with AW Ski strings (exact strings in CONTENT.md §5): `<title>`, `meta description`, `link rel=canonical https://awski.pavlov-ai.online/`, full OG block (`og:type/site_name/url/title/description/image` + `image:width=1200`/`height=630`/`alt`), Twitter `summary_large_image`, `theme-color #0A0F1A`, `favicon.svg` + `apple-touch-icon`. OG image = `public/og-image.jpg` (1200×630, from ASSETS-PROMPTS §7).

## 11. Series parity contract (exact values)
Reuse, so the three AW sites read as one author's work:
- **Ribbon (verbatim):** `Portfolio demo` • `Not a real Company` • `built by` → [`Anton Pavlov`](https://pavlov-ai.online); `•` in `brand`, classes `fixed top-0 inset-x-0 z-[110] glass border-b border-white/10 text-center text-[11px] sm:text-xs py-1.5 px-4` (recolored glass vs sibling's `bg-black/70`).
- **Footer credit:** `© 2026 AW Ski Equipment — fictional company, portfolio demo.` + `Made by · Anton Pavlov · pavlov-ai.online`. Marquee words: `Ride · Carve · Send · Glide · Drop · Float`.
- **Contact.tsx:** copied from sibling; change only `ACCESS_KEY` (new), `subject = "New inquiry — AW Ski Equipment"`, `from_name = "AW Ski Equipment website"`, `FALLBACK_EMAIL = "hello@awski.example"`. Keep the `botcheck` honeypot and the `startsWith('YOUR_')` mailto fallback. Status strings per CONTENT.md §4.
- **Tokens:** Tailwind `brand`/`brand-dark` kept; add winter tokens (DESIGN-TOKENS.md). Easing `cubic-bezier(0.16,1,0.3,1)`. Fonts Inter + Playfair.
- **Smooth scroll:** `new Lenis({ duration: 1.1, smoothWheel: true })`, disabled under reduced-motion (parity).

## 12. Deploy
- `vite.config.ts` → `base: '/'`. `public/CNAME` → `awski.pavlov-ai.online`. `.github/workflows/deploy.yml` = sibling verbatim (push to `main` → build → Pages).
- **One-time setup (not inherited):** add DNS `CNAME` record `awski` → the same Pages target as `awhome`; set the custom domain in the new repo's Pages settings; wait for the cert; enable **Enforce HTTPS**.
- **`.nojekyll`:** unnecessary (Vite `dist/` has no `_`/`.` paths). Add `public/.nojekyll` only if you ever introduce an asset path starting with `_`.

## 13. Build phases (ordered; some run on placeholder media)
1. **Scaffold** — Vite+TS+Tailwind+Lenis, tokens (DESIGN-TOKENS), `PortfolioRibbon`, `Navbar`. *(no media)*
2. **Below-fold first** — `Catalog`, `FAQ`, `Contact` (copy from sibling), `Footer` from CONTENT.md. *(no media — fully shippable)*
3. **Static hero** — `ScrollCinematic` with a poster image + the fallback layout (all 6 cards in normal flow). *(placeholder poster)*
4. **One scrubbed act** — wire Lenis+GSAP pin + `useVideoScrubber` on S1 with a placeholder clip; verify currentTime tracking + cards.
5. **Generalize** — all 4 acts + dual cards + `ConnectorLine` + `useCoverAnchor`; segment swap.
6. **Finale** — A4 orbit + finale copy + CTA.
7. **Fallback/mobile** — low-power/reduced-motion detection, bottom-sheet cards, breakpoints.
8. **SEO/OG/favicon** (§10) → **deploy** (§12).
> Swap real renders in as the user delivers them — the structure is built on placeholders (sibling's proven pattern).

## 14. Production polish
Perf budget per §4 (LCP target ≤ ~2.5 s, lazy-load below-fold clips, per-clip ceiling). Note GitHub Pages SPA 404 behavior (single-page; a `404.html` copy of `index.html` is the usual trick if deep links are ever added). Optional `robots.txt` + `sitemap.xml` for the custom domain. Aim for a clean Lighthouse story given the heavy media.

## 15. Verification (definition of done for the build)
Run the QA in [`README → Build/run/verify`](./README.md): desktop scrub, **real iPhone Safari** (renders + scrubs + low-power fallback), reduced-motion, all breakpoints. Confirm all 6 cards reachable in every path, ribbon/footer/OG parity, form submits (or mailto-fallbacks), and final scrub smoothness **on the live Pages URL**.
