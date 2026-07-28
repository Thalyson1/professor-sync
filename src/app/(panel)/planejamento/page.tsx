import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";

export default function PlanejamentoPage() {
  return (
    <PageSection
      title="Planejamento"
      description="Espaço reservado para planos, cronogramas e organização pedagógica que serão centrais no Professor Sync."
    >
      <EmptyState
        title="Módulo de planejamento será desenvolvido posteriormente"
        description="A base visual já está pronta para receber os fluxos de plano anual, plano de ensino, plano de aula e cronograma nas próximas entregas."
      />
    </PageSection>
  );
}
