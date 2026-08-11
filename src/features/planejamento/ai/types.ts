import type { EducationBase, TeachingPlanStatus } from "../types";

export type AiProviderName = "openai" | "gemini";

export type AiPlanningContext = {
  targetPlanId: string | null;
  teacherAssignmentId: string;
  className: string;
  grade: string;
  letter: string | null;
  course: string;
  subjectName: string;
  componentType: string | null;
  semester: string | null;
  schoolName: string;
  currentPlanStatus?: TeachingPlanStatus;
};

export type AiPlanningRequest = {
  context: AiPlanningContext;
  educationBase: EducationBase;
  workloadHours: number | null;
  weeklyLessons: number | null;
  semester: string | null;
  description: string;
  generalObjectives: string[];
  observations: string | null;
};

export type AiPlanningDraftLesson = {
  lessonNumber: number;
  title: string;
  knowledgeObjects: string;
  objectives: string;
  methodology: string;
  observationsTemplate: string;
  plannedDate?: string | null;
  durationLessons: number;
  position: number;
};

export type AiPlanningDraftUnit = {
  title: string;
  description: string;
  position: number;
  lessons: AiPlanningDraftLesson[];
};

export type AiPlanningDraft = {
  title: string;
  description: string;
  educationBase: EducationBase;
  generalObjectives: string[];
  methodologies: string[];
  assessmentStrategies: string[];
  units: AiPlanningDraftUnit[];
};

export type AiGenerationResult = {
  provider: AiProviderName;
  draft: AiPlanningDraft;
  rawText: string;
};

export type AiGenerationActionState = {
  success: boolean;
  message: string | null;
  provider: AiProviderName | null;
  draft: AiPlanningDraft | null;
};
