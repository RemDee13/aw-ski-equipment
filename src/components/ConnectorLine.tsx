import type { Pt } from '../lib/cover'

interface Props {
  from: Pt // anchor on the video (gear element)
  to: Pt // card connection point
}

// A thin elbow line from the gear anchor to the card, with a pulsing dot on the gear.
export default function ConnectorLine({ from, to }: Props) {
  const midX = (from.x + to.x) / 2
  const d = `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`
  return (
    <g>
      <path d={d} fill="none" stroke="#F2C200" strokeWidth={1.5} strokeOpacity={0.7} />
      <circle cx={from.x} cy={from.y} r={4} fill="#F2C200" />
      <circle cx={from.x} cy={from.y} r={4} fill="none" stroke="#F2C200" strokeOpacity={0.5}>
        <animate attributeName="r" values="4;11;4" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.6;0;0.6" dur="2.2s" repeatCount="indefinite" />
      </circle>
      <circle cx={to.x} cy={to.y} r={2.5} fill="#F2C200" />
    </g>
  )
}
