import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-bg text-neutral-text flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-neutral-surface border border-neutral-border rounded-lg p-8 shadow-card">
        <span className="inline-block px-3 py-1 bg-secondary-subtle text-secondary font-mono text-xs rounded-full uppercase tracking-wider mb-4">
          404 Not Found
        </span>
        <h1 className="font-display text-3xl font-semibold text-neutral-text mb-3">
          Folio Entry Not Found
        </h1>
        <p className="font-sans text-sm text-neutral-muted mb-6 leading-relaxed">
          The requested ledger page or almanac folio could not be found. Please return to the event studio dashboard.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-neutral-text hover:bg-primary-hover hover:text-white rounded-md font-sans text-sm font-semibold transition-colors"
        >
          Return to Almanac Studio
        </Link>
      </div>
    </div>
  );
}
