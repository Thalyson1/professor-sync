"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  applyGeneratedTeachingPlanAction,
  generateTeachingPlanWithAiAction
} from "../actions";
import { FormSubmitButton } from "@/features/turmas/components/form-submit-button";

import type { AiGenerationActionState, AiPlanningContext, AiPlanningDraft } from "../ai/types";
import type { EducationBase } from "../types";

type AiPlanningWorkflowProps = {
  context: AiPlanningContext;
  backHref: string;
  cancelHref: string;
  initialValues: {
    educationBase: EducationBase;
    workloadHours: string;
    weeklyLessons: string;
    semester: string;
    description: string;
    generalObjectives: string;
    observations: string;
  };
};

const initialState: AiGenerationActionState = {
  success: false,
  message: null,
  provider: null,
  draft: null
};

export function AiPlanningWorkflow({
  context,
  backHref,
  cancelHref,
  initialValues
}: AiPlanningWorkflowProps) {
  const [state, formAction] = useActionState(generateTeachingPlanWithAiAction, initialState);
  const [promptValues, setPromptValues] = useState(initialValues);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <form
          id="ai-generate-form"
          action={formAction}
          className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm"
        >
          <input type="hidden" name="targetPlanId" value={context.targetPlanId ?? ""} />
          <input type="hidden" name="teacherAssignmentId" value={context.teacherAssignmentId} />
          <input type="hidden" name="className" value={context.className} />
          <input type="hidden" name="grade" value={context.grade} />
          <input type="hidden" name="letter" value={context.letter ?? ""} />
          <input type="hidden" name="course" value={context.course} />
          <input type="hidden" name="subjectName" value={context.subjectName} />
          <input type="hidden" name="componentType" value={context.componentType ?? ""} />
          <input type="hidden" name="assignmentSemester" value={context.semester ?? ""} />
          <input type="hidden" name="schoolName" value={context.schoolName} />
          <input type="hidden" name="currentPlanStatus" value={context.currentPlanStatus ?? ""} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                Gerar com IA
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                A IA monta apenas um rascunho. Revise tudo antes de aplicar ao planejamento.
              </p>
            </div>
            <Link
              href={backHref}
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              Voltar
            </Link>
          </div>

          {state.message ? (
            <p
              className={`mt-5 rounded-2xl px-4 py-3 text-sm ${
                state.success
                  ? "border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "border border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
              }`}
            >
              {state.message}
            </p>
          ) : null}

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">Base educacional</span>
              <select
                name="educationBase"
                value={promptValues.educationBase}
                onChange={(event) =>
                  setPromptValues((current) => ({
                    ...current,
                    educationBase: event.target.value as EducationBase
                  }))
                }
                className={inputClassName}
              >
                <option value="technical">Técnica</option>
                <option value="bncc">BNCC</option>
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">Semestre</span>
              <input
                name="semester"
                value={promptValues.semester}
                onChange={(event) =>
                  setPromptValues((current) => ({
                    ...current,
                    semester: event.target.value
                  }))
                }
                className={inputClassName}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">Carga horária</span>
              <input
                name="workloadHours"
                type="number"
                min="1"
                value={promptValues.workloadHours}
                onChange={(event) =>
                  setPromptValues((current) => ({
                    ...current,
                    workloadHours: event.target.value
                  }))
                }
                className={inputClassName}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">Aulas semanais</span>
              <input
                name="weeklyLessons"
                type="number"
                min="1"
                value={promptValues.weeklyLessons}
                onChange={(event) =>
                  setPromptValues((current) => ({
                    ...current,
                    weeklyLessons: event.target.value
                  }))
                }
                className={inputClassName}
              />
            </label>

            <label className="flex flex-col gap-2 lg:col-span-2">
              <span className="text-sm font-medium text-[var(--foreground)]">Descrição / ementa / diretrizes</span>
              <textarea
                name="description"
                rows={6}
                value={promptValues.description}
                onChange={(event) =>
                  setPromptValues((current) => ({
                    ...current,
                    description: event.target.value
                  }))
                }
                className={textareaClassName}
                placeholder="Descreva a ementa, as diretrizes e o foco pedagógico para a IA."
              />
            </label>

            <label className="flex flex-col gap-2 lg:col-span-2">
              <span className="text-sm font-medium text-[var(--foreground)]">Objetivos gerais opcionais</span>
              <textarea
                name="generalObjectives"
                rows={4}
                value={promptValues.generalObjectives}
                onChange={(event) =>
                  setPromptValues((current) => ({
                    ...current,
                    generalObjectives: event.target.value
                  }))
                }
                className={textareaClassName}
                placeholder="Um objetivo por linha."
              />
            </label>

            <label className="flex flex-col gap-2 lg:col-span-2">
              <span className="text-sm font-medium text-[var(--foreground)]">Observações adicionais</span>
              <textarea
                name="observations"
                rows={4}
                value={promptValues.observations}
                onChange={(event) =>
                  setPromptValues((current) => ({
                    ...current,
                    observations: event.target.value
                  }))
                }
                className={textareaClassName}
                placeholder="Inclua restrições, preferências metodológicas ou habilidades BNCC já fornecidas."
              />
            </label>

            <div className="lg:col-span-2 flex flex-wrap gap-3">
              <FormSubmitButton
                idleLabel="Gerar com IA"
                pendingLabel="Gerando rascunho..."
              />
              <Link
                href={cancelHref}
                className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                Cancelar
              </Link>
            </div>
          </div>
        </form>

        <aside className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Contexto enviado Ã  IA
          </h2>
          <dl className="mt-4 space-y-4">
            <DetailItem label="Turma" value={context.className} />
            <DetailItem
              label="Série"
              value={`${context.grade}${context.letter ? ` ${context.letter}` : ""}`}
            />
            <DetailItem label="Disciplina" value={context.subjectName} />
            <DetailItem label="Curso" value={context.course} />
            <DetailItem label="Escola" value={context.schoolName} />
            <DetailItem label="Semestre" value={context.semester ?? "Não informado"} />
          </dl>
        </aside>
      </section>

      {state.draft ? (
        <DraftReviewSection
          key={JSON.stringify(state.draft)}
          draft={state.draft}
          provider={state.provider}
          context={context}
          promptValues={promptValues}
          cancelHref={cancelHref}
        />
      ) : null}
    </div>
  );
}

