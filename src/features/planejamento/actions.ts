"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createRlsClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

import { SIAGE_METHODOLOGIES } from "./constants";

type ActionResult = never;

export async function createTeachingPlanAction(
  formData: FormData
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    redirect("/planejamento?error=Supabase%20n%C3%A3o%20configurado");
  }

  const teacherAssignmentId = getRequiredString(formData, "teacherAssignmentId");
  const title = getRequiredString(formData, "title");
  const educationBase = getRequiredString(formData, "educationBase");
  const workloadHours = getPositiveNumber(formData, "workloadHours");
  const weeklyLessons = getPositiveNumber(formData, "weeklyLessons");
  const semester = getRequiredString(formData, "semester");
  const description = getOptionalString(formData, "description");

  if (!teacherAssignmentId || !title || !educationBase || !workloadHours || !weeklyLessons || !semester) {
    redirect(
      `/planejamento/novo?${buildParams({
        atribuicao: teacherAssignmentId,
        error: "Preencha todos os campos obrigatórios do planejamento."
      })}`
    );
  }

  const payload: Database["public"]["Tables"]["teaching_plans"]["Insert"] = {
    teacher_assignment_id: teacherAssignmentId,
    title,
    education_base: educationBase as Database["public"]["Tables"]["teaching_plans"]["Insert"]["education_base"],
    workload_hours: workloadHours,
    weekly_lessons: weeklyLessons,
    semester,
    description,
    status: "draft"
  };

  const supabase = await createRlsClient();
  const { data, error } = await supabase
    .from("teaching_plans")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      `/planejamento/novo?${buildParams({
        atribuicao: teacherAssignmentId,
        error: error?.message ?? "Não foi possível criar o planejamento."
      })}`
    );
  }

  revalidatePath("/planejamento");
  redirect(`/planejamento/${data.id}?notice=created`);
}

