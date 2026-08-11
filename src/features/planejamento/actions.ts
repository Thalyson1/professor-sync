"use server";

import { redirect } from "next/navigation";

import { generateTeachingPlanDraft } from "./ai/provider";
import { parseAiPlanningDraft } from "./ai/parser";
import { createRlsClient } from "@/lib/supabase/server";
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

import type { AiGenerationActionState } from "./ai/types";

const initialAiGenerationState: AiGenerationActionState = {
  success: false,
  message: null,
  provider: null,
  draft: null
};

export async function generateTeachingPlanWithAiAction(
  _previousState: AiGenerationActionState,
  formData: FormData
): Promise<AiGenerationActionState> {
  try {
    const result = await generateTeachingPlanDraft({
      context: {
        targetPlanId: getOptionalString(formData, "targetPlanId"),
        teacherAssignmentId: getString(formData, "teacherAssignmentId"),
        className: getString(formData, "className"),
        grade: getString(formData, "grade"),
        letter: getOptionalString(formData, "letter"),
        course: getString(formData, "course"),
        subjectName: getString(formData, "subjectName"),
        componentType: getOptionalString(formData, "componentType"),
        semester: getOptionalString(formData, "assignmentSemester"),
        schoolName: getString(formData, "schoolName"),
        currentPlanStatus: getOptionalStatus(formData, "currentPlanStatus")
      },
      educationBase: getString(formData, "educationBase") as "technical" | "bncc",
      workloadHours: getOptionalNumber(formData, "workloadHours"),
      weeklyLessons: getOptionalInteger(formData, "weeklyLessons"),
      semester: getOptionalString(formData, "semester"),
      description: getString(formData, "description"),
      generalObjectives: getLines(formData, "generalObjectives"),
      observations: getOptionalString(formData, "observations")
    });

    return {
      success: true,
      message: "Rascunho gerado com sucesso. Revise e edite antes de aplicar.",
      provider: result.provider,
      draft: result.draft
    };
  } catch (error) {
    return {
      ...initialAiGenerationState,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o rascunho com IA."
    };
  }
}

export async function applyGeneratedTeachingPlanAction(formData: FormData) {
  const targetPlanId = getOptionalString(formData, "targetPlanId");
  const teacherAssignmentId = getString(formData, "teacherAssignmentId");
  const planStatus = getOptionalStatus(formData, "planStatus") ?? "draft";
  const draftPayload = getString(formData, "draftPayload");

  let parsedPayload: unknown;

  try {
    parsedPayload = JSON.parse(draftPayload);
  } catch {
    redirectWithError(
      targetPlanId,
      "O rascunho revisado ficou inválido. Gere novamente antes de aplicar."
    );
  }

  const parsedDraft = parseAiPlanningDraft(parsedPayload);

  if (!parsedDraft.success) {
    redirectWithError(targetPlanId, parsedDraft.errors[0]);
  }

  try {
    const supabase = await createRlsClient();
    const { data, error } = await supabase.rpc("apply_ai_teaching_plan_draft", {
      p_target_plan_id: targetPlanId,
      p_teacher_assignment_id: teacherAssignmentId,
      p_title: parsedDraft.data.title,
      p_description: buildPersistedPlanDescription(parsedDraft.data),
      p_education_base: parsedDraft.data.educationBase,
      p_workload_hours: getOptionalNumber(formData, "workloadHours"),
      p_weekly_lessons: getOptionalInteger(formData, "weeklyLessons"),
      p_semester: getOptionalString(formData, "semester"),
      p_status: planStatus,
      p_units: parsedDraft.data.units
    });

    if (error || !data) {
      redirectWithError(
        targetPlanId,
        error?.message ?? "Não foi possível aplicar o rascunho de IA ao planejamento."
      );
    }

    redirect(
      `/planejamento/${data}?notice=${encodeURIComponent(
        "Rascunho da IA aplicado com sucesso. Revise o planejamento salvo."
      )}`
    );
  } catch (error) {
    redirectWithError(
      targetPlanId,
      error instanceof Error
        ? error.message
        : "Não foi possível aplicar o rascunho de IA."
    );
  }
}

export async function getInitialAiGenerationStateAction() {
  return initialAiGenerationState;
}

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

function getLines(formData: FormData, key: string) {
  return getString(formData, key)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function getOptionalStatus(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (value === "draft" || value === "active" || value === "completed" || value === "archived") {
    return value;
  }

  return undefined;
}

function buildPersistedPlanDescription(
  draft: import("./ai/types").AiPlanningDraft
) {
  const sections = [draft.description.trim()];

  if (draft.generalObjectives.length > 0) {
    sections.push(
      ["Objetivos gerais:", ...draft.generalObjectives.map((item) => `- ${item}`)].join("\n")
    );
  }

  if (draft.methodologies.length > 0) {
    sections.push(
      ["Metodologias sugeridas:", ...draft.methodologies.map((item) => `- ${item}`)].join(
        "\n"
      )
    );
  }

  if (draft.assessmentStrategies.length > 0) {
    sections.push(
      [
        "Estratégias de avaliação:",
        ...draft.assessmentStrategies.map((item) => `- ${item}`)
      ].join("\n")
    );
  }

  return sections.filter((section) => section.trim().length > 0).join("\n\n");
}

function redirectWithError(targetPlanId: string | null, message: string): never {
  if (targetPlanId) {
    redirect(`/planejamento/${targetPlanId}/ia?error=${encodeURIComponent(message)}`);
  }

  redirect(`/planejamento/novo/ia?error=${encodeURIComponent(message)}`);
}
