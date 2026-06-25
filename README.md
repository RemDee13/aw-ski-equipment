# AW Ski Equipment

Portfolio-demo e-commerce site for ski / snowboard gear. Third site in the **AW** portfolio series, sibling to **AW House Flipping** (`awhome.pavlov-ai.online`). Built by Anton Pavlov · [pavlov-ai.online](https://pavlov-ai.online).

- **Live (target):** https://awski.pavlov-ai.online/
- **Reference (animation inspiration):** https://i-want-fable.vercel.app/ (cosmonaut scroll-scrubbed video)
- **Series sibling (house style):** https://awhome.pavlov-ai.online/

> **Статус: docs-first.** Сейчас в репозитории только документация (спецификация + промпты для ассетов). Код сайта, ассеты и деплой — отдельной сессией. Ничего из `../AW House Flipping` не трогаем.

---

## The idea (одно предложение)

Скроллим страницу → «камера» едет по сноубордисту и фокусируется на **3 зонах** экипировки; на каждом фокусе **две** стеклянные карточки товара симметрично разлетаются в стороны (left/right) с выносками; финал — камера разворачивается за спину райдера и открывается огромная гора. Ниже — каталог, FAQ, контактная форма.

**Продаём 6 товаров в 3 парах:** `очки + маска` · `куртка + перчатки` · `ботинки + штаны`.

Анимация = **scroll-scrubbed video** (как референс-космонавт): `video.currentTime` привязан к scroll-прогрессу через Lenis + GSAP ScrollTrigger.

---

## Documentation map

| File | What it is |
|------|------------|
| [`DOCUMENTATION.md`](./DOCUMENTATION.md) | Master spec: architecture, file map, media/iOS/fallback/anchoring decisions, SEO, deploy, build phases, accessibility |
| [`SCROLL-STORYBOARD.md`](./SCROLL-STORYBOARD.md) | Numeric scroll raskadrovka (scroll% → currentTime, card enter/exit %, anchors) + 1:1 beat→prompt checklist |
| [`ASSETS-PROMPTS.md`](./ASSETS-PROMPTS.md) | ★ The asset prompt library: character-lock, per-segment image (Nano Banana Pro) + image-to-video prompts, environments, aux assets, ffmpeg recipe |
| [`CONTENT.md`](./CONTENT.md) | Copy deck + product data (source of truth for `src/data/products.ts`): 6 cards, catalog, FAQ, all UI strings |
| [`DESIGN-TOKENS.md`](./DESIGN-TOKENS.md) | Single source of truth: palette, glass recipe, type scale, spacing, easing |
| [`DECISIONS.md`](./DECISIONS.md) | Open decisions + risk register |
| [`CLAUDE.md`](./CLAUDE.md) | Conventions & invariants for the future build session |

---

## Planned stack (parity with sibling)

`React 18` + `TypeScript` + `Vite 5` + `Tailwind 3` + `Lenis` (smooth scroll) + **`GSAP ScrollTrigger`** (scrub/pin) + `lucide-react`. Fonts: `Inter` + `Playfair Display`. Deploy: GitHub Pages via GitHub Actions + custom domain.

---

## Build / run / verify (для будущей code-сессии)

```bash
npm ci
npm run dev                 # fast iteration (Vite dev server)
npm run build && npm run preview   # serves dist/ — closest local proxy to Pages
```

**Manual scrub QA (обязательно перед деплоем):**
1. Desktop Chrome — `video.currentTime` трекает скролл плавно, карточки выезжают на нужных порогах, выноски попадают в элементы.
2. **Реальный iPhone Safari** — видео вообще рендерится (faststart!), скраб не дёргается, при Low Power Mode срабатывает poster-fallback и все 6 карточек доступны.
3. `prefers-reduced-motion` — скраб выключен, показан постер, карточки раскрыты обычным скроллом.
4. 375 / 768 / 1024 / 1440 / 1920+ — карточки не наезжают на фокус-элемент, на мобайле пара схлопывается в bottom-sheet.

> ⚠️ Финальную плавность скраба проверять на **live GitHub Pages URL** — dev-сервер не повторяет Range-serving (Fastly), а от него зависит seek на Safari.

See [`DOCUMENTATION.md` → Deploy](./DOCUMENTATION.md) for the one-time DNS/Pages setup.
