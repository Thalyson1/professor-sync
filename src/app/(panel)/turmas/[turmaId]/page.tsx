import { notFound } from "next/navigation";

import { PageSection } from "@/components/ui/page-section";
import { TurmasDataState } from "@/features/turmas/components/turmas-data-state";
import { TurmaHeader } from "@/features/turmas/components/turma-header";
import { TurmaOverview } from "@/features/turmas/components/turma-overview";
import { TurmaPlaceholderSection } from "@/features/turmas/components/turma-placeholder-section";
import { TurmaSectionNav } from "@/features/turmas/components/turma-section-nav";
import { getTurmaDetail } from "@/features/turmas/data/queries";
import { getTurmaSection } from "@/features/turmas/utils/turmas";

export const dynamic = "force-dynamic";

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
  const { data: turma, error, configured } = await getTurmaDetail(turmaId);

  if (!turma) {
    if (error) {
      return (
        <TurmasDataState
          title={
            configured
              ? "Não foi possível carregar a turma"
              : "Supabase ainda não configurado"
          }
          description={error}
        />
      );
    }

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
            ? "Detalhes da turma"
            : "Seção em desenvolvimento"
        }
        description={
          activeSection === "visao-geral"
            ? "Dados reais da turma, disciplinas sem repetição e lista de alunos ordenada por nome."
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
