export const EDUCATION_BASE_OPTIONS = [
  { value: "technical", label: "Base técnica" },
  { value: "bncc", label: "BNCC" }
] as const;

export const TEACHING_PLAN_STATUS_OPTIONS = [
  { value: "draft", label: "Rascunho" },
  { value: "active", label: "Ativo" },
  { value: "completed", label: "Concluído" },
  { value: "archived", label: "Arquivado" }
] as const;

export const PLANNED_LESSON_STATUS_OPTIONS = [
  { value: "planned", label: "Planejada" },
  { value: "completed", label: "Concluída" },
  { value: "postponed", label: "Adiada" },
  { value: "cancelled", label: "Cancelada" }
] as const;

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
