import { ConfirmSubmitButton } from "./confirm-submit-button";
import {
  cancelPlannedLessonAction,
  completePlannedLessonAction,
  postponePlannedLessonAction,
  updatePlannedLessonDateAction
} from "../actions";
import { SIAGE_METHODOLOGIES } from "../constants";
import { deriveLessonExecutionRecord, parseLessonExecutionSnapshot } from "../utils/execution";
import { getLessonVisualStatus } from "../utils/schedule";
import { getPlannedLessonStatusLabel } from "../utils/status-rules";
import { FormSubmitButton } from "@/features/turmas/components/form-submit-button";
import { createLessonRecordAction } from "@/features/registros/form-actions";

import type { PlanUnit, PlannedLesson } from "../types";

type ScheduleLessonCardProps = {
  lesson: PlannedLesson;
  planId: string;
  redirectTo: string;
  units: PlanUnit[];
  today: string;
};

export function ScheduleLessonCard({
  lesson,
  planId,
  redirectTo,
  units,
  today
}: ScheduleLessonCardProps) {
  const execution = deriveLessonExecutionRecord(lesson);
  const snapshot = parseLessonExecutionSnapshot(lesson.executionNotes);
  const unit = units.find((item) => item.id === lesson.planUnitId) ?? null;

  return (
    <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={getStatusClassName(lesson)}>
              {getLessonVisualStatus(lesson)}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
              Aula {lesson.lessonNumber}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-[var(--foreground)]">
            {lesson.title}
          </h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {unit ? `Unidade ${unit.position + 1} · ${unit.title}` : "Sem unidade"} ·{" "}
            {lesson.durationLessons} {lesson.durationLessons === 1 ? "tempo" : "tempos"} ·{" "}
            {lesson.methodology ?? "Metodologia não informada"}
          </p>
        </div>

        <div className="grid min-w-[240px] gap-3 text-sm text-[var(--foreground)]">
          <InfoItem label="Status salvo" value={getPlannedLessonStatusLabel(lesson.status)} />
          <InfoItem
            label="Data prevista"
            value={lesson.plannedDate ? formatDate(lesson.plannedDate) : "Sem data"}
          />
          <InfoItem
            label="Data real"
            value={lesson.actualDate ? formatDate(lesson.actualDate) : "Não realizada"}
          />
        </div>
      </div>

      {(lesson.status === "completed" || !snapshot.followedPlan || snapshot.note) && (
        <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] p-4 text-sm text-[var(--foreground)]">
          <p className="font-medium">Execução registrada</p>
          <p className="mt-2 text-[var(--muted)]">
            {snapshot.followedPlan
              ? "O professor informou que seguiu o planejamento."
              : "O professor registrou diferenças entre o planejado e o realizado."}
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <InfoItem
              label="Objetos realizados"
              value={execution.knowledgeObjects ?? "Sem alteração registrada"}
            />
            <InfoItem
              label="Objetivos realizados"
              value={execution.objectives ?? "Sem alteração registrada"}
            />
            <InfoItem
              label="Metodologia realizada"
              value={execution.methodology ?? "Sem alteração registrada"}
            />
            <InfoItem
              label="Observações"
              value={execution.observations ?? "Sem observação registrada"}
            />
          </div>
        </div>
      )}

      {lesson.status === "completed" ? (
        <form action={createLessonRecordAction} className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <input type="hidden" name="plannedLessonId" value={lesson.id} />
          <p className="text-sm text-sky-950">Gere um rascunho revisÃ¡vel com os dados realmente executados. Nenhuma informaÃ§Ã£o serÃ¡ enviada ao SIAGE.</p>
          <div className="mt-3"><FormSubmitButton idleLabel="Criar registro de aula" pendingLabel="Criando registro..." /></div>
        </form>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <form
          action={updatePlannedLessonDateAction}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] p-4"
        >
          <input type="hidden" name="planId" value={planId} />
          <input type="hidden" name="lessonId" value={lesson.id} />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Editar data prevista</span>
            <input
              type="date"
              name="plannedDate"
              defaultValue={lesson.plannedDate ?? ""}
              className={inputClassName}
            />
          </label>
          <div className="mt-4">
            <FormSubmitButton idleLabel="Salvar data" pendingLabel="Salvando..." />
          </div>
        </form>

        <form
          action={postponePlannedLessonAction}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] p-4"
        >
          <input type="hidden" name="planId" value={planId} />
          <input type="hidden" name="lessonId" value={lesson.id} />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Adiar aula</span>
            <input
              required
              type="date"
              name="plannedDate"
              defaultValue={lesson.plannedDate ?? today}
              className={inputClassName}
            />
          </label>
          <label className="mt-3 flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Observação do adiamento</span>
            <textarea
              name="executionNote"
              rows={3}
              defaultValue={snapshot.note ?? ""}
              className={textareaClassName}
            />
          </label>
          <div className="mt-4">
            <FormSubmitButton idleLabel="Confirmar adiamento" pendingLabel="Adiando..." />
          </div>
        </form>

        <form
          action={cancelPlannedLessonAction}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] p-4"
        >
          <input type="hidden" name="planId" value={planId} />
          <input type="hidden" name="lessonId" value={lesson.id} />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Motivo do cancelamento</span>
            <textarea name="executionNote" rows={3} className={textareaClassName} />
          </label>
          <div className="mt-4">
            <ConfirmSubmitButton
              confirmMessage="Deseja cancelar esta aula do cronograma?"
              idleLabel="Cancelar aula"
              pendingLabel="Cancelando..."
            />
          </div>
        </form>
      </div>

      <form
        action={completePlannedLessonAction}
        className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] p-4"
      >
        <input type="hidden" name="planId" value={planId} />
        <input type="hidden" name="lessonId" value={lesson.id} />
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <div className="grid gap-4 xl:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Data real da aula</span>
            <input
              required
              type="date"
              name="actualDate"
              defaultValue={lesson.actualDate ?? lesson.plannedDate ?? today}
              className={inputClassName}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Execução</span>
            <select
              name="executionMode"
              defaultValue={snapshot.followedPlan ? "followed" : "different"}
              className={inputClassName}
            >
              <option value="followed">Segui o planejamento</option>
              <option value="different">Conteúdo diferente</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Objetos realizados</span>
            <textarea
              name="actualKnowledgeObjects"
              rows={3}
              defaultValue={snapshot.actualKnowledgeObjects ?? ""}
              className={textareaClassName}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Objetivos realizados</span>
            <textarea
              name="actualObjectives"
              rows={3}
              defaultValue={snapshot.actualObjectives ?? ""}
              className={textareaClassName}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Metodologia realizada</span>
            <select
              name="actualMethodology"
              defaultValue={snapshot.actualMethodology ?? lesson.methodology ?? ""}
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
            <span className="text-sm font-medium text-[var(--foreground)]">Observações da execução</span>
            <textarea
              name="actualObservations"
              rows={3}
              defaultValue={snapshot.actualObservations ?? ""}
              className={textareaClassName}
            />
          </label>

          <label className="flex flex-col gap-2 xl:col-span-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Observação geral</span>
            <textarea
              name="executionNote"
              rows={3}
              defaultValue={snapshot.note ?? ""}
              className={textareaClassName}
            />
          </label>
        </div>

        <div className="mt-4">
          <FormSubmitButton
            idleLabel="Marcar como realizada"
            pendingLabel="Registrando execução..."
          />
        </div>
      </form>
    </article>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted-soft)]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short"
  }).format(new Date(`${value}T12:00:00`));
}

function getStatusClassName(lesson: PlannedLesson) {
  switch (lesson.status) {
    case "completed":
      return "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700";
    case "postponed":
      return "rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700";
    case "cancelled":
      return "rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700";
    default:
      return lesson.plannedDate
        ? "rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700"
        : "rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700";
  }
}

const inputClassName =
  "h-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]";

const textareaClassName =
  "min-h-24 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]";
