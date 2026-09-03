import { PageSection } from "@/components/ui/page-section";

export default function PlanejamentoHojeLoadingPage() {
  return (
    <PageSection
      title="Carregando aulas de hoje"
      description="Buscando as aulas previstas para a data atual."
    >
      <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-sm text-[var(--muted)]">
        Carregando aulas de hoje...
      </div>
    </PageSection>
  );
}
