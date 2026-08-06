import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";
import { createTeachingPlanAction } from "@/features/planejamento/actions";
import { ActionNotice } from "@/features/planejamento/components/action-notice";
import { EDUCATION_BASE_OPTIONS } from "@/features/planejamento/constants";
import { getPlanningAssignments } from "@/features/planejamento/data/queries";
import { FormSubmitButton } from "@/features/turmas/components/form-submit-button";

export const dynamic = "force-dynamic";

type NovoPlanejamentoPageProps = {
  searchParams: Promise<{
    atribuicao?: string;
    error?: string;
  }>;
};

export default async function NovoPlanejamentoPage({
  searchParams
}: NovoPlanejamentoPageProps) {
  const params = await searchParams;
  const { data, error, configured } = await getPlanningAssignments({
    serie: "",
    disciplina: "",
    semestre: "",
    status: "",
    base: ""
  });

  const selectedAssignment =
    data.assignmentOptions.find(
      (option) => option.assignmentId === (params.atribuicao ?? "")
    ) ?? data.assignmentOptions[0];

  return (
    <PageSection
      title="Novo planejamento"
      description="Crie um rascunho semestral vinculado a uma atribuição real do professor, sem escrever ainda no SIAGE."
    >
      <div className="flex flex-wrap gap-3">
        <Link
          href="/planejamento"
          className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          Voltar para planejamento
        </Link>
      </div>

      <ActionNotice error={params.error} />

      {error ? (
        <EmptyState
          title={
            configured
              ? "Não foi possível carregar as atribuições"
              : "Supabase ainda não configurado"
          }
          description={error}
        />
      ) : data.assignmentOptions.length === 0 ? (
        <EmptyState
          title="Nenhuma atribuição disponível"
          description="As atribuições reais do professor precisam existir no banco antes da criação do planejamento."
        />
      ) : (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <form action={createTeachingPlanAction} className="grid gap-4 lg:grid-cols-2">
            <label className="flex flex-col gap-2 lg:col-span-2">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Atribuição
              </span>
              <select
                name="teacherAssignmentId"
                defaultValue={selectedAssignment?.assignmentId}
                className={inputClassName}
              >
                {data.assignmentOptions.map((option) => (
                  <option key={option.assignmentId} value={option.assignmentId}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Título
              </span>
              <input
                required
                name="title"
                defaultValue={
                  selectedAssignment
                    ? `Planejamento ${selectedAssignment.disciplinaNome} - ${selectedAssignment.semester}`
                    : ""
                }
                className={inputClassName}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Base educacional
              </span>
              <select name="educationBase" defaultValue="technical" className={inputClassName}>
                {EDUCATION_BASE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Carga horária
              </span>
              <input
                required
                type="number"
                min="1"
                name="workloadHours"
                defaultValue="40"
                className={inputClassName}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Aulas semanais
              </span>
              <input
                required
                type="number"
                min="1"
                name="weeklyLessons"
                defaultValue="2"
                className={inputClassName}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Semestre
              </span>
              <input
                required
                name="semester"
                defaultValue={selectedAssignment?.semester ?? ""}
                className={inputClassName}
              />
            </label>

            <label className="flex flex-col gap-2 lg:col-span-2">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Descrição
              </span>
              <textarea
                name="description"
                rows={5}
                className={textareaClassName}
                placeholder="Descreva o foco geral do planejamento semestral."
              />
            </label>

            <div className="lg:col-span-2">
              <FormSubmitButton
                idleLabel="Salvar como rascunho"
                pendingLabel="Salvando rascunho..."
              />
            </div>
          </form>
        </section>
      )}
    </PageSection>
  );
}

const inputClassName =
  "h-12 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]";

const textareaClassName =
  "min-h-32 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]";
