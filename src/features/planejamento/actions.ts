"use server";

import { redirect } from "next/navigation";

import { getTeachingPlanById } from "./queries";
import {
  archiveTeachingPlan,
  createPlannedLesson,
  createPlanUnit,
  createTeachingPlan,
  deletePlannedLesson,
  deletePlanUnit,
  reorderPlannedLessons,
  reorderPlanUnits,
  updatePlannedLesson,
  updatePlanUnit,
  updateTeachingPlan
} from "./actions/index";
import { isPlannedLessonStatus } from "./utils/status-rules";

export async function createTeachingPlanAction(formData: FormData) {
  const result = await createTeachingPlan({
    teacherAssignmentId: getString(formData, "teacherAssignmentId"),
    title: getString(formData, "title"),
    description: getOptionalString(formData, "description"),
    educationBase: getString(formData, "educationBase"),
    workloadHours: getOptionalNumber(formData, "workloadHours"),
    weeklyLessons: getOptionalInteger(formData, "weeklyLessons"),
    semester: getOptionalString(formData, "semester"),
    status: "draft"
  });

  if (!result.success) {
    redirect(`/planejamento/novo?error=${encodeURIComponent(result.message)}`);
  }

  redirect(`/planejamento/${result.data.id}?notice=${encodeURIComponent(result.message)}`);
}

export async function updateTeachingPlanAction(formData: FormData) {
  const planId = getString(formData, "planId");
  const result = await updateTeachingPlan({
    id: planId,
    title: getString(formData, "title"),
    description: getOptionalString(formData, "description"),
    educationBase: getString(formData, "educationBase"),
    workloadHours: getOptionalNumber(formData, "workloadHours"),
    weeklyLessons: getOptionalInteger(formData, "weeklyLessons"),
    semester: getOptionalString(formData, "semester"),
    status: getString(formData, "status")
  });

  redirectToPlanResult(planId, result);
}

export async function deleteTeachingPlanAction(formData: FormData) {
  const planId = getString(formData, "planId");
  const result = await archiveTeachingPlan({ id: planId });

  if (!result.success) {
    redirect(`/planejamento/${planId}?error=${encodeURIComponent(result.message)}`);
  }

  redirect(`/planejamento?notice=${encodeURIComponent(result.message)}`);
}

export async function createPlanUnitAction(formData: FormData) {
  const planId = getString(formData, "planId");
  const result = await createPlanUnit({
    teachingPlanId: planId,
    title: getString(formData, "title"),
    description: getOptionalString(formData, "description")
  });

  redirectToPlanResult(planId, result);
}

export async function updatePlanUnitAction(formData: FormData) {
  const planId = getString(formData, "planId");
  const result = await updatePlanUnit({
    id: getString(formData, "unitId"),
    teachingPlanId: planId,
    title: getString(formData, "title"),
    description: getOptionalString(formData, "description")
  });

  redirectToPlanResult(planId, result);
}

export async function deletePlanUnitAction(formData: FormData) {
  const planId = getString(formData, "planId");
  const result = await deletePlanUnit({
    id: getString(formData, "unitId"),
    teachingPlanId: planId
  });

  redirectToPlanResult(planId, result);
}

export async function createPlannedLessonAction(formData: FormData) {
  const planId = getString(formData, "planId");
  const result = await createPlannedLesson({
    teachingPlanId: planId,
    planUnitId: getOptionalString(formData, "planUnitId"),
    title: getString(formData, "title"),
    knowledgeObjects: getOptionalString(formData, "knowledgeObjects"),
    objectives: getOptionalString(formData, "objectives"),
    methodology: getOptionalString(formData, "methodology"),
    observationsTemplate: getOptionalString(formData, "observationsTemplate"),
    plannedDate: getOptionalString(formData, "plannedDate"),
    lessonNumber: getOptionalInteger(formData, "lessonNumber") ?? 1,
    durationLessons: getOptionalInteger(formData, "durationLessons") ?? 1,
    status: "planned"
  });

  redirectToPlanResult(planId, result);
}

