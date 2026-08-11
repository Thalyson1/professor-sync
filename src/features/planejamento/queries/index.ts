import type { PostgrestError } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createRlsClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

import type {
  PlanUnit,
  PlannedLesson,
  QueryResult,
  TeachingPlan,
  TeachingPlanAssignmentSummary,
  TeachingPlanDetail,
  TeachingPlanFilters,
  TeachingPlanListItem
} from "../types";

type TeacherAssignmentRow = Database["public"]["Tables"]["teacher_assignments"]["Row"];
type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
type SchoolRow = Database["public"]["Tables"]["schools"]["Row"];
type AcademicPeriodRow = Database["public"]["Tables"]["academic_periods"]["Row"];
type TeachingPlanRow = Database["public"]["Tables"]["teaching_plans"]["Row"];
type PlanUnitRow = Database["public"]["Tables"]["plan_units"]["Row"];
type PlannedLessonRow = Database["public"]["Tables"]["planned_lessons"]["Row"];

type TeacherAssignmentWithRelations = Pick<
  TeacherAssignmentRow,
  "id" | "semester"
> & {
  classes: Pick<
    ClassRow,
    "id" | "name" | "grade" | "letter" | "shift" | "room" | "course"
  > & {
    schools: Pick<SchoolRow, "name"> | null;
    academic_periods: Pick<AcademicPeriodRow, "name" | "year"> | null;
  };
  subjects: Pick<SubjectRow, "id" | "name" | "component_type"> | null;
};

type TeachingPlanListRow = TeachingPlanRow & {
  teacher_assignments: TeacherAssignmentWithRelations | null;
  plan_units: Array<Pick<PlanUnitRow, "id">> | null;
  planned_lessons: Array<Pick<PlannedLessonRow, "id">> | null;
};

type TeachingPlanDetailRow = TeachingPlanRow & {
  teacher_assignments: TeacherAssignmentWithRelations | null;
  plan_units: PlanUnitRow[] | null;
  planned_lessons: PlannedLessonRow[] | null;
};

