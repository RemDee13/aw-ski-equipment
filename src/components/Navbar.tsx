import { useEffect, useState } from 'react'
import { Snowflake, Menu, X, ShoppingBag } from 'lucide-react'
import { useCart } from '../cart'

const LINKS = [
  { label: 'Gear', href: '#gear' },
  { label: 'Story', href: '#story' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)
  const { count, setOpen: setCartOpen } = useCart()

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const Logo = (
    <a href="#top" className="flex items-center gap-2 font-semibold tracking-tight">
      <Snowflake size={18} className="text-gear" />
      <span>AW Ski</span>
    </a>
  )

  const CartButton = (
    <button
      onClick={() => setCartOpen(true)}
      aria-label={`Open your kit (${count} item${count === 1 ? '' : 's'})`}
      className="relative p-2 text-ink hover:text-gear transition-colors"
    >
      <ShoppingBag size={20} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gear text-bg text-[11px] font-bold flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  )

  return (
    <header className="fixed top-7 left-0 right-0 z-[100] px-4">
      {/* desktop: single centered pill */}
      <nav
        className={`hidden md:flex mx-auto max-w-5xl items-center justify-between rounded-full px-5 py-2.5 transition-all duration-500 ${
          solid ? 'glass-nav' : 'bg-transparent border border-transparent'
        }`}
      >
        {Logo}
        <div className="flex items-center gap-7 text-sm text-ink/80">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-ink transition-colors">
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <a
            href="#gear"
            className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-5 py-2 rounded-full transition-all hover:scale-[1.03] active:scale-95"
          >
            Shop the kit
          </a>
          {CartButton}
        </div>
      </nav>

      {/* mobile: logo pill on the left, cart + burger pill on the right */}
      <div className="md:hidden flex items-center justify-between">
        <div className="glass-nav rounded-full px-4 py-2.5">{Logo}</div>
        <div className="glass-nav rounded-full px-1.5 py-1 flex items-center gap-0.5">
          {CartButton}
          <button
            className="p-2 text-ink"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* mobile dropdown menu */}
      {open && (
        <div className="md:hidden mt-2 glass-nav rounded-2xl p-4 flex flex-col gap-1 text-ink/85">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#gear"
            onClick={() => setOpen(false)}
            className="mt-1 text-center bg-brand text-white font-medium px-5 py-2.5 rounded-full"
          >
            Shop the kit
          </a>
        </div>
      )}
    </header>
  )
}
