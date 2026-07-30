import { PageSection } from "@/components/ui/page-section";

export default function TurmasLoading() {
  return (
    <PageSection
      title="Minhas turmas"
      description="Carregando turmas importadas do SIAGE."
    >
      <div className="grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--card)]"
          />
        ))}
      </div>
    </PageSection>
  );
}