const teachingPlanListSelect = `
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
  plan_units(id),
  planned_lessons(id)
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
    teaching_plan_id,
    title,
    description,
    position,
    created_at,
    updated_at
  ),
  planned_lessons(
    id,
    teaching_plan_id,
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

export async function listTeachingPlans(
  filters: TeachingPlanFilters = {}
): Promise<QueryResult<TeachingPlanListItem[]>> {
  if (!isSupabaseConfigured()) {
    return {
      data: [],
      error:
        "Supabase ainda não está configurado. Defina as variáveis públicas do projeto para carregar os planejamentos.",
      configured: false
    };
  }

  try {
    const supabase = await createRlsClient();
    let query = supabase
      .from("teaching_plans")
      .select(teachingPlanListSelect)
      .order("created_at", { ascending: false });

    if (filters.assignmentId) {
      query = query.eq("teacher_assignment_id", filters.assignmentId);
    }

    if (filters.semester) {
      query = query.eq("semester", filters.semester);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.educationBase) {
      query = query.eq("education_base", filters.educationBase);
    }

    const { data, error } = await query;

    if (error) {
      return {
        data: [],
        error: getReadableError(error),
        configured: true
      };
    }

    return {
      data: ((data ?? []) as unknown as TeachingPlanListRow[]).map(
        mapTeachingPlanListItem
      ),
      error: null,
      configured: true
    };
  } catch (error) {
    return {
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao listar planejamentos.",
      configured: true
    };
  }
}

export async function getTeachingPlanById(
  id: string
): Promise<QueryResult<TeachingPlanDetail | null>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error:
        "Supabase ainda não está configurado. Defina as variáveis públicas do projeto para carregar o planejamento.",
      configured: false
    };
  }

  try {
    const supabase = await createRlsClient();
    const { data, error } = await supabase
      .from("teaching_plans")
      .select(teachingPlanDetailSelect)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: getReadableError(error),
        configured: true
      };
    }

    return {
      data: data ? mapTeachingPlanDetail(data as unknown as TeachingPlanDetailRow) : null,
      error: null,
      configured: true
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao buscar o planejamento.",
      configured: true
    };
  }
}

export async function listTeachingPlanAssignments(): Promise<
  QueryResult<TeachingPlanAssignmentSummary[]>
> {
  if (!isSupabaseConfigured()) {
    return {
      data: [],
      error:
        "Supabase ainda não está configurado. Defina as variáveis públicas do projeto para carregar as atribuições.",
      configured: false
    };
  }

  try {
    const supabase = await createRlsClient();
    const { data, error } = await supabase
      .from("teacher_assignments")
      .select(
        `
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
        `
      )
      .order("semester", { ascending: true });

    if (error) {
      return {
        data: [],
        error: getReadableError(error),
        configured: true
      };
    }

    return {
      data: ((data ?? []) as unknown as TeacherAssignmentWithRelations[]).map(
        mapTeachingPlanAssignmentSummary
      ),
      error: null,
      configured: true
    };
  } catch (error) {
    return {
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao listar atribuições de planejamento.",
      configured: true
    };
  }
}

function mapTeachingPlanListItem(row: TeachingPlanListRow): TeachingPlanListItem {
  return {
    ...mapTeachingPlan(row),
    assignment: mapTeachingPlanAssignmentSummary(row.teacher_assignments),
    unitsCount: row.plan_units?.length ?? 0,
    lessonsCount: row.planned_lessons?.length ?? 0
  };
}

function mapTeachingPlanDetail(row: TeachingPlanDetailRow): TeachingPlanDetail {
  return {
    ...mapTeachingPlan(row),
    assignment: mapTeachingPlanAssignmentSummary(row.teacher_assignments),
    units: (row.plan_units ?? [])
      .map(
        (unit): PlanUnit => ({
          id: unit.id,
          teachingPlanId: unit.teaching_plan_id,
          title: unit.title,
          description: unit.description,
          position: unit.position,
          createdAt: unit.created_at,
          updatedAt: unit.updated_at
        })
      )
      .sort((left, right) => left.position - right.position),
    lessons: (row.planned_lessons ?? [])
      .map(
        (lesson): PlannedLesson => ({
          id: lesson.id,
          teachingPlanId: lesson.teaching_plan_id,
          planUnitId: lesson.plan_unit_id,
          title: lesson.title,
          knowledgeObjects: lesson.knowledge_objects,
          objectives: lesson.objectives,
          methodology: lesson.methodology,
          observationsTemplate: lesson.observations_template,
          plannedDate: lesson.planned_date,
          lessonNumber: lesson.lesson_number,
          durationLessons: lesson.duration_lessons,
          status: lesson.status,
          position: lesson.position,
          createdAt: lesson.created_at,
          updatedAt: lesson.updated_at
        })
      )
      .sort(
        (left, right) =>
          left.position - right.position || left.lessonNumber - right.lessonNumber
      )
  };
}

function mapTeachingPlan(row: TeachingPlanRow): TeachingPlan {
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

function mapTeachingPlanAssignmentSummary(
  row: TeacherAssignmentWithRelations | null
): TeachingPlanAssignmentSummary {
  return {
    assignmentId: row?.id ?? "",
    semester: row?.semester ?? null,
    classId: row?.classes.id ?? "",
    className: row?.classes.name ?? "Turma não informada",
    grade: row?.classes.grade ?? "",
    letter: row?.classes.letter ?? null,
    shift: row?.classes.shift ?? "",
    room: row?.classes.room ?? null,
    course: row?.classes.course ?? "",
    schoolName: row?.classes.schools?.name ?? "Escola não informada",
    academicPeriodName: formatAcademicPeriodName(row?.classes.academic_periods),
    subjectId: row?.subjects?.id ?? "",
    subjectName: row?.subjects?.name ?? "Disciplina não informada",
    componentType: row?.subjects?.component_type ?? null
  };
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
