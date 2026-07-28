import { IndicatorCard } from "@/components/ui/indicator-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";

const dashboardCards = [
  {
    label: "Turmas ativas",
    value: "06",
    helper: "Quantidade provisória para representar as turmas do semestre."
  },
  {
    label: "Aulas pendentes",
    value: "12",
    helper: "Aulas que futuramente exigirão revisão, registro ou confirmação."
  },
  {
    label: "Frequências pendentes",
    value: "08",
    helper: "Registros de presença que ainda serão tratados no módulo próprio."
  },
  {
    label: "Sincronizações pendentes",
    value: "03",
    helper: "Itens aguardando envio quando a integração oficial estiver pronta."
  }
];

export default function DashboardPage() {
  return (
    <PageSection
      title="Visão geral"
      description="Acompanhe um resumo inicial da rotina docente e os módulos que formarão o fluxo principal do Professor Sync."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card) => (
          <IndicatorCard
            key={card.label}
            label={card.label}
            value={card.value}
            helper={card.helper}
          />
        ))}
      </div>

      <EmptyState
        title="Dashboard em construção"
        description="Os indicadores reais, alertas e resumos operacionais serão conectados nas próximas etapas. Por enquanto, esta área apresenta apenas a estrutura base de navegação do painel."
      />
    </PageSection>
  );
}
