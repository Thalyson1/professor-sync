export * from "./types/index";

import type { EducationBase, TeachingPlanStatus } from "./types/index";

export type PlanningAssignmentListItem = {
  assignmentId: string;
  planId: string | null;
  turmaNome: string;
  serie: string;
  letra: string | null;
  disciplinaNome: string;
  semester: string;
  componentType: string | null;
  educationBase: EducationBase | null;
  planStatus: TeachingPlanStatus | "missing";
  lessonCount: number;
  schoolName: string;
};
