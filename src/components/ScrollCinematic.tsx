import { useEffect, useRef, useState, type RefObject, type MutableRefObject } from 'react'
import { ChevronDown, Plus, Check } from 'lucide-react'
import { PAIRS, pairProducts, type PairId, type Product } from '../data/products'
import { coverPoint, clamp } from '../lib/cover'
import { useCart } from '../cart'
import ProductCard from './ProductCard'
import ConnectorLine from './ConnectorLine'

const BASE = import.meta.env.BASE_URL

// timeline segments (relative scroll length in vh). idle is the intro hold.
const SEGMENTS = [
  { key: 'idle', vh: 100, pair: null as PairId | null },
  { key: 's1', vh: 350, pair: 'optics' as PairId },
  { key: 's2', vh: 350, pair: 'shell' as PairId },
  { key: 's3', vh: 350, pair: 'lower' as PairId },
  { key: 's4', vh: 420, pair: null as PairId | null },
]
const TOTAL_VH = SEGMENTS.reduce((a, s) => a + s.vh, 0)

// the 4 acts are concatenated into one acts.mp4 — these are each act's slice of that timeline
const ACT_DURS = [7.708, 8, 8, 8]
const ACT_STARTS = ACT_DURS.map((_, i) => ACT_DURS.slice(0, i).reduce((a, b) => a + b, 0))

const FRAC_ENDS = (() => {
  let acc = 0
  return SEGMENTS.map((s) => (acc += s.vh) / TOTAL_VH)
})()

// desktop scrubs an all-intra (-g 1) video; touch devices scrub an image sequence on
// <canvas> (images preload reliably on iOS and draw instantly — no video-seek jank).
export const ACTS_SRC = 'acts.mp4'
export const FRAME_COUNT = 254
export const TOTAL_DUR = ACT_DURS.reduce((a, b) => a + b, 0)
export const frameUrl = (i: number) => `${BASE}frames/f_${String(i + 1).padStart(3, '0')}.jpg`
const COARSE = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ---- discrete stop state machine (scroll-INITIATED playback) ----
// 5 stops: idle → optics → shell → lower → finale. Each stop's time is the END frame of that
// act (where cards mount). Crossing a scroll-band boundary commits to the next/prev stop and a
// wall-time tween eases renderTime there (forward OR backward) — decoupled from raw scroll, so
// the frame never scrubs jitterily with the cursor and never seek-storms on mobile.
const STOP_TIMES = [...ACT_STARTS, TOTAL_DUR] // [0, 7.708, 15.708, 23.708, 31.708]
const STOP_PAIRS = SEGMENTS.map((s) => s.pair) // [null, optics, shell, lower, null]
const N_STOPS = STOP_TIMES.length
const HYST = 0.03 // half-band hysteresis so a parked cursor never thrashes a boundary
const TAU = 0.28 // exp-smoothing time constant (s) — a single stop→stop move settles in ~1s
const SETTLE_EPS = 0.0015 // |Δp| per frame that counts as "stationary"
const SETTLE_FRAMES = 4 // stationary frames before honoring a multi-band jump directly
const ARRIVE = 0.12 // renderTime within this (s of video) of goal → "arrived" (cards fire ~1.1s after commit)
const SNAP = 0.008 // hard-snap to goal only when truly there, so the last hair still eases (no pop)

// stop band containing p (no history) — used once at mount to rest at the restored scroll pos
const bandAt = (p: number) => {
  let cur = 0
  while (cur < N_STOPS - 1 && p > FRAC_ENDS[cur]) cur++
  return cur
}
// committed stop from p with hysteresis (asymmetric up/down thresholds)
const deriveCommitted = (p: number, prev: number) => {
  let cur = prev
  while (cur < N_STOPS - 1 && p > FRAC_ENDS[cur] + HYST) cur++
  while (cur > 0 && p < FRAC_ENDS[cur - 1] - HYST) cur--
  return cur
}
// scroll position (as a fraction of the section) that parks the page in the middle of each stop's band
const STOP_CENTER = STOP_TIMES.map((_, i) => ((i === 0 ? 0 : FRAC_ENDS[i - 1]) + FRAC_ENDS[i]) / 2)

