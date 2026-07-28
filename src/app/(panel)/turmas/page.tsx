import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";

export default function TurmasPage() {
  return (
    <PageSection
      title="Turmas"
      description="Área destinada ao acompanhamento das turmas, disciplinas e agrupamentos que farão parte da rotina do professor."
    >
      <EmptyState
        title="Módulo de turmas será desenvolvido posteriormente"
        description="Nesta etapa existe apenas o estado vazio provisório. O gerenciamento de turmas será implementado quando iniciarmos os módulos funcionais do produto."
      />
    </PageSection>
  );
}
