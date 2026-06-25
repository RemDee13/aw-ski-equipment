# DESIGN-TOKENS — AW Ski Equipment

Single source of truth for color, glass, type, spacing, motion. **Nothing here gets hardcoded ad-hoc in components** — it lives in `tailwind.config.js` (colors, fonts, easing) or `src/index.css` (font import, keyframes, glass utility, reduced-motion block). This is the winter counterpart to the sibling's warm-dark palette.

> Series principle: `#e8702a` (the AW signature orange) is **reserved for series-identity elements only** — CTA buttons, the ribbon `•` separators, the footer wordmark, active states. The **scene/ambient** palette is cold (night-blue + icy cyan). This keeps the three AW sites visibly one author's work while letting the ski site read as winter.

---

## 1. Color palette

| Token | Hex | Use | Tailwind key |
|-------|-----|-----|--------------|
| `bg` | `#0A0F1A` | page background (night-blue, replaces sibling's `#000`) | `colors.bg` |
| `bg-2` | `#0E1626` | raised sections / footer | `colors.bg2` |
| `surface` | `#13203A` | solid card/nav surface (non-glass) | `colors.surface` |
| `ink` | `#EAF1F7` | primary text (off-white) | `colors.ink` |
| `ink-muted` | `#9FB2C4` | secondary text | `colors.inkMuted` |
| `line` | `rgba(255,255,255,0.12)` | hairline borders | — (use `border-white/12`) |
| **`brand`** | `#E8702A` | **signature accent (series identity)** — CTA, ribbon `•`, footer wordmark, active | `colors.brand` |
| `brand-dark` | `#D2611F` | CTA hover | `colors.brand-dark` |
| **`gear`** | `#F2C200` | **scene/product accent** (matches the rider's yellow kit) — focus rings, links, connector lines, badges, eyebrows | `colors.gear` |
| `gear-mirror` | `#F4C430` | goggle-lens yellow (imagery reference only) | — |
| `ice` | `#BFE9F5` | subtle snow highlights / glints (minor) | `colors.ice` |
| `success` | `#3FB68B` | form success status (parity w/ sibling) | `colors.success` |
| `error` | `#E3564B` | form error status | `colors.error` |

Gradients:
- Hero scrim (legibility over video): `linear-gradient(to top, rgba(10,15,26,0.85) 0%, rgba(10,15,26,0.15) 45%, rgba(10,15,26,0.55) 100%)` — keeps the rider visible, darkens top/bottom for text.
- Section seam glow (optional): radial `rgba(90,209,230,0.10)` top-center.

---

## 2. Glass recipe (liquid-glass product cards, navbar, ribbon)

Define once as a `.glass` utility (in `index.css`) + a slightly stronger `.glass-card`:

```css
.glass {
  background: rgba(18, 32, 58, 0.42);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.glass-card { border-radius: 20px; }   /* product cards */
```

- Navbar / ribbon use a lighter tint: `rgba(10,15,26,0.55)` + `blur(14px)` (matches sibling `bg-black/70 backdrop-blur-md` density, recolored).
- **Contrast guard:** any text over the live video sits on `.glass` OR over the hero scrim. Target **WCAG AA (≥4.5:1)** for body, **≥3:1** for large headings. White-on-snow is a real failure mode — never place bare text over the bright snow region; use the scrim or glass.
- Radius scale: `card 20px`, `pill/button 9999px`, `input 12px`.

---

## 3. Typography

- Import (parity with sibling, in `index.css`):
  `Inter:wght@300;400;500;600;700` + `Playfair Display:ital,wght@1,400;1,500;1,600`.
- **Inter** — all UI/body. **Playfair Display italic** (`.font-playfair`) — accent display headings (hero line, finale line, section titles). *Decision: keep Playfair for series parity (see DECISIONS.md).*
- Global letter-spacing on root: `tracking-[-0.02em]` (parity).
- Micro-labels (eyebrows): `text-xs tracking-[0.28em] uppercase` in `gear` yellow (sibling used `brand` — here gear-yellow for ambient/product, brand orange reserved for series identity).

| Role | Size (desktop) | Weight / font |
|------|----------------|---------------|
| Hero display | `clamp(2.5rem, 6vw, 5rem)` | Playfair italic |
| Section H2 | `clamp(2rem, 4vw, 3.75rem)` | Playfair italic |
| Card title | `1.125rem` | Inter 600 |
| Body | `1rem`–`1.125rem` | Inter 400, `leading-relaxed` |
| Eyebrow | `0.75rem` | Inter 500, tracked |
| Price | `1rem` | Inter 600, `tabular-nums` |

---

## 4. Spacing & layout

- Container: `max-w-6xl mx-auto px-6` (parity); wide catalog may use `max-w-7xl`.
- Section vertical rhythm: `py-28 md:py-36` (parity with sibling Contact).
- Card padding: `p-5 md:p-6`. Card width: `min(88vw, 360px)` desktop float; full-width bottom-sheet on mobile.
- Grid (catalog): `grid sm:grid-cols-2 lg:grid-cols-3 gap-6`.

---

## 5. Motion tokens

- **Easing (the one true curve):** `cubic-bezier(0.16, 1, 0.3, 1)` — every entrance/transition. Expose as Tailwind `transitionTimingFunction.smooth` and reuse in GSAP (`ease: 'power4.out'` is the GSAP analog).
- Durations: card slide-in `0.4s` (mobile) / `0.34s` (desktop) — reuse sibling `panelIn`; reveal-up `0.7s`; scrub smoothing lerp factor `~0.1` per rAF.
- Lenis: `new Lenis({ duration: 1.1, smoothWheel: true })` (parity). **Disabled under `prefers-reduced-motion`.**
- Reduced-motion block must zero out: scrub binding, marquee, card auto-animations, reveal-up (mirror sibling's `@media (prefers-reduced-motion: reduce)` block).

---

## 6. Wardrobe palette (shared with ASSETS-PROMPTS character-lock)

These exact material/color words must be reused **verbatim** in every keyframe prompt so the AI-generated rider stays consistent. Yellow-forward premium freeride look on a cold scene.

| Element | Locked description |
|---------|--------------------|
| Helmet | matte **white** hardshell, `#ECEDEF` |
| **Goggles** | oversized goggles, **yellow mirror lens** `#F4C430`, black strap |
| **Balaclava** (the "mask" product) | black balaclava `#15171A` covering the full face and neck — worn throughout |
| **Jacket** | bold **alpine-yellow** `#F2C200` technical shell, slightly oversized stylish cut, black `#15171A` shoulder panels, storm hood |
| **Gloves** | black insulated gloves, subtle yellow stitching |
| **Pants** | graphite-black `#2B2E33` shell pants, black reinforced knee panels |
| **Boots** | black snowboard boots with **yellow Boa dials** |
| Snowboard | matte charcoal-black `#1C1E22` deck, bold yellow-and-black topsheet graphic |
| Rider | athletic adult ~30, premium fashion-forward; **face fully covered by black balaclava + yellow mirror goggles** |

> The signature orange `#e8702a` no longer appears in-scene — it lives only in UI chrome (CTA / ribbon `•` / footer wordmark). In-scene pop = yellow.

Lighting (all frames): cold overcast alpine daylight, soft blue-grey shadows, gentle snow, the yellow kit popping against the cold palette.
