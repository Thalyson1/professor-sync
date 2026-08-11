import { notFound } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";
import { AiPlanningWorkflow } from "@/features/planejamento/components/ai-planning-workflow";
import { getTeachingPlanById } from "@/features/planejamento/queries";

export const dynamic = "force-dynamic";

type EditAiPlanningPageProps = {
  params: Promise<{
    planoId: string;
  }>;
};

export default async function EditAiPlanningPage({
  params
}: EditAiPlanningPageProps) {
  const { planoId } = await params;
  const { data: plan, error, configured } = await getTeachingPlanById(planoId);

  if (!plan) {
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

    notFound();
  }

  return (
    <PageSection
      title="Gerar rascunho com IA"
      description="A IA cria apenas um rascunho revisável. O planejamento atual só será alterado após sua confirmação."
    >
      <AiPlanningWorkflow
        context={{
          targetPlanId: plan.id,
          teacherAssignmentId: plan.teacherAssignmentId,
          className: plan.assignment.className,
          grade: plan.assignment.grade,
          letter: plan.assignment.letter,
          course: plan.assignment.course,
          subjectName: plan.assignment.subjectName,
          componentType: plan.assignment.componentType,
          semester: plan.assignment.semester,
          schoolName: plan.assignment.schoolName,
          currentPlanStatus: plan.status
        }}
        backHref={`/planejamento/${plan.id}`}
        cancelHref={`/planejamento/${plan.id}`}
        initialValues={{
          educationBase: plan.educationBase,
          workloadHours: plan.workloadHours ? String(plan.workloadHours) : "",
          weeklyLessons: plan.weeklyLessons ? String(plan.weeklyLessons) : "",
          semester: plan.semester ?? plan.assignment.semester ?? "",
          description: plan.description ?? "",
          generalObjectives: "",
          observations: ""
        }}
      />
    </PageSection>
  );
}