type LenisLike = { scrollTo: (t: number, o?: Record<string, unknown>) => void }
const getLenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// snap navigation: while the cinematic is pinned, one scroll gesture (wheel / touch / arrow key)
// instantly auto-scrolls to the next/prev stop so it reacts immediately instead of feeling dead.
// At the ends (finale↓ / idle↑) input is released to the normal page scroll.
function useSnapNav(
  sectionRef: RefObject<HTMLElement>,
  stageRef: RefObject<HTMLElement>,
  committedRef: MutableRefObject<number>,
) {
  useEffect(() => {
    let snapping = false
    let touchStartY = 0
    let touchHandled = false

    const pinned = () => {
      const st = stageRef.current
      if (!st) return false
      const r = st.getBoundingClientRect()
      return r.top <= 1 && r.bottom >= window.innerHeight - 1
    }
    const snapTo = (i: number) => {
      const L = getLenis()
      const sec = sectionRef.current
      if (!L || !sec) return
      const scrollable = Math.max(1, sec.offsetHeight - window.innerHeight)
      const y = Math.round(sec.offsetTop + STOP_CENTER[i] * scrollable)
      snapping = true
      L.scrollTo(y, {
        duration: 0.85,
        lock: true,
        easing: easeInOutCubic,
        onComplete: () => { window.setTimeout(() => { snapping = false }, 140) },
      })
    }
    // returns true if the gesture was consumed (caller should preventDefault)
    const step = (dir: number) => {
      const cur = committedRef.current
      if ((dir > 0 && cur >= N_STOPS - 1) || (dir < 0 && cur <= 0)) return false // release at the ends
      if (!snapping) snapTo(cur + dir)
      return true
    }

    const onWheel = (e: WheelEvent) => {
      if (!getLenis() || !pinned() || Math.abs(e.deltaY) < 1) return
      if (step(e.deltaY > 0 ? 1 : -1)) e.preventDefault()
    }
    const onTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; touchHandled = false }
    const onTouchMove = (e: TouchEvent) => {
      if (touchHandled || !getLenis() || !pinned()) return
      const dy = touchStartY - e.touches[0].clientY
      if (Math.abs(dy) < 24) return
      if (step(dy > 0 ? 1 : -1)) { touchHandled = true; e.preventDefault() }
    }
    const onKey = (e: KeyboardEvent) => {
      if (!getLenis() || !pinned()) return
      const dir = e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ' ? 1
        : e.key === 'ArrowUp' || e.key === 'PageUp' ? -1 : 0
      if (dir && step(dir)) e.preventDefault()
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [sectionRef, stageRef, committedRef])
}

export default function ScrollCinematic() {
  const [mode] = useState<'reduced' | 'mobile' | 'video'>(() =>
    prefersReducedMotion() ? 'reduced' : COARSE ? 'mobile' : 'video',
  )
  if (mode === 'reduced') return <FallbackCinematic />
  if (mode === 'mobile') return <MobileCinematic />
  return <ScrubCinematic />
}

/* ---------------- scrubbed (default) ---------------- */

function ScrubCinematic() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const posterRef = useRef<HTMLImageElement>(null)
  const idleRef = useRef<HTMLVideoElement>(null)
  const actsRef = useRef<HTMLVideoElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const finaleRef = useRef<HTMLDivElement>(null)
  const committedRef = useRef(0) // current stop index, mirrored for the snap-nav handlers
  const curTime = useRef(0)
  const revealed = useRef(false)
  const warmedDecoder = useRef(false)
  const warmedGesture = useRef(false)

  const [pair, setPair] = useState<PairId | null>(null)
  const [pairShown, setPairShown] = useState(false) // opacity gate for a fade-out before unmount
  const [size, setSize] = useState({ w: 1280, h: 720 })

  // warm the scrub decoder once: seek across the whole timeline so the first real
  // scrub never pays the cold-decoder cost (the ~1.5s hitch). Runs behind the loader.
  const warmDecoder = () => {
    const v = actsRef.current
    if (!v || warmedDecoder.current || !v.duration) return
    warmedDecoder.current = true
    // seek across the whole timeline to decode keyframes everywhere
    const sweep = () => {
      const pts = [0.1, 0.3, 0.5, 0.7, 0.9, 0].map((f) => f * v.duration)
      let i = 0
      const onSeeked = () => {
        if (i >= pts.length) {
          v.removeEventListener('seeked', onSeeked)
          curTime.current = 0
          return
        }
        try { v.currentTime = pts[i++] } catch { /* seeking */ }
      }
      v.addEventListener('seeked', onSeeked)
      onSeeked()
    }
    // first actually PLAY for a moment to spin up the decoder pipeline (the real cause of
    // the cold first-scroll hitch), then pause + sweep — all behind the loader
    v.muted = true
    const p = v.play()
    if (p && typeof p.then === 'function') {
      p.then(() => window.setTimeout(() => { v.pause(); sweep() }, 220)).catch(sweep)
    } else {
      sweep()
    }
  }

  // pin the stage to exactly one screen + track its size (resize → recompute anchors)
  useEffect(() => {
    const measure = () => {
      const el = stageRef.current
      if (!el) return
      // fixed pixel height = one screen — no viewport-unit drift, never stretched on tall displays
      el.style.height = `${window.innerHeight}px`
      setSize({ w: el.clientWidth, h: el.clientHeight })
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
    }
  }, [])

  // first user gesture: warm the decoder (covers iOS, where seeking may need a gesture)
  useEffect(() => {
    const onGesture = () => {
      if (warmedGesture.current) return
      warmedGesture.current = true
      warmDecoder()
    }
    const opts = { once: true, passive: true } as AddEventListenerOptions
    window.addEventListener('touchstart', onGesture, opts)
    window.addEventListener('wheel', onGesture, opts)
    window.addEventListener('pointerdown', onGesture, opts)
    return () => {
      window.removeEventListener('touchstart', onGesture)
      window.removeEventListener('wheel', onGesture)
      window.removeEventListener('pointerdown', onGesture)
    }
  }, [])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let committed = -1 // current stop index (init on first frame from the restored scroll pos)
    let target = 0
    let lastP = 0
    let stationary = 0
    let lastPoster = -1
    let lastWant: PairId | null = null
    let hideTimer = 0

    const loop = () => {
      const section = sectionRef.current
      const acts = actsRef.current
      if (section && acts) {
        const now = performance.now()
        const dt = Math.min(0.1, Math.max(0, (now - last) / 1000))
        last = now

        const vh = window.innerHeight
        const scrollable = Math.max(1, section.offsetHeight - vh)
        const p = clamp((window.scrollY - section.offsetTop) / scrollable)

        // init once — rest at the stop that contains the restored scroll position (no tween on load)
        if (committed < 0) { committed = bandAt(p); target = committed; curTime.current = STOP_TIMES[committed] }

        // stationary detection defends against Lenis momentum carrying p across several bands
        stationary = Math.abs(p - lastP) < SETTLE_EPS ? stationary + 1 : 0
        lastP = p

        // committed stop with hysteresis; on a fast flick advance at most one stop per frame
        const nc = deriveCommitted(p, committed)
        if (nc !== committed) {
          committed = stationary >= SETTLE_FRAMES ? nc : committed + Math.sign(nc - committed)
          target = committed
        }
        committedRef.current = committed

        // wall-time exponential tween toward the target stop — retarget-safe (no restart hitch),
        // plays forward or backward identically, and the clock never waits on the decoder
        const goal = STOP_TIMES[target]
        curTime.current += (goal - curTime.current) * (1 - Math.exp(-dt / TAU))
        const dist = Math.abs(curTime.current - goal)
        const atRest = dist < ARRIVE
        if (dist < SNAP) curTime.current = goal
        const rt = curTime.current

        // render: seek the all-intra clip toward renderTime, gated on !seeking (self-heals next frame)
        if (acts.readyState >= 2) revealed.current = true
        if (!acts.paused) acts.pause()
        if (!acts.seeking && Math.abs(acts.currentTime - rt) > 0.02) {
          try { acts.currentTime = rt } catch { /* seeking */ }
        }

        // poster bridge (behind video): show where we're heading; snap to committed only at rest
        const posterIdx = atRest ? committed : target
        if (posterIdx !== lastPoster && posterRef.current) {
          lastPoster = posterIdx
          posterRef.current.src = `${BASE}poster-${posterIdx}.jpg`
        }

        // idle ↔ acts crossfade — idle video only when fully at rest in stop 0 (keep acts up on the way back)
        const showIdle = committed === 0 && atRest
        if (idleRef.current) idleRef.current.style.opacity = showIdle ? '1' : '0'
        acts.style.opacity = showIdle ? '0' : (revealed.current ? '1' : '0')

        // hero text fades with renderTime across idle→optics; kill taps once hidden (full-screen overlay)
        if (heroRef.current) {
          const o = clamp(1 - (rt / STOP_TIMES[1]) * 1.6)
          heroRef.current.style.opacity = String(o)
          heroRef.current.style.pointerEvents = o < 0.05 ? 'none' : ''
        }

        // finale: arrived at the mountain, or already past the lower→finale midpoint
        if (finaleRef.current) {
          const showFinale = (atRest && committed === N_STOPS - 1) ||
            (target === N_STOPS - 1 && rt > (STOP_TIMES[N_STOPS - 2] + STOP_TIMES[N_STOPS - 1]) / 2)
          finaleRef.current.style.opacity = showFinale ? '1' : '0'
        }

        // cards: only when fully arrived at a product stop; mount on arrival, fade + delayed unmount on leave
        const wantPair = atRest ? STOP_PAIRS[committed] : null
        if (wantPair !== lastWant) {
          lastWant = wantPair
          if (wantPair) {
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = 0 }
            setPair(wantPair); setPairShown(true)
          } else {
            setPairShown(false)
            if (hideTimer) clearTimeout(hideTimer)
            hideTimer = window.setTimeout(() => setPair(null), 320)
          }
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); if (hideTimer) clearTimeout(hideTimer) }
  }, [])

  useSnapNav(sectionRef, stageRef, committedRef)

  // connector geometry (desktop)
  const pad = size.w * 0.035
  const cardW = Math.min(360, size.w * 0.3)
  const leftConn = { x: pad + cardW, y: size.h * 0.5 }
  const rightConn = { x: size.w - pad - cardW, y: size.h * 0.5 }
  const products = pair ? pairProducts(pair) : []

  return (
    <section ref={sectionRef} id="cinematic" className="relative" style={{ height: `${TOTAL_VH}vh` }}>
      <div ref={stageRef} className="sticky top-0 h-[100lvh] w-full overflow-hidden bg-bg">
        {/* poster layer — always visible behind the videos so the screen is never black */}
        <img ref={posterRef} src={`${BASE}poster-0.jpg`} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />

        {/* idle hero — plain autoplay loop video, full quality */}
        <video
          ref={idleRef}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-smooth"
          src={`${BASE}idle.mp4`}
          poster={`${BASE}poster-0.jpg`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={(e) => { e.currentTarget.play().catch(() => {}) }}
        />

        {/* the scrubbed cinematic — one concatenated clip, one decoder, scrubbed by scroll */}
        <video
          ref={actsRef}
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700 ease-smooth"
          src={`${BASE}${ACTS_SRC}`}
          poster={`${BASE}poster-0.jpg`}
          muted
          playsInline
          preload="auto"
          onCanPlay={warmDecoder}
          onLoadedData={warmDecoder}
        />

        {/* scrim for legibility */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-bg/70 via-bg/10 to-bg/60" />


        {/* hero (idle) text */}
        <div ref={heroRef} className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 transition-opacity duration-300">
          <p className="text-xs tracking-[0.3em] uppercase text-gear mb-4">AW Ski Equipment</p>
          <h1 className="font-playfair italic text-5xl sm:text-6xl md:text-7xl leading-[1.05] drop-shadow-[0_2px_30px_rgba(0,0,0,0.6)]">
            Suit up. Send it.
          </h1>
          <p className="mt-5 max-w-md text-ink/75">
            Pro-grade snowboard gear, built for deep days and long descents. Scroll to gear up.
          </p>
          <div className="mt-10 flex flex-col items-center gap-1 text-ink/60 animate-bounce">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <ChevronDown size={18} />
          </div>
          {/* mobile: jump straight to the catalog, skipping the cinematic */}
          <a
            href="#gear"
            className="md:hidden mt-6 inline-flex items-center gap-1.5 glass-nav rounded-full px-5 py-2.5 text-sm font-medium text-ink/90 active:scale-95 transition-all"
          >
            Skip to catalog <ChevronDown size={15} />
          </a>
        </div>

        {/* connector lines + dual cards (desktop) */}
        {products.length > 0 && (
          <div className={`absolute inset-0 hidden md:block transition-opacity duration-300 ${pairShown ? 'opacity-100' : 'opacity-0'}`}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none" width={size.w} height={size.h}>
              {products.map((pr) => {
                const a = coverPoint(pr.anchor.x, pr.anchor.y, size.w, size.h)
                return <ConnectorLine key={pr.id} from={a} to={pr.side === 'left' ? leftConn : rightConn} />
              })}
            </svg>
            {products.map((pr) => (
              <div
                key={pr.id}
                className="absolute top-1/2 -translate-y-1/2"
                style={pr.side === 'left' ? { left: pad, width: cardW } : { right: pad, width: cardW }}
              >
                <ProductCard product={pr} />
              </div>
            ))}
          </div>
        )}

        {/* mobile: compact pair sheet — both items fit on screen */}
        {products.length > 0 && (
          <div className={`absolute inset-x-0 bottom-0 md:hidden p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-opacity duration-300 ${pairShown ? 'opacity-100' : 'opacity-0'}`}>
            <div className="glass rounded-2xl divide-y divide-white/10 card-in-up">
              {products.map((pr) => (
                <MiniRow key={pr.id} product={pr} />
              ))}
            </div>
          </div>
        )}

        {/* finale text */}
        <div ref={finaleRef} className="absolute inset-x-0 bottom-[14%] flex flex-col items-center text-center px-6 opacity-0 transition-opacity duration-500">
          <h2 className="font-playfair italic text-4xl sm:text-5xl md:text-6xl drop-shadow-[0_2px_30px_rgba(0,0,0,0.7)]">
            The mountain is waiting.
          </h2>
          <p className="mt-3 text-ink/80">Your kit's ready. The line's yours.</p>
          <a
            href="#gear"
            className="mt-6 bg-brand hover:bg-brand-dark text-white font-medium px-7 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-95"
          >
            Shop the kit
          </a>
        </div>
      </div>
    </section>
  )
}

/* compact mobile row — name, hook, price, add (fits within the viewport) */
function MiniRow({ product }: { product: Product }) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="font-semibold text-sm leading-tight truncate">{product.name}</p>
        <p className="text-[11px] text-ink-muted truncate">{product.hook}</p>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-sm font-semibold tabular-nums">{product.price}</span>
        <button
          onClick={() => { add(product); setAdded(true); window.setTimeout(() => setAdded(false), 1200) }}
          aria-label={`Add ${product.name} to kit`}
          className="w-9 h-9 rounded-full bg-brand hover:bg-brand-dark text-white flex items-center justify-center active:scale-90 transition-all"
        >
          {added ? <Check size={16} /> : <Plus size={16} />}
        </button>
      </div>
    </div>
  )
}

