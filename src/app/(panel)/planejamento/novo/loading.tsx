import { PageSection } from "@/components/ui/page-section";

export default function NovoPlanejamentoLoading() {
  return (
    <PageSection
      title="Novo planejamento"
      description="Carregando atribuições e formulário do plano semestral."
    >
      <div className="h-96 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--card)]" />
    </PageSection>
  );
}
