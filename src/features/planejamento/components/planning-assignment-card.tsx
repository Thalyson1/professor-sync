import Link from "next/link";

import { getEducationBaseLabel, getTeachingPlanStatusLabel } from "../utils/status-rules";

import type { TeachingPlanListItem } from "../types";

type PlanningAssignmentCardProps = {
  item: TeachingPlanListItem;
};

export function PlanningAssignmentCard({ item }: PlanningAssignmentCardProps) {
  return (
    <article className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            {item.assignment.grade}
            {item.assignment.letter ? ` · ${item.assignment.letter}` : ""}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            {item.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {item.assignment.className} · {item.assignment.subjectName}
          </p>
        </div>

        <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          {getTeachingPlanStatusLabel(item.status)}
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InfoItem label="Turma" value={item.assignment.className} />
        <InfoItem label="Disciplina" value={item.assignment.subjectName} />
        <InfoItem label="Série" value={formatGrade(item.assignment.grade, item.assignment.letter)} />
        <InfoItem label="Semestre" value={item.semester ?? item.assignment.semester ?? "Não informado"} />
        <InfoItem label="Base educacional" value={getEducationBaseLabel(item.educationBase)} />
        <InfoItem label="Unidades" value={String(item.unitsCount)} />
        <InfoItem label="Aulas planejadas" value={String(item.lessonsCount)} />
        <InfoItem label="Carga horária" value={item.workloadHours ? `${item.workloadHours} h` : "Não informada"} />
        <InfoItem label="Última atualização" value={formatDate(item.updatedAt)} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/planejamento/${item.id}`}
          className="inline-flex items-center justify-center rounded-2xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          Abrir planejamento
        </Link>
        <span className="inline-flex items-center rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm text-[var(--muted)]">
          {item.assignment.schoolName}
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

function formatGrade(grade: string, letter: string | null) {
  return `${grade}${letter ? ` ${letter}` : ""}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
