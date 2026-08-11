"use server";

import { revalidatePath } from "next/cache";

import { createRlsClient } from "@/lib/supabase/server";

import {
  createPlannedLessonSchema,
  createPlanUnitSchema,
  createTeachingPlanSchema,
  updateTeachingPlanSchema
} from "../schemas";
import { translateSupabaseError } from "../utils/errors";
import {
  buildPlannedLessonInsertPayload,
  buildPlannedLessonUpdatePayload,
  buildPlanUnitInsertPayload,
  buildPlanUnitUpdatePayload,
  buildTeachingPlanInsertPayload,
  buildTeachingPlanUpdatePayload
} from "../utils/payloads";
import { buildReorderMap, hasDuplicateIds } from "../utils/reorder";
import { canArchiveTeachingPlan, isPlannedLessonStatus } from "../utils/status-rules";

import type {
  ActionResult,
  ArchiveTeachingPlanInput,
  DeletePlannedLessonInput,
  DeletePlanUnitInput,
  PlannedLesson,
  PlanUnit,
  ReorderPlannedLessonsInput,
  ReorderPlanUnitsInput,
  TeachingPlan,
  UpdatePlannedLessonInput,
  UpdatePlanUnitInput
} from "../types";

export async function createTeachingPlan(
  input: unknown
): Promise<ActionResult<TeachingPlan>> {
  const parsed = createTeachingPlanSchema.safeParse(input);

  if (!parsed.success) {
    return fail(parsed.errors[0], parsed.errors);
  }

  try {
    const supabase = await createRlsClient();
    const payload = buildTeachingPlanInsertPayload(parsed.data);
    const { data, error } = await supabase
      .from("teaching_plans")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      return failFromError(error?.message ?? "Não foi possível criar o planejamento.");
    }

    revalidatePlanningRoutes(data.id);

    return ok("Planejamento criado com sucesso.", mapTeachingPlan(data));
  } catch (error) {
    return failUnexpected(error, "Não foi possível criar o planejamento.");
  }
}

export async function updateTeachingPlan(
  input: unknown
): Promise<ActionResult<TeachingPlan>> {
  const parsed = updateTeachingPlanSchema.safeParse(input);

  if (!parsed.success) {
    return fail(parsed.errors[0], parsed.errors);
  }

  try {
    const supabase = await createRlsClient();
    const current = await getExistingTeachingPlan(supabase, parsed.data.id);

    if (!current.success) {
      return current;
    }

    if (
      parsed.data.status === "active" &&
      (await hasAnotherActivePlan(
        supabase,
        current.data.teacher_assignment_id,
        parsed.data.semester,
        parsed.data.id
      ))
    ) {
      return fail("Já existe um planejamento ativo para esta atribuição e semestre.");
    }

    const payload = buildTeachingPlanUpdatePayload(parsed.data);
    const { data, error } = await supabase
      .from("teaching_plans")
      .update(payload)
      .eq("id", parsed.data.id)
      .select("*")
      .single();

    if (error || !data) {
      return failFromError(error?.message ?? "Não foi possível atualizar o planejamento.");
    }

    revalidatePlanningRoutes(data.id);

    return ok("Planejamento atualizado com sucesso.", mapTeachingPlan(data));
  } catch (error) {
    return failUnexpected(error, "Não foi possível atualizar o planejamento.");
  }
}

export async function archiveTeachingPlan(
  input: ArchiveTeachingPlanInput
): Promise<ActionResult<TeachingPlan>> {
  if (!input.id) {
    return fail("Informe o planejamento que será arquivado.");
  }

  try {
    const supabase = await createRlsClient();
    const current = await getExistingTeachingPlan(supabase, input.id);

    if (!current.success) {
      return current;
    }

    if (!canArchiveTeachingPlan(current.data.status)) {
      return fail("Este planejamento já está arquivado.");
    }

    const { data, error } = await supabase
      .from("teaching_plans")
      .update({ status: "archived" })
      .eq("id", input.id)
      .select("*")
      .single();

    if (error || !data) {
      return failFromError(error?.message ?? "Não foi possível arquivar o planejamento.");
    }

    revalidatePlanningRoutes(data.id);

    return ok("Planejamento arquivado com sucesso.", mapTeachingPlan(data));
  } catch (error) {
    return failUnexpected(error, "Não foi possível arquivar o planejamento.");
  }
}

