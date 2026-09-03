export const LESSON_RECORD_STATUSES = [
  "draft",
  "ready",
  "synced",
  "sync_error"
] as const;

export type LessonRecordStatus = (typeof LESSON_RECORD_STATUSES)[number];

export type LessonRecord = {
  id: string;
  plannedLessonId: string;
  teacherAssignmentId: string;
  lessonDate: string;
  knowledgeObjects: string | null;
  methodology: string | null;
  observations: string | null;
  numberOfLessons: number;
  status: LessonRecordStatus;
  createdAt: string;
  updatedAt: string;
  classId: string;
  className: string;
  grade: string;
  letter: string | null;
  subjectId: string;
  subjectName: string;
  plannedLessonTitle: string;
  teachingPlanId: string;
};

export type LessonRecordFilters = {
  classId?: string;
  subjectId?: string;
  status?: LessonRecordStatus;
  startDate?: string;
  endDate?: string;
};

export type UpdateLessonRecordInput = {
  id: string;
  lessonDate: string;
  knowledgeObjects: string | null;
  methodology: string | null;
  observations: string | null;
  numberOfLessons: number;
};

export type QueryResult<T> = {
  data: T;
  error: string | null;
  configured: boolean;
};
