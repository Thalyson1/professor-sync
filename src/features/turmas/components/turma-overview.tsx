import { EmptyState } from "@/components/ui/empty-state";

import type { Turma } from "../types";

type TurmaOverviewProps = {
  turma: Turma;
};

export function TurmaOverview({ turma }: TurmaOverviewProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Disciplinas vinculadas
          </h2>
          <p className="text-sm leading-6 text-[var(--muted)]">
            Disciplinas reais vinculadas à turma pelas atribuições do professor no SIAGE.
          </p>
        </div>

        {turma.disciplinas.length > 0 ? (
          <ul className="mt-6 space-y-3">
            {turma.disciplinas.map((disciplina) => (
              <li
                key={disciplina.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] p-4"
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {disciplina.nome}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--muted-soft)]">
                  {disciplina.cargaHorariaTotal ? (
                    <span className="rounded-full border border-[var(--border)] px-3 py-1">
                      Carga horária: {disciplina.cargaHorariaTotal}h
                    </span>
                  ) : null}
                  {disciplina.aulasSemanais ? (
                    <span className="rounded-full border border-[var(--border)] px-3 py-1">
                      Aulas semanais: {disciplina.aulasSemanais}
                    </span>
                  ) : null}
                  {disciplina.status ? (
                    <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-[var(--primary)]">
                      {disciplina.status}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="Nenhuma disciplina vinculada"
              description="A turma existe no banco, mas ainda não possui disciplinas associadas por teacher_assignments."
            />
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Alunos da turma
          </h2>
          <p className="text-sm leading-6 text-[var(--muted)]">
            Lista real de estudantes vinculados à turma via class_enrollments, ordenada alfabeticamente.
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
              title="Turma sem alunos"
              description="A turma foi encontrada, mas ainda não há alunos vinculados em class_enrollments."
            />
          </div>
        )}
      </section>
    </div>
  );
}