export async function updateTeachingPlanAction(
  formData: FormData
): Promise<ActionResult> {
  const planId = getRequiredString(formData, "planId");
  const title = getRequiredString(formData, "title");
  const description = getOptionalString(formData, "description");
  const educationBase = getRequiredString(formData, "educationBase");
  const workloadHours = getPositiveNumber(formData, "workloadHours");
  const weeklyLessons = getPositiveNumber(formData, "weeklyLessons");
  const semester = getRequiredString(formData, "semester");
  const status = getRequiredString(formData, "status");

  if (!planId || !title || !educationBase || !workloadHours || !weeklyLessons || !semester || !status) {
    redirect(`/planejamento/${planId}?error=Preencha%20todos%20os%20campos%20obrigat%C3%B3rios`);
  }

  const payload: Database["public"]["Tables"]["teaching_plans"]["Update"] = {
    title,
    description,
    education_base: educationBase as Database["public"]["Tables"]["teaching_plans"]["Update"]["education_base"],
    workload_hours: workloadHours,
    weekly_lessons: weeklyLessons,
    semester,
    status: status as Database["public"]["Tables"]["teaching_plans"]["Update"]["status"]
  };

  const supabase = await createRlsClient();
  const { error } = await supabase
    .from("teaching_plans")
    .update(payload)
    .eq("id", planId);

  if (error) {
    redirect(`/planejamento/${planId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/planejamento");
  revalidatePath(`/planejamento/${planId}`);
  redirect(`/planejamento/${planId}?notice=updated`);
}

export async function deleteTeachingPlanAction(
  formData: FormData
): Promise<ActionResult> {
  const planId = getRequiredString(formData, "planId");

  if (!planId) {
    redirect("/planejamento?error=Plano%20inv%C3%A1lido");
  }

  const supabase = await createRlsClient();
  const { error } = await supabase.from("teaching_plans").delete().eq("id", planId);

  if (error) {
    redirect(`/planejamento/${planId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/planejamento");
  redirect("/planejamento?notice=deleted");
}

export async function createPlanUnitAction(formData: FormData): Promise<ActionResult> {
  const planId = getRequiredString(formData, "planId");
  const title = getRequiredString(formData, "title");
  const description = getOptionalString(formData, "description");

  if (!planId || !title) {
    redirect(`/planejamento/${planId}?error=Informe%20o%20t%C3%ADtulo%20da%20unidade`);
  }

  const supabase = await createRlsClient();
  const { data: lastUnit } = await supabase
    .from("plan_units")
    .select("position")
    .eq("teaching_plan_id", planId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload: Database["public"]["Tables"]["plan_units"]["Insert"] = {
    teaching_plan_id: planId,
    title,
    description,
    position: (lastUnit?.position ?? 0) + 1
  };

  const { error } = await supabase.from("plan_units").insert(payload);

  if (error) {
    redirect(`/planejamento/${planId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/planejamento/${planId}`);
  redirect(`/planejamento/${planId}?notice=unit-created`);
}

export async function updatePlanUnitAction(formData: FormData): Promise<ActionResult> {
  const planId = getRequiredString(formData, "planId");
  const unitId = getRequiredString(formData, "unitId");
  const title = getRequiredString(formData, "title");
  const description = getOptionalString(formData, "description");

  if (!planId || !unitId || !title) {
    redirect(`/planejamento/${planId}?error=Dados%20inv%C3%A1lidos%20da%20unidade`);
  }

  const supabase = await createRlsClient();
  const { error } = await supabase
    .from("plan_units")
    .update({ title, description })
    .eq("id", unitId);

  if (error) {
    redirect(`/planejamento/${planId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/planejamento/${planId}`);
  redirect(`/planejamento/${planId}?notice=unit-updated`);
}

export async function movePlanUnitAction(formData: FormData): Promise<ActionResult> {
  const planId = getRequiredString(formData, "planId");
  const unitId = getRequiredString(formData, "unitId");
  const direction = getRequiredString(formData, "direction");

  if (!planId || !unitId || !direction) {
    redirect(`/planejamento/${planId}?error=Movimenta%C3%A7%C3%A3o%20inv%C3%A1lida`);
  }

  const supabase = await createRlsClient();
  const { data: units, error } = await supabase
    .from("plan_units")
    .select("id, position")
    .eq("teaching_plan_id", planId)
    .order("position", { ascending: true });

  if (error || !units) {
    redirect(`/planejamento/${planId}?error=${encodeURIComponent(error?.message ?? "Não foi possível ordenar as unidades.")}`);
  }

  const currentIndex = units.findIndex((unit) => unit.id === unitId);
  const targetIndex =
    direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= units.length) {
    redirect(`/planejamento/${planId}?notice=no-change`);
  }

  const currentUnit = units[currentIndex];
  const targetUnit = units[targetIndex];

  await supabase.from("plan_units").update({ position: -1 }).eq("id", currentUnit.id);
  await supabase
    .from("plan_units")
    .update({ position: currentUnit.position })
    .eq("id", targetUnit.id);
  await supabase
    .from("plan_units")
    .update({ position: targetUnit.position })
    .eq("id", currentUnit.id);

  revalidatePath(`/planejamento/${planId}`);
  redirect(`/planejamento/${planId}?notice=unit-moved`);
}

export async function deletePlanUnitAction(formData: FormData): Promise<ActionResult> {
  const planId = getRequiredString(formData, "planId");
  const unitId = getRequiredString(formData, "unitId");

  if (!planId || !unitId) {
    redirect(`/planejamento/${planId}?error=Unidade%20inv%C3%A1lida`);
  }

  const supabase = await createRlsClient();
  const { error } = await supabase.from("plan_units").delete().eq("id", unitId);

  if (error) {
    redirect(`/planejamento/${planId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/planejamento/${planId}`);
  redirect(`/planejamento/${planId}?notice=unit-deleted`);
}

export async function createPlannedLessonAction(
  formData: FormData
): Promise<ActionResult> {
  const planId = getRequiredString(formData, "planId");
  const planUnitId = getOptionalString(formData, "planUnitId");
  const title = getRequiredString(formData, "title");
  const knowledgeObjects = getOptionalString(formData, "knowledgeObjects");
  const objectives = getOptionalString(formData, "objectives");
  const methodology = getOptionalString(formData, "methodology");
  const observationsTemplate = getOptionalString(formData, "observationsTemplate");
  const plannedDate = getOptionalString(formData, "plannedDate");
  const durationLessons = getPositiveNumber(formData, "durationLessons");

  if (!planId || !title || !durationLessons) {
    redirect(`/planejamento/${planId}?error=Preencha%20os%20campos%20obrigat%C3%B3rios%20da%20aula`);
  }

  if (methodology && !SIAGE_METHODOLOGIES.includes(methodology as (typeof SIAGE_METHODOLOGIES)[number])) {
    redirect(`/planejamento/${planId}?error=Metodologia%20inv%C3%A1lida`);
  }

  const supabase = await createRlsClient();
  const { data: lastLesson } = await supabase
    .from("planned_lessons")
    .select("position, lesson_number")
    .eq("teaching_plan_id", planId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload: Database["public"]["Tables"]["planned_lessons"]["Insert"] = {
    teaching_plan_id: planId,
    plan_unit_id: planUnitId || null,
    title,
    knowledge_objects: knowledgeObjects,
    objectives,
    methodology: methodology || null,
    observations_template: observationsTemplate,
    planned_date: plannedDate || null,
    lesson_number: (lastLesson?.lesson_number ?? 0) + 1,
    duration_lessons: durationLessons,
    status: "planned",
    position: (lastLesson?.position ?? 0) + 1
  };

  const { error } = await supabase.from("planned_lessons").insert(payload);

  if (error) {
    redirect(`/planejamento/${planId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/planejamento/${planId}`);
  redirect(`/planejamento/${planId}?notice=lesson-created`);
}

export async function updatePlannedLessonAction(
  formData: FormData
): Promise<ActionResult> {
  const planId = getRequiredString(formData, "planId");
  const lessonId = getRequiredString(formData, "lessonId");
  const planUnitId = getOptionalString(formData, "planUnitId");
  const title = getRequiredString(formData, "title");
  const knowledgeObjects = getOptionalString(formData, "knowledgeObjects");
  const objectives = getOptionalString(formData, "objectives");
  const methodology = getOptionalString(formData, "methodology");
  const observationsTemplate = getOptionalString(formData, "observationsTemplate");
  const plannedDate = getOptionalString(formData, "plannedDate");
  const lessonNumber = getPositiveNumber(formData, "lessonNumber");
  const durationLessons = getPositiveNumber(formData, "durationLessons");
  const status = getRequiredString(formData, "status");

  if (!planId || !lessonId || !title || !lessonNumber || !durationLessons || !status) {
    redirect(`/planejamento/${planId}?error=Dados%20inv%C3%A1lidos%20da%20aula`);
  }

  if (methodology && !SIAGE_METHODOLOGIES.includes(methodology as (typeof SIAGE_METHODOLOGIES)[number])) {
    redirect(`/planejamento/${planId}?error=Metodologia%20inv%C3%A1lida`);
  }

  const payload: Database["public"]["Tables"]["planned_lessons"]["Update"] = {
    plan_unit_id: planUnitId || null,
    title,
    knowledge_objects: knowledgeObjects,
    objectives,
    methodology: methodology || null,
    observations_template: observationsTemplate,
    planned_date: plannedDate || null,
    lesson_number: lessonNumber,
    duration_lessons: durationLessons,
    status: status as Database["public"]["Tables"]["planned_lessons"]["Update"]["status"]
  };

  const supabase = await createRlsClient();
  const { error } = await supabase
    .from("planned_lessons")
    .update(payload)
    .eq("id", lessonId);

  if (error) {
    redirect(`/planejamento/${planId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/planejamento/${planId}`);
  redirect(`/planejamento/${planId}?notice=lesson-updated`);
}

export async function movePlannedLessonAction(
  formData: FormData
): Promise<ActionResult> {
  const planId = getRequiredString(formData, "planId");
  const lessonId = getRequiredString(formData, "lessonId");
  const direction = getRequiredString(formData, "direction");

  if (!planId || !lessonId || !direction) {
    redirect(`/planejamento/${planId}?error=Movimenta%C3%A7%C3%A3o%20inv%C3%A1lida`);
  }

  const supabase = await createRlsClient();
  const { data: lessons, error } = await supabase
    .from("planned_lessons")
    .select("id, position")
    .eq("teaching_plan_id", planId)
    .order("position", { ascending: true });

  if (error || !lessons) {
    redirect(`/planejamento/${planId}?error=${encodeURIComponent(error?.message ?? "Não foi possível ordenar as aulas.")}`);
  }

  const currentIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  const targetIndex =
    direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= lessons.length) {
    redirect(`/planejamento/${planId}?notice=no-change`);
  }

  const currentLesson = lessons[currentIndex];
  const targetLesson = lessons[targetIndex];

  await supabase.from("planned_lessons").update({ position: -1 }).eq("id", currentLesson.id);
  await supabase
    .from("planned_lessons")
    .update({ position: currentLesson.position })
    .eq("id", targetLesson.id);
  await supabase
    .from("planned_lessons")
    .update({ position: targetLesson.position })
    .eq("id", currentLesson.id);

  revalidatePath(`/planejamento/${planId}`);
  redirect(`/planejamento/${planId}?notice=lesson-moved`);
}

export async function deletePlannedLessonAction(
  formData: FormData
): Promise<ActionResult> {
  const planId = getRequiredString(formData, "planId");
  const lessonId = getRequiredString(formData, "lessonId");

  if (!planId || !lessonId) {
    redirect(`/planejamento/${planId}?error=Aula%20inv%C3%A1lida`);
  }

  const supabase = await createRlsClient();
  const { error } = await supabase
    .from("planned_lessons")
    .delete()
    .eq("id", lessonId);

  if (error) {
    redirect(`/planejamento/${planId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/planejamento/${planId}`);
  redirect(`/planejamento/${planId}?notice=lesson-deleted`);
}

function getRequiredString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  return value.length > 0 ? value : "";
}

function getPositiveNumber(formData: FormData, key: string) {
  const raw = Number(formData.get(key) ?? 0);

  return Number.isInteger(raw) && raw > 0 ? raw : 0;
}

function buildParams(params: Record<string, string>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value.length > 0) {
      searchParams.set(key, value);
    }
  }

  return searchParams.toString();
}
