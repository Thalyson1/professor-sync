import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";
import {
  createPlannedLessonAction,
  createPlanUnitAction,
  deletePlannedLessonAction,
  deletePlanUnitAction,
  deleteTeachingPlanAction,
  movePlannedLessonAction,
  movePlanUnitAction,
  updatePlannedLessonAction,
  updatePlanUnitAction,
  updateTeachingPlanAction
} from "@/features/planejamento/actions";
import { ActionNotice } from "@/features/planejamento/components/action-notice";
import { ConfirmSubmitButton } from "@/features/planejamento/components/confirm-submit-button";
import {
  EDUCATION_BASE_OPTIONS,
  PLANNED_LESSON_STATUS_OPTIONS,
  SIAGE_METHODOLOGIES,
  TEACHING_PLAN_STATUS_OPTIONS
} from "@/features/planejamento/constants";
import { getTeachingPlanById } from "@/features/planejamento/queries";
import {
  getEducationBaseLabel,
  getPlannedLessonStatusLabel,
  getTeachingPlanStatusLabel
} from "@/features/planejamento/utils/status-rules";
import { FormSubmitButton } from "@/features/turmas/components/form-submit-button";

export const dynamic = "force-dynamic";

type PlanoEditorPageProps = {
  params: Promise<{
    planoId: string;
  }>;
  searchParams: Promise<{
    notice?: string;
    error?: string;
  }>;
};

