export default function TurmasLoading() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--card)]" />
      <div className="grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--card)]"
          />
        ))}
      </div>
    </div>
  );
}
