import { Snowflake } from 'lucide-react'

const WORDS = ['Ride', 'Carve', 'Send', 'Glide', 'Drop', 'Float']

export default function Footer() {
  return (
    <footer className="relative bg-bg pt-20 pb-10 overflow-hidden">
      {/* marquee */}
      <div className="select-none overflow-hidden whitespace-nowrap opacity-[0.06] mb-10">
        <div className="marquee-track inline-block">
          {[...WORDS, ...WORDS, ...WORDS, ...WORDS].map((w, i) => (
            <span key={i} className="font-playfair italic text-7xl md:text-9xl mx-6">{w}</span>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <a href="#top" className="flex items-center gap-2 font-semibold text-xl">
          <Snowflake size={20} className="text-gear" /> AW Ski
        </a>
        <nav className="flex flex-wrap gap-6 text-sm text-ink-muted">
          <a href="#gear" className="hover:text-ink transition-colors">Gear</a>
          <a href="#story" className="hover:text-ink transition-colors">Story</a>
          <a href="#faq" className="hover:text-ink transition-colors">FAQ</a>
          <a href="#contact" className="hover:text-ink transition-colors">Contact</a>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-2 text-xs text-ink-muted">
        <p>© 2026 AW Ski Equipment — fictional company, portfolio demo.</p>
        <p>
          Made by · <a href="https://pavlov-ai.online" target="_blank" rel="noopener" className="text-ink hover:text-brand transition-colors">Anton Pavlov</a> · pavlov-ai.online
        </p>
      </div>
    </footer>
  )
}
