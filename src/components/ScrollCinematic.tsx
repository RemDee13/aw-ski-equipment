import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { PAIRS, pairProducts, type PairId } from '../data/products'
import { coverPoint, clamp } from '../lib/cover'
import ProductCard from './ProductCard'
import ConnectorLine from './ConnectorLine'

const BASE = import.meta.env.BASE_URL

// timeline segments (relative scroll length in vh). idle is the intro hold.
// Longer segments = slower scrub per scrolled pixel = smoother, more cinematic.
const SEGMENTS = [
  { key: 'idle', vh: 100 },
  { key: 's1', vh: 350, pair: 'optics' as PairId },
  { key: 's2', vh: 350, pair: 'shell' as PairId },
  { key: 's3', vh: 350, pair: 'lower' as PairId },
  { key: 's4', vh: 420, pair: null },
]
const TOTAL_VH = SEGMENTS.reduce((a, s) => a + s.vh, 0)
const ACT_KEYS = ['s1', 's2', 's3', 's4']
const SCRUB = 0.6 // first 60% of an act scrubs the clip; the rest holds + shows cards

// cumulative end fractions for each segment
const FRAC_ENDS = (() => {
  let acc = 0
  return SEGMENTS.map((s) => (acc += s.vh) / TOTAL_VH)
})()

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
  const idleRef = useRef<HTMLVideoElement>(null)
  const actRefs = useRef<(HTMLVideoElement | null)[]>([])
  const heroRef = useRef<HTMLDivElement>(null)
  const finaleRef = useRef<HTMLDivElement>(null)
  const curTimes = useRef<number[]>([0, 0, 0, 0])

  const [pair, setPair] = useState<PairId | null>(null)
  const [size, setSize] = useState({ w: 1280, h: 720 })

  // track stage size for anchor math
  useEffect(() => {
    const measure = () => {
      const el = stageRef.current
      if (el) setSize({ w: el.clientWidth, h: el.clientHeight })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    let raf = 0
    let lastPair: PairId | null = null

    const loop = () => {
      const section = sectionRef.current
      if (section) {
        const vh = window.innerHeight
        const sectionPx = section.offsetHeight
        const top = section.offsetTop
        const scrollable = Math.max(1, sectionPx - vh)
        const p = clamp((window.scrollY - top) / scrollable)

        // find active segment
        let idx = 0
        while (idx < FRAC_ENDS.length - 1 && p > FRAC_ENDS[idx]) idx++
        const prevEnd = idx === 0 ? 0 : FRAC_ENDS[idx - 1]
        const localP = clamp((p - prevEnd) / (FRAC_ENDS[idx] - prevEnd))

        const seg = SEGMENTS[idx]
        const isIdle = seg.key === 'idle'

        // idle video opacity + hero fade
        if (idleRef.current) idleRef.current.style.opacity = isIdle ? '1' : '0'
        if (heroRef.current) heroRef.current.style.opacity = isIdle ? String(clamp(1 - localP * 1.6)) : '0'

        let nextPair: PairId | null = null
        let nextFinale = false

        ACT_KEYS.forEach((k, ai) => {
          const v = actRefs.current[ai]
          if (!v) return
          const active = !isIdle && seg.key === k
          v.style.opacity = active ? '1' : '0'
          if (active) {
            const dur = v.duration || 8
            const scrubP = clamp(localP / SCRUB)
            const target = scrubP * dur
            const cur = curTimes.current[ai]
            const next = cur + (target - cur) * 0.14
            curTimes.current[ai] = next
            if (Math.abs(target - next) > 0.008 || Math.abs(v.currentTime - next) > 0.05) {
              try { v.currentTime = next } catch { /* seeking */ }
            }
            if (seg.pair && localP > SCRUB) nextPair = seg.pair
            if (k === 's4' && localP > 0.5) nextFinale = true
          }
        })

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
        {/* idle loop */}
        <video
          ref={idleRef}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          src={`${BASE}idle.mp4`}
          poster={`${BASE}poster-0.jpg`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        {/* act videos */}
        {ACT_KEYS.map((k, i) => (
          <video
            key={k}
            ref={(el) => (actRefs.current[i] = el)}
            className="absolute inset-0 w-full h-full object-cover opacity-0"
            src={`${BASE}${k}.mp4`}
            poster={`${BASE}poster-${i + 1}.jpg`}
            muted
            playsInline
            preload={i === 0 ? 'auto' : 'metadata'}
          />
        ))}

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

        {/* mobile: dual cards as a swipeable bottom sheet */}
        {products.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 md:hidden p-3 flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
            {products.map((pr) => (
              <ProductCard key={pr.id} product={pr} variant="sheet" className="!p-4 min-w-[82%] snap-center text-[13px]" />
            ))}
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

/* ---------------- reduced-motion / no-scrub fallback ---------------- */

function FallbackCinematic() {
  return (
    <section id="cinematic" className="relative">
      {/* hero poster */}
      <div className="relative h-[90svh] w-full overflow-hidden">
        <img src={`${BASE}poster-0.jpg`} alt="A snowboarder geared up on an alpine ridge" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/70 via-bg/10 to-bg/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-gear mb-4">AW Ski Equipment</p>
          <h1 className="font-playfair italic text-5xl sm:text-6xl md:text-7xl">Suit up. Send it.</h1>
          <p className="mt-5 max-w-md text-ink/75">Pro-grade snowboard gear, built for deep days and long descents.</p>
        </div>
      </div>

      {/* each stop: poster + its two cards */}
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

      {/* finale poster */}
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
