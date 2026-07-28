import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";

export default function ConfiguracoesPage() {
  return (
    <PageSection
      title="Configurações"
      description="Página destinada a preferências da aplicação, personalizações e ajustes gerais do ambiente de trabalho."
    >
      <EmptyState
        title="Módulo de configurações será desenvolvido posteriormente"
        description="Os ajustes de conta, preferências e opções administrativas ainda serão definidos. Por enquanto, a rota permanece pronta para evolução."
      />
    </PageSection>
  );
}
