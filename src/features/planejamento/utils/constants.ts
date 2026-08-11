import type { EducationBase, PlannedLessonStatus, TeachingPlanStatus } from "../types";

export const EDUCATION_BASE_VALUES: EducationBase[] = ["technical", "bncc"];

export const TEACHING_PLAN_STATUS_VALUES: TeachingPlanStatus[] = [
  "draft",
  "active",
  "completed",
  "archived"
];

export const PLANNED_LESSON_STATUS_VALUES: PlannedLessonStatus[] = [
  "planned",
  "completed",
  "postponed",
  "cancelled"
];

export const SIAGE_METHODOLOGIES = [
  "Apresentação de trabalhos pelos estudantes",
  "Atividades de Práticas Integradoras",
  "Aula contextualizada",
  "Aula de campo",
  "Aula dialogada",
  "Aula em laboratório didático",
  "Aula em laboratório educacional de Ciências",
  "Aula em laboratório educacional de informática",
  "Aula em laboratório técnico",
  "Aula prática",
  "Avaliação",
  "Evento escolar",
  "Momento comemorativo da turma",
  "Outros",
  "Participação em eventos",
  "Visita técnica"
] as const;
