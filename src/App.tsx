import { useEffect } from 'react'
import Lenis from 'lenis'
import PortfolioRibbon from './components/PortfolioRibbon'
import Navbar from './components/Navbar'
import ScrollCinematic from './components/ScrollCinematic'
import Catalog from './components/Catalog'
import FAQ from './components/FAQ'
import Contact from './components/Contact'
import Footer from './components/Footer'
import { CartProvider, CartDrawer } from './cart'
import Preloader from './components/Preloader'

export default function App() {
  // smooth scrolling (Lenis), disabled under reduced-motion
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
    let raf = 0
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); lenis.destroy() }
  }, [])

  // scroll-in reveals
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal-up'))
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('in')); return }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }),
      { threshold: 0.15 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <CartProvider>
    <Preloader />
    <div id="top" className="bg-bg tracking-[-0.02em]">
      <PortfolioRibbon />
      <Navbar />
      <CartDrawer />
      <ScrollCinematic />

      {/* story / brand statement */}
      <section id="story" className="relative bg-bg py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6 text-center reveal-up">
          <p className="text-xs tracking-[0.28em] uppercase text-gear mb-5">Why AW Ski</p>
          <p className="font-playfair italic text-3xl md:text-5xl leading-[1.15]">
            “Great gear disappears. You forget the kit, you remember the line.”
          </p>
          <p className="mt-6 text-ink-muted">
            We picked six pieces that do exactly that — warm, dry, dialled-in, out of your way. Suit up once, ride all day.
          </p>
        </div>
      </section>

      <Catalog />
      <FAQ />
      <Contact />
      <Footer />
    </div>
    </CartProvider>
  )
}
