export default function PlanejamentoLoading() {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <div className="h-9 w-64 animate-pulse rounded-2xl bg-[var(--card-strong)]" />
        <div className="h-5 w-full max-w-3xl animate-pulse rounded-2xl bg-[var(--card-strong)]" />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
          >
            <div className="h-6 w-40 animate-pulse rounded-2xl bg-[var(--card-strong)]" />
            <div className="mt-4 h-4 w-64 animate-pulse rounded-2xl bg-[var(--card-strong)]" />
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((__, innerIndex) => (
                <div
                  key={innerIndex}
                  className="h-20 animate-pulse rounded-2xl bg-[var(--card-strong)]"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
