import { useEffect, useRef, useState } from 'react'
import { Snowflake } from 'lucide-react'
import { ACTS_SRC, FRAME_COUNT, frameUrl } from './ScrollCinematic'

const BASE = import.meta.env.BASE_URL
const COARSE = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
// desktop buffers the scrub video; touch devices preload the image-sequence frames
const VIDEOS = (COARSE ? ['idle.mp4', 'contact-bg.mp4'] : ['idle.mp4', ACTS_SRC, 'contact-bg.mp4']).map((f) => BASE + f)
const POSTERS = [
  ...['poster-0.jpg', 'poster-1.jpg', 'poster-2.jpg', 'poster-3.jpg', 'poster-4.jpg'].map((f) => BASE + f),
  ...(COARSE ? Array.from({ length: FRAME_COUNT }, (_, i) => frameUrl(i)) : []),
]
const TOTAL = VIDEOS.length + POSTERS.length

const MAX_MS = 3000 // hard cap: never hold the user longer than 3s
const MIN_MS = 600 // avoid a jarring flash on very fast loads

export default function Preloader() {
  const [pct, setPct] = useState(0)
  const [fade, setFade] = useState(false)
  const [gone, setGone] = useState(false)
  const finished = useRef(false)

  useEffect(() => {
    const start = performance.now()
    let alive = true
    const vids: HTMLVideoElement[] = []
    const ready = new Array(POSTERS.length).fill(0) // poster readiness 0/1

    const recompute = () => {
      if (!alive) return
      // video readiness = buffered fraction; poster readiness = loaded 0/1
      let sum = 0
      for (const v of vids) {
        const b = v.buffered.length ? v.buffered.end(v.buffered.length - 1) : 0
        sum += v.duration ? Math.min(1, b / v.duration) : 0
      }
      sum += ready.reduce((a, b) => a + b, 0)
      const real = sum / TOTAL
      const timeP = Math.min((performance.now() - start) / MAX_MS, 1) * 0.92
      const p = Math.round(Math.min(1, Math.max(real, timeP)) * 100)
      setPct((prev) => (p > prev ? p : prev))
      if (real >= 0.999) finish()
    }

    const finish = () => {
      if (finished.current) return
      finished.current = true
      const wait = Math.max(0, MIN_MS - (performance.now() - start))
      window.setTimeout(() => {
        setPct(100)
        setFade(true)
        window.setTimeout(() => setGone(true), 700)
      }, wait)
    }

    // videos — buffer fully in parallel, wait for canplaythrough
    VIDEOS.forEach((url) => {
      const v = document.createElement('video')
      v.muted = true
      v.preload = 'auto'
      v.playsInline = true
      v.src = url
      const done = () => recompute()
      v.addEventListener('canplaythrough', done)
      v.addEventListener('progress', recompute)
      v.addEventListener('loadeddata', recompute)
      v.addEventListener('error', () => { recompute() })
      v.load()
      vids.push(v)
    })

    // posters — in parallel
    POSTERS.forEach((url, i) => {
      const img = new Image()
      const mark = () => { ready[i] = 1; recompute() }
      img.onload = mark
      img.onerror = mark
      img.src = url
    })

    const timer = window.setTimeout(finish, MAX_MS)
    const tick = window.setInterval(recompute, 120)
    return () => {
      alive = false
      clearTimeout(timer)
      clearInterval(tick)
      // free the off-DOM probe videos; bytes stay in HTTP cache for the real <video>s
      vids.forEach((v) => { v.removeAttribute('src'); v.load() })
    }
  }, [])

  if (gone) return null

  return (
    <div
      className={`fixed inset-0 z-[200] bg-bg flex flex-col items-center justify-center gap-7 transition-opacity duration-700 ease-smooth ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="status"
      aria-label="Loading"
    >
      <Snowflake size={40} className="text-gear animate-spin-slow" />
      <p className="text-xs tracking-[0.3em] uppercase text-ink-muted">AW Ski Equipment</p>
      <div className="w-56 h-1 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-gear rounded-full transition-[width] duration-200 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-sm text-ink/70 tabular-nums">{pct}%</p>
    </div>
  )
}
