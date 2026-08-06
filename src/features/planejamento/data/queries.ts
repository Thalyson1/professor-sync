import type { PostgrestError } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createRlsClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

import type {
  EducationBase,
  PlannedLesson,
  PlanUnit,
  PlanningAssignmentListItem,
  PlanningAssignmentOption,
  PlanningFilters,
  PlanningQueryState,
  TeachingPlanDetail,
  TeachingPlanStatus
} from "../types";

type TeacherAssignmentRow = Database["public"]["Tables"]["teacher_assignments"]["Row"];
type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
type SchoolRow = Database["public"]["Tables"]["schools"]["Row"];
type AcademicPeriodRow = Database["public"]["Tables"]["academic_periods"]["Row"];
type TeachingPlanRow = Database["public"]["Tables"]["teaching_plans"]["Row"];
type PlanUnitRow = Database["public"]["Tables"]["plan_units"]["Row"];
type PlannedLessonRow = Database["public"]["Tables"]["planned_lessons"]["Row"];

type AssignmentListRow = Pick<TeacherAssignmentRow, "id" | "semester"> & {
  classes: Pick<
    ClassRow,
    "id" | "name" | "grade" | "letter" | "shift" | "room" | "course"
  > & {
    schools: Pick<SchoolRow, "name"> | null;
    academic_periods: Pick<AcademicPeriodRow, "name" | "year"> | null;
  };
  subjects: Pick<SubjectRow, "id" | "name" | "component_type"> | null;
  teaching_plans:
    | Array<
        Pick<
          TeachingPlanRow,
          | "id"
          | "title"
          | "education_base"
          | "status"
          | "semester"
          | "created_at"
        > & {
          planned_lessons: Array<Pick<PlannedLessonRow, "id">> | null;
        }
      >
    | null;
};

type TeachingPlanDetailRow = TeachingPlanRow & {
  teacher_assignments:
    | (Pick<TeacherAssignmentRow, "id" | "semester"> & {
        classes: Pick<
          ClassRow,
          "id" | "name" | "grade" | "letter" | "shift" | "room" | "course"
        > & {
          schools: Pick<SchoolRow, "name"> | null;
          academic_periods: Pick<AcademicPeriodRow, "name" | "year"> | null;
        };
        subjects: Pick<SubjectRow, "id" | "name" | "component_type"> | null;
      })
    | null;
  plan_units: PlanUnitRow[] | null;
  planned_lessons: PlannedLessonRow[] | null;
};

const assignmentListSelect = `
  id,
  semester,
  classes:classes!teacher_assignments_class_id_fkey(
    id,
    name,
    grade,
    letter,
    shift,
    room,
    course,
    schools:schools!classes_school_id_fkey(name),
    academic_periods:academic_periods!classes_academic_period_id_fkey(name, year)
  ),
  subjects:subjects!teacher_assignments_subject_id_fkey(
    id,
    name,
    component_type
  ),
  teaching_plans(
    id,
    title,
    education_base,
    status,
    semester,
    created_at,
    planned_lessons(id)
  )
`;

const teachingPlanDetailSelect = `
  id,
  teacher_assignment_id,
  title,
  description,
  education_base,
  workload_hours,
  weekly_lessons,
  semester,
  status,
  created_at,
  updated_at,
  teacher_assignments:teacher_assignments!teaching_plans_teacher_assignment_id_fkey(
    id,
    semester,
    classes:classes!teacher_assignments_class_id_fkey(
      id,
      name,
      grade,
      letter,
      shift,
      room,
      course,
      schools:schools!classes_school_id_fkey(name),
      academic_periods:academic_periods!classes_academic_period_id_fkey(name, year)
    ),
    subjects:subjects!teacher_assignments_subject_id_fkey(
      id,
      name,
      component_type
    )
  ),
  plan_units(
    id,
    title,
    description,
    position,
    created_at,
    updated_at
  ),
  planned_lessons(
    id,
    plan_unit_id,
    title,
    knowledge_objects,
    objectives,
    methodology,
    observations_template,
    planned_date,
    lesson_number,
    duration_lessons,
    status,
    position,
    created_at,
    updated_at
  )
`;

