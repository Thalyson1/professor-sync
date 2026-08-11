import { EDUCATION_BASE_OPTIONS, TEACHING_PLAN_STATUS_OPTIONS } from "../constants";

import type { TeachingPlanListItem } from "../types";

type PlanningFiltersProps = {
  current: {
    serie: string;
    disciplina: string;
    semestre: string;
    status: string;
    base: string;
  };
  items: TeachingPlanListItem[];
};

export function PlanningFilters({ current, items }: PlanningFiltersProps) {
  const series = Array.from(new Set(items.map((item) => item.assignment.grade))).sort();
  const disciplinas = Array.from(
    new Set(items.map((item) => item.assignment.subjectName))
  ).sort((left, right) => left.localeCompare(right, "pt-BR"));
  const semestres = Array.from(
    new Set(
      items
        .map((item) => item.semester ?? item.assignment.semester ?? "")
        .filter((value) => value.length > 0)
    )
  ).sort();

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <SelectField
        label="Série"
        name="serie"
        defaultValue={current.serie}
        options={[
          { label: "Todas", value: "" },
          ...series.map((value) => ({ label: value, value }))
        ]}
      />
      <SelectField
        label="Disciplina"
        name="disciplina"
        defaultValue={current.disciplina}
        options={[
          { label: "Todas", value: "" },
          ...disciplinas.map((value) => ({ label: value, value }))
        ]}
      />
      <SelectField
        label="Semestre"
        name="semestre"
        defaultValue={current.semestre}
        options={[
          { label: "Todos", value: "" },
          ...semestres.map((value) => ({ label: value, value }))
        ]}
      />
      <SelectField
        label="Status"
        name="status"
        defaultValue={current.status}
        options={[
          { label: "Todos", value: "" },
          ...TEACHING_PLAN_STATUS_OPTIONS.map((option) => ({
            label: option.label,
            value: option.value
          }))
        ]}
      />
      <SelectField
        label="Base"
        name="base"
        defaultValue={current.base}
        options={[
          { label: "Todas", value: "" },
          ...EDUCATION_BASE_OPTIONS.map((option) => ({
            label: option.label,
            value: option.value
          }))
        ]}
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
