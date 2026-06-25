# SCROLL-STORYBOARD — the cinematic, by the numbers

5 beats: **idle → 3 dual-card stops → orbit finale**. The hero is one pinned host (`ScrollCinematic`) made of 4 scrubbed acts (S1–S4) plus a non-scrubbed idle loop (B0). Camera pans **top → bottom** (face → torso/hands → legs/feet), then orbits behind the rider to reveal the mountain.

Keyframes **K0–K4** are the shared segment boundaries: `K_n` is the **last** frame of act `S_n` and the **first** frame of act `S_{n+1}`. Generate each K once; reuse on both sides of the seam (kills inter-clip jumps). See [`ASSETS-PROMPTS.md`](./ASSETS-PROMPTS.md).

> All numbers below are the **design intent**; the build session re-measures `anchor` x/y against the actual rendered K-frames and tunes pin lengths to feel right. Anchors are a **fraction of the video frame** (0..1, x left→right, y top→bottom) and get mapped to screen coords through the `object-fit: cover` transform (`useCoverAnchor`).

---

## Beat table

| Beat | Act / clip | Pin length | Scroll progress → `currentTime` | Camera & character | Cards (enter%→exit% of act) |
|------|-----------|-----------|-------------------------------|--------------------|-----------------------------|
| **B0** Idle | `idle.mp4` (ping-pong loop, **not** scrubbed) | top, until first scroll | loops; fades out on scroll, back on scroll-up | Rider stands ¾-view, **bare face**, goggles up on helmet, balaclava at neck; subtle board sway + head turn | none |
| **A1** Goggles | `s1.mp4` (K0→K1) | ~120 vh | 0→1 maps 0→`dur(s1)` | Dolly in to the **face**; rider pulls the balaclava UP over his face and lowers the goggles over his eyes (bare → covered) | **Stop 1** in at 70%: `goggles` slides **left**, `mask` (balaclava) slides **right** |
| **A2** Shell | `s2.mp4` (K1→K2) | ~120 vh | 0→1 maps 0→`dur(s2)` | Pan down to **torso/hands**; zips jacket, pulls on gloves, tugs cuff | Stop 1 **out** at 8%; **Stop 2** in at 70%: `jacket` **left**, `gloves` **right** |
| **A3** Lower | `s3.mp4` (K2→K3) | ~120 vh | 0→1 maps 0→`dur(s3)` | Pan down to **legs/feet**; taps boots together (snow flicks off), adjusts pant cuff over boot | Stop 2 **out** at 8%; **Stop 3** in at 70%: `boots` **left**, `pants` **right** |
| **A4** Finale | `s4.mp4` (K3→K4) | ~150 vh | 0→1 maps 0→`dur(s4)` | Camera **orbits behind** the rider; slope drops away to a huge peak, clouds, light snowfall | Stop 3 **out** at 12%; **finale copy** fades in at 55% |
| — Catalog | (unpins) | normal flow | — | static page | — |

Pin total ≈ **510 vh** of scroll for the cinematic. Each act's scroll progress drives **only its own clip's** `currentTime` (lerped). At an act boundary, keep both `<video>` mounted and **cross-hold the outgoing last frame** while the next clip seeks to frame 0, then swap opacity (no black flash).

---

## Card anchors (provisional — re-measure on final frames)

`anchor` = point on the gear the connector line targets, as a fraction of the video frame.

| Stop | Product | side | anchor x | anchor y |
|------|---------|------|---------|---------|
| 1 optics | `goggles` | left | 0.45 | 0.30 |
| 1 optics | `mask` | right | 0.56 | 0.42 |
| 2 shell | `jacket` | left | 0.46 | 0.48 |
| 2 shell | `gloves` | right | 0.61 | 0.66 |
| 3 lower | `boots` | left | 0.48 | 0.82 |
| 3 lower | `pants` | right | 0.55 | 0.60 |

Layout rules:
- Two cards per stop, mirrored: left card docks on the left third, right card on the right third; each connector runs from the card's inner edge to its anchor. The rider/focus stays centered (frame leaves left+right safe-zones — enforced in the K1–K3 prompts).
- **Mobile (`<768px`):** no room to split. Collapse the pair into two stacked **bottom-sheet** cards (or a 2-tab switch), no connector lines.
- Card entrance: `panelIn` easing (`cubic-bezier(0.16,1,0.3,1)`), desktop 0.34s / mobile 0.4s. Exit = reverse + fade.

---

## Scrub → currentTime mapping (per act)

```
progress = clamp01(scrollTop_in_act / pinLength_in_act)   // from ScrollTrigger
target   = progress * clip.duration
// smooth, don't set raw every event:
current += (target - current) * 0.1                        // rAF lerp
if (requestVideoFrameCallback supported) seek on rVFC, else throttle currentTime
```

---

## Fallback layout (iOS low-power / reduced-motion / video fails)

No scrub → no "current frame" to anchor to. Instead render the **poster keyframes** K1–K3 stacked vertically, each as a static beat with its two product cards laid out in normal flow beneath it (no absolute connector line, or a short static line). K4 (mountain) is the closing hero image + finale copy + CTA. **All 6 cards remain reachable.** The same K-frame stills serve `<video poster>`, the reduced-motion view, and the low-power fallback.

---

## 1:1 beat → prompt verification checklist

Every row must have its cell filled in `ASSETS-PROMPTS.md` before assets are "done".

### Keyframe stills (Nano Banana Pro)
| Frame | Content | image prompt? | used as |
|-------|---------|:---:|---------|
| **K0** | Idle ¾-view, **bare face**, goggles up on helmet, balaclava down at neck | ☐ | first frame of S1; idle base |
| **K1** | Face **covered**: balaclava up + goggles seated | ☐ | last of S1 / first of S2; Stop-1 poster |
| **K2** | Torso/hands, jacket zipped, gloves on | ☐ | last of S2 / first of S3; Stop-2 poster |
| **K3** | Legs/feet, boots set, pant cuff over boot | ☐ | last of S3 / first of S4; Stop-3 poster |
| **K4** | Behind-the-rider, huge mountain reveal | ☐ | last of S4; finale poster + OG base |

### Motion clips (image-to-video, first=K_n, last=K_{n+1})
| Segment | Motion | motion prompt? | first | last | special |
|---------|--------|:---:|:---:|:---:|---------|
| **B0** idle | board sway + head turn, **seamless ping-pong loop** | ☐ | K0 | K0 | boomerang/reverse-seamless |
| **S1** | dolly to bare face; pulls balaclava UP + lowers goggles → face covered | ☐ | K0 | K1 | bare → covered |
| **S2** | pan to torso/hands; zips jacket, pulls gloves | ☐ | K1 | K2 | — |
| **S3** | pan to legs/feet; taps boots (snow flicks), pant cuff | ☐ | K2 | K3 | snow particles |
| **S4** | **orbit behind rider** + mountain reveal, snowfall, clouds | ☐ | K3 | K4 | camera orbit, hero moment |

### Auxiliary (see ASSETS-PROMPTS → Auxiliary assets)
☐ favicon mark · ☐ `og-image.jpg` 1200×630 · ☐ `hero-poster.jpg` (= K0 or K4 still)