export async function getPlanningAssignments(
  filters: PlanningFilters
): Promise<
  PlanningQueryState<{
    items: PlanningAssignmentListItem[];
    allItems: PlanningAssignmentListItem[];
    assignmentOptions: PlanningAssignmentOption[];
  }>
> {
  if (!isSupabaseConfigured()) {
    return {
      data: { items: [], allItems: [], assignmentOptions: [] },
      error:
        "Supabase ainda não está configurado. Defina as variáveis públicas do projeto para carregar os planejamentos.",
      configured: false
    };
  }

  try {
    const supabase = await createRlsClient();
    const { data, error } = await supabase
      .from("teacher_assignments")
      .select(assignmentListSelect)
      .order("semester", { ascending: true });

    if (error) {
      return {
        data: { items: [], allItems: [], assignmentOptions: [] },
        error:
          getReadableError(error) ??
          "Não foi possível carregar as atribuições de planejamento.",
        configured: true
      };
    }

    const allItems = ((data ?? []) as AssignmentListRow[]).map(mapAssignmentListItem);

    return {
      data: {
        items: applyPlanningFilters(allItems, filters),
        allItems,
        assignmentOptions: allItems.map((item) => ({
          assignmentId: item.assignmentId,
          label: `${item.serie}${item.letra ? ` ${item.letra}` : ""} · ${item.turmaNome} · ${item.disciplinaNome}`,
          turmaNome: item.turmaNome,
          disciplinaNome: item.disciplinaNome,
          serie: item.serie,
          semester: item.semester,
          componentType: item.componentType
        }))
      },
      error: null,
      configured: true
    };
  } catch (error) {
    return {
      data: { items: [], allItems: [], assignmentOptions: [] },
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao carregar as atribuições de planejamento.",
      configured: true
    };
  }
}

export async function getTeachingPlanDetail(
  planId: string
): Promise<PlanningQueryState<TeachingPlanDetail | null>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error:
        "Supabase ainda não está configurado. Defina as variáveis públicas do projeto para carregar o plano.",
      configured: false
    };
  }

  try {
    const supabase = await createRlsClient();
    const { data, error } = await supabase
      .from("teaching_plans")
      .select(teachingPlanDetailSelect)
      .eq("id", planId)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: getReadableError(error),
        configured: true
      };
    }

    return {
      data: data ? mapTeachingPlanDetail(data as TeachingPlanDetailRow) : null,
      error: null,
      configured: true
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao carregar o plano.",
      configured: true
    };
  }
}

function mapAssignmentListItem(row: AssignmentListRow): PlanningAssignmentListItem {
  const plans = (row.teaching_plans ?? []).map((plan) => ({
    ...plan,
    lessonCount: plan.planned_lessons?.length ?? 0
  }));
  const primaryPlan = selectPrimaryPlan(plans);

  return {
    assignmentId: row.id,
    semester: row.semester ?? "Sem semestre",
    classId: row.classes.id,
    turmaNome: row.classes.name,
    serie: row.classes.grade,
    letra: row.classes.letter,
    turno: row.classes.shift,
    sala: row.classes.room,
    curso: row.classes.course,
    schoolName: row.classes.schools?.name ?? "Escola não informada",
    academicPeriodName: formatAcademicPeriodName(row.classes.academic_periods),
    disciplineId: row.subjects?.id ?? "",
    disciplinaNome: row.subjects?.name ?? "Disciplina não informada",
    componentType: row.subjects?.component_type ?? null,
    planId: primaryPlan?.id ?? null,
    planTitle: primaryPlan?.title ?? null,
    planStatus: (primaryPlan?.status as TeachingPlanStatus | undefined) ?? "missing",
    educationBase: (primaryPlan?.education_base as EducationBase | undefined) ?? null,
    lessonCount: primaryPlan?.lessonCount ?? 0
  };
}

