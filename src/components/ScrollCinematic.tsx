import { useEffect, useRef, useState } from 'react'
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
const SCRUB = 0.6 // first 60% of an act scrubs the clip; the rest holds + shows cards

// the 4 acts are concatenated into one acts.mp4 — these are each act's slice of that timeline
const ACT_DURS = [7.708, 8, 8, 8]
const ACT_STARTS = ACT_DURS.map((_, i) => ACT_DURS.slice(0, i).reduce((a, b) => a + b, 0))

const FRAC_ENDS = (() => {
  let acc = 0
  return SEGMENTS.map((s) => (acc += s.vh) / TOTAL_VH)
})()

// one all-intra (-g 1) clip for every device — every frame is a keyframe, so seeking
// to any time is an instant single-frame decode (smooth scrub on mobile, like the reference)
export const ACTS_SRC = 'acts.mp4'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function ScrollCinematic() {
  const [fallback] = useState(prefersReducedMotion)
  if (fallback) return <FallbackCinematic />
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
  const curTime = useRef(0)
  const revealed = useRef(false)
  const warmedDecoder = useRef(false)
  const warmedGesture = useRef(false)

  const [pair, setPair] = useState<PairId | null>(null)
  const [size, setSize] = useState({ w: 1280, h: 720 })

  // warm the scrub decoder once: seek across the whole timeline so the first real
  // scrub never pays the cold-decoder cost (the ~1.5s hitch). Runs behind the loader.
  const warmDecoder = () => {
    const v = actsRef.current
    if (!v || warmedDecoder.current || !v.duration) return
    warmedDecoder.current = true
    const pts = [0.12, 0.37, 0.62, 0.87, 0].map((f) => f * v.duration)
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

  // track stage size (resize + orientation change → recompute anchors)
  useEffect(() => {
    const measure = () => {
      const el = stageRef.current
      if (el) setSize({ w: el.clientWidth, h: el.clientHeight })
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
    let lastPair: PairId | null = null
    let lastPoster = -1

    const loop = () => {
      const section = sectionRef.current
      const acts = actsRef.current
      if (section && acts) {
        const vh = window.innerHeight
        const scrollable = Math.max(1, section.offsetHeight - vh)
        const p = clamp((window.scrollY - section.offsetTop) / scrollable)

        let idx = 0
        while (idx < FRAC_ENDS.length - 1 && p > FRAC_ENDS[idx]) idx++
        const prevEnd = idx === 0 ? 0 : FRAC_ENDS[idx - 1]
        const localP = clamp((p - prevEnd) / (FRAC_ENDS[idx] - prevEnd))

        const seg = SEGMENTS[idx]
        const isIdle = seg.key === 'idle'
        const actIndex = isIdle ? -1 : idx - 1

        // poster bridge (never black): act start frame while scrubbing in, end frame on the card hold
        const posterIdx = isIdle ? 0 : localP > SCRUB ? actIndex + 1 : actIndex
        if (posterIdx !== lastPoster && posterRef.current) {
          lastPoster = posterIdx
          posterRef.current.src = `${BASE}poster-${posterIdx}.jpg`
        }

        // idle hero — plain always-playing autoplay video, full quality (JS never pauses it)
        if (idleRef.current) idleRef.current.style.opacity = isIdle ? '1' : '0'
        if (heroRef.current) heroRef.current.style.opacity = isIdle ? String(clamp(1 - localP * 1.6)) : '0'

        let nextPair: PairId | null = null
        let nextFinale = false

        if (!isIdle) {
          // map this act's scroll onto its slice of the single concatenated timeline
          const scrubP = clamp(localP / SCRUB)
          const target = ACT_STARTS[actIndex] + scrubP * ACT_DURS[actIndex]
          // inertial lerp toward the target (like the reference) — smooth on all devices;
          // with the all-intra clip each seek is an instant single-frame decode
          const next = curTime.current + (target - curTime.current) * 0.1
          curTime.current = next
          if (!acts.paused) acts.pause()
          if (Math.abs(acts.currentTime - next) > 0.001) {
            try { acts.currentTime = next } catch { /* seeking */ }
          }
          if (acts.readyState >= 2) revealed.current = true
          acts.style.opacity = revealed.current ? '1' : '0'
          if (seg.pair && localP > SCRUB) nextPair = seg.pair
          if (seg.key === 's4' && localP > 0.5) nextFinale = true
        } else {
          acts.style.opacity = '0'
        }

        if (finaleRef.current) finaleRef.current.style.opacity = nextFinale ? '1' : '0'
        if (nextPair !== lastPair) { lastPair = nextPair; setPair(nextPair) }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // connector geometry (desktop)
  const pad = size.w * 0.035
  const cardW = Math.min(360, size.w * 0.3)
  const leftConn = { x: pad + cardW, y: size.h * 0.5 }
  const rightConn = { x: size.w - pad - cardW, y: size.h * 0.5 }
  const products = pair ? pairProducts(pair) : []

  return (
    <section ref={sectionRef} id="cinematic" className="relative" style={{ height: `${TOTAL_VH}vh` }}>
      <div ref={stageRef} className="sticky top-0 h-[100svh] w-full overflow-hidden bg-bg">
        {/* poster layer — always visible behind the videos so the screen is never black */}
        <img ref={posterRef} src={`${BASE}poster-0.jpg`} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />

        {/* idle hero — plain autoplay loop video, full quality */}
        <video
          ref={idleRef}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-smooth"
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
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 ease-smooth"
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
        </div>

        {/* connector lines + dual cards (desktop) */}
        {products.length > 0 && (
          <div className="absolute inset-0 hidden md:block">
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
          <div className="absolute inset-x-0 bottom-0 md:hidden p-3">
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
