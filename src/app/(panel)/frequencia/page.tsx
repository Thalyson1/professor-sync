import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";

export default function FrequenciaPage() {
  return (
    <PageSection
      title="Frequência"
      description="Área pensada para facilitar o registro de presenças e faltas com foco em produtividade e simplicidade."
    >
      <EmptyState
        title="Módulo de frequência será desenvolvido posteriormente"
        description="O fluxo de registro de presença ainda não foi implementado. Nesta fase, mantemos apenas o layout-base e o espaço reservado para o módulo."
      />
    </PageSection>
  );
}
