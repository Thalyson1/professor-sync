import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createRlsClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

import type { LessonRecord, LessonRecordFilters, QueryResult } from "./types";

type RecordRow = Database["public"]["Tables"]["lesson_records"]["Row"];
type AssignmentRow = Database["public"]["Tables"]["teacher_assignments"]["Row"];
type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
type PlannedLessonRow = Database["public"]["Tables"]["planned_lessons"]["Row"];

export async function listLessonRecords(
  filters: LessonRecordFilters = {}
): Promise<QueryResult<LessonRecord[]>> {
  if (!isSupabaseConfigured()) return unavailable<LessonRecord[]>();

  try {
    const supabase = await createRlsClient();
    const { data, error } = await supabase
      .from("lesson_records")
      .select("*")
      .order("lesson_date", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) return failed<LessonRecord[]>(error.message);
    return { data: await hydrateRecords(supabase, data ?? [], filters), error: null, configured: true };
  } catch (error) {
    return failed<LessonRecord[]>(message(error));
  }
}

export async function getLessonRecordById(id: string): Promise<QueryResult<LessonRecord | null>> {
  if (!isSupabaseConfigured()) return unavailable<LessonRecord | null>();

  try {
    const supabase = await createRlsClient();
    const { data, error } = await supabase.from("lesson_records").select("*").eq("id", id).maybeSingle();
    if (error) return failed<LessonRecord | null>(error.message);
    if (!data) return { data: null, error: null, configured: true };
    const records = await hydrateRecords(supabase, [data], {});
    return { data: records[0] ?? null, error: null, configured: true };
  } catch (error) {
    return failed<LessonRecord | null>(message(error));
  }
}

async function hydrateRecords(
  supabase: Awaited<ReturnType<typeof createRlsClient>>,
  records: RecordRow[],
  filters: LessonRecordFilters
) {
  if (records.length === 0) return [];
  const assignmentIds = [...new Set(records.map((record) => record.teacher_assignment_id))];
  const lessonIds = [...new Set(records.map((record) => record.planned_lesson_id))];
  const [{ data: assignments, error: assignmentError }, { data: lessons, error: lessonError }] = await Promise.all([
    supabase.from("teacher_assignments").select("*").in("id", assignmentIds),
    supabase.from("planned_lessons").select("id, title, teaching_plan_id").in("id", lessonIds)
  ]);
  if (assignmentError || lessonError) throw new Error(assignmentError?.message ?? lessonError?.message);

  const assignmentRows = assignments ?? [];
  const classIds = [...new Set(assignmentRows.map((item) => item.class_id))];
  const subjectIds = [...new Set(assignmentRows.map((item) => item.subject_id))];
  const [{ data: classes, error: classError }, { data: subjects, error: subjectError }] = await Promise.all([
    supabase.from("classes").select("id, name, grade, letter").in("id", classIds),
    supabase.from("subjects").select("id, name").in("id", subjectIds)
  ]);
  if (classError || subjectError) throw new Error(classError?.message ?? subjectError?.message);

  const assignmentById = new Map(assignmentRows.map((item) => [item.id, item]));
  const classById = new Map((classes ?? []).map((item) => [item.id, item]));
  const subjectById = new Map((subjects ?? []).map((item) => [item.id, item]));
  const lessonById = new Map((lessons ?? []).map((item) => [item.id, item]));

  return records.flatMap((record) => {
    const assignment = assignmentById.get(record.teacher_assignment_id);
    const lesson = lessonById.get(record.planned_lesson_id);
    const classItem = assignment ? classById.get(assignment.class_id) : null;
    const subject = assignment ? subjectById.get(assignment.subject_id) : null;
    if (!assignment || !lesson || !classItem || !subject) return [];
    const item = mapRecord(record, assignment, classItem, subject, lesson);
    if (filters.classId && item.classId !== filters.classId) return [];
    if (filters.subjectId && item.subjectId !== filters.subjectId) return [];
    if (filters.status && item.status !== filters.status) return [];
    if (filters.startDate && item.lessonDate < filters.startDate) return [];
    if (filters.endDate && item.lessonDate > filters.endDate) return [];
    return [item];
  });
}

function mapRecord(record: RecordRow, assignment: AssignmentRow, classItem: Pick<ClassRow, "id" | "name" | "grade" | "letter">, subject: Pick<SubjectRow, "id" | "name">, lesson: Pick<PlannedLessonRow, "id" | "title" | "teaching_plan_id">): LessonRecord {
  return {
    id: record.id, plannedLessonId: record.planned_lesson_id, teacherAssignmentId: record.teacher_assignment_id,
    lessonDate: record.lesson_date, knowledgeObjects: record.knowledge_objects, methodology: record.methodology,
    observations: record.observations, numberOfLessons: record.number_of_lessons, status: record.status,
    createdAt: record.created_at, updatedAt: record.updated_at, classId: classItem.id, className: classItem.name,
    grade: classItem.grade, letter: classItem.letter, subjectId: subject.id, subjectName: subject.name,
    plannedLessonTitle: lesson.title, teachingPlanId: lesson.teaching_plan_id
  };
}

function unavailable<T>(): QueryResult<T> {
  return { data: null as T, error: "Supabase nÃ£o estÃ¡ configurado.", configured: false };
}
function failed<T>(error: string): QueryResult<T> { return { data: null as T, error, configured: true }; }
function message(error: unknown) { return error instanceof Error ? error.message : "NÃ£o foi possÃ­vel carregar os registros."; }
