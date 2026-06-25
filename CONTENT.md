# CONTENT — copy deck & product data

Authoritative copy for AW Ski Equipment. Every visible string lives here; the build session reproduces these **verbatim** (English ships). `src/data/products.ts` is generated from §2.

---

## 1. Brand & global strings

- **Brand name:** AW Ski Equipment · **logo lockup:** `AW Ski`
- **Tagline / hero headline:** *Suit up. Send it.*
- **Portfolio ribbon (verbatim, parity):** `Portfolio demo` • `Not a real Company` • `built by` [`Anton Pavlov`](https://pavlov-ai.online)
  *(the `•` separators render in `brand` orange; "Anton Pavlov" links to https://pavlov-ai.online, `target="_blank" rel="noopener"`)*
- **Navbar:** logo `AW Ski` · links `Gear` (#gear) · `Story` (#story) · `FAQ` (#faq) · `Contact` (#contact) · CTA button `Shop the kit` (→ #gear)

### Hero overlay copy
- Eyebrow: `AW Ski Equipment`
- Headline: `Suit up. Send it.`
- Sub: `Pro-grade snowboard gear, built for deep days and long descents. Scroll to gear up.`
- Scroll cue: `Scroll`

### Finale (mountain reveal) copy
- Headline: `The mountain is waiting.`
- Sub: `Your kit's ready. The line's yours.`
- CTA: `Shop the kit` (→ #gear)

### Footer
- Marquee words (loop): `Ride` · `Carve` · `Send` · `Glide` · `Drop` · `Float`
- Credit line 1: `© 2026 AW Ski Equipment — fictional company, portfolio demo.`
- Credit line 2: `Made by · Anton Pavlov · ` [`pavlov-ai.online`](https://pavlov-ai.online)
- Footer nav: `Gear` · `Story` · `FAQ` · `Contact`

---

## 2. Products — 6 items, 3 pairs (source of truth for `products.ts`)

Each focus stop shows **two** cards splitting to opposite sides. `side` = which way the card slides / which side of the rider its connector points to. `pairId` groups the stop. Prices are demo USD.

### Stop 1 — Face (`pairId: "optics"`)

**`goggles` — left**
- Name: `Vortex Mirror Goggles`
- Hook: `See the whole mountain — edge to edge.`
- Price: `$189`
- Badge: `Best seller`
- Specs: `Oversized frame, magnetic quick-swap lens` · `Yellow mirror lens, 18% VLT` · `Triple-layer face foam` · `Permanent anti-fog coating`
- CTA: `Add to kit`
- *(image: yellow mirror lens, black strap, white-helmet pairing)*

**`mask` — right**
- Name: `Stormknit Balaclava`
- Hook: `Full-face warmth, all day.`
- Price: `$39`
- Badge: `New`
- Specs: `Full-face merino-knit balaclava` · `Fog-free breathing channel` · `Goggle-compatible eye port` · `One size`
- CTA: `Add to kit`
- *(image: black balaclava)*

### Stop 2 — Torso & hands (`pairId: "shell"`)

**`jacket` — left**
- Name: `Apex 3L Shell Jacket`
- Hook: `Three layers between you and the storm.`
- Price: `$429`
- Badge: `Pro`
- Specs: `3-layer 20k/20k waterproof-breathable` · `Pit zips + powder skirt` · `RECCO reflector` · `Helmet-compatible hood`
- CTA: `Add to kit`
- *(image: alpine-yellow shell, black shoulder panels)*

**`gloves` — right**
- Name: `Gauntlet GTX Gloves`
- Hook: `Dry hands, every lap.`
- Price: `$119`
- Badge: `null`
- Specs: `GORE-TEX insert, fully waterproof` · `Goat-leather palm` · `Storm gauntlet cuff` · `Touchscreen index + thumb`
- CTA: `Add to kit`

### Stop 3 — Legs & feet (`pairId: "lower"`)

**`boots` — left**
- Name: `Carve Boa Boots`
- Hook: `Lock in with one pull.`
- Price: `$349`
- Badge: `Best seller`
- Specs: `Dual-zone Boa Fit System (yellow dials)` · `Heat-moldable liner` · `Medium-stiff flex` · `Shock-absorbing outsole`
- CTA: `Add to kit`
- *(image: black boots, yellow Boa dials)*

**`pants` — right**
- Name: `Ridgeline Shell Pants`
- Hook: `Built for the deep stuff.`
- Price: `$259`
- Badge: `null`
- Specs: `20k shell, bib-ready` · `Inner-thigh vents` · `Kevlar scuff guards` · `Integrated gaiters`
- CTA: `Add to kit`

> **Catalog grid (`#gear`)** = these same 6 items, tile order: goggles, mask, jacket, gloves, boots, pants. Each tile: image, name, hook, price, badge (if any), `Add to kit` CTA. CTA is demo → scrolls to `#contact`.

### TypeScript shape (target `src/data/products.ts`)
```ts
export interface Product {
  id: 'goggles' | 'mask' | 'jacket' | 'gloves' | 'boots' | 'pants'
  pairId: 'optics' | 'shell' | 'lower'
  side: 'left' | 'right'
  name: string
  hook: string
  price: string
  badge: string | null
  specs: string[]
  // anchor as a fraction (0..1) of the VIDEO frame at this stop — see SCROLL-STORYBOARD
  anchor: { x: number; y: number }
}
```

---

## 3. FAQ (`#faq`) — demo-shop framed

1. **Is this a real store?**
   No — it's a portfolio demo by Anton Pavlov. The gear, prices, and brand are fictional, built to show off a scroll-driven product experience.
2. **Can I actually buy anything?**
   The "Add to kit" buttons are for show. They send you to the contact form — reach out if you'd like a site like this.
3. **Is the snowboarder real footage?**
   No. The rider and the mountain are AI-generated stills animated into a scroll-scrubbed video. (Built with Nano Banana Pro + a Google video model.)
4. **How do I pick the right size?**
   In a real build this is where a size guide and fit chart would live. Here it's a placeholder to show the layout.
5. **What about shipping and returns?**
   Also fictional — a real version would document delivery times, regions, and a returns window here.
6. **Who built this and can I get one?**
   Anton Pavlov ([pavlov-ai.online](https://pavlov-ai.online)). Yes — use the contact form below.

---

## 4. Contact section (`#contact`) — Web3Forms

- Eyebrow: `Get in touch`
- Heading: `Gear up with us` *(Playfair italic, two lines OK)*
- Sub: `Want a scroll-driven site like this one? Send a note and I'll get back within a business day.`
- Fields: `Name` (required) · `Email` (required) · `What are you after?` (optional text) · `Message` (required, textarea)
- Submit button: `Send message`
- Contact rows: `hello@awski.example` · `+1 (000) 555-0142` · `Alps · Worldwide` *(all fictional, demo)*

### Form states (status line, parity wording)
- idle: `` (empty)
- sending: `Sending…`
- success: `Thanks — I'll be in touch within one business day.`
- error (server): `Something went wrong. Please email me directly.`
- error (network): `Network error — please try again.`
- mailto-fallback (key not set): `Opening your email app…`

### Web3Forms hidden fields
- `access_key` = `9ca61ce9-166c-4793-ad84-1aa5f8f3be0f` (AW Ski key — public client-side id, safe to commit)
- `subject` = `New inquiry — AW Ski Equipment`
- `from_name` = `AW Ski Equipment website`
- `botcheck` honeypot (keep)
- `FALLBACK_EMAIL` = `hello@awski.example`

---

## 5. Head / SEO strings (for `index.html`)
- `<title>`: `AW Ski Equipment — Suit up. Send it.`
- `meta description`: `Pro-grade snowboard gear for deep days and long descents — goggles, shells, boots and more. A scroll-driven portfolio demo by Anton Pavlov.`
- `og:site_name`: `AW Ski Equipment` · `og:url` / canonical: `https://awski.pavlov-ai.online/`
- `og:title`: `AW Ski Equipment — Suit up. Send it.`
- `og:description`: `Pro-grade snowboard gear, brought to life with a scroll-scrubbed cinematic. Portfolio demo by Anton Pavlov.`
- `og:image`: `https://awski.pavlov-ai.online/og-image.jpg` (1200×630), `og:image:alt`: `A snowboarder geared up against a huge alpine peak`
- Twitter: `summary_large_image`, same title/description/image.
- `theme-color`: `#0A0F1A`