export async function createPlanUnit(
  input: unknown
): Promise<ActionResult<PlanUnit>> {
  const parsed = createPlanUnitSchema.safeParse(input);

  if (!parsed.success) {
    return fail(parsed.errors[0], parsed.errors);
  }

  try {
    const supabase = await createRlsClient();
    const position = await getNextUnitPosition(supabase, parsed.data.teachingPlanId);
    const payload = buildPlanUnitInsertPayload(parsed.data, position);
    const { data, error } = await supabase
      .from("plan_units")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      return failFromError(error?.message ?? "Não foi possível criar a unidade.");
    }

    revalidatePlanningRoutes(parsed.data.teachingPlanId);

    return ok("Unidade criada com sucesso.", mapPlanUnit(data));
  } catch (error) {
    return failUnexpected(error, "Não foi possível criar a unidade.");
  }
}

export async function updatePlanUnit(
  input: UpdatePlanUnitInput
): Promise<ActionResult<PlanUnit>> {
  const parsed = createPlanUnitSchema.safeParse(input);

  if (!parsed.success || !input.id) {
    return fail(
      parsed.success ? "Informe a unidade que será atualizada." : parsed.errors[0],
      parsed.success ? undefined : parsed.errors
    );
  }

  try {
    const supabase = await createRlsClient();
    const { data: unit, error: unitError } = await supabase
      .from("plan_units")
      .select("*")
      .eq("id", input.id)
      .eq("teaching_plan_id", input.teachingPlanId)
      .maybeSingle();

    if (unitError || !unit) {
      return failFromError(unitError?.message ?? "A unidade informada não foi encontrada.");
    }

    const payload = buildPlanUnitUpdatePayload({
      id: input.id,
      teachingPlanId: parsed.data.teachingPlanId,
      title: parsed.data.title,
      description: parsed.data.description
    });

    const { data, error } = await supabase
      .from("plan_units")
      .update(payload)
      .eq("id", input.id)
      .select("*")
      .single();

    if (error || !data) {
      return failFromError(error?.message ?? "Não foi possível atualizar a unidade.");
    }

    revalidatePlanningRoutes(input.teachingPlanId);

    return ok("Unidade atualizada com sucesso.", mapPlanUnit(data));
  } catch (error) {
    return failUnexpected(error, "Não foi possível atualizar a unidade.");
  }
}

export async function deletePlanUnit(
  input: DeletePlanUnitInput
): Promise<ActionResult<{ id: string }>> {
  if (!input.id || !input.teachingPlanId) {
    return fail("Informe corretamente a unidade que será excluída.");
  }

  try {
    const supabase = await createRlsClient();
    const { error } = await supabase
      .from("plan_units")
      .delete()
      .eq("id", input.id)
      .eq("teaching_plan_id", input.teachingPlanId);

    if (error) {
      return failFromError(error.message);
    }

    revalidatePlanningRoutes(input.teachingPlanId);

    return ok("Unidade excluída com sucesso.", { id: input.id });
  } catch (error) {
    return failUnexpected(error, "Não foi possível excluir a unidade.");
  }
}

export async function createPlannedLesson(
  input: unknown
): Promise<ActionResult<PlannedLesson>> {
  const parsed = createPlannedLessonSchema.safeParse(input);

  if (!parsed.success) {
    return fail(parsed.errors[0], parsed.errors);
  }

  try {
    const supabase = await createRlsClient();

    if (parsed.data.planUnitId) {
      const unitValidation = await ensureUnitBelongsToPlan(
        supabase,
        parsed.data.planUnitId,
        parsed.data.teachingPlanId
      );

      if (!unitValidation.success) {
        return unitValidation;
      }
    }

    if (
      await hasLessonNumberConflict(
        supabase,
        parsed.data.teachingPlanId,
        parsed.data.lessonNumber
      )
    ) {
      return fail("O número da aula já está em uso neste planejamento.");
    }

    const position = await getNextLessonPosition(supabase, parsed.data.teachingPlanId);
    const payload = buildPlannedLessonInsertPayload(parsed.data, position);
    const { data, error } = await supabase
      .from("planned_lessons")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      return failFromError(error?.message ?? "Não foi possível criar a aula planejada.");
    }

    revalidatePlanningRoutes(parsed.data.teachingPlanId);

    return ok("Aula planejada criada com sucesso.", mapPlannedLesson(data));
  } catch (error) {
    return failUnexpected(error, "Não foi possível criar a aula planejada.");
  }
}

