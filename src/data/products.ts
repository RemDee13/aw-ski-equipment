// Source of truth: CONTENT.md §2. 6 products in 3 focus-stop pairs.
// `anchor` = point on the gear the connector line targets, as a fraction (0..1)
// of the VIDEO frame (1280x720). Mapped to screen coords via useCoverAnchor.

export type ProductId = 'goggles' | 'mask' | 'jacket' | 'gloves' | 'boots' | 'pants'
export type PairId = 'optics' | 'shell' | 'lower'

export interface Product {
  id: ProductId
  pairId: PairId
  side: 'left' | 'right'
  name: string
  hook: string
  price: string
  badge: string | null
  specs: string[]
  anchor: { x: number; y: number }
}

export const PRODUCTS: Product[] = [
  {
    id: 'goggles',
    pairId: 'optics',
    side: 'left',
    name: 'Vortex Mirror Goggles',
    hook: 'See the whole mountain — edge to edge.',
    price: '$189',
    badge: 'Best seller',
    specs: ['Oversized frame, magnetic quick-swap lens', 'Yellow mirror lens, 18% VLT', 'Triple-layer face foam', 'Permanent anti-fog coating'],
    anchor: { x: 0.5, y: 0.42 },
  },
  {
    id: 'mask',
    pairId: 'optics',
    side: 'right',
    name: 'Stormknit Balaclava',
    hook: 'Full-face warmth, all day.',
    price: '$39',
    badge: 'New',
    specs: ['Full-face merino-knit balaclava', 'Fog-free breathing channel', 'Goggle-compatible eye port', 'One size'],
    anchor: { x: 0.5, y: 0.64 },
  },
  {
    id: 'jacket',
    pairId: 'shell',
    side: 'left',
    name: 'Apex 3L Shell Jacket',
    hook: 'Three layers between you and the storm.',
    price: '$429',
    badge: 'Pro',
    specs: ['3-layer 20k/20k waterproof-breathable', 'Pit zips + powder skirt', 'RECCO reflector', 'Helmet-compatible hood'],
    anchor: { x: 0.52, y: 0.46 },
  },
  {
    id: 'gloves',
    pairId: 'shell',
    side: 'right',
    name: 'Gauntlet GTX Gloves',
    hook: 'Dry hands, every lap.',
    price: '$119',
    badge: null,
    specs: ['GORE-TEX insert, fully waterproof', 'Goat-leather palm', 'Storm gauntlet cuff', 'Touchscreen index + thumb'],
    anchor: { x: 0.5, y: 0.72 },
  },
  {
    id: 'boots',
    pairId: 'lower',
    side: 'left',
    name: 'Carve Boa Boots',
    hook: 'Lock in with one pull.',
    price: '$349',
    badge: 'Best seller',
    specs: ['Dual-zone Boa Fit System (yellow dials)', 'Heat-moldable liner', 'Medium-stiff flex', 'Shock-absorbing outsole'],
    anchor: { x: 0.5, y: 0.78 },
  },
  {
    id: 'pants',
    pairId: 'lower',
    side: 'right',
    name: 'Ridgeline Shell Pants',
    hook: 'Built for the deep stuff.',
    price: '$259',
    badge: null,
    specs: ['20k shell, bib-ready', 'Inner-thigh vents', 'Kevlar scuff guards', 'Integrated gaiters'],
    anchor: { x: 0.5, y: 0.4 },
  },
]

export const PAIRS: PairId[] = ['optics', 'shell', 'lower']
export const pairProducts = (pair: PairId) => PRODUCTS.filter((p) => p.pairId === pair)
