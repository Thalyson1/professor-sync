import type { Database } from "@/types/database";

import type {
  CreatePlannedLessonInput,
  CreatePlanUnitInput,
  CreateTeachingPlanInput,
  UpdatePlannedLessonInput,
  UpdatePlanUnitInput,
  UpdateTeachingPlanInput
} from "../types";

export function buildTeachingPlanInsertPayload(
  input: CreateTeachingPlanInput
): Database["public"]["Tables"]["teaching_plans"]["Insert"] {
  return {
    teacher_assignment_id: input.teacherAssignmentId,
    title: input.title.trim(),
    description: normalizeNullableText(input.description),
    education_base: input.educationBase,
    workload_hours: input.workloadHours,
    weekly_lessons: input.weeklyLessons,
    semester: normalizeNullableText(input.semester),
    status: input.status ?? "draft"
  };
}

export function buildTeachingPlanUpdatePayload(
  input: UpdateTeachingPlanInput
): Database["public"]["Tables"]["teaching_plans"]["Update"] {
  return {
    title: input.title.trim(),
    description: normalizeNullableText(input.description),
    education_base: input.educationBase,
    workload_hours: input.workloadHours,
    weekly_lessons: input.weeklyLessons,
    semester: normalizeNullableText(input.semester),
    status: input.status
  };
}

export function buildPlanUnitInsertPayload(
  input: CreatePlanUnitInput,
  position: number
): Database["public"]["Tables"]["plan_units"]["Insert"] {
  return {
    teaching_plan_id: input.teachingPlanId,
    title: input.title.trim(),
    description: normalizeNullableText(input.description),
    position
  };
}

export function buildPlanUnitUpdatePayload(
  input: UpdatePlanUnitInput
): Database["public"]["Tables"]["plan_units"]["Update"] {
  return {
    title: input.title.trim(),
    description: normalizeNullableText(input.description)
  };
}

export function buildPlannedLessonInsertPayload(
  input: CreatePlannedLessonInput,
  position: number
): Database["public"]["Tables"]["planned_lessons"]["Insert"] {
  return {
    teaching_plan_id: input.teachingPlanId,
    plan_unit_id: input.planUnitId,
    title: input.title.trim(),
    knowledge_objects: normalizeNullableText(input.knowledgeObjects),
    objectives: normalizeNullableText(input.objectives),
    methodology: normalizeNullableText(input.methodology),
    observations_template: normalizeNullableText(input.observationsTemplate),
    planned_date: normalizeNullableText(input.plannedDate),
    lesson_number: input.lessonNumber,
    duration_lessons: input.durationLessons,
    status: input.status ?? "planned",
    position
  };
}

export function buildPlannedLessonUpdatePayload(
  input: UpdatePlannedLessonInput
): Database["public"]["Tables"]["planned_lessons"]["Update"] {
  return {
    plan_unit_id: input.planUnitId,
    title: input.title.trim(),
    knowledge_objects: normalizeNullableText(input.knowledgeObjects),
    objectives: normalizeNullableText(input.objectives),
    methodology: normalizeNullableText(input.methodology),
    observations_template: normalizeNullableText(input.observationsTemplate),
    planned_date: normalizeNullableText(input.plannedDate),
    lesson_number: input.lessonNumber,
    duration_lessons: input.durationLessons,
    status: input.status
  };
}

export function normalizeNullableText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";

  return normalized.length > 0 ? normalized : null;
}
