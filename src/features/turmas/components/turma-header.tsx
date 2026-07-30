import Link from "next/link";

import type { Turma } from "../types";
import {
  formatAcademicPeriodLabel,
  formatStatus,
  formatTurno,
  getTurmaDisplayName
} from "../utils/turmas";

type TurmaHeaderProps = {
  turma: Turma;
};

export function TurmaHeader({ turma }: TurmaHeaderProps) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <Link
        href="/turmas"
        className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
      >
        <span aria-hidden="true">←</span>
        <span>Voltar para turmas</span>
      </Link>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--primary)]">Diário da turma</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            {getTurmaDisplayName(turma)}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            {turma.curso} ·{" "}
            {turma.disciplinas.length > 0
              ? turma.disciplinas.map((disciplina) => disciplina.nome).join(", ")
              : "Sem disciplinas atribuídas"}
          </p>
        </div>

        <span
          className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${
            turma.status === "active"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300"
              : "bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200"
          }`}
        >
          {formatStatus(turma.status)}
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <InfoPill label="Escola" value={turma.escola.nome} />
        <InfoPill label="Curso" value={turma.curso} />
        <InfoPill label="Série" value={turma.serie} />
        <InfoPill label="Letra" value={turma.letra ?? "Não informada"} />
        <InfoPill
          label="Disciplinas"
          value={
            turma.disciplinas.length > 0
              ? turma.disciplinas.map((disciplina) => disciplina.nome).join(", ")
              : "Sem disciplinas atribuídas"
          }
        />
        <InfoPill label="Turno" value={formatTurno(turma.turno)} />
        <InfoPill label="Sala" value={turma.sala ?? "Não informada"} />
        <InfoPill
          label="Período letivo"
          value={formatAcademicPeriodLabel(turma.periodoLetivo)}
        />
        <InfoPill
          label="Quantidade de alunos"
          value={`${turma.quantidadeAlunos} estudantes`}
        />
      </div>
    </section>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted-soft)]">
        {label}
      </p>
      <p className="mt-2 text-sm text-[var(--foreground)]">{value}</p>
    </div>
  );
}
