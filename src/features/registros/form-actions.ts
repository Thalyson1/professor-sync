"use server";

import { redirect } from "next/navigation";

import { createLessonRecordFromPlannedLesson, markLessonRecordReady, updateLessonRecord } from "./actions";

export async function createLessonRecordAction(formData: FormData) {
  const result = await createLessonRecordFromPlannedLesson(value(formData, "plannedLessonId"));
  if (!result.success) redirect(`/registros?error=${encodeURIComponent(result.message)}`);
  redirect(`/registros/${result.recordId}?notice=${encodeURIComponent(result.message)}`);
}

export async function updateLessonRecordAction(formData: FormData) {
  const id = value(formData, "id");
  const result = await updateLessonRecord({
    id,
    lessonDate: value(formData, "lessonDate"),
    knowledgeObjects: nullable(formData, "knowledgeObjects"),
    methodology: nullable(formData, "methodology"),
    observations: nullable(formData, "observations"),
    numberOfLessons: Number(value(formData, "numberOfLessons"))
  });
  redirect(`/registros/${id}?${result.success ? "notice" : "error"}=${encodeURIComponent(result.message)}`);
}

export async function markLessonRecordReadyAction(formData: FormData) {
  const id = value(formData, "id");
  const result = await markLessonRecordReady(id);
  redirect(`/registros/${id}?${result.success ? "notice" : "error"}=${encodeURIComponent(result.message)}`);
}

function value(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }
function nullable(formData: FormData, key: string) { const result = value(formData, key); return result || null; }
