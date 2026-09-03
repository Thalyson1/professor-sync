import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";
import { ActionNotice } from "@/features/planejamento/components/action-notice";
import { ScheduleLessonCard } from "@/features/planejamento/components/schedule-lesson-card";
import { listLessonsForToday } from "@/features/planejamento/queries";

export const dynamic = "force-dynamic";

type PlanejamentoHojePageProps = {
  searchParams: Promise<{
    notice?: string;
    error?: string;
  }>;
};

export default async function PlanejamentoHojePage({
  searchParams
}: PlanejamentoHojePageProps) {
  const resolvedSearchParams = await searchParams;
  const today = formatDateOnly(new Date());
  const { data: lessons, error, configured } = await listLessonsForToday(today);

  return (
    <PageSection
      title="Hoje"
      description="Acompanhe rapidamente as aulas previstas para hoje e registre a execução sem sair do Professor Sync."
    >
      <ActionNotice
        status={resolvedSearchParams.notice}
        error={resolvedSearchParams.error}
      />

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">
              Aulas previstas para {formatDisplayDate(today)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Fluxo rápido para localizar a turma, verificar o status e marcar a aula como realizada.
            </p>
          </div>

          <Link href="/planejamento" className={ghostButtonClassName}>
            Voltar aos planejamentos
          </Link>
        </div>
      </section>

      {error ? (
        <EmptyState
          title={
            configured
              ? "Não foi possível carregar as aulas de hoje"
              : "Supabase ainda não configurado"
          }
          description={error}
        />
      ) : lessons.length > 0 ? (
        <div className="space-y-5">
          {lessons.map((lesson) => (
            <section key={lesson.id} className="space-y-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-sm">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {lesson.assignment.className} · {lesson.assignment.subjectName}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {lesson.assignment.schoolName} · {lesson.planTitle}
                </p>
              </div>

              <ScheduleLessonCard
                lesson={lesson}
                planId={lesson.teachingPlanId}
                redirectTo="/planejamento/hoje"
                units={
                  lesson.unitTitle
                    ? [
                        {
                          id: lesson.planUnitId ?? "unit",
                          teachingPlanId: lesson.teachingPlanId,
                          title: lesson.unitTitle,
                          description: null,
                          position: lesson.unitPosition ?? 0,
                          createdAt: "",
                          updatedAt: ""
                        }
                      ]
                    : []
                }
                today={today}
              />
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma aula prevista para hoje"
          description="Quando houver aulas com a data de hoje no cronograma, elas aparecerão aqui para execução rápida."
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

function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full"
  }).format(new Date(`${value}T12:00:00`));
}

const ghostButtonClassName =
  "inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]";
