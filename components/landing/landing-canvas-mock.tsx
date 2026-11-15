export function LandingCanvasMock() {
  return (
    <div className="relative min-h-85 overflow-hidden rounded-2xl border border-border bg-muted/40">
      {/* dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: "radial-gradient(circle, var(--border) 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* edges */}
      <svg aria-hidden viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d="M 16 20 C 26 20, 26 20, 38 20" fill="none" stroke="var(--border)" strokeWidth="2" />
        <path d="M 62 20 C 74 20, 74 20, 84 20" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 3" />
      </svg>

      <div className="relative flex h-full min-h-85 flex-wrap items-center justify-center gap-6 p-6 sm:gap-12">
        {/* start */}
        <div className="rounded-xl border-2 border-emerald-500/60 bg-card px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Start</p>
          <p className="mt-1 text-xs text-muted-foreground">New message</p>
        </div>

        {/* agent */}
        <div className="relative min-w-40 rounded-xl border-2 border-primary bg-card px-4 py-3 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-primary">Agent</p>
          <p className="mt-1 text-xs text-muted-foreground">Main agent</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {["Web Search", "My Custom Tool"].map((t) => (
              <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* end */}
        <div className="min-w-32 rounded-xl border-2 border-rose-500/60 bg-card px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">End</p>
          <p className="mt-1 text-xs text-muted-foreground">Response out</p>
        </div>
      </div>
    </div>
  );
}
