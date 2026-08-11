export type EducationBase = "technical" | "bncc";

export type TeachingPlanStatus = "draft" | "active" | "completed" | "archived";

export type PlannedLessonStatus =
  | "planned"
  | "completed"
  | "postponed"
  | "cancelled";

export type TeachingPlan = {
  id: string;
  teacherAssignmentId: string;
  title: string;
  description: string | null;
  educationBase: EducationBase;
  workloadHours: number | null;
  weeklyLessons: number | null;
  semester: string | null;
  status: TeachingPlanStatus;
  createdAt: string;
  updatedAt: string;
};

export type PlanUnit = {
  id: string;
  teachingPlanId: string;
  title: string;
  description: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type PlannedLesson = {
  id: string;
  teachingPlanId: string;
  planUnitId: string | null;
  title: string;
  knowledgeObjects: string | null;
  objectives: string | null;
  methodology: string | null;
  observationsTemplate: string | null;
  plannedDate: string | null;
  lessonNumber: number;
  durationLessons: number;
  status: PlannedLessonStatus;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type TeachingPlanAssignmentSummary = {
  assignmentId: string;
  semester: string | null;
  classId: string;
  className: string;
  grade: string;
  letter: string | null;
  shift: string;
  room: string | null;
  course: string;
  schoolName: string;
  academicPeriodName: string;
  subjectId: string;
  subjectName: string;
  componentType: string | null;
};

export type TeachingPlanListItem = TeachingPlan & {
  assignment: TeachingPlanAssignmentSummary;
  unitsCount: number;
  lessonsCount: number;
};

export type TeachingPlanDetail = TeachingPlan & {
  assignment: TeachingPlanAssignmentSummary;
  units: PlanUnit[];
  lessons: PlannedLesson[];
};

export type TeachingPlanFilters = {
  assignmentId?: string;
  semester?: string;
  status?: TeachingPlanStatus;
  educationBase?: EducationBase;
};

export type CreateTeachingPlanInput = {
  teacherAssignmentId: string;
  title: string;
  description: string | null;
  educationBase: EducationBase;
  workloadHours: number | null;
  weeklyLessons: number | null;
  semester: string | null;
  status?: TeachingPlanStatus;
};

export type UpdateTeachingPlanInput = {
  id: string;
  title: string;
  description: string | null;
  educationBase: EducationBase;
  workloadHours: number | null;
  weeklyLessons: number | null;
  semester: string | null;
  status: TeachingPlanStatus;
};

export type ArchiveTeachingPlanInput = {
  id: string;
};

export type CreatePlanUnitInput = {
  teachingPlanId: string;
  title: string;
  description: string | null;
};

export type UpdatePlanUnitInput = {
  id: string;
  teachingPlanId: string;
  title: string;
  description: string | null;
};

export type DeletePlanUnitInput = {
  id: string;
  teachingPlanId: string;
};

export type ReorderPlanUnitsInput = {
  teachingPlanId: string;
  unitIdsInOrder: string[];
};

export type CreatePlannedLessonInput = {
  teachingPlanId: string;
  planUnitId: string | null;
  title: string;
  knowledgeObjects: string | null;
  objectives: string | null;
  methodology: string | null;
  observationsTemplate: string | null;
  plannedDate: string | null;
  lessonNumber: number;
  durationLessons: number;
  status?: PlannedLessonStatus;
};

export type UpdatePlannedLessonInput = {
  id: string;
  teachingPlanId: string;
  planUnitId: string | null;
  title: string;
  knowledgeObjects: string | null;
  objectives: string | null;
  methodology: string | null;
  observationsTemplate: string | null;
  plannedDate: string | null;
  lessonNumber: number;
  durationLessons: number;
  status: PlannedLessonStatus;
};

export type DeletePlannedLessonInput = {
  id: string;
  teachingPlanId: string;
};

export type ReorderPlannedLessonsInput = {
  teachingPlanId: string;
  lessonIdsInOrder: string[];
};

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

export type ActionResult<T> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; errors?: string[] };

export type QueryResult<T> = {
  data: T;
  error: string | null;
  configured: boolean;
};
