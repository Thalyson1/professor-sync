import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";
import { createTeachingPlanAction } from "@/features/planejamento/actions";
import { ActionNotice } from "@/features/planejamento/components/action-notice";
import { EDUCATION_BASE_OPTIONS } from "@/features/planejamento/constants";
import { listTeachingPlanAssignments } from "@/features/planejamento/queries";
import { FormSubmitButton } from "@/features/turmas/components/form-submit-button";

export const dynamic = "force-dynamic";

type NovoPlanejamentoPageProps = {
  searchParams: Promise<{
    atribuicao?: string;
    error?: string;
    notice?: string;
  }>;
};

export default async function NovoPlanejamentoPage({
  searchParams
}: NovoPlanejamentoPageProps) {
  const params = await searchParams;
  const { data: assignments, error, configured } = await listTeachingPlanAssignments();
  const selectedAssignment =
    assignments.find((option) => option.assignmentId === (params.atribuicao ?? "")) ??
    assignments[0];

  return (
    <PageSection
      title="Novo planejamento"
      description="Crie um planejamento em rascunho vinculado a uma `teacher_assignment` real do professor."
    >
      <div className="flex flex-wrap gap-3">
        <Link
          href="/planejamento"
          className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          Voltar para planejamento
        </Link>
      </div>

      <ActionNotice status={params.notice} error={params.error} />

      {error ? (
        <EmptyState
          title={
            configured
              ? "Não foi possível carregar as atribuições"
              : "Supabase ainda não configurado"
          }
          description={error}
        />
      ) : assignments.length === 0 ? (
        <EmptyState
          title="Nenhuma atribuição disponível"
          description="As atribuições reais do professor precisam existir no banco antes da criação do planejamento."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
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
                  required
                >
                  {assignments.map((assignment) => (
                    <option key={assignment.assignmentId} value={assignment.assignmentId}>
                      {formatAssignmentLabel(assignment)}
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
                      ? `Planejamento ${selectedAssignment.subjectName} - ${selectedAssignment.semester ?? "Sem semestre"}`
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

          <aside className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Atribuição selecionada
            </h2>

            {selectedAssignment ? (
              <dl className="mt-4 space-y-4">
                <DetailItem label="Turma" value={selectedAssignment.className} />
                <DetailItem
                  label="Série"
                  value={`${selectedAssignment.grade}${selectedAssignment.letter ? ` ${selectedAssignment.letter}` : ""}`}
                />
                <DetailItem label="Disciplina" value={selectedAssignment.subjectName} />
                <DetailItem label="Curso" value={selectedAssignment.course} />
                <DetailItem
                  label="Semestre"
                  value={selectedAssignment.semester ?? "Não informado"}
                />
              </dl>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                Selecione uma atribuição real para iniciar o planejamento.
              </p>
            )}
          </aside>
        </div>
      )}
    </PageSection>
  );
}

function formatAssignmentLabel(
  assignment: Awaited<ReturnType<typeof listTeachingPlanAssignments>>["data"][number]
) {
  return `${assignment.grade}${assignment.letter ? ` ${assignment.letter}` : ""} · ${assignment.className} · ${assignment.subjectName} · ${assignment.course} · ${assignment.semester ?? "Sem semestre"}`;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted-soft)]">
        {label}
      </dt>
      <dd className="mt-2 text-sm text-[var(--foreground)]">{value}</dd>
    </div>
  );
}

const inputClassName =
  "h-12 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]";

const textareaClassName =
  "min-h-32 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]";
