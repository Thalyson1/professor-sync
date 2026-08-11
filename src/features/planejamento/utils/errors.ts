const knownConstraintMessages: Array<[string, string]> = [
  ["teaching_plans_active_per_assignment_semester", "Já existe um planejamento ativo para esta atribuição e semestre."],
  ["teaching_plans_active_per_assignment_semester_uidx", "Já existe um planejamento ativo para esta atribuição e semestre."],
  ["planned_lessons_teaching_plan_id_lesson_number", "O número da aula já está em uso neste planejamento."],
  ["plan_units_teaching_plan_id_position", "A posição da unidade já está em uso neste planejamento."],
  ["planned_lessons_teaching_plan_plan_unit_match", "A unidade informada não pertence a este planejamento."],
  ["permission denied", "Você não tem permissão para executar esta operação com as políticas atuais."]
];

export function translateSupabaseError(message: string) {
  const normalized = message.toLowerCase();

  for (const [snippet, translated] of knownConstraintMessages) {
    if (normalized.includes(snippet.toLowerCase())) {
      return translated;
    }
  }

  return message;
}