/* ---------------- mobile: image-sequence scrub on <canvas> ---------------- */

function MobileCinematic() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stopRef = useRef<HTMLImageElement>(null)
  const idleRef = useRef<HTMLVideoElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const finaleRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const committedRef = useRef(0) // current stop index, mirrored for the snap-nav handlers
  const frames = useRef<HTMLImageElement[]>([])
  const curTime = useRef(0)
  const lastDrawn = useRef(-1)
  const [pair, setPair] = useState<PairId | null>(null)
  const [pairShown, setPairShown] = useState(false) // opacity gate for a fade-out before unmount

  // preload every frame as a decoded image (reliable on iOS, unlike video preload)
  useEffect(() => {
    frames.current = Array.from({ length: FRAME_COUNT }, (_, i) => {
      const img = new Image()
      img.src = frameUrl(i)
      return img
    })
  }, [])

  // size the canvas to the stage (dpr-capped) + pin the stage to one screen
  useEffect(() => {
    let lockedW = -1
    let lockedH = 0
    const fit = () => {
      const el = stageRef.current
      const cv = canvasRef.current
      if (!el || !cv) return
      // pin height to one screen; re-lock only on a real width change (orientation), and only ever
      // grow to the toolbar-hidden max — so the mobile URL-bar show/hide never restretches the hero
      if (window.innerWidth !== lockedW) { lockedW = window.innerWidth; lockedH = window.innerHeight }
      else if (window.innerHeight > lockedH) lockedH = window.innerHeight
      el.style.height = `${lockedH}px`
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cv.width = Math.round(el.clientWidth * dpr)
      cv.height = Math.round(el.clientHeight * dpr)
      cv.style.width = `${el.clientWidth}px`
      cv.style.height = `${el.clientHeight}px`
      lastDrawn.current = -1
    }
    fit()
    window.addEventListener('resize', fit)
    window.addEventListener('orientationchange', fit)
    return () => { window.removeEventListener('resize', fit); window.removeEventListener('orientationchange', fit) }
  }, [])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let committed = -1
    let target = 0
    let lastP = 0
    let stationary = 0
    let lastStop = -1
    let lastWant: PairId | null = null
    let hideTimer = 0

    const drawCover = (img: HTMLImageElement, alpha: number) => {
      const cv = canvasRef.current
      if (!cv || !img.naturalWidth) return
      const ctx = cv.getContext('2d')
      if (!ctx) return
      const cw = cv.width
      const ch = cv.height
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
      const w = img.naturalWidth * scale
      const h = img.naturalHeight * scale
      ctx.globalAlpha = alpha
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h)
      ctx.globalAlpha = 1
    }

    const loop = () => {
      const section = sectionRef.current
      if (section) {
        const now = performance.now()
        const dt = Math.min(0.1, Math.max(0, (now - last) / 1000))
        last = now

        const vh = window.innerHeight
        const scrollable = Math.max(1, section.offsetHeight - vh)
        const p = clamp((window.scrollY - section.offsetTop) / scrollable)

        if (committed < 0) { committed = bandAt(p); target = committed; curTime.current = STOP_TIMES[committed] }

        stationary = Math.abs(p - lastP) < SETTLE_EPS ? stationary + 1 : 0
        lastP = p

        const nc = deriveCommitted(p, committed)
        if (nc !== committed) {
          committed = stationary >= SETTLE_FRAMES ? nc : committed + Math.sign(nc - committed)
          target = committed
        }
        committedRef.current = committed

        // wall-time exponential tween toward the target stop (same driver as desktop)
        const goal = STOP_TIMES[target]
        curTime.current += (goal - curTime.current) * (1 - Math.exp(-dt / TAU))
        const dist = Math.abs(curTime.current - goal)
        const atRest = dist < ARRIVE
        if (dist < SNAP) curTime.current = goal
        const rt = curTime.current

        // draw the image-sequence frame for renderTime — fractional index + cross-dissolve of the
        // two nearest frames; if the target frame isn't decoded, draw the nearest ready one (no freeze)
        const fexact = clamp(rt / TOTAL_DUR) * (FRAME_COUNT - 1)
        if (Math.abs(fexact - lastDrawn.current) > 0.02) {
          const i0 = Math.floor(fexact)
          const i1 = Math.min(FRAME_COUNT - 1, i0 + 1)
          const frac = fexact - i0
          const a = frames.current[i0]
          if (a && a.complete && a.naturalWidth) {
            drawCover(a, 1)
            const b = frames.current[i1]
            if (frac > 0.02 && b && b.complete && b.naturalWidth) drawCover(b, frac)
            lastDrawn.current = fexact
          } else {
            for (let d = 1; d < FRAME_COUNT; d++) {
              const c = frames.current[i0 - d] || frames.current[i0 + d]
              if (c && c.complete && c.naturalWidth) { drawCover(c, 1); break }
            }
          }
        }

        // idle ↔ canvas crossfade — idle video only when fully at rest in stop 0
        const showIdle = committed === 0 && atRest
        if (idleRef.current) idleRef.current.style.opacity = showIdle ? '1' : '0'
        if (canvasRef.current) canvasRef.current.style.opacity = showIdle ? '0' : '1'

        if (heroRef.current) {
          const o = clamp(1 - (rt / STOP_TIMES[1]) * 1.6)
          heroRef.current.style.opacity = String(o)
          heroRef.current.style.pointerEvents = o < 0.05 ? 'none' : ''
        }

        const isProductStop = atRest && STOP_PAIRS[committed] != null
        // crisp full-res poster over the (soft) canvas, only parked at a product stop — never at finale
        if (stopRef.current) {
          if (isProductStop) {
            if (committed !== lastStop) { lastStop = committed; stopRef.current.src = `${BASE}poster-${committed}.jpg` }
            stopRef.current.style.opacity = '1'
          } else {
            stopRef.current.style.opacity = '0'
          }
        }
        // "scroll for more" hint arrow — shown only while the product cards are open
        if (hintRef.current) hintRef.current.style.opacity = isProductStop ? '1' : '0'

        if (finaleRef.current) {
          const showFinale = (atRest && committed === N_STOPS - 1) ||
            (target === N_STOPS - 1 && rt > (STOP_TIMES[N_STOPS - 2] + STOP_TIMES[N_STOPS - 1]) / 2)
          finaleRef.current.style.opacity = showFinale ? '1' : '0'
        }

        const wantPair = atRest ? STOP_PAIRS[committed] : null
        if (wantPair !== lastWant) {
          lastWant = wantPair
          if (wantPair) {
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = 0 }
            setPair(wantPair); setPairShown(true)
          } else {
            setPairShown(false)
            if (hideTimer) clearTimeout(hideTimer)
            hideTimer = window.setTimeout(() => setPair(null), 320)
          }
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); if (hideTimer) clearTimeout(hideTimer) }
  }, [])

  useSnapNav(sectionRef, stageRef, committedRef)

  const products = pair ? pairProducts(pair) : []

  return (
    <section ref={sectionRef} id="cinematic" className="relative" style={{ height: `${TOTAL_VH}vh` }}>
      <div ref={stageRef} className="sticky top-0 h-[100lvh] w-full overflow-hidden bg-bg">
        <img src={`${BASE}poster-0.jpg`} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
        <video
          ref={idleRef}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-smooth"
          src={`${BASE}idle.mp4`}
          poster={`${BASE}poster-0.jpg`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={(e) => { e.currentTarget.play().catch(() => {}) }}
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-0 transition-opacity duration-700 ease-smooth" />
        {/* crisp full-res poster fades in at each parked stop (canvas frames are soft) */}
        <img ref={stopRef} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300 ease-smooth" />

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-bg/70 via-bg/10 to-bg/60" />


        <div ref={heroRef} className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 transition-opacity duration-300">
          <p className="text-xs tracking-[0.3em] uppercase text-gear mb-4">AW Ski Equipment</p>
          <h1 className="font-playfair italic text-5xl sm:text-6xl leading-[1.05] drop-shadow-[0_2px_30px_rgba(0,0,0,0.6)]">Suit up. Send it.</h1>
          <p className="mt-5 max-w-md text-ink/75">Pro-grade snowboard gear, built for deep days and long descents. Scroll to gear up.</p>
          <div className="mt-10 flex flex-col items-center gap-1 text-ink/60 animate-bounce">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <ChevronDown size={18} />
          </div>
          {/* jump straight to the catalog, skipping the cinematic */}
          <a
            href="#gear"
            className="md:hidden mt-6 inline-flex items-center gap-1.5 glass-nav rounded-full px-5 py-2.5 text-sm font-medium text-ink/90 active:scale-95 transition-all"
          >
            Skip to catalog <ChevronDown size={15} />
          </a>
        </div>

        {/* "scroll for more" hint — appears above the sheet only while cards are open at a stop */}
        <div
          ref={hintRef}
          aria-hidden
          className="md:hidden absolute inset-x-0 bottom-[150px] flex justify-center opacity-0 transition-opacity duration-300 pointer-events-none z-10"
        >
          <div className="w-9 h-9 rounded-full glass-nav flex items-center justify-center text-ink/80 animate-bounce">
            <ChevronDown size={18} />
          </div>
        </div>

        {products.length > 0 && (
          <div className={`absolute inset-x-0 bottom-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-opacity duration-300 ${pairShown ? 'opacity-100' : 'opacity-0'}`}>
            <div className="glass rounded-2xl divide-y divide-white/10 card-in-up">
              {products.map((pr) => (
                <MiniRow key={pr.id} product={pr} />
              ))}
            </div>
          </div>
        )}

        <div ref={finaleRef} className="absolute inset-x-0 bottom-[14%] flex flex-col items-center text-center px-6 opacity-0 transition-opacity duration-500">
          <h2 className="font-playfair italic text-4xl sm:text-5xl drop-shadow-[0_2px_30px_rgba(0,0,0,0.7)]">The mountain is waiting.</h2>
          <p className="mt-3 text-ink/80">Your kit's ready. The line's yours.</p>
          <a href="#gear" className="mt-6 bg-brand hover:bg-brand-dark text-white font-medium px-7 py-3 rounded-full transition-all active:scale-95">Shop the kit</a>
        </div>
      </div>
    </section>
  )
}

