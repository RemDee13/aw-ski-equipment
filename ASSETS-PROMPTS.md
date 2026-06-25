# ASSETS-PROMPTS — the asset prompt library

★ Главный документ для генерации ассетов. Пайплайн: **Nano Banana Pro → стиллы (K0–K4)**, затем **image-to-video (Veo 3.1 / твоя Google-модель) → сегменты (idle, S1–S4)** с conditioning по first+last кадру. Все промпты — на английском, готовы к вставке as-is.

> **Главный принцип континьюити.** Видео-модель **не** попадёт в нужный конечный кадр по одному текстовому промпту — поза/камера «уплывут», и швы между сегментами будут прыгать. Поэтому: генерим 5 граничных стиллов K0–K4 (Nano Banana Pro), и каждый сегмент `S_n` гоним как image-to-video с **first frame = K_{n-1}** и **last frame = K_n**. `K_n` используется дважды — как конец S_n и начало S_{n+1}. Так швы совпадают по пикселям.

---

## 0. Order of operations
1. Generate the **character sheet** (§2) → your locked reference of the rider + wardrobe.
2. Generate **K0–K4** stills (§4), each attaching the character sheet as the primary reference and pasting the wardrobe token block (§2) verbatim. Generate both a **16:9** and a **9:16** version of each (§9).
3. Generate **idle + S1–S4** motion clips (§5) using first/last-frame conditioning.
4. Generate **auxiliary assets** (§7): favicon, `og-image.jpg`, `hero-poster.jpg`.
5. **Post-process** every clip with the ffmpeg recipe (§10) before it goes in `public/`.
6. Tick the 1:1 checklist in [`SCROLL-STORYBOARD.md`](./SCROLL-STORYBOARD.md).

---

## 1. Target model & capabilities

**Video model: Veo 3.1 in Google Flow** (decided, D1). Use Flow's **first + last frame** input ("Frames to Video" / ingredients) — feed `K_{n-1}` as the first frame and `K_n` as the last frame of each act. That conditioning is what makes the seams line up.

Limits to keep in mind (they bound segment length, §8):
- Max clip length: **~8 s** per generation
- Resolution: **720p or 1080p**
- Frame rate: **24 fps** (fixed)
- Aspect: **16:9 or 9:16 only**

> If a Flow generation drifts and the last frame doesn't land on `K_n`, regenerate (vary seed/prompt) until the seam matches, or export that act as an **image sequence** of the in-between stills and scrub it on `<canvas>` — the page's iOS/low-power path already uses image sequences, so it degrades cleanly. (DECISIONS → D1/D4.)

Stills model: **Nano Banana Pro** (Google Gemini image). Holds multiple reference images; quality is best with **≤6 high-fidelity references** and one job per reference slot.

---

## 2. CHARACTER LOCK protocol

**Step A — character sheet (generate first, reuse everywhere). Show the BARE face.**
```
Full character reference sheet of ONE stylish male freeride snowboarder on a clean light-grey seamless studio background. Three full-body views in a row, evenly spaced: front, 3/4, and side profile, standing confidently, holding a snowboard vertically beside him. Athletic adult, ~30, light stubble, neutral calm expression — FACE FULLY VISIBLE AND BARE: no mask over the face, goggles pushed UP on the helmet above the forehead (not over the eyes). Modern premium fashion-forward look. IDENTICAL wardrobe in all three views, exact colors: matte WHITE (#ECEDEF) hardshell ski helmet; oversized goggles with a YELLOW mirror lens (#F4C430) and black strap, pushed UP on the helmet; black balaclava (#15171A) worn DOWN as a neck collar (NOT covering the face); bold ALPINE-YELLOW (#F2C200) technical shell jacket with a slightly oversized stylish cut, black (#15171A) shoulder panels and a storm hood; black insulated gloves with subtle yellow stitching; dark graphite-black (#2B2E33) shell snow pants with black reinforced knee panels; black snowboard boots with yellow Boa dials; matte charcoal-black (#1C1E22) snowboard deck with a bold yellow-and-black topsheet graphic. Even soft neutral studio light, consistent face, proportions and stance across all three views, photoreal, ultra-detailed, premium editorial look, 8k.
Negative: no text, no logos, no watermark, no extra people, face covered by a mask, goggles over the eyes, deformed hands, extra fingers, warped gear.
```
Attach this sheet as the **primary reference** on every K-frame job. Reference-slot plan (max 6): `slot1 = character sheet`, `slot2 = environment plate (§6)`, `slot3 = previous K-frame for continuity`, others as needed.

