import { SIAGE_METHODOLOGIES } from "./constants";

import type { LessonExecutionSnapshot, PlannedLesson } from "../types";

const EXECUTION_NOTE_VERSION = 1;

type ExecutionNotePayload = {
  version: number;
  followedPlan: boolean;
  note: string | null;
  actualKnowledgeObjects: string | null;
  actualObjectives: string | null;
  actualMethodology: string | null;
  actualObservations: string | null;
};

export function serializeLessonExecutionSnapshot(
  snapshot: LessonExecutionSnapshot
) {
  const payload: ExecutionNotePayload = {
    version: EXECUTION_NOTE_VERSION,
    followedPlan: snapshot.followedPlan,
    note: normalizeNullableText(snapshot.note),
    actualKnowledgeObjects: normalizeNullableText(snapshot.actualKnowledgeObjects),
    actualObjectives: normalizeNullableText(snapshot.actualObjectives),
    actualMethodology: normalizeNullableText(snapshot.actualMethodology),
    actualObservations: normalizeNullableText(snapshot.actualObservations)
  };

  return JSON.stringify(payload);
}

export function parseLessonExecutionSnapshot(
  value: string | null
): LessonExecutionSnapshot {
  if (!value) {
    return emptyExecutionSnapshot(true);
  }

  try {
    const parsed = JSON.parse(value) as Partial<ExecutionNotePayload>;

    return {
      followedPlan: parsed.followedPlan !== false,
      note: normalizeNullableText(parsed.note),
      actualKnowledgeObjects: normalizeNullableText(parsed.actualKnowledgeObjects),
      actualObjectives: normalizeNullableText(parsed.actualObjectives),
      actualMethodology: normalizeNullableText(parsed.actualMethodology),
      actualObservations: normalizeNullableText(parsed.actualObservations)
    };
  } catch {
    return {
      ...emptyExecutionSnapshot(true),
      note: normalizeNullableText(value)
    };
  }
}

export function deriveLessonExecutionRecord(lesson: PlannedLesson) {
  const snapshot = parseLessonExecutionSnapshot(lesson.executionNotes);

  return {
    date: lesson.actualDate ?? lesson.plannedDate,
    plannedDate: lesson.plannedDate,
    actualDate: lesson.actualDate,
    methodology:
      snapshot.actualMethodology ??
      lesson.methodology,
    knowledgeObjects:
      snapshot.actualKnowledgeObjects ??
      lesson.knowledgeObjects,
    objectives:
      snapshot.actualObjectives ??
      lesson.objectives,
    observations:
      snapshot.actualObservations ??
      snapshot.note ??
      lesson.observationsTemplate,
    followedPlan: snapshot.followedPlan
  };
}

export function validateExecutionSnapshot(snapshot: LessonExecutionSnapshot) {
  const errors: string[] = [];

  if (
    snapshot.actualMethodology &&
    !SIAGE_METHODOLOGIES.includes(
      snapshot.actualMethodology as (typeof SIAGE_METHODOLOGIES)[number]
    )
  ) {
    errors.push("Selecione uma metodologia de execuÃ§Ã£o compatÃ­vel com o SIAGE.");
  }

  return errors;
}

export function emptyExecutionSnapshot(followedPlan: boolean): LessonExecutionSnapshot {
  return {
    followedPlan,
    note: null,
    actualKnowledgeObjects: null,
    actualObjectives: null,
    actualMethodology: null,
    actualObservations: null
  };
}

function normalizeNullableText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}
