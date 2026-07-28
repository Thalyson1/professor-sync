import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";

export default function SincronizacaoPage() {
  return (
    <PageSection
      title="Sincronização"
      description="Área que concentrará o acompanhamento de envios e importações quando a integração oficial estiver disponível."
    >
      <EmptyState
        title="Módulo de sincronização será desenvolvido posteriormente"
        description="A interface desta etapa prepara a navegação do painel, sem integrar SIAGE ou qualquer fluxo externo neste momento."
      />
    </PageSection>
  );
}