**Step B — wardrobe token block (paste verbatim into every K-frame prompt).**
```
[WARDROBE — keep identical] Stylish premium freeride snowboarder. Matte WHITE helmet (#ECEDEF); oversized goggles with a YELLOW mirror lens (#F4C430) and black strap; black balaclava (#15171A); bold ALPINE-YELLOW (#F2C200) technical shell jacket, slightly oversized cut, black shoulder panels, storm hood; black insulated gloves with yellow stitching; graphite-black (#2B2E33) shell pants, black knee panels; black boots with yellow Boa dials; matte charcoal-black (#1C1E22) snowboard with a yellow-and-black graphic. Cold overcast alpine daylight, soft blue-grey shadows, fine drifting snow, the yellow kit popping against the cold palette, photoreal, cinematic, premium.
```
> **FACE STATE rule (continuity):** **K0** = bare face, goggles UP on the helmet, balaclava DOWN at the neck. **S1** is where he pulls the balaclava UP over the face and lowers the goggles. **K1–K4** = face fully covered (balaclava up + goggles seated). Set the state per frame, not in the shared block.

---

## 3. Global style anchor
Cold overcast alpine daylight; desaturated night-blue/ice palette; soft blue shadows; light snowfall; faint film grain; cinematic shallow depth of field with the focus element sharpest. **No text, no UI, no logos, no watermark** baked into frames (overlays are added in code). Keep the rider centered with **empty space on the left and right thirds** (the product cards live there).

---

## 4. Keyframe image prompts (Nano Banana Pro) — K0–K4 (detailed)

> For each: attach the character sheet as the primary reference, generate **16:9** and **9:16** versions (§9), keep the rider centered with empty left/right safe-zones. Wardrobe colors are embedded with hex so the rider never drifts. K1–K3 double as the Stop posters; K4 as the finale poster.

### K0 — Idle base · wide establishing · BARE face
```
Stylish freeride snowboarder, exact wardrobe and FACE as the reference: bare visible face, light stubble, neutral expression; matte WHITE helmet; YELLOW mirror goggles pushed UP on the helmet above the forehead (NOT over the eyes); black balaclava worn DOWN as a neck collar (face uncovered); bold alpine-yellow (#F2C200) shell jacket with black shoulder panels; black gloves; graphite-black pants; black boots with yellow Boa; charcoal snowboard with a yellow-and-black graphic. WIDE full-body establishing shot, 35mm lens, eye level. He stands on a wind-packed snow ridge in a relaxed confident 3/4 stance turned slightly camera-left, weight on the back foot, snowboard held upright in his right gloved hand with the tail planted in the snow, left arm loose. The yellow jacket pops against the cold scene. ENVIRONMENT: layered snow-laden pine forest mid-ground, soft blue mountains fading into haze far behind, flat white-grey overcast sky; fine drifting snow, faint ground fog, soft blue-grey shadows, desaturated cold palette. COMPOSITION: head-to-board fully in frame, rider in the central vertical third, large EMPTY negative space left and right, horizon upper third. Photoreal, cinematic, premium, subtle film grain.
Negative: no text, no logos, no watermark, no other people, face covered, goggles over eyes, warm sunlight, lens flare, deformed hands, extra fingers. 16:9.
```