export async function updatePlannedLesson(
  input: UpdatePlannedLessonInput
): Promise<ActionResult<PlannedLesson>> {
  const parsed = createPlannedLessonSchema.safeParse(input);

  if (!parsed.success || !input.id || !input.status || !isPlannedLessonStatus(input.status)) {
    return fail(
      parsed.success
        ? "Informe um status válido para a aula planejada."
        : parsed.errors[0],
      parsed.success ? undefined : parsed.errors
    );
  }

  try {
    const supabase = await createRlsClient();

    if (parsed.data.planUnitId) {
      const unitValidation = await ensureUnitBelongsToPlan(
        supabase,
        parsed.data.planUnitId,
        parsed.data.teachingPlanId
      );

      if (!unitValidation.success) {
        return unitValidation;
      }
    }

    if (
      await hasLessonNumberConflict(
        supabase,
        parsed.data.teachingPlanId,
        parsed.data.lessonNumber,
        input.id
      )
    ) {
      return fail("O número da aula já está em uso neste planejamento.");
    }

    const payload = buildPlannedLessonUpdatePayload({
      id: input.id,
      teachingPlanId: parsed.data.teachingPlanId,
      planUnitId: parsed.data.planUnitId,
      title: parsed.data.title,
      knowledgeObjects: parsed.data.knowledgeObjects,
      objectives: parsed.data.objectives,
      methodology: parsed.data.methodology,
      observationsTemplate: parsed.data.observationsTemplate,
      plannedDate: parsed.data.plannedDate,
      lessonNumber: parsed.data.lessonNumber,
      durationLessons: parsed.data.durationLessons,
      status: input.status
    });

    const { data, error } = await supabase
      .from("planned_lessons")
      .update(payload)
      .eq("id", input.id)
      .eq("teaching_plan_id", input.teachingPlanId)
      .select("*")
      .single();

    if (error || !data) {
      return failFromError(error?.message ?? "Não foi possível atualizar a aula planejada.");
    }

    revalidatePlanningRoutes(input.teachingPlanId);

    return ok("Aula planejada atualizada com sucesso.", mapPlannedLesson(data));
  } catch (error) {
    return failUnexpected(error, "Não foi possível atualizar a aula planejada.");
  }
}

export async function deletePlannedLesson(
  input: DeletePlannedLessonInput
): Promise<ActionResult<{ id: string }>> {
  if (!input.id || !input.teachingPlanId) {
    return fail("Informe corretamente a aula que será excluída.");
  }

  try {
    const supabase = await createRlsClient();
    const { error } = await supabase
      .from("planned_lessons")
      .delete()
      .eq("id", input.id)
      .eq("teaching_plan_id", input.teachingPlanId);

    if (error) {
      return failFromError(error.message);
    }

    revalidatePlanningRoutes(input.teachingPlanId);

    return ok("Aula planejada excluída com sucesso.", { id: input.id });
  } catch (error) {
    return failUnexpected(error, "Não foi possível excluir a aula planejada.");
  }
}

