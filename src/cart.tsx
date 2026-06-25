import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { X, ShoppingBag, Trash2 } from 'lucide-react'
import type { Product } from './data/products'

interface CartItem {
  product: Product
  qty: number
}

interface CartCtx {
  items: CartItem[]
  count: number
  subtotal: number
  open: boolean
  setOpen: (v: boolean) => void
  add: (p: Product) => void
  remove: (id: string) => void
}

const priceNum = (s: string) => Number(s.replace(/[^0-9.]/g, '')) || 0

const Ctx = createContext<CartCtx | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [open, setOpen] = useState(false)

  const add = (p: Product) =>
    setItems((cur) => {
      const found = cur.find((i) => i.product.id === p.id)
      if (found) return cur.map((i) => (i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i))
      return [...cur, { product: p, qty: 1 }]
    })

  const remove = (id: string) => setItems((cur) => cur.filter((i) => i.product.id !== id))

  const value = useMemo<CartCtx>(() => {
    const count = items.reduce((a, i) => a + i.qty, 0)
    const subtotal = items.reduce((a, i) => a + priceNum(i.product.price) * i.qty, 0)
    return { items, count, subtotal, open, setOpen, add, remove }
  }, [items, open])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCart must be used within CartProvider')
  return c
}

export function CartDrawer() {
  const { items, count, subtotal, open, setOpen, remove } = useCart()
  return (
    <>
      {/* backdrop */}
      <div
        className={`fixed inset-0 z-[120] bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      {/* panel */}
      <aside
        className={`fixed top-0 right-0 z-[130] h-full w-[88vw] max-w-md glass flex flex-col transition-transform duration-300 ease-smooth ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-label="Your kit"
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2 font-semibold">
            <ShoppingBag size={18} className="text-gear" /> Your kit
            <span className="text-ink-muted font-normal">({count})</span>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close kit" className="p-1 text-ink-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {items.length === 0 && <p className="text-ink-muted text-sm mt-6 text-center">Your kit is empty. Add some gear.</p>}
          {items.map((i) => (
            <div key={i.product.id} className="flex items-center justify-between gap-3 bg-white/5 rounded-2xl px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{i.product.name}</p>
                <p className="text-xs text-ink-muted">{i.product.price}{i.qty > 1 ? ` × ${i.qty}` : ''}</p>
              </div>
              <button onClick={() => remove(i.product.id)} aria-label={`Remove ${i.product.name}`} className="shrink-0 text-ink-muted hover:text-error transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-ink-muted">Subtotal</span>
            <span className="text-lg font-semibold tabular-nums">${subtotal.toLocaleString()}</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => alert('Demo cart — this is a portfolio piece, no real checkout. :)')}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-full transition-all"
          >
            Checkout
          </button>
          <p className="mt-2 text-center text-[11px] text-ink-muted">Demo cart — portfolio piece, no real checkout.</p>
        </div>
      </aside>
    </>
  )
}
