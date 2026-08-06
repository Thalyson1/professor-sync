import Link from "next/link";

import type { PlanningAssignmentListItem } from "../types";

type PlanningAssignmentCardProps = {
  item: PlanningAssignmentListItem;
};

export function PlanningAssignmentCard({ item }: PlanningAssignmentCardProps) {
  const actionHref = item.planId
    ? `/planejamento/${item.planId}`
    : `/planejamento/novo?atribuicao=${item.assignmentId}`;

  return (
    <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            {item.serie}
            {item.letra ? ` · ${item.letra}` : ""}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            {item.turmaNome}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {item.disciplinaNome} · {item.semester}
          </p>
        </div>

        <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          {formatPlanStatus(item.planStatus)}
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InfoItem label="Turma" value={`${item.serie}${item.letra ? ` ${item.letra}` : ""} · ${item.turmaNome}`} />
        <InfoItem label="Disciplina" value={item.disciplinaNome} />
        <InfoItem label="Semestre" value={item.semester} />
        <InfoItem label="Tipo de componente" value={item.componentType ?? "Não informado"} />
        <InfoItem label="Base do plano" value={formatEducationBase(item.educationBase)} />
        <InfoItem label="Aulas planejadas" value={String(item.lessonCount)} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center rounded-2xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          {item.planId ? "Abrir planejamento" : "Criar planejamento"}
        </Link>
        <span className="inline-flex items-center rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm text-[var(--muted)]">
          {item.schoolName}
        </span>
      </div>
    </article>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted-soft)]">
        {label}
      </p>
      <p className="mt-2 text-sm text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function formatPlanStatus(status: PlanningAssignmentListItem["planStatus"]) {
  switch (status) {
    case "active":
      return "Ativo";
    case "draft":
      return "Rascunho";
    case "completed":
      return "Concluído";
    case "archived":
      return "Arquivado";
    default:
      return "Sem planejamento";
  }
}

function formatEducationBase(base: PlanningAssignmentListItem["educationBase"]) {
  if (base === "technical") {
    return "Base técnica";
  }

  if (base === "bncc") {
    return "BNCC";
  }

  return "Não definida";
}
