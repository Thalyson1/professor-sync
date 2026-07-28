import type { ReactNode } from "react";

type PageSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function PageSection({
  title,
  description,
  children
}: PageSectionProps) {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}
