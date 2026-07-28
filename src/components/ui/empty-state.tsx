type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
      <div className="inline-flex rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
        Em breve
      </div>
      <h3 className="mt-5 text-xl font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
        {description}
      </p>
    </section>
  );
}
