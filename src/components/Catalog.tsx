import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import { PRODUCTS, type PairId, type Product } from '../data/products'
import { useCart } from '../cart'

const BASE = import.meta.env.BASE_URL
const POSTER: Record<PairId, string> = { optics: 'poster-1.jpg', shell: 'poster-2.jpg', lower: 'poster-3.jpg' }

export default function Catalog() {
  return (
    <section id="gear" className="relative bg-bg2 py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="reveal-up max-w-2xl">
          <p className="text-xs tracking-[0.28em] uppercase text-gear mb-4">The kit</p>
          <h2 className="font-playfair italic text-4xl md:text-5xl leading-tight">Everything on the rider, ready to ship.</h2>
          <p className="mt-4 text-ink-muted">Six pieces, head to board. Tap any item to start a build.</p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((p) => (
            <article key={p.id} className="reveal-up group glass rounded-3xl overflow-hidden flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={`${BASE}${POSTER[p.pairId]}`}
                  alt={p.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {p.badge && (
                  <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider font-semibold text-bg bg-gear rounded-full px-2.5 py-1">
                    {p.badge}
                  </span>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-lg leading-tight">{p.name}</h3>
                  <span className="text-lg font-semibold tabular-nums shrink-0">{p.price}</span>
                </div>
                <p className="mt-1.5 text-sm text-ink-muted">{p.hook}</p>
                <div className="mt-auto pt-5">
                  <AddToKit product={p} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function AddToKit({ product }: { product: Product }) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)
  return (
    <button
      onClick={() => { add(product); setAdded(true); window.setTimeout(() => setAdded(false), 1300) }}
      className="w-full inline-flex items-center justify-center gap-1.5 bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2.5 rounded-full transition-all hover:scale-[1.02] active:scale-95"
    >
      {added ? <><Check size={15} /> Added to kit</> : <><Plus size={15} /> Add to kit</>}
    </button>
  )
}
