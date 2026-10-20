export default function Loading() {
  return (
    <div className="container-x py-10" aria-busy="true" aria-live="polite">
      <div className="h-9 w-64 animate-pulse rounded-2xl bg-ink-100" />
      <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded-full bg-ink-100" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-ink-100" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