export default async function PlanoEditorPage({
  params,
  searchParams
}: PlanoEditorPageProps) {
  const { planoId } = await params;
  const resolvedSearchParams = await searchParams;
  const { data: plan, error, configured } = await getTeachingPlanById(planoId);

  if (!plan) {
    if (error) {
      return (
        <PageSection
          title={configured ? "Não foi possível carregar o planejamento" : "Supabase ainda não configurado"}
          description={error}
        >
          <EmptyState title="Planejamento indisponível" description={error} />
        </PageSection>
      );
    }

    notFound();
  }

  return (
    <PageSection
      title={plan.title}
      description="Edite as informações gerais, organize as unidades e mantenha as aulas planejadas com dados reais do banco."
    >
      <ActionNotice
        status={resolvedSearchParams.notice}
        error={resolvedSearchParams.error}
      />

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                {getTeachingPlanStatusLabel(plan.status)}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                {plan.assignment.grade}
                {plan.assignment.letter ? ` ${plan.assignment.letter}` : ""}
                {" · "}
                {plan.semester ?? plan.assignment.semester ?? "Sem semestre"}
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              {plan.title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {plan.assignment.subjectName} · {plan.assignment.className}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/planejamento"
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              Voltar
            </Link>
            <Link
              href={`/planejamento/${plan.id}/ia`}
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              Gerar com IA
            </Link>
            <button
              type="submit"
              form="plan-general-form"
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              Salvar
            </button>
            <form action={deleteTeachingPlanAction}>
              <input type="hidden" name="planId" value={plan.id} />
              <ConfirmSubmitButton
                confirmMessage="Deseja arquivar este planejamento? Ele continuará disponível apenas para consulta."
                idleLabel="Arquivar"
                pendingLabel="Arquivando..."
              />
            </form>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoItem label="Turma" value={plan.assignment.className} />
        <InfoItem label="Disciplina" value={plan.assignment.subjectName} />
        <InfoItem label="Base" value={getEducationBaseLabel(plan.educationBase)} />
        <InfoItem label="Aulas planejadas" value={String(plan.lessons.length)} />
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          Informações gerais
        </h2>

        <form
          id="plan-general-form"
          action={updateTeachingPlanAction}
          className="mt-5 grid gap-4 lg:grid-cols-2"
        >
          <input type="hidden" name="planId" value={plan.id} />

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Título</span>
            <input required name="title" defaultValue={plan.title} className={inputClassName} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Status</span>
            <select name="status" defaultValue={plan.status} className={inputClassName}>
              {TEACHING_PLAN_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Base educacional</span>
            <select
              name="educationBase"
              defaultValue={plan.educationBase}
              className={inputClassName}
            >
              {EDUCATION_BASE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Semestre</span>
            <input
              required
              name="semester"
              defaultValue={plan.semester ?? ""}
              className={inputClassName}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Carga horária</span>
            <input
              required
              type="number"
              min="1"
              name="workloadHours"
              defaultValue={plan.workloadHours ?? ""}
              className={inputClassName}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Aulas semanais</span>
            <input
              required
              type="number"
              min="1"
              name="weeklyLessons"
              defaultValue={plan.weeklyLessons ?? ""}
              className={inputClassName}
            />
          </label>

          <label className="flex flex-col gap-2 lg:col-span-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Descrição</span>
            <textarea
              name="description"
              rows={5}
              defaultValue={plan.description ?? ""}
              className={textareaClassName}
            />
          </label>
        </form>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Unidades</h2>

        <form action={createPlanUnitAction} className="mt-5 grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="planId" value={plan.id} />
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Título da unidade</span>
            <input required name="title" className={inputClassName} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Descrição</span>
            <input name="description" className={inputClassName} />
          </label>
          <div className="lg:col-span-2">
            <FormSubmitButton
              idleLabel="Adicionar unidade"
              pendingLabel="Adicionando unidade..."
            />
          </div>
        </form>

        {plan.units.length > 0 ? (
          <div className="mt-6 space-y-4">
            {plan.units.map((unit) => (
              <article
                key={unit.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    Unidade {unit.position + 1}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <form action={movePlanUnitAction}>
                      <input type="hidden" name="planId" value={plan.id} />
                      <input type="hidden" name="unitId" value={unit.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button type="submit" className={ghostButtonClassName}>
                        Subir
                      </button>
                    </form>
                    <form action={movePlanUnitAction}>
                      <input type="hidden" name="planId" value={plan.id} />
                      <input type="hidden" name="unitId" value={unit.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button type="submit" className={ghostButtonClassName}>
                        Descer
                      </button>
                    </form>
                  </div>
                </div>

                <form
                  action={updatePlanUnitAction}
                  className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]"
                >
                  <input type="hidden" name="planId" value={plan.id} />
                  <input type="hidden" name="unitId" value={unit.id} />
                  <div className="grid gap-4">
                    <input
                      required
                      name="title"
                      defaultValue={unit.title}
                      className={inputClassName}
                    />
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={unit.description ?? ""}
                      className={textareaClassName}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <FormSubmitButton
                      idleLabel="Salvar unidade"
                      pendingLabel="Salvando..."
                    />
                  </div>
                </form>
                <form action={deletePlanUnitAction} className="mt-3">
                  <input type="hidden" name="planId" value={plan.id} />
                  <input type="hidden" name="unitId" value={unit.id} />
                  <ConfirmSubmitButton
                    confirmMessage="Deseja excluir esta unidade?"
                    idleLabel="Excluir unidade"
                    pendingLabel="Excluindo..."
                  />
                </form>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="Nenhuma unidade criada"
              description="Adicione unidades para estruturar o semestre por blocos de conteúdo."
            />
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Aulas planejadas</h2>

        <form action={createPlannedLessonAction} className="mt-5 grid gap-4 xl:grid-cols-2">
          <input type="hidden" name="planId" value={plan.id} />

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Número da aula</span>
            <input
              required
              type="number"
              min="1"
              name="lessonNumber"
              defaultValue={plan.lessons.length + 1}
              className={inputClassName}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Título da aula</span>
            <input required name="title" className={inputClassName} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Unidade</span>
            <select name="planUnitId" className={inputClassName} defaultValue="">
              <option value="">Sem unidade</option>
              {plan.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  Unidade {unit.position + 1} · {unit.title}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Metodologia</span>
            <select name="methodology" defaultValue="" className={inputClassName}>
              <option value="">Selecione</option>
              {SIAGE_METHODOLOGIES.map((methodology) => (
                <option key={methodology} value={methodology}>
                  {methodology}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Objetos de conhecimento</span>
            <textarea name="knowledgeObjects" rows={3} className={textareaClassName} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Objetivos</span>
            <textarea name="objectives" rows={3} className={textareaClassName} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Modelo de observação</span>
            <textarea name="observationsTemplate" rows={3} className={textareaClassName} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Data prevista</span>
            <input type="date" name="plannedDate" className={inputClassName} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Quantidade de tempos</span>
            <input
              required
              type="number"
              min="1"
              name="durationLessons"
              defaultValue="1"
              className={inputClassName}
            />
          </label>

          <div className="xl:col-span-2">
            <FormSubmitButton
              idleLabel="Adicionar aula"
              pendingLabel="Adicionando aula..."
            />
          </div>
        </form>

        {plan.lessons.length > 0 ? (
          <div className="mt-6 space-y-4">
            {plan.lessons.map((lesson) => (
              <article
                key={lesson.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      Aula {lesson.lessonNumber} · {lesson.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {getPlannedLessonStatusLabel(lesson.status)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={movePlannedLessonAction}>
                      <input type="hidden" name="planId" value={plan.id} />
                      <input type="hidden" name="lessonId" value={lesson.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button type="submit" className={ghostButtonClassName}>
                        Subir
                      </button>
                    </form>
                    <form action={movePlannedLessonAction}>
                      <input type="hidden" name="planId" value={plan.id} />
                      <input type="hidden" name="lessonId" value={lesson.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button type="submit" className={ghostButtonClassName}>
                        Descer
                      </button>
                    </form>
                  </div>
                </div>

                <form
                  action={updatePlannedLessonAction}
                  className="mt-4 grid gap-4 xl:grid-cols-2"
                >
                  <input type="hidden" name="planId" value={plan.id} />
                  <input type="hidden" name="lessonId" value={lesson.id} />

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">Número da aula</span>
                    <input
                      required
                      type="number"
                      min="1"
                      name="lessonNumber"
                      defaultValue={lesson.lessonNumber}
                      className={inputClassName}
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">Título</span>
                    <input required name="title" defaultValue={lesson.title} className={inputClassName} />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">Unidade</span>
                    <select
                      name="planUnitId"
                      defaultValue={lesson.planUnitId ?? ""}
                      className={inputClassName}
                    >
                      <option value="">Sem unidade</option>
                      {plan.units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          Unidade {unit.position + 1} · {unit.title}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">Metodologia</span>
                    <select
                      name="methodology"
                      defaultValue={lesson.methodology ?? ""}
                      className={inputClassName}
                    >
                      <option value="">Selecione</option>
                      {SIAGE_METHODOLOGIES.map((methodology) => (
                        <option key={methodology} value={methodology}>
                          {methodology}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">Objetos de conhecimento</span>
                    <textarea
                      name="knowledgeObjects"
                      rows={3}
                      defaultValue={lesson.knowledgeObjects ?? ""}
                      className={textareaClassName}
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">Objetivos</span>
                    <textarea
                      name="objectives"
                      rows={3}
                      defaultValue={lesson.objectives ?? ""}
                      className={textareaClassName}
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">Modelo de observação</span>
                    <textarea
                      name="observationsTemplate"
                      rows={3}
                      defaultValue={lesson.observationsTemplate ?? ""}
                      className={textareaClassName}
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">Data prevista</span>
                    <input
                      type="date"
                      name="plannedDate"
                      defaultValue={lesson.plannedDate ?? ""}
                      className={inputClassName}
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">Quantidade de tempos</span>
                    <input
                      required
                      type="number"
                      min="1"
                      name="durationLessons"
                      defaultValue={lesson.durationLessons}
                      className={inputClassName}
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">Status</span>
                    <select
                      name="status"
                      defaultValue={lesson.status}
                      className={inputClassName}
                    >
                      {PLANNED_LESSON_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="xl:col-span-2">
                    <FormSubmitButton
                      idleLabel="Salvar aula"
                      pendingLabel="Salvando aula..."
                    />
                  </div>
                </form>
                <form action={deletePlannedLessonAction} className="mt-3">
                  <input type="hidden" name="planId" value={plan.id} />
                  <input type="hidden" name="lessonId" value={lesson.id} />
                  <ConfirmSubmitButton
                    confirmMessage="Deseja excluir esta aula planejada?"
                    idleLabel="Excluir aula"
                    pendingLabel="Excluindo..."
                  />
                </form>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="Nenhuma aula planejada"
              description="Adicione aulas para começar a estruturar o semestre desta atribuição."
            />
          </div>
        )}
      </section>
    </PageSection>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted-soft)]">
        {label}
      </p>
      <p className="mt-2 text-sm text-[var(--foreground)]">{value}</p>
    </div>
  );
}

const inputClassName =
  "h-12 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]";

const textareaClassName =
  "min-h-28 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]";

const ghostButtonClassName =
  "inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]";
