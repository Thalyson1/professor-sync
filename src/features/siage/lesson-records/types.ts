import type { LessonRecord } from "@/features/registros/types";

export type SiageLessonPayloadBuildResult = {
  supported: false;
  payload: null;
  pendingInternalFields: Array<keyof Pick<LessonRecord, "lessonDate" | "knowledgeObjects" | "methodology" | "observations" | "numberOfLessons">>;
  reason: string;
};
