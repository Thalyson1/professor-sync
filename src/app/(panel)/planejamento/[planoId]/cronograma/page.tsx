import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";
import { autoDistributeLessonsAction } from "@/features/planejamento/actions";
import { ActionNotice } from "@/features/planejamento/components/action-notice";
import { ScheduleFiltersForm } from "@/features/planejamento/components/schedule-filters";
import { ScheduleLessonCard } from "@/features/planejamento/components/schedule-lesson-card";
import { isPlannedLessonStatus } from "@/features/planejamento/utils/status-rules";
import { getTeachingPlanById } from "@/features/planejamento/queries";
import { sortLessonsChronologically } from "@/features/planejamento/utils/schedule";
import { FormSubmitButton } from "@/features/turmas/components/form-submit-button";

import type { ScheduleFilters } from "@/features/planejamento/types";

export const dynamic = "force-dynamic";

type CronogramaPageProps = {
  params: Promise<{ planoId: string }>;
  searchParams: Promise<{
    status?: string;
    unitId?: string;
    startDate?: string;
    endDate?: string;
    notice?: string;
    error?: string;
  }>;
};

const weekDayOptions = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" }
] as const;

export default async function CronogramaPage({
  params,
  searchParams
}: CronogramaPageProps) {
  const { planoId } = await params;
  const resolvedSearchParams = await searchParams;
  const { data: plan, error, configured } = await getTeachingPlanById(planoId);

  if (!plan) {
    if (error) {
      return (
        <PageSection
          title={configured ? "Não foi possível carregar o cronograma" : "Supabase ainda não configurado"}
          description={error}
        >
          <EmptyState title="Cronograma indisponível" description={error} />
        </PageSection>
      );
    }

    notFound();
  }

  const rawStatus = resolvedSearchParams.status ?? "";
  const filters: ScheduleFilters = {
    status: isPlannedLessonStatus(rawStatus) ? rawStatus : "",
    unitId: resolvedSearchParams.unitId ?? "",
    startDate: resolvedSearchParams.startDate ?? "",
    endDate: resolvedSearchParams.endDate ?? ""
  };
  const hasFilters = Object.values(filters).some((value) => value.length > 0);
  const redirectTo = `/planejamento/${plan.id}/cronograma`;
  const today = formatDateOnly(new Date());
  const filteredLessons = sortLessonsChronologically(plan.lessons).filter((lesson) => {
    if (filters.status && lesson.status !== filters.status) {
      return false;
    }

    if (filters.unitId && lesson.planUnitId !== filters.unitId) {
      return false;
    }

    if (filters.startDate && (!lesson.plannedDate || lesson.plannedDate < filters.startDate)) {
      return false;
    }

    if (filters.endDate && (!lesson.plannedDate || lesson.plannedDate > filters.endDate)) {
      return false;
    }

    return true;
  });

  return (
    <PageSection
      title={`Cronograma · ${plan.title}`}
      description="Transforme as aulas planejadas em uma sequência temporal utilizável no dia a dia do professor, preservando a diferença entre o planejado e o realizado."
    >
      <ActionNotice
        status={resolvedSearchParams.notice}
        error={resolvedSearchParams.error}
      />

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">
              {plan.assignment.className} · {plan.assignment.subjectName}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Ordenação por data prevista, posição e número da aula. As aulas realizadas preservam o planejamento original para futura geração do registro de aula.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/planejamento/${plan.id}`} className={ghostButtonClassName}>
              Voltar ao planejamento
            </Link>
            <Link href="/planejamento/hoje" className={ghostButtonClassName}>
              Hoje
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Filtros e distribuição</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Filtre o cronograma e distribua automaticamente apenas as aulas elegíveis.
            </p>
          </div>
        </div>

        <form method="get" className="mt-6 space-y-4">
          <ScheduleFiltersForm current={filters} units={plan.units} />
          <div className="flex flex-wrap gap-3">
            <button type="submit" className={primaryButtonClassName}>
              Aplicar filtros
            </button>
            <Link href={redirectTo} className={ghostButtonClassName}>
              Limpar filtros
            </Link>
          </div>
        </form>

        <form action={autoDistributeLessonsAction} className="mt-8 grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] p-4 xl:grid-cols-5">
          <input type="hidden" name="planId" value={plan.id} />
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Data inicial</span>
            <input required type="date" name="startDate" defaultValue={today} className={inputClassName} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Data final</span>
            <input type="date" name="endDate" className={inputClassName} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Tempos por encontro</span>
            <input
              required
              type="number"
              min="1"
              name="lessonsPerMeeting"
              defaultValue={plan.weeklyLessons ?? 1}
              className={inputClassName}
            />
          </label>

          <fieldset className="xl:col-span-2">
            <legend className="text-sm font-medium text-[var(--foreground)]">Dias da semana</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {weekDayOptions.map((option) => (
                <label
                  key={option.value}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
                >
                  <input type="checkbox" name="weekDays" value={option.value} />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="xl:col-span-5 inline-flex items-center gap-2 text-sm text-[var(--foreground)]">
            <input type="checkbox" name="overwriteScheduledDates" />
            Confirmo que desejo sobrescrever datas já preenchidas, exceto aulas concluídas.
          </label>

          <div className="xl:col-span-5">
            <FormSubmitButton
              idleLabel="Distribuir aulas automaticamente"
              pendingLabel="Distribuindo aulas..."
            />
          </div>
        </form>
      </section>

      {filteredLessons.length > 0 ? (
        <div className="space-y-5">
          {filteredLessons.map((lesson) => (
            <ScheduleLessonCard
              key={lesson.id}
              lesson={lesson}
              planId={plan.id}
              redirectTo={redirectTo}
              units={plan.units}
              today={today}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            hasFilters
              ? "Nenhuma aula encontrada com os filtros atuais"
              : "Nenhuma aula no cronograma"
          }
          description={
            hasFilters
              ? "Ajuste os filtros para visualizar outras aulas deste planejamento."
              : "Adicione aulas ao planejamento ou distribua datas para começar a usar o cronograma."
          }
        />
      )}
    </PageSection>
  );
}

function formatDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const inputClassName =
  "h-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]";

const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-2xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]";

const ghostButtonClassName =
  "inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]";
