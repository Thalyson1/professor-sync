import { EmptyState } from "@/components/ui/empty-state";
import { IndicatorCard } from "@/components/ui/indicator-card";

import { getTurmaIndicators } from "../utils/turmas";
import type { Turma } from "../types";

import { UpcomingLessonsList } from "./upcoming-lessons-list";

type TurmaOverviewProps = {
  turma: Turma;
};

export function TurmaOverview({ turma }: TurmaOverviewProps) {
  const indicators = getTurmaIndicators(turma);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {indicators.map((indicator) => (
          <IndicatorCard
            key={indicator.id}
            label={indicator.label}
            value={indicator.valor}
            helper={indicator.apoio}
          />
        ))}
      </div>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Alunos da turma
          </h2>
          <p className="text-sm leading-6 text-[var(--muted)]">
            Lista real de estudantes vinculados à turma, ordenada alfabeticamente.
          </p>
        </div>

        {turma.alunos.length > 0 ? (
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {turma.alunos.map((aluno) => (
              <li
                key={aluno.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3"
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {aluno.nome}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted-soft)]">
                  <span className="rounded-full border border-[var(--border)] px-3 py-1">
                    Matrícula: {aluno.matricula ?? "Não informada"}
                  </span>
                  <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-[var(--primary)]">
                    {aluno.status ?? "Status não informado"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="Nenhum aluno vinculado a esta turma"
              description="A turma foi carregada com sucesso, mas ainda não há matrículas de alunos importadas para exibir aqui."
            />
          </div>
        )}
      </section>

      <UpcomingLessonsList aulas={turma.resumo.proximasAulas} />
    </div>
  );
}
