import { SIAGE_METHODOLOGIES } from "../planejamento/utils/constants";

import type { UpdateLessonRecordInput } from "./types";

export function validateLessonRecordUpdate(input: unknown):
  | { success: true; data: UpdateLessonRecordInput }
  | { success: false; errors: string[] } {
  if (!isRecord(input)) {
    return { success: false, errors: ["Dados invÃ¡lidos para atualizar o registro."] };
  }

  const id = text(input.id);
  const lessonDate = text(input.lessonDate);
  const knowledgeObjects = nullableText(input.knowledgeObjects);
  const methodology = nullableText(input.methodology);
  const observations = nullableText(input.observations);
  const numberOfLessons = Number(input.numberOfLessons);
  const errors: string[] = [];

  if (!id) errors.push("Registro de aula invÃ¡lido.");
  if (!isDate(lessonDate)) errors.push("Informe uma data de aula vÃ¡lida.");
  if (!Number.isInteger(numberOfLessons) || numberOfLessons <= 0) {
    errors.push("A quantidade de tempos deve ser maior que zero.");
  }
  if (methodology && !SIAGE_METHODOLOGIES.includes(methodology as never)) {
    errors.push("Selecione uma metodologia compatÃ­vel com o SIAGE.");
  }

  return errors.length > 0
    ? { success: false, errors }
    : {
        success: true,
        data: { id, lessonDate, knowledgeObjects, methodology, observations, numberOfLessons }
      };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: unknown) {
  const valueText = text(value);
  return valueText || null;
}

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
}