function mapTeachingPlanDetail(row: TeachingPlanDetailRow): TeachingPlanDetail {
  return {
    id: row.id,
    teacherAssignmentId: row.teacher_assignment_id,
    title: row.title,
    description: row.description ?? "",
    educationBase: row.education_base as EducationBase,
    workloadHours: row.workload_hours,
    weeklyLessons: row.weekly_lessons,
    semester: row.semester,
    status: row.status as TeachingPlanStatus,
    assignment: {
      assignmentId: row.teacher_assignments?.id ?? "",
      label: `${row.teacher_assignments?.classes.grade ?? ""}${row.teacher_assignments?.classes.letter ? ` ${row.teacher_assignments.classes.letter}` : ""} · ${row.teacher_assignments?.classes.name ?? ""} · ${row.teacher_assignments?.subjects?.name ?? ""}`,
      turmaNome: row.teacher_assignments?.classes.name ?? "Turma não informada",
      disciplinaNome: row.teacher_assignments?.subjects?.name ?? "Disciplina não informada",
      serie: row.teacher_assignments?.classes.grade ?? "",
      semester: row.teacher_assignments?.semester ?? row.semester,
      componentType: row.teacher_assignments?.subjects?.component_type ?? null
    },
    units: (row.plan_units ?? [])
      .map(
        (unit): PlanUnit => ({
          id: unit.id,
          title: unit.title,
          description: unit.description ?? "",
          position: unit.position
        })
      )
      .sort((left, right) => left.position - right.position),
    lessons: (row.planned_lessons ?? [])
      .map(
        (lesson): PlannedLesson => ({
          id: lesson.id,
          planUnitId: lesson.plan_unit_id,
          title: lesson.title,
          knowledgeObjects: lesson.knowledge_objects ?? "",
          objectives: lesson.objectives ?? "",
          methodology: lesson.methodology,
          observationsTemplate: lesson.observations_template ?? "",
          plannedDate: lesson.planned_date,
          lessonNumber: lesson.lesson_number,
          durationLessons: lesson.duration_lessons,
          status: lesson.status as PlannedLesson["status"],
          position: lesson.position
        })
      )
      .sort((left, right) => left.position - right.position || left.lessonNumber - right.lessonNumber)
  };
}

function selectPrimaryPlan<
  T extends {
    status: string;
    created_at: string;
  }
>(plans: T[]) {
  return [...plans].sort((left, right) => {
    const rank = getPlanStatusRank(left.status) - getPlanStatusRank(right.status);

    if (rank !== 0) {
      return rank;
    }

    return right.created_at.localeCompare(left.created_at);
  })[0];
}

function getPlanStatusRank(status: string) {
  switch (status) {
    case "active":
      return 0;
    case "draft":
      return 1;
    case "completed":
      return 2;
    case "archived":
      return 3;
    default:
      return 4;
  }
}

function applyPlanningFilters(
  items: PlanningAssignmentListItem[],
  filters: PlanningFilters
) {
  return items.filter((item) => {
    const matchesSerie =
      filters.serie.length === 0 || item.serie === filters.serie;
    const matchesDisciplina =
      filters.disciplina.length === 0 ||
      item.disciplinaNome === filters.disciplina;
    const matchesSemestre =
      filters.semestre.length === 0 || item.semester === filters.semestre;
    const matchesStatus =
      filters.status.length === 0 || item.planStatus === filters.status;
    const matchesBase =
      filters.base.length === 0 || item.educationBase === filters.base;

    return (
      matchesSerie &&
      matchesDisciplina &&
      matchesSemestre &&
      matchesStatus &&
      matchesBase
    );
  });
}

function formatAcademicPeriodName(
  period:
    | (Pick<AcademicPeriodRow, "name" | "year"> | null)
    | undefined
) {
  if (period?.name && period.year) {
    return `${period.name} · ${period.year}`;
  }

  if (period?.name) {
    return period.name;
  }

  if (period?.year) {
    return String(period.year);
  }

  return "Período letivo não informado";
}

function getReadableError(error: PostgrestError | null) {
  if (!error) {
    return null;
  }

  return error.message;
}