function DraftReviewSection({
  draft,
  provider,
  context,
  promptValues,
  cancelHref
}: {
  draft: AiPlanningDraft;
  provider: AiGenerationActionState["provider"];
  context: AiPlanningContext;
  promptValues: AiPlanningWorkflowProps["initialValues"];
  cancelHref: string;
}) {
  const [editableDraft, setEditableDraft] = useState(draft);

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Revisão do rascunho
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Edite o que for necessário antes de aplicar. Nada é salvo automaticamente.
          </p>
        </div>
        <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          Provider: {provider ?? "desconhecido"}
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-2 lg:col-span-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Título</span>
          <input
            value={editableDraft.title}
            onChange={(event) =>
              setEditableDraft((current) => ({
                ...current,
                title: event.target.value
              }))
            }
            className={inputClassName}
          />
        </label>

        <label className="flex flex-col gap-2 lg:col-span-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Descrição</span>
          <textarea
            rows={5}
            value={editableDraft.description}
            onChange={(event) =>
              setEditableDraft((current) => ({
                ...current,
                description: event.target.value
              }))
            }
            className={textareaClassName}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Objetivos gerais</span>
          <textarea
            rows={5}
            value={editableDraft.generalObjectives.join("\n")}
            onChange={(event) =>
              setEditableDraft((current) => ({
                ...current,
                generalObjectives: splitLines(event.target.value)
              }))
            }
            className={textareaClassName}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Estratégias de avaliação</span>
          <textarea
            rows={5}
            value={editableDraft.assessmentStrategies.join("\n")}
            onChange={(event) =>
              setEditableDraft((current) => ({
                ...current,
                assessmentStrategies: splitLines(event.target.value)
              }))
            }
            className={textareaClassName}
          />
        </label>
      </div>

      <div className="mt-6 space-y-6">
        {editableDraft.units.map((unit, unitIndex) => (
          <article
            key={`${unit.position}-${unitIndex}`}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] p-4"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">Título da unidade</span>
                <input
                  value={unit.title}
                  onChange={(event) =>
                    setEditableDraft((current) =>
                      updateUnitField(current, unitIndex, "title", event.target.value)
                    )
                  }
                  className={inputClassName}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]">Posição</span>
                <input
                  type="number"
                  min="0"
                  value={unit.position}
                  onChange={(event) =>
                    setEditableDraft((current) =>
                      updateUnitField(
                        current,
                        unitIndex,
                        "position",
                        Number(event.target.value)
                      )
                    )
                  }
                  className={inputClassName}
                />
              </label>

              <label className="flex flex-col gap-2 lg:col-span-2">
                <span className="text-sm font-medium text-[var(--foreground)]">Descrição da unidade</span>
                <textarea
                  rows={3}
                  value={unit.description}
                  onChange={(event) =>
                    setEditableDraft((current) =>
                      updateUnitField(current, unitIndex, "description", event.target.value)
                    )
                  }
                  className={textareaClassName}
                />
              </label>
            </div>

            <div className="mt-5 space-y-4">
              {unit.lessons.map((lesson, lessonIndex) => (
                <div
                  key={`${lesson.position}-${lesson.lessonNumber}-${lessonIndex}`}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
                >
                  <div className="grid gap-4 xl:grid-cols-2">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">Número da aula</span>
                      <input
                        type="number"
                        min="1"
                        value={lesson.lessonNumber}
                        onChange={(event) =>
                          setEditableDraft((current) =>
                            updateLessonField(
                              current,
                              unitIndex,
                              lessonIndex,
                              "lessonNumber",
                              Number(event.target.value)
                            )
                          )
                        }
                        className={inputClassName}
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">Posição</span>
                      <input
                        type="number"
                        min="0"
                        value={lesson.position}
                        onChange={(event) =>
                          setEditableDraft((current) =>
                            updateLessonField(
                              current,
                              unitIndex,
                              lessonIndex,
                              "position",
                              Number(event.target.value)
                            )
                          )
                        }
                        className={inputClassName}
                      />
                    </label>

                    <label className="flex flex-col gap-2 xl:col-span-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">Título</span>
                      <input
                        value={lesson.title}
                        onChange={(event) =>
                          setEditableDraft((current) =>
                            updateLessonField(
                              current,
                              unitIndex,
                              lessonIndex,
                              "title",
                              event.target.value
                            )
                          )
                        }
                        className={inputClassName}
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">Metodologia</span>
                      <input
                        value={lesson.methodology}
                        onChange={(event) =>
                          setEditableDraft((current) =>
                            updateLessonField(
                              current,
                              unitIndex,
                              lessonIndex,
                              "methodology",
                              event.target.value
                            )
                          )
                        }
                        className={inputClassName}
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">Quantidade de tempos</span>
                      <input
                        type="number"
                        min="1"
                        value={lesson.durationLessons}
                        onChange={(event) =>
                          setEditableDraft((current) =>
                            updateLessonField(
                              current,
                              unitIndex,
                              lessonIndex,
                              "durationLessons",
                              Number(event.target.value)
                            )
                          )
                        }
                        className={inputClassName}
                      />
                    </label>

                    <label className="flex flex-col gap-2 xl:col-span-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">Objetos de conhecimento</span>
                      <textarea
                        rows={3}
                        value={lesson.knowledgeObjects}
                        onChange={(event) =>
                          setEditableDraft((current) =>
                            updateLessonField(
                              current,
                              unitIndex,
                              lessonIndex,
                              "knowledgeObjects",
                              event.target.value
                            )
                          )
                        }
                        className={textareaClassName}
                      />
                    </label>

                    <label className="flex flex-col gap-2 xl:col-span-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">Objetivos</span>
                      <textarea
                        rows={3}
                        value={lesson.objectives}
                        onChange={(event) =>
                          setEditableDraft((current) =>
                            updateLessonField(
                              current,
                              unitIndex,
                              lessonIndex,
                              "objectives",
                              event.target.value
                            )
                          )
                        }
                        className={textareaClassName}
                      />
                    </label>

                    <label className="flex flex-col gap-2 xl:col-span-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">Modelo de observação</span>
                      <textarea
                        rows={3}
                        value={lesson.observationsTemplate}
                        onChange={(event) =>
                          setEditableDraft((current) =>
                            updateLessonField(
                              current,
                              unitIndex,
                              lessonIndex,
                              "observationsTemplate",
                              event.target.value
                            )
                          )
                        }
                        className={textareaClassName}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <form action={applyGeneratedTeachingPlanAction} className="mt-6 flex flex-wrap gap-3">
        <input type="hidden" name="targetPlanId" value={context.targetPlanId ?? ""} />
        <input type="hidden" name="teacherAssignmentId" value={context.teacherAssignmentId} />
        <input type="hidden" name="planStatus" value={context.currentPlanStatus ?? "draft"} />
        <input type="hidden" name="workloadHours" value={promptValues.workloadHours} />
        <input type="hidden" name="weeklyLessons" value={promptValues.weeklyLessons} />
        <input type="hidden" name="semester" value={promptValues.semester} />
        <input type="hidden" name="draftPayload" value={JSON.stringify(editableDraft)} />
        <FormSubmitButton
          idleLabel="Usar este planejamento"
          pendingLabel="Aplicando planejamento..."
        />
        <button
          type="submit"
          form="ai-generate-form"
          className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
        >
          Gerar novamente
        </button>
        <Link
          href={cancelHref}
          className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
        >
          Cancelar
        </Link>
      </form>
    </section>
  );
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

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function updateUnitField<K extends keyof AiPlanningDraft["units"][number]>(
  draft: AiPlanningDraft,
  unitIndex: number,
  key: K,
  value: AiPlanningDraft["units"][number][K]
) {
  return {
    ...draft,
    units: draft.units.map((unit, index) =>
      index === unitIndex
        ? {
            ...unit,
            [key]: value
          }
        : unit
    )
  };
}

function updateLessonField<K extends keyof AiPlanningDraft["units"][number]["lessons"][number]>(
  draft: AiPlanningDraft,
  unitIndex: number,
  lessonIndex: number,
  key: K,
  value: AiPlanningDraft["units"][number]["lessons"][number][K]
) {
  return {
    ...draft,
    units: draft.units.map((unit, currentUnitIndex) =>
      currentUnitIndex === unitIndex
        ? {
            ...unit,
            lessons: unit.lessons.map((lesson, currentLessonIndex) =>
              currentLessonIndex === lessonIndex
                ? {
                    ...lesson,
                    [key]: value
                  }
                : lesson
            )
          }
        : unit
    )
  };
}

const inputClassName =
  "h-12 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]";

const textareaClassName =
  "min-h-28 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]";
