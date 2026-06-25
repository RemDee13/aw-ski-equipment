# DECISIONS — open decisions & risk register

Living doc. Resolve the open rows before/while building; the risk rows are things the build session must respect. Status: 🟢 resolved · 🟡 default-but-confirm · 🔴 needs user/owner input.

---

## Open decisions

| # | Decision | Options | Recommendation | Status |
|---|----------|---------|----------------|--------|
| D1 | **Image-to-video model** (continuity hinges on this) | (a) Veo 3.1 via **Google Flow**; (b) image-sequence only | **Google Flow (Veo 3.1)** — exposes first+last-frame conditioning ("Frames to Video" / ingredients), which makes the segment seams line up. Generate each `S_n` with first=`K_{n-1}`, last=`K_n`. | 🟢 resolved — user building in **Google Flow** |
| D2 | **Accent color strategy** | (a) keep `#e8702a` as scene color; (b) reserve `#e8702a` for series-identity UI only + yellow scene accent | **(b)** — orange only on CTA / ribbon `•` / footer wordmark / active. In-scene + product accent = **alpine yellow `#F2C200`** (matches the rider's yellow kit + yellow mirror goggles); used for focus rings, links, connector lines, badges, eyebrows. Bg night-blue. | 🟢 resolved — yellow-forward kit (user restyle), orange = series thread only |
| D3 | **Large-media hosting** | (a) commit mp4 to `public/` (served by GitHub Pages); (b) external bucket/CDN | **(a) GitHub Pages `public/`.** Pages is fronted by **Fastly CDN** (HTTP Range + edge caching) → fast delivery worldwide, fine for a low-traffic flagship portfolio. The job is **aggressive optimization**, not external hosting. Keep each file `<50 MB`, total media small, lazy-load below-fold. Revisit (b) only if the 100 GB/mo bandwidth cap is ever hit. | 🟢 resolved — host on Pages, optimize hard (see DOCUMENTATION §4a) |
| D4 | **Mobile / low-power render path** | (a) scrub mp4 everywhere; (b) scrub on desktop, **image-sequence or static poster** on iOS/low-power | **(b)** — first-class fallback, not optional. iOS Low Power Mode disables `<video>` seeking entirely. | 🟢 resolved — fallback is mandatory; all 6 cards reachable without scrub |
| D5 | **Accent display font** | keep Playfair Display italic / swap for a "colder" face | **Keep Playfair** for series parity. | 🟡 default; revisit only if it reads too warm |
| D6 | **Web3Forms key** | reuse sibling key / new key | **New key, provided:** `9ca61ce9-166c-4793-ad84-1aa5f8f3be0f`. Public client-side id (safe to commit, not a secret); spam protection = `botcheck` honeypot. Set in `Contact.tsx` `ACCESS_KEY`. | 🟢 resolved |
| D7 | **Optional "features strip" section** | include / cut | **Cut** unless copy is written in CONTENT.md — avoid undefined scope. | 🟢 cut for now |

---

## Risk register

| Risk | Impact | Mitigation (where documented) |
|------|--------|-------------------------------|
| **Git LFS on GitHub Pages** | 🔴 Site breaks silently — Pages serves LFS **pointer text**, not the video bytes. | **LFS is forbidden.** Commit real files under the size budget, or host externally. (DOCUMENTATION → Media delivery; CLAUDE → media policy) |
| **100 MB per-file hard limit / 50 MB git warning** | 🔴 `git push` rejected outright. | Encode under budget; split long acts into multiple short clips. (ASSETS-PROMPTS → frame budget) |
| **100 GB/month Pages bandwidth soft cap + ~1 GB repo soft cap** | 🟠 GitHub may throttle / email to move to CDN. | Byte budget (desktop ≤15–20 MB, mobile ≤6–8 MB per load), lazy-load below-fold clips, eager-load only idle+S1. (DOCUMENTATION → perf budget) |
| **iOS Safari `currentTime` scrub jank / decode latency** | 🟠 Stutters on real phones. | Dense GOP + `+faststart` + `yuv420p`; drive seeks via `requestVideoFrameCallback` + rAF lerp, not per-scroll-event. (DOCUMENTATION → iOS recipe) |
| **AI clip seams don't match (pose/camera drift)** | 🟠 Visible jump between segments. | First+last-frame conditioning; `K_n` shared as last-of-S_n and first-of-S_{n+1}; cross-hold last frame on swap. (ASSETS-PROMPTS → continuity) |
| **Card/connector drift over `object-fit: cover`** | 🟠 Outlines miss the gear at some viewport ratios. | Anchors stored as fraction-of-video-frame, mapped through the cover-crop transform; redraw on resize/scroll. (DOCUMENTATION → anchoring) |
| **Git-history bloat from re-encoded mp4** | 🟡 Repo grows forever. | Never commit draft/intermediate encodes; only final files. (CLAUDE → media policy) |
| **Character inconsistency across keyframes** | 🟡 Rider's face/wardrobe shifts between cards. | Character-lock protocol: 3-view sheet + verbatim wardrobe token block + ref-slot discipline. (ASSETS-PROMPTS → character lock) |
| **AI-asset provenance** | 🟡 Public portfolio using generated imagery. | Note SynthID watermarking + fictional-demo framing (consistent with the portfolio ribbon). (ASSETS-PROMPTS → provenance) |