### K1 — Face covered · face close-up (Stop 1 still)
```
Same snowboarder, exact wardrobe. TIGHT cinematic close-up, 85mm lens, shallow depth of field (pine forest melted to soft bokeh). Framed chest-up, head centered. He has just pulled the black balaclava UP over his nose, mouth and chin AND seated the oversized goggles DOWN over his eyes — face now FULLY COVERED, the YELLOW mirror lens (#F4C430) reflecting the pale slope and sky, eyes hidden behind the mirror, snowflakes resting on the lens. His right gloved hand is lowering away from the goggle frame near his temple. Matte-white helmet on, yellow jacket collar just visible at the bottom of frame. LIGHT: cold overcast daylight, soft, gentle catchlight on the yellow lens, soft blue-grey shadows. COMPOSITION: face/goggles dead-center, EMPTY negative space left and right. Photoreal, crisp goggle and balaclava knit texture, premium, subtle film grain.
Negative: no text, no logos, no watermark, no other people, bare uncovered face, warm light, lens flare, deformed hands, extra fingers. 16:9.
```

### K2 — Shell on · torso & hands (Stop 2 still)
```
Same snowboarder, exact wardrobe. MEDIUM shot, 50mm lens, framed helmet-chin to waist, slight 3/4 angle. The bold alpine-yellow (#F2C200) technical shell jacket is zipped fully to the chin, storm hood pulled up over the matte-white helmet, black shoulder panels visible. Both black insulated gloves are on; his RIGHT hand grips and tugs the LEFT glove cuff tight over the jacket sleeve — yellow stitching and a zipper pull sharp in focus. Goggles seated (yellow mirror), balaclava on. ENVIRONMENT: soft blurred snow-pine background, fine falling snow, cold overcast light, soft blue-grey shadows. COMPOSITION: torso centered, EMPTY negative space left and right. Photoreal, fabric texture crisp, premium, subtle film grain.
Negative: no text, no logos, no watermark, no other people, warm light, deformed hands, extra fingers, mangled gloves. 16:9.
```

### K3 — Locked in · legs & feet (Stop 3 still)
```
Same snowboarder, exact wardrobe. LOW medium shot, 35mm lens, camera low near the snow looking slightly up, framed mid-thigh to the snow. He has just tapped his two black snowboard boots (yellow Boa dials) together and a small burst of dry snow flicks off the toes, particles frozen mid-air. His gloved hands settle the graphite-black (#2B2E33) shell pant cuff and gaiter DOWN over the boots' yellow Boa dials. Boots, Boa dials and pant hem razor-sharp, light snow dusting. ENVIRONMENT: packed snow with boot scuffs, blurred pine and slope behind, cold overcast light, soft blue-grey shadows, fine snowfall. COMPOSITION: feet/legs centered, EMPTY negative space left and right. Photoreal, gritty snow detail, premium, subtle film grain.
Negative: no text, no logos, no watermark, no other people, warm light, deformed hands, extra fingers, melted boots. 16:9.
```

### K4 — The mountain · behind the rider (finale still)
```
Same snowboarder, exact wardrobe, seen from BEHIND and slightly above his right shoulder — the bold alpine-yellow jacket glowing against the cold scene. EPIC wide shot, 24mm lens, camera elevated. He stands at the top of a groomed run, snowboard strapped to his boots, facing away downhill, head slightly raised toward the view. The piste sweeps down into a vast snowy valley toward an ENORMOUS majestic snow-capped peak filling the upper frame, wrapped in slow drifting clouds, light snowfall through the whole frame, cold cinematic light breaking faintly over the summit. SCALE: rider a small sharp yellow silhouette lower-center; mountain and valley dominate. LIGHT: cold overcast, soft glow on the peak, deep blue valley shadows, layered haze. Photoreal, awe-inspiring, grand scale, premium, subtle film grain.
Negative: no text, no logos, no watermark, no other people, warm sunset, lens flare, deformed rider, extra limbs. 16:9.
```

---

## 5. Motion prompts (image-to-video, Google Flow) — idle + S1–S4 (detailed)

> Each clip: set **first frame** and **last frame** as noted, paste the motion text, 24 fps, target length per §8, single continuous take (no cut), constant cold overcast light. Wardrobe is locked by the frames — describe only camera + action.

