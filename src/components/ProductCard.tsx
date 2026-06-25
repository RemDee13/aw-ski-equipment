import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import type { Product } from '../data/products'
import { useCart } from '../cart'

interface Props {
  product: Product
  /** layout context: floating beside the video, or stacked in a sheet/grid */
  variant?: 'float' | 'sheet'
  className?: string
  style?: React.CSSProperties
}

export default function ProductCard({ product, variant = 'float', className = '', style }: Props) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)
  const onAdd = () => {
    add(product)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1300)
  }
  const anim = variant === 'sheet' ? 'card-in-up' : product.side === 'left' ? 'card-in-left' : 'card-in-right'
  return (
    <article
      className={`glass glass-card rounded-3xl p-5 w-full ${anim} ${className}`}
      style={style}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
        {product.badge && (
          <span className="shrink-0 text-[10px] uppercase tracking-wider font-semibold text-gear border border-gear/40 rounded-full px-2 py-0.5">
            {product.badge}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm text-ink-muted">{product.hook}</p>

      <ul className="mt-4 space-y-1.5">
        {product.specs.map((s) => (
          <li key={s} className="flex items-start gap-2 text-[13px] text-ink/85">
            <Check size={14} className="text-gear mt-0.5 shrink-0" />
            <span>{s}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-lg font-semibold tabular-nums">{product.price}</span>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-full transition-all hover:scale-[1.03] active:scale-95"
        >
          {added ? <><Check size={15} /> Added</> : <><Plus size={15} /> Add to kit</>}
        </button>
      </div>
    </article>
  )
}
