import Link from "next/link";

import type { Turma } from "../types";

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
          <p className="text-sm font-medium text-[var(--primary)]">
            Diário da turma
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            {turma.nome}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            {turma.curso} · {turma.disciplina.nome}
          </p>
        </div>

        <span
          className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${
            turma.status === "Ativa"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300"
              : "bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200"
          }`}
        >
          {turma.status}
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <InfoPill label="Curso" value={turma.curso} />
        <InfoPill label="Disciplina" value={turma.disciplina.nome} />
        <InfoPill label="Turno" value={turma.turno} />
        <InfoPill label="Modalidade" value={turma.modalidade} />
        <InfoPill label="Semestre" value={turma.semestre} />
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