### B0 — Idle loop (first = K0, last = K0)
```
Static locked-off camera, no camera movement. The snowboarder stands on the snow ridge breathing calmly; the snowboard in his hand sways just a few degrees; he slowly turns his head to look off toward the distant mountains, holds for a beat, then turns his head back to the start position. Gentle snow drifts past, faint fog shifts slightly, soft overcast light constant. Extremely subtle, calm, weighty. Single continuous take designed to loop seamlessly back to the first frame (ping-pong), first and last frame near-identical.
```
*Generate ~3–4 s; the page reverse-loops it (ping-pong).*

### S1 — Cover the face (first = K0, last = K1)
```
One continuous slow cinematic dolly-IN from the wide 3/4 establishing shot toward the rider's BARE face, tightening to an 85mm-style chest-up close-up. He starts with an uncovered face, goggles up on the helmet and the balaclava down at his neck. As the camera closes in he plants the snowboard, raises both gloved hands, pulls the black balaclava UP over his nose, mouth and chin, then takes the oversized goggles and pulls them DOWN from the helmet, seating them over his eyes; the yellow mirror lens catches the cold light as his hands lower away. End exactly on the tight centered face close-up — face now fully covered, goggles seated, balaclava up. Smooth deliberate motion, gentle snowfall throughout, cold overcast light constant, no cut.
```

### S2 — Suit up the shell (first = K1, last = K2)
```
One continuous shot, camera eases DOWN and slightly back from the face to a 50mm-style medium framing of the torso and hands. The rider grabs the jacket zipper and zips the alpine-yellow shell up to the chin, flips the storm hood up over the helmet, then pulls his second black glove fully on and tugs the cuff tight over the sleeve. End framed on the chest and gloved hands with the cuff cinched. Controlled, weighty, realistic fabric motion; fine falling snow; cold overcast light constant, no cut.
```

### S3 — Lock in below (first = K2, last = K3)
```
One continuous shot, camera tilts and cranes DOWN from the torso to a low 35mm-style framing of the legs and feet near the snow. The rider taps his two snowboard boots together and a small spray of dry snow flicks off the toes (visible particles), then his gloved hands settle the graphite pant cuff and gaiter down over the boots' ice-blue Boa dials. End framed low on the boots and pant cuffs with snow particles still settling. Grounded, deliberate motion; cold overcast light constant, no cut.
```

### S4 — Orbit to the mountain (first = K3, last = K4)
```
One continuous sweeping shot: the camera lifts UP and ORBITS around to BEHIND the rider as he steps onto the board and turns to face downhill. The orbit settles behind and slightly above his right shoulder, and the view opens onto the slope dropping away into a vast valley toward a colossal snow-capped peak wrapped in slow drifting clouds, snowfall drifting through the frame, cold light cresting the summit. End on the epic behind-the-rider wide shot, rider small in the lower-center, mountain dominating. Slow, smooth, awe-inspiring hero camera move, no cut, constant cold cinematic light.
```

---

## 6. Environment / background prompts (reference plates, slot2)
- **Alpine slope plate:** `Wide empty alpine snowboarding piste under overcast sky, packed snow, pine forest flanking, soft mountains in haze, gentle snowfall, cold blue cinematic light, photoreal, no people. 16:9.`
- **Forest backdrop:** `Snow-laden pine forest edge on a mountain slope, soft fog, falling snow, desaturated cold palette, cinematic, no people.`
- **Mountain hero plate (for K4):** `An enormous majestic snow-capped peak across a wide valley, wrapped in slow drifting clouds, light snowfall, cold dramatic light breaking over the summit, awe-inspiring scale, photoreal, no people. 16:9.`
- **Snowfall overlay (optional, code-side):** a looping transparent snow particle layer can also be done in CSS/canvas instead of baked into video.

---