export async function updatePlannedLessonAction(formData: FormData) {
  const planId = getString(formData, "planId");
  const rawStatus = getString(formData, "status");
  const result = await updatePlannedLesson({
    id: getString(formData, "lessonId"),
    teachingPlanId: planId,
    planUnitId: getOptionalString(formData, "planUnitId"),
    title: getString(formData, "title"),
    knowledgeObjects: getOptionalString(formData, "knowledgeObjects"),
    objectives: getOptionalString(formData, "objectives"),
    methodology: getOptionalString(formData, "methodology"),
    observationsTemplate: getOptionalString(formData, "observationsTemplate"),
    plannedDate: getOptionalString(formData, "plannedDate"),
    lessonNumber: getOptionalInteger(formData, "lessonNumber") ?? 1,
    durationLessons: getOptionalInteger(formData, "durationLessons") ?? 1,
    status: isPlannedLessonStatus(rawStatus) ? rawStatus : "planned"
  });

  redirectToPlanResult(planId, result);
}

export async function deletePlannedLessonAction(formData: FormData) {
  const planId = getString(formData, "planId");
  const result = await deletePlannedLesson({
    id: getString(formData, "lessonId"),
    teachingPlanId: planId
  });

  redirectToPlanResult(planId, result);
}

export async function movePlanUnitAction(formData: FormData) {
  const planId = getString(formData, "planId");
  const unitId = getString(formData, "unitId");
  const direction = getString(formData, "direction");
  const detail = await getTeachingPlanById(planId);

  if (!detail.data) {
    redirect(`/planejamento/${planId}?error=${encodeURIComponent(detail.error ?? "Planejamento não encontrado.")}`);
  }

  const reordered = moveId(
    detail.data.units.map((unit) => unit.id),
    unitId,
    direction
  );

  if (!reordered) {
    redirect(`/planejamento/${planId}?error=${encodeURIComponent("Não foi possível reordenar a unidade.")}`);
  }

  const result = await reorderPlanUnits({
    teachingPlanId: planId,
    unitIdsInOrder: reordered
  });

  redirectToPlanResult(planId, result);
}

export async function movePlannedLessonAction(formData: FormData) {
  const planId = getString(formData, "planId");
  const lessonId = getString(formData, "lessonId");
  const direction = getString(formData, "direction");
  const detail = await getTeachingPlanById(planId);

  if (!detail.data) {
    redirect(`/planejamento/${planId}?error=${encodeURIComponent(detail.error ?? "Planejamento não encontrado.")}`);
  }

  const reordered = moveId(
    detail.data.lessons.map((lesson) => lesson.id),
    lessonId,
    direction
  );

  if (!reordered) {
    redirect(`/planejamento/${planId}?error=${encodeURIComponent("Não foi possível reordenar a aula.")}`);
  }

  const result = await reorderPlannedLessons({
    teachingPlanId: planId,
    lessonIdsInOrder: reordered
  });

  redirectToPlanResult(planId, result);
}

function redirectToPlanResult(
  planId: string,
  result: { success: boolean; message: string }
) {
  if (!result.success) {
    redirect(`/planejamento/${planId}?error=${encodeURIComponent(result.message)}`);
  }

  redirect(`/planejamento/${planId}?notice=${encodeURIComponent(result.message)}`);
}

function moveId(ids: string[], targetId: string, direction: string) {
  const currentIndex = ids.findIndex((id) => id === targetId);

  if (currentIndex < 0) {
    return null;
  }

  const nextIndex =
    direction === "up"
      ? currentIndex - 1
      : direction === "down"
        ? currentIndex + 1
        : -1;

  if (nextIndex < 0 || nextIndex >= ids.length) {
    return null;
  }

  const reordered = [...ids];
  [reordered[currentIndex], reordered[nextIndex]] = [
    reordered[nextIndex],
    reordered[currentIndex]
  ];

  return reordered;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value.length > 0 ? value : null;
}

function getOptionalNumber(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getOptionalInteger(formData: FormData, key: string) {
  const value = getOptionalNumber(formData, key);
  return value !== null && Number.isInteger(value) ? value : null;
}
