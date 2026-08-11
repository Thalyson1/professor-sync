import {
  EDUCATION_BASE_VALUES,
  PLANNED_LESSON_STATUS_VALUES,
  SIAGE_METHODOLOGIES,
  TEACHING_PLAN_STATUS_VALUES
} from "./utils/constants";

export {
  EDUCATION_BASE_VALUES,
  PLANNED_LESSON_STATUS_VALUES,
  SIAGE_METHODOLOGIES,
  TEACHING_PLAN_STATUS_VALUES
};

export const EDUCATION_BASE_OPTIONS = [
  { value: EDUCATION_BASE_VALUES[0], label: "Base técnica" },
  { value: EDUCATION_BASE_VALUES[1], label: "BNCC" }
] as const;

export const TEACHING_PLAN_STATUS_OPTIONS = [
  { value: TEACHING_PLAN_STATUS_VALUES[0], label: "Rascunho" },
  { value: TEACHING_PLAN_STATUS_VALUES[1], label: "Ativo" },
  { value: TEACHING_PLAN_STATUS_VALUES[2], label: "Concluído" },
  { value: TEACHING_PLAN_STATUS_VALUES[3], label: "Arquivado" }
] as const;

export const PLANNED_LESSON_STATUS_OPTIONS = [
  { value: PLANNED_LESSON_STATUS_VALUES[0], label: "Planejada" },
  { value: PLANNED_LESSON_STATUS_VALUES[1], label: "Concluída" },
  { value: PLANNED_LESSON_STATUS_VALUES[2], label: "Adiada" },
  { value: PLANNED_LESSON_STATUS_VALUES[3], label: "Cancelada" }
] as const;