/* ---------------- reduced-motion / no-scrub fallback ---------------- */

function FallbackCinematic() {
  return (
    <section id="cinematic" className="relative">
      <div className="relative h-[90svh] w-full overflow-hidden">
        <img src={`${BASE}poster-0.jpg`} alt="A snowboarder geared up on an alpine ridge" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/70 via-bg/10 to-bg/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-gear mb-4">AW Ski Equipment</p>
          <h1 className="font-playfair italic text-5xl sm:text-6xl md:text-7xl">Suit up. Send it.</h1>
          <p className="mt-5 max-w-md text-ink/75">Pro-grade snowboard gear, built for deep days and long descents.</p>
        </div>
      </div>

      {PAIRS.map((pid, i) => (
        <div key={pid} className="relative grid md:grid-cols-2 gap-6 items-center max-w-6xl mx-auto px-6 py-16">
          <img src={`${BASE}poster-${i + 1}.jpg`} alt="" className="rounded-3xl w-full object-cover aspect-video" />
          <div className="grid sm:grid-cols-2 gap-4">
            {pairProducts(pid).map((pr) => (
              <ProductCard key={pr.id} product={pr} variant="sheet" />
            ))}
          </div>
        </div>
      ))}

      <div className="relative h-[80svh] w-full overflow-hidden">
        <img src={`${BASE}poster-4.jpg`} alt="A snowboarder looking at a huge alpine peak" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-[12%] flex flex-col items-center text-center px-6">
          <h2 className="font-playfair italic text-4xl sm:text-5xl md:text-6xl">The mountain is waiting.</h2>
          <a href="#gear" className="mt-6 bg-brand text-white font-medium px-7 py-3 rounded-full">Shop the kit</a>
        </div>
      </div>
    </section>
  )
}