export async function reorderPlanUnits(
  input: ReorderPlanUnitsInput
): Promise<ActionResult<{ teachingPlanId: string }>> {
  if (!input.teachingPlanId || input.unitIdsInOrder.length === 0) {
    return fail("Informe a ordem das unidades do planejamento.");
  }

  if (hasDuplicateIds(input.unitIdsInOrder)) {
    return fail("A lista de unidades contém duplicidades.");
  }

  try {
    const supabase = await createRlsClient();
    const { data: units, error } = await supabase
      .from("plan_units")
      .select("id, teaching_plan_id, position")
      .eq("teaching_plan_id", input.teachingPlanId);

    if (error || !units) {
      return failFromError(error?.message ?? "Não foi possível carregar as unidades para reordenação.");
    }

    if (units.length !== input.unitIdsInOrder.length) {
      return fail("A lista de unidades está incompleta para esta operação.");
    }

    for (const reorderItem of buildReorderMap(input.unitIdsInOrder)) {
      const { error: updateError } = await supabase
        .from("plan_units")
        .update({ position: reorderItem.position + 1000 })
        .eq("id", reorderItem.id)
        .eq("teaching_plan_id", input.teachingPlanId);

      if (updateError) {
        return failFromError(updateError.message);
      }
    }

    for (const reorderItem of buildReorderMap(input.unitIdsInOrder)) {
      const { error: updateError } = await supabase
        .from("plan_units")
        .update({ position: reorderItem.position })
        .eq("id", reorderItem.id)
        .eq("teaching_plan_id", input.teachingPlanId);

      if (updateError) {
        return failFromError(updateError.message);
      }
    }

    revalidatePlanningRoutes(input.teachingPlanId);

    return ok("Unidades reordenadas com sucesso.", {
      teachingPlanId: input.teachingPlanId
    });
  } catch (error) {
    return failUnexpected(error, "Não foi possível reordenar as unidades.");
  }
}

export async function reorderPlannedLessons(
  input: ReorderPlannedLessonsInput
): Promise<ActionResult<{ teachingPlanId: string }>> {
  if (!input.teachingPlanId || input.lessonIdsInOrder.length === 0) {
    return fail("Informe a ordem das aulas do planejamento.");
  }

  if (hasDuplicateIds(input.lessonIdsInOrder)) {
    return fail("A lista de aulas contém duplicidades.");
  }

  try {
    const supabase = await createRlsClient();
    const { data: lessons, error } = await supabase
      .from("planned_lessons")
      .select("id, teaching_plan_id")
      .eq("teaching_plan_id", input.teachingPlanId);

    if (error || !lessons) {
      return failFromError(error?.message ?? "Não foi possível carregar as aulas para reordenação.");
    }

    if (lessons.length !== input.lessonIdsInOrder.length) {
      return fail("A lista de aulas está incompleta para esta operação.");
    }

    for (const reorderItem of buildReorderMap(input.lessonIdsInOrder)) {
      const { error: updateError } = await supabase
        .from("planned_lessons")
        .update({ position: reorderItem.position + 1000 })
        .eq("id", reorderItem.id)
        .eq("teaching_plan_id", input.teachingPlanId);

      if (updateError) {
        return failFromError(updateError.message);
      }
    }

    for (const reorderItem of buildReorderMap(input.lessonIdsInOrder)) {
      const { error: updateError } = await supabase
        .from("planned_lessons")
        .update({ position: reorderItem.position })
        .eq("id", reorderItem.id)
        .eq("teaching_plan_id", input.teachingPlanId);

      if (updateError) {
        return failFromError(updateError.message);
      }
    }

    revalidatePlanningRoutes(input.teachingPlanId);

    return ok("Aulas reordenadas com sucesso.", {
      teachingPlanId: input.teachingPlanId
    });
  } catch (error) {
    return failUnexpected(error, "Não foi possível reordenar as aulas.");
  }
}

