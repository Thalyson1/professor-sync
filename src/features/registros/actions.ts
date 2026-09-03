"use server";

import { revalidatePath } from "next/cache";

import { createRlsClient } from "@/lib/supabase/server";
import { deriveLessonExecutionRecord } from "@/features/planejamento/utils/execution";
import type { Database } from "@/types/database";

import { validateLessonRecordUpdate } from "./schemas";
import { buildLessonRecordUpdatePayload } from "./utils";

type ActionResult = { success: true; message: string; recordId: string } | { success: false; message: string };

export async function createLessonRecordFromPlannedLesson(plannedLessonId: string): Promise<ActionResult> {
  try {
    const supabase = await createRlsClient();
    const existing = await supabase.from("lesson_records").select("id").eq("planned_lesson_id", plannedLessonId).maybeSingle();
    if (existing.data) return { success: true, message: "Registro jÃ¡ existente.", recordId: existing.data.id };
    if (existing.error) return fail(existing.error.message);

    const lessonResult = await supabase.from("planned_lessons").select("*").eq("id", plannedLessonId).maybeSingle();
    if (lessonResult.error || !lessonResult.data) return fail(lessonResult.error?.message ?? "Aula planejada nÃ£o encontrada.");
    const lesson = lessonResult.data;
    if (lesson.status !== "completed") return fail("Marque a aula como realizada antes de criar o registro.");

    const planResult = await supabase.from("teaching_plans").select("teacher_assignment_id").eq("id", lesson.teaching_plan_id).maybeSingle();
    if (planResult.error || !planResult.data) return fail(planResult.error?.message ?? "Planejamento relacionado nÃ£o encontrado.");
    const executed = deriveLessonExecutionRecord(mapPlannedLesson(lesson));
    if (!executed.date) return fail("Informe a data real da aula antes de criar o registro.");

    const { data, error } = await supabase.from("lesson_records").insert({
      planned_lesson_id: lesson.id,
      teacher_assignment_id: planResult.data.teacher_assignment_id,
      lesson_date: executed.date,
      knowledge_objects: executed.knowledgeObjects,
      methodology: executed.methodology,
      observations: executed.observations,
      number_of_lessons: lesson.duration_lessons,
      status: "draft"
    }).select("id").single();
    if (error || !data) return fail(error?.message ?? "NÃ£o foi possÃ­vel criar o registro de aula.");
    revalidateRecords(lesson.teaching_plan_id);
    return { success: true, message: "Registro criado para revisÃ£o.", recordId: data.id };
  } catch (error) { return fail(error); }
}

export async function updateLessonRecord(input: unknown): Promise<ActionResult> {
  const parsed = validateLessonRecordUpdate(input);
  if (!parsed.success) return fail(parsed.errors[0]);
  try {
    const supabase = await createRlsClient();
    const current = await supabase.from("lesson_records").select("status, planned_lesson_id").eq("id", parsed.data.id).maybeSingle();
    if (current.error || !current.data) return fail(current.error?.message ?? "Registro nÃ£o encontrado.");
    if (current.data.status === "synced") return fail("Registros sincronizados nÃ£o podem ser editados.");
    const { error } = await supabase.from("lesson_records").update(buildLessonRecordUpdatePayload(parsed.data)).eq("id", parsed.data.id);
    if (error) return fail(error.message);
    revalidatePath(`/registros/${parsed.data.id}`); revalidatePath("/registros");
    return { success: true, message: "Registro atualizado com sucesso.", recordId: parsed.data.id };
  } catch (error) { return fail(error); }
}

export async function markLessonRecordReady(id: string): Promise<ActionResult> {
  try {
    const supabase = await createRlsClient();
    const current = await supabase.from("lesson_records").select("status").eq("id", id).maybeSingle();
    if (current.error || !current.data) return fail(current.error?.message ?? "Registro nÃ£o encontrado.");
    if (current.data.status === "synced") return fail("Este registro jÃ¡ foi sincronizado.");
    const { error } = await supabase.from("lesson_records").update({ status: "ready" }).eq("id", id);
    if (error) return fail(error.message);
    revalidatePath(`/registros/${id}`); revalidatePath("/registros");
    return { success: true, message: "Registro pronto para sincronizaÃ§Ã£o.", recordId: id };
  } catch (error) { return fail(error); }
}

function revalidateRecords(planId: string) { revalidatePath("/registros"); revalidatePath(`/planejamento/${planId}/cronograma`); revalidatePath("/planejamento/hoje"); }
function fail(error: unknown): ActionResult { return { success: false, message: error instanceof Error ? error.message : typeof error === "string" ? error : "NÃ£o foi possÃ­vel concluir a operaÃ§Ã£o." }; }
function mapPlannedLesson(row: Database["public"]["Tables"]["planned_lessons"]["Row"]) {
  return { id: row.id, teachingPlanId: row.teaching_plan_id, planUnitId: row.plan_unit_id, title: row.title, knowledgeObjects: row.knowledge_objects, objectives: row.objectives, methodology: row.methodology, observationsTemplate: row.observations_template, plannedDate: row.planned_date, actualDate: row.actual_date, lessonNumber: row.lesson_number, durationLessons: row.duration_lessons, status: row.status, position: row.position, completedAt: row.completed_at, postponedFrom: row.postponed_from, executionNotes: row.execution_notes, createdAt: row.created_at, updatedAt: row.updated_at };
}
