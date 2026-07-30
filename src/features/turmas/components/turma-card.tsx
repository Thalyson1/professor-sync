import Link from "next/link";

import type { Turma } from "../types";
import {
  formatAcademicPeriodLabel,
  formatStatus,
  formatTurno,
  getTurmaDisplayName
} from "../utils/turmas";

type TurmaCardProps = {
  turma: Turma;
};

export function TurmaCard({ turma }: TurmaCardProps) {
  return (
    <article className="group h-full rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[var(--shadow)]">
      <Link
        href={`/turmas/${turma.id}`}
        className="flex h-full flex-col p-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]"
        aria-label={`Abrir diário da turma ${turma.nome} de ${turma.curso}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
              {turma.serie}
              {turma.letra ? ` · ${turma.letra}` : ""}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
              {getTurmaDisplayName(turma)}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {turma.curso}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              turma.status === "active"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300"
                : "bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200"
            }`}
          >
            {formatStatus(turma.status)}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted-soft)]">
              Disciplinas
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
              {turma.disciplinas.length > 0
                ? turma.disciplinas.map((disciplina) => disciplina.nome).join(", ")
                : "Sem disciplinas atribuídas"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted-soft)]">
              Turno
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
              {formatTurno(turma.turno)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted-soft)]">
              Sala
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
              {turma.sala ?? "Não informada"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted-soft)]">
              Alunos
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
              {turma.quantidadeAlunos} matriculados
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted-soft)]">
              Período letivo
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
              {formatAcademicPeriodLabel(turma.periodoLetivo)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted-soft)]">
              Escola
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
              {turma.escola.nome}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl bg-[var(--primary-soft)] px-4 py-3 text-sm font-medium text-[var(--primary)]">
          <span>Abrir diário da turma</span>
          <span aria-hidden="true" className="transition group-hover:translate-x-1">
            →
          </span>
        </div>
      </Link>
    </article>
  );
}
