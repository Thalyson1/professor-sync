import { notFound } from "next/navigation";

import { PageSection } from "@/components/ui/page-section";
import { TurmaHeader } from "@/features/turmas/components/turma-header";
import { TurmaOverview } from "@/features/turmas/components/turma-overview";
import { TurmaPlaceholderSection } from "@/features/turmas/components/turma-placeholder-section";
import { TurmaSectionNav } from "@/features/turmas/components/turma-section-nav";
import {
  getTurmaById,
  getTurmaSection
} from "@/features/turmas/utils/turmas";

type TurmaDetailPageProps = {
  params: Promise<{
    turmaId: string;
  }>;
  searchParams: Promise<{
    sec?: string;
  }>;
};

export default async function TurmaDetailPage({
  params,
  searchParams
}: TurmaDetailPageProps) {
  const { turmaId } = await params;
  const { sec } = await searchParams;
  const turma = getTurmaById(turmaId);

  if (!turma) {
    notFound();
  }

  const activeSection = getTurmaSection(sec);

  return (
    <div className="space-y-6">
      <TurmaHeader turma={turma} />
      <TurmaSectionNav turmaId={turma.id} activeSection={activeSection} />
      <PageSection
        title={
          activeSection === "visao-geral"
            ? "Visão geral da turma"
            : "Seção em desenvolvimento"
        }
        description={
          activeSection === "visao-geral"
            ? "Resumo inicial da rotina da turma com indicadores simulados e próximas aulas planejadas."
            : "Esta área do diário já está preparada para navegação, mas o conteúdo funcional será desenvolvido em etapas futuras."
        }
      >
        {activeSection === "visao-geral" ? (
          <TurmaOverview turma={turma} />
        ) : (
          <TurmaPlaceholderSection section={activeSection} />
        )}
      </PageSection>
    </div>
  );
}
