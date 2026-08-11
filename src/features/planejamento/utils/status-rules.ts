import {
  EDUCATION_BASE_VALUES,
  PLANNED_LESSON_STATUS_VALUES,
  TEACHING_PLAN_STATUS_VALUES
} from "./constants";

import type {
  EducationBase,
  PlannedLessonStatus,
  TeachingPlanStatus
} from "../types";

export function isEducationBase(value: string): value is EducationBase {
  return EDUCATION_BASE_VALUES.includes(value as EducationBase);
}

export function isTeachingPlanStatus(value: string): value is TeachingPlanStatus {
  return TEACHING_PLAN_STATUS_VALUES.includes(value as TeachingPlanStatus);
}

export function isPlannedLessonStatus(
  value: string
): value is PlannedLessonStatus {
  return PLANNED_LESSON_STATUS_VALUES.includes(value as PlannedLessonStatus);
}

export function canArchiveTeachingPlan(status: TeachingPlanStatus) {
  return status !== "archived";
}

export function getEducationBaseLabel(base: EducationBase) {
  switch (base) {
    case "technical":
      return "Base técnica";
    case "bncc":
      return "BNCC";
  }
}

export function getTeachingPlanStatusLabel(status: TeachingPlanStatus) {
  switch (status) {
    case "draft":
      return "Rascunho";
    case "active":
      return "Ativo";
    case "completed":
      return "Concluído";
    case "archived":
      return "Arquivado";
  }
}

export function getPlannedLessonStatusLabel(status: PlannedLessonStatus) {
  switch (status) {
    case "planned":
      return "Planejada";
    case "completed":
      return "Concluída";
    case "postponed":
      return "Adiada";
    case "cancelled":
      return "Cancelada";
  }
}
