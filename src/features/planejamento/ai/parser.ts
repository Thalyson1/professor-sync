import { validateAiPlanningDraft } from "./validation";

import type { AiDraftValidationResult } from "./schema";
import type { AiPlanningDraft, AiPlanningDraftLesson, AiPlanningDraftUnit } from "./types";

export function parseAiPlanningDraft(payload: unknown): AiDraftValidationResult {
  if (!isRecord(payload)) {
    return failure("A IA retornou um formato inesperado para o planejamento.");
  }

  const draft: AiPlanningDraft = {
    title: readString(payload.title),
    description: readString(payload.description),
    educationBase: readString(payload.educationBase) as AiPlanningDraft["educationBase"],
    generalObjectives: readStringArray(payload.generalObjectives),
    methodologies: readStringArray(payload.methodologies),
    assessmentStrategies: readStringArray(payload.assessmentStrategies),
    units: readUnits(payload.units)
  };

  const errors = validateAiPlanningDraft(draft);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: draft };
}

function readUnits(value: unknown): AiPlanningDraftUnit[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((unit, unitIndex) => {
    const record = isRecord(unit) ? unit : {};

    return {
      title: readString(record.title),
      description: readString(record.description),
      position: readInteger(record.position, unitIndex),
      lessons: readLessons(record.lessons)
    };
  });
}

function readLessons(value: unknown): AiPlanningDraftLesson[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((lesson, lessonIndex) => {
    const record = isRecord(lesson) ? lesson : {};

    return {
      lessonNumber: readInteger(record.lessonNumber, lessonIndex + 1),
      title: readString(record.title),
      knowledgeObjects: readString(record.knowledgeObjects),
      objectives: readString(record.objectives),
      methodology: readString(record.methodology),
      observationsTemplate: readString(record.observationsTemplate),
      plannedDate: readNullableString(record.plannedDate),
      durationLessons: readInteger(record.durationLessons, 1),
      position: readInteger(record.position, lessonIndex)
    };
  });
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readNullableString(value: unknown) {
  const normalized = readString(value);
  return normalized.length > 0 ? normalized : null;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => readString(item))
    .filter((item) => item.length > 0);
}

function readInteger(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isInteger(numeric) ? numeric : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function failure(...errors: string[]): AiDraftValidationResult {
  return { success: false, errors };
}
