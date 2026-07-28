type IndicatorCardProps = {
  label: string;
  value: string;
  helper: string;
};

export function IndicatorCard({
  label,
  value,
  helper
}: IndicatorCardProps) {
  return (
    <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <p className="text-sm font-medium text-[var(--muted-soft)]">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{helper}</p>
    </article>
  );
}