async function getExistingTeachingPlan(
  supabase: Awaited<ReturnType<typeof createRlsClient>>,
  planId: string
): Promise<ActionResult<TeachingPlan & { teacher_assignment_id: string }>> {
  const { data, error } = await supabase
    .from("teaching_plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();

  if (error || !data) {
    return failFromError(error?.message ?? "Planejamento não encontrado.");
  }

  return ok("Planejamento encontrado.", {
    ...mapTeachingPlan(data),
    teacher_assignment_id: data.teacher_assignment_id
  });
}

async function hasAnotherActivePlan(
  supabase: Awaited<ReturnType<typeof createRlsClient>>,
  teacherAssignmentId: string,
  semester: string | null,
  currentPlanId?: string
) {
  let query = supabase
    .from("teaching_plans")
    .select("id")
    .eq("teacher_assignment_id", teacherAssignmentId)
    .eq("status", "active");

  query =
    semester === null ? query.is("semester", null) : query.eq("semester", semester);

  if (currentPlanId) {
    query = query.neq("id", currentPlanId);
  }

  const { data } = await query.limit(1);

  return (data?.length ?? 0) > 0;
}

async function ensureUnitBelongsToPlan(
  supabase: Awaited<ReturnType<typeof createRlsClient>>,
  unitId: string,
  teachingPlanId: string
): Promise<ActionResult<{ id: string }>> {
  const { data, error } = await supabase
    .from("plan_units")
    .select("id")
    .eq("id", unitId)
    .eq("teaching_plan_id", teachingPlanId)
    .maybeSingle();

  if (error || !data) {
    return failFromError(
      error?.message ?? "A unidade informada não pertence a este planejamento."
    );
  }

  return ok("Unidade validada.", data);
}

async function hasLessonNumberConflict(
  supabase: Awaited<ReturnType<typeof createRlsClient>>,
  teachingPlanId: string,
  lessonNumber: number,
  currentLessonId?: string
) {
  let query = supabase
    .from("planned_lessons")
    .select("id")
    .eq("teaching_plan_id", teachingPlanId)
    .eq("lesson_number", lessonNumber);

  if (currentLessonId) {
    query = query.neq("id", currentLessonId);
  }

  const { data } = await query.limit(1);

  return (data?.length ?? 0) > 0;
}

async function getNextUnitPosition(
  supabase: Awaited<ReturnType<typeof createRlsClient>>,
  teachingPlanId: string
) {
  const { data } = await supabase
    .from("plan_units")
    .select("position")
    .eq("teaching_plan_id", teachingPlanId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.position ?? -1) + 1;
}

async function getNextLessonPosition(
  supabase: Awaited<ReturnType<typeof createRlsClient>>,
  teachingPlanId: string
) {
  const { data } = await supabase
    .from("planned_lessons")
    .select("position")
    .eq("teaching_plan_id", teachingPlanId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.position ?? -1) + 1;
}

function revalidatePlanningRoutes(planId: string) {
  revalidatePath("/planejamento");
  revalidatePath("/planejamento/novo");
  revalidatePath(`/planejamento/${planId}`);
}

function mapTeachingPlan(
  row: {
    id: string;
    teacher_assignment_id: string;
    title: string;
    description: string | null;
    education_base: TeachingPlan["educationBase"];
    workload_hours: number | null;
    weekly_lessons: number | null;
    semester: string | null;
    status: TeachingPlan["status"];
    created_at: string;
    updated_at: string;
  }
): TeachingPlan {
  return {
    id: row.id,
    teacherAssignmentId: row.teacher_assignment_id,
    title: row.title,
    description: row.description,
    educationBase: row.education_base,
    workloadHours: row.workload_hours,
    weeklyLessons: row.weekly_lessons,
    semester: row.semester,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapPlanUnit(row: {
  id: string;
  teaching_plan_id: string;
  title: string;
  description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}): PlanUnit {
  return {
    id: row.id,
    teachingPlanId: row.teaching_plan_id,
    title: row.title,
    description: row.description,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapPlannedLesson(row: {
  id: string;
  teaching_plan_id: string;
  plan_unit_id: string | null;
  title: string;
  knowledge_objects: string | null;
  objectives: string | null;
  methodology: string | null;
  observations_template: string | null;
  planned_date: string | null;
  lesson_number: number;
  duration_lessons: number;
  status: PlannedLesson["status"];
  position: number;
  created_at: string;
  updated_at: string;
}): PlannedLesson {
  return {
    id: row.id,
    teachingPlanId: row.teaching_plan_id,
    planUnitId: row.plan_unit_id,
    title: row.title,
    knowledgeObjects: row.knowledge_objects,
    objectives: row.objectives,
    methodology: row.methodology,
    observationsTemplate: row.observations_template,
    plannedDate: row.planned_date,
    lessonNumber: row.lesson_number,
    durationLessons: row.duration_lessons,
    status: row.status,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function ok<T>(message: string, data: T): ActionResult<T> {
  return { success: true, message, data };
}

function fail(message: string, errors?: string[]): ActionResult<never> {
  return { success: false, message, errors };
}

function failFromError(message: string): ActionResult<never> {
  return fail(translateSupabaseError(message));
}

function failUnexpected(error: unknown, fallback: string): ActionResult<never> {
  if (error instanceof Error) {
    return fail(translateSupabaseError(error.message));
  }

  return fail(fallback);
}
