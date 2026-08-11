import { SIAGE_METHODOLOGIES } from "../utils/constants";

import type { AiPlanningRequest } from "./types";

export function buildAiPlanningSystemPrompt() {
  return [
    "Você é um assistente pedagógico do Professor Sync.",
    "Sua tarefa é gerar apenas um rascunho de planejamento para revisão humana.",
    "Responda exclusivamente com JSON válido conforme o schema informado.",
    "Nunca invente códigos BNCC ou competências oficiais não fornecidas pelo professor.",
    "Use somente metodologias compatíveis com o SIAGE.",
    "Distribua o conteúdo de forma coerente com carga horária, aulas semanais e semestre.",
    "Não inclua dados pessoais de alunos, CPF, matrícula ou qualquer informação sensível.",
    `Metodologias permitidas: ${SIAGE_METHODOLOGIES.join("; ")}.`
  ].join("\n");
}

export function buildAiPlanningUserPrompt(input: AiPlanningRequest) {
  const assignmentLabel = `${input.context.grade}${input.context.letter ? ` ${input.context.letter}` : ""} · ${input.context.className} · ${input.context.subjectName}`;
  const objectiveBlock =
    input.generalObjectives.length > 0
      ? input.generalObjectives.map((item) => `- ${item}`).join("\n")
      : "Nenhum objetivo geral adicional foi informado.";

  return [
    "Gere um rascunho de planejamento semestral.",
    "",
    "Contexto da atribuição:",
    `- Turma: ${assignmentLabel}`,
    `- Curso: ${input.context.course}`,
    `- Disciplina: ${input.context.subjectName}`,
    `- Tipo de componente: ${input.context.componentType ?? "Não informado"}`,
    `- Escola: ${input.context.schoolName}`,
    `- Semestre da atribuição: ${input.context.semester ?? "Não informado"}`,
    "",
    "Parâmetros pedagógicos:",
    `- Base educacional: ${input.educationBase}`,
    `- Carga horária: ${input.workloadHours ?? "Não informada"}`,
    `- Aulas semanais: ${input.weeklyLessons ?? "Não informadas"}`,
    `- Semestre do planejamento: ${input.semester ?? "Não informado"}`,
    "",
    "Descrição / ementa / diretrizes:",
    input.description,
    "",
    "Objetivos gerais opcionais:",
    objectiveBlock,
    "",
    "Observações adicionais:",
    input.observations?.trim() || "Nenhuma observação adicional.",
    "",
    input.educationBase === "bncc"
      ? "Se a base for BNCC, use apenas as habilidades e competências textualmente fornecidas pelo professor. Não invente códigos oficiais."
      : "Se a base for técnica, organize a progressão pedagógica, proponha aulas práticas quando fizer sentido e não invente competências oficiais externas ao texto informado."
  ].join("\n");
}
