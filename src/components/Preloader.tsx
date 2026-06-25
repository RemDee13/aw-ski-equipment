import { useEffect, useRef, useState } from 'react'
import { Snowflake } from 'lucide-react'

const BASE = import.meta.env.BASE_URL
// the cinematic-critical media — warm these into cache before revealing the site
const ASSETS = [
  'idle.mp4', 's1.mp4', 's2.mp4', 's3.mp4', 's4.mp4', 'contact-bg.mp4',
  'poster-0.jpg', 'poster-1.jpg', 'poster-2.jpg', 'poster-3.jpg', 'poster-4.jpg',
].map((f) => BASE + f)

const MAX_MS = 3000 // hard cap: never hold the user longer than 3s
const MIN_MS = 600 // avoid a jarring flash on very fast loads

export default function Preloader() {
  const [pct, setPct] = useState(0)
  const [fade, setFade] = useState(false)
  const [gone, setGone] = useState(false)
  const finished = useRef(false)

  useEffect(() => {
    const start = performance.now()
    const received: Record<string, number> = {}
    const totals: Record<string, number> = {}
    let alive = true

    const update = () => {
      if (!alive) return
      const tot = Object.values(totals).reduce((a, b) => a + b, 0)
      const rec = Object.values(received).reduce((a, b) => a + b, 0)
      const real = tot > 0 ? rec / tot : 0
      const timeP = Math.min((performance.now() - start) / MAX_MS, 1) * 0.9
      const p = Math.round(Math.min(1, Math.max(real, timeP)) * 100)
      setPct((prev) => (p > prev ? p : prev))
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

    Promise.all(
      ASSETS.map(async (u) => {
        try {
          const res = await fetch(u)
          totals[u] = Number(res.headers.get('content-length') || 0)
          received[u] = 0
          const reader = res.body?.getReader()
          if (!reader) { received[u] = totals[u] || 1; update(); return }
          for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            received[u] += value?.length || 0
            update()
          }
        } catch {
          totals[u] = totals[u] || 1
          received[u] = totals[u]
        }
        update()
      }),
    ).then(finish)

    const timer = window.setTimeout(finish, MAX_MS)
    const tick = window.setInterval(update, 100)
    return () => { alive = false; clearTimeout(timer); clearInterval(tick) }
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
