// Portfolio ribbon — series-parity copy (recolored glass).
export default function PortfolioRibbon() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[110] glass-nav text-center text-[11px] sm:text-xs text-ink/70 py-1.5 px-4">
      <span className="text-ink font-medium">Portfolio demo</span>
      <span className="mx-1.5 text-brand">•</span>
      Not a real Company
      <span className="mx-1.5 text-brand">•</span>
      built by{' '}
      <a
        href="https://pavlov-ai.online"
        target="_blank"
        rel="noopener"
        className="text-ink font-medium underline underline-offset-2 decoration-white/30 hover:text-brand hover:decoration-brand transition-colors"
      >
        Anton Pavlov
      </a>
    </div>
  )
}
