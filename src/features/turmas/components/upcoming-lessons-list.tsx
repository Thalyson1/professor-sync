import type { Aula } from "../types";

type UpcomingLessonsListProps = {
  aulas: Aula[];
};

export function UpcomingLessonsList({ aulas }: UpcomingLessonsListProps) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Próximas aulas
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Lista simulada com os próximos encontros planejados para a turma.
          </p>
        </div>
      </div>

      {aulas.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {aulas.map((aula) => (
            <li
              key={aula.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {aula.titulo}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {aula.conteudo}
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--primary-soft)] px-3 py-2 text-sm font-medium text-[var(--primary)]">
                  {formatLessonDate(aula.data)}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted-soft)]">
                <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-[var(--primary)]">
                  {aula.cargaHoraria}h
                </span>
                <span className="rounded-full border border-[var(--border)] px-3 py-1">
                  {aula.status === "planejada" ? "Planejada" : "Realizada"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
          Não há próximas aulas registradas para esta turma simulada.
        </p>
      )}
    </section>
  );
}

function formatLessonDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(`${date}T12:00:00`));
}
