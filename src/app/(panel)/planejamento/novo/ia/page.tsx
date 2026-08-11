import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";
import { AiPlanningWorkflow } from "@/features/planejamento/components/ai-planning-workflow";
import { listTeachingPlanAssignments } from "@/features/planejamento/queries";

export const dynamic = "force-dynamic";

type NewAiPlanningPageProps = {
  searchParams: Promise<{
    atribuicao?: string;
    error?: string;
  }>;
};

export default async function NewAiPlanningPage({
  searchParams
}: NewAiPlanningPageProps) {
  const params = await searchParams;
  const { data: assignments, error, configured } = await listTeachingPlanAssignments();
  const assignment =
    assignments.find((item) => item.assignmentId === (params.atribuicao ?? "")) ??
    assignments[0];

  if (error) {
    return (
      <PageSection
        title={configured ? "IA indisponível" : "Supabase ainda não configurado"}
        description={error}
      >
        <EmptyState title="Não foi possível iniciar a geração" description={error} />
      </PageSection>
    );
  }

  if (!assignment) {
    return (
      <PageSection
        title="Nenhuma atribuição disponível"
        description="Escolha uma atribuição real antes de gerar um planejamento com IA."
      >
        <EmptyState
          title="Atribuição não encontrada"
          description="Volte para a criação manual e selecione uma atribuição válida."
        />
        <Link
          href="/planejamento/novo"
          className="inline-flex items-center justify-center rounded-2xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Voltar para Novo Planejamento
        </Link>
      </PageSection>
    );
  }

  return (
    <PageSection
      title="Gerar planejamento com IA"
      description="Revise o rascunho antes de salvar. Nada será enviado ao SIAGE nesta etapa."
    >
      <AiPlanningWorkflow
        context={{
          targetPlanId: null,
          teacherAssignmentId: assignment.assignmentId,
          className: assignment.className,
          grade: assignment.grade,
          letter: assignment.letter,
          course: assignment.course,
          subjectName: assignment.subjectName,
          componentType: assignment.componentType,
          semester: assignment.semester,
          schoolName: assignment.schoolName,
          currentPlanStatus: "draft"
        }}
        backHref="/planejamento/novo"
        cancelHref="/planejamento/novo"
        initialValues={{
          educationBase: "technical",
          workloadHours: "",
          weeklyLessons: "",
          semester: assignment.semester ?? "",
          description: "",
          generalObjectives: "",
          observations: ""
        }}
      />
    </PageSection>
  );
}
