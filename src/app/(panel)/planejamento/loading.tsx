import { PageSection } from "@/components/ui/page-section";

export default function PlanejamentoLoading() {
  return (
    <PageSection
      title="Planejamento"
      description="Carregando atribuições reais e planos semestrais."
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
