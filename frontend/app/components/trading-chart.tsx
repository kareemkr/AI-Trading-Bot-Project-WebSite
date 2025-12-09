"use client"

export function TradingChart() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">

      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-3xl" />

      <svg
        className="absolute bottom-0 left-0 right-0 w-full h-[60%] opacity-30"
        viewBox="0 0 1440 500"
        preserveAspectRatio="none"
        fill="none"
      >
        <path d="M0 400 L100 380 L150 350 L200 320 L250 340 L300 280 L350 250 L400 200 L450 180"
          stroke="url(#gradient1)" strokeWidth="2" fill="none" className="animate-pulse" />

        <path d="M450 400 L500 350 L550 380 L600 320 L650 280 L700 200 L720 180 L740 220 L780 180 L820 200 L860 250 L900 280 L950 300"
          stroke="url(#gradient2)" strokeWidth="2" fill="none" className="animate-pulse" style={{ animationDelay: "0.5s" }} />

        <path d="M1000 350 L1050 300 L1100 320 L1150 280 L1200 200 L1250 150 L1300 180 L1350 150 L1400 120 L1440 100"
          stroke="url(#gradient3)" strokeWidth="2" fill="none" className="animate-pulse" style={{ animationDelay: "1s" }} />

        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>

          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>

          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="50%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute top-16 left-8 w-2 h-2 border-l border-t border-accent/40" />
      <div className="absolute top-16 right-8 w-2 h-2 border-r border-t border-accent/40" />

    </div>
  )
}
