import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";

export default function AvaliacoesPage() {
  return (
    <PageSection
      title="Avaliações"
      description="Seção reservada para organização das avaliações, lançamentos e acompanhamento de pendências acadêmicas."
    >
      <EmptyState
        title="Módulo de avaliações será desenvolvido posteriormente"
        description="O produto ainda não possui formulários ou fluxos de lançamento. Este estado vazio mantém a rota pronta para receber o desenvolvimento futuro."
      />
    </PageSection>
  );
}
