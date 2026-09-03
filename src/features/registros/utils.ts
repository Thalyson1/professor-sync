import type { Database } from "@/types/database";

import type { LessonRecordStatus, UpdateLessonRecordInput } from "./types";

export function buildLessonRecordUpdatePayload(input: UpdateLessonRecordInput): Database["public"]["Tables"]["lesson_records"]["Update"] {
  return {
    lesson_date: input.lessonDate,
    knowledge_objects: input.knowledgeObjects,
    methodology: input.methodology,
    observations: input.observations,
    number_of_lessons: input.numberOfLessons
  };
}

export function isLessonRecordStatus(value: string): value is LessonRecordStatus {
  return ["draft", "ready", "synced", "sync_error"].includes(value);
}

export function getLessonRecordStatusLabel(status: LessonRecordStatus) {
  return {
    draft: "Rascunho",
    ready: "Pronto para SIAGE",
    synced: "Sincronizado",
    sync_error: "Erro"
  }[status];
}
