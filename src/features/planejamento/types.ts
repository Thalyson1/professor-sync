export type EducationBase = "technical" | "bncc";

export type TeachingPlanStatus = "draft" | "active" | "completed" | "archived";

export type PlannedLessonStatus =
  | "planned"
  | "completed"
  | "postponed"
  | "cancelled";

export type PlanningListStatus = TeachingPlanStatus | "missing";

export type PlanningFilters = {
  serie: string;
  disciplina: string;
  semestre: string;
  status: string;
  base: string;
};

export type PlanningAssignmentListItem = {
  assignmentId: string;
  semester: string;
  classId: string;
  turmaNome: string;
  serie: string;
  letra: string | null;
  turno: string;
  sala: string | null;
  curso: string;
  schoolName: string;
  academicPeriodName: string;
  disciplineId: string;
  disciplinaNome: string;
  componentType: string | null;
  planId: string | null;
  planTitle: string | null;
  planStatus: PlanningListStatus;
  educationBase: EducationBase | null;
  lessonCount: number;
};

export type PlanningAssignmentOption = {
  assignmentId: string;
  label: string;
  turmaNome: string;
  disciplinaNome: string;
  serie: string;
  semester: string;
  componentType: string | null;
};

export type PlanUnit = {
  id: string;
  title: string;
  description: string;
  position: number;
};

export type PlannedLesson = {
  id: string;
  planUnitId: string | null;
  title: string;
  knowledgeObjects: string;
  objectives: string;
  methodology: string | null;
  observationsTemplate: string;
  plannedDate: string | null;
  lessonNumber: number;
  durationLessons: number;
  status: PlannedLessonStatus;
  position: number;
};

export type TeachingPlanDetail = {
  id: string;
  teacherAssignmentId: string;
  title: string;
  description: string;
  educationBase: EducationBase;
  workloadHours: number;
  weeklyLessons: number;
  semester: string;
  status: TeachingPlanStatus;
  assignment: PlanningAssignmentOption;
  units: PlanUnit[];
  lessons: PlannedLesson[];
};

export type PlanningQueryState<T> = {
  data: T;
  error: string | null;
  configured: boolean;
};
