import { PLANNED_LESSON_STATUS_OPTIONS } from "../constants";

import type { PlanUnit, ScheduleFilters } from "../types";

type ScheduleFiltersProps = {
  current: ScheduleFilters;
  units: PlanUnit[];
};

export function ScheduleFiltersForm({
  current,
  units
}: ScheduleFiltersProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Status</span>
          <select name="status" defaultValue={current.status ?? ""} className={inputClassName}>
            <option value="">Todos</option>
            {PLANNED_LESSON_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Unidade</span>
          <select name="unitId" defaultValue={current.unitId ?? ""} className={inputClassName}>
            <option value="">Todas</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                Unidade {unit.position + 1} · {unit.title}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Data inicial</span>
          <input
            type="date"
            name="startDate"
            defaultValue={current.startDate ?? ""}
            className={inputClassName}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Data final</span>
          <input
            type="date"
            name="endDate"
            defaultValue={current.endDate ?? ""}
            className={inputClassName}
          />
        </label>
      </div>
    </>
  );
}

const inputClassName =
  "h-12 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]";
