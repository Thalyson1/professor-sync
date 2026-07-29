export default function TurmaDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="h-64 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--card)]" />
      <div className="h-20 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--card)]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--card)]"
          />
        ))}
      </div>
    </div>
  );
}
