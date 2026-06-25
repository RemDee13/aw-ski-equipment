import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const ITEMS = [
  {
    q: 'Is this a real store?',
    a: "No — it's a portfolio demo by Anton Pavlov. The gear, prices, and brand are fictional, built to show off a scroll-driven product experience.",
  },
  {
    q: 'Can I actually buy anything?',
    a: 'The "Add to kit" buttons are for show. They send you to the contact form — reach out if you\'d like a site like this.',
  },
  {
    q: 'Is the snowboarder real footage?',
    a: 'No. The rider and the mountain are AI-generated stills animated into a scroll-scrubbed video (Nano Banana Pro + a Google video model).',
  },
  {
    q: 'How do I pick the right size?',
    a: 'In a real build this is where a size guide and fit chart would live. Here it\'s a placeholder to show the layout.',
  },
  {
    q: 'What about shipping and returns?',
    a: 'Also fictional — a real version would document delivery times, regions, and a returns window here.',
  },
  {
    q: 'Who built this and can I get one?',
    a: 'Anton Pavlov (pavlov-ai.online). Yes — use the contact form below.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="relative bg-bg py-24 md:py-32">
      <div className="max-w-3xl mx-auto px-6">
        <div className="reveal-up">
          <p className="text-xs tracking-[0.28em] uppercase text-gear mb-4">Questions</p>
          <h2 className="font-playfair italic text-4xl md:text-5xl leading-tight">Good to know.</h2>
        </div>
        <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
          {ITEMS.map((it, i) => {
            const isOpen = open === i
            return (
              <div key={i} className="reveal-up">
                <button
                  className="w-full flex items-center justify-between gap-4 text-left py-5"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="font-medium text-lg">{it.q}</span>
                  <span className="shrink-0 text-gear">{isOpen ? <Minus size={18} /> : <Plus size={18} />}</span>
                </button>
                <div className={`grid transition-all duration-300 ease-smooth ${isOpen ? 'grid-rows-[1fr] pb-5' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden text-ink-muted leading-relaxed">{it.a}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
