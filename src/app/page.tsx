export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-bg flex flex-col justify-between p-6 md:p-12">
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between border-b border-neutral-border pb-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-secondary bg-secondary-subtle px-2.5 py-0.5 rounded-sm font-mono border border-secondary">
            Milestone 0 · Studio Baseline
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-neutral-text mt-2">
            Event Pilot
          </h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-muted">Design System</p>
          <p className="text-sm font-medium text-neutral-text">Panchang &amp; Utsav Almanac</p>
        </div>
      </header>

      <section className="max-w-5xl mx-auto w-full my-auto py-12">
        <div className="bg-neutral-surface border border-neutral-border rounded-lg p-8 shadow-card max-w-2xl">
          <h2 className="font-display text-2xl font-semibold text-neutral-text mb-3">
            Celebration &amp; Event Planning Studio
          </h2>
          <p className="text-neutral-text text-base leading-relaxed mb-6">
            Foundation initialized with Next.js App Router, TypeScript, Tailwind CSS, Vitest, and local issue tracking. Ready for deterministic calculation engines and AI integration in upcoming milestones.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="bg-primary hover:bg-primary-hover text-neutral-text font-semibold px-5 py-2.5 rounded-md transition-colors shadow-sm">
              Explore Workspace
            </button>
            <button className="bg-neutral-surface hover:bg-neutral-subtle text-neutral-text border border-neutral-border font-medium px-5 py-2.5 rounded-md transition-colors">
              Documentation
            </button>
          </div>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto w-full border-t border-neutral-border pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-muted gap-2">
        <p>Event Pilot · Challenge 5: Celebration &amp; Event Planner</p>
        <p className="font-mono tabular-nums">WCAG 2.1 AA Compliant · Deterministic Math Engine</p>
      </footer>
    </main>
  );
}