## 7. Auxiliary assets (ship-blockers — don't forget)
- **`public/favicon.svg`** — `Minimal flat vector mark for a ski brand "AW Ski": a stylized mountain peak combined with the letters AW, ice-blue and night-blue, on transparent background, simple, crisp at 32px. SVG, no gradients-heavy detail.` (Also export a 180×180 `apple-touch-icon.png`.)
- **`public/og-image.jpg` (1200×630)** — `Cinematic banner: the geared-up snowboarder from behind looking at a huge alpine peak (reuse the K4 look), strong negative space on the left for a title. Cold cinematic light, snowfall. Photoreal. 1200x630.` Composite the `AW Ski` wordmark + tagline in code/editor if needed.
- **`public/hero-poster.jpg`** — export a still (K0 for the idle poster, or K4 for the closing poster) as the `<video poster>` and the reduced-motion/low-power image.

---

## 8. Frame budget & multi-clip chaining
- 24 fps fixed. A scroll act ~120 vh feels good at **~3–5 s** of footage scrubbed across it; the orbit (A4) can be **~5–6 s**.
- **8 s/clip ceiling:** if an act needs more, generate it as **2+ chained clips** where `clipB.firstFrame = clipA.lastFrame`, then concat (§10). Keep each chained piece's seam on a shared still.
- Don't over-generate frames — more seconds = more bytes; respect the budget in DECISIONS → D3.

## 9. Resolution / aspect ladder
- **Stills (K0–K4):** generate at **max quality, 16:9 AND 9:16 (1080p+)**. These become the posters at each stop, so they must be crisp — sharpness lives in the stills, motion in the clips.
- **Clips:** generate at 1080p in Flow, but the shipped **scrub** versions are downscaled (§10) — **720p desktop / ~540p mobile** — because decode cost on weak devices ∝ pixels. Full-bleed at 720p reads clean; the eye gets sharpness from the parked poster.
- Keep the focus element and both safe-zones inside frame in **both** aspects (recompose the 9:16 prompt so left/right space becomes top/bottom space where needed). The page picks the master matching the viewport to avoid cropping the rider on phones.

## 10. ffmpeg post-processing (mandatory before `public/`)

Scrub-grade desktop encode — **720p**, Safari-safe, dense keyframes for seek (light decode for weak devices):
```bash
ffmpeg -i s1_raw.mp4 -an \
  -vf "scale=1280:-2,fps=24" \
  -c:v libx264 -profile:v main -pix_fmt yuv420p \
  -g 4 -keyint_min 4 -sc_threshold 0 -crf 22 \
  -movflags +faststart \
  public/s1.mp4
```
Mobile variant — vertical 9:16, ~540×960:
```bash
ffmpeg -i s1_raw_vertical.mp4 -an -vf "scale=-2:960,fps=24" \
  -c:v libx264 -profile:v main -pix_fmt yuv420p -g 4 -keyint_min 4 -sc_threshold 0 -crf 24 \
  -movflags +faststart public/s1.mobile.mp4
```
Poster stills stay **full-res** (crisp at the stops), exported AVIF/WebP:
```bash
ffmpeg -i K1_master.png -vf "scale=1600:-2" -q:v 80 public/poster-1.webp
```
Chain two clips (shared seam frame), then re-encode as above:
```bash
printf "file 's1a.mp4'\nfile 's1b.mp4'\n" > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy s1_raw.mp4
```
Image-sequence export (iOS/low-power fallback):
```bash
ffmpeg -i public/s1.mp4 -vf "fps=24,scale=1280:-2" public/seq/s1_%04d.webp
```
Why these flags: `+faststart` moves the moov atom to the front (**Safari refuses to render/seek without it**); small `-g`/`-keyint_min` + `sc_threshold 0` give dense keyframes so `currentTime` seeking is smooth; `yuv420p` + `main` profile = broad/iOS compatibility; `-an` strips audio (the scrub is muted — saves bytes).

## 11. Audio & provenance
- **Audio:** none. The scrub master is muted; always strip the track (`-an`). If you want ambience, add it as a separate non-scrubbed element later — never on the scrub master.
- **Provenance:** all stills/clips are AI-generated (Nano Banana Pro + Veo/Google), carry SynthID watermarking, and are used only as a **fictional portfolio demo** — consistent with the on-page portfolio ribbon. Confirm your Google account tier permits this output use.
