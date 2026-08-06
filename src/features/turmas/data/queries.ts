import type { PostgrestError } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createRlsClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

import { filterTurmas } from "../utils/turmas";
import type {
  Escola,
  PeriodoLetivo,
  Turma,
  TurmaAluno,
  TurmaDisciplina,
  TurmasFiltros
} from "../types";

type SchoolRow = Database["public"]["Tables"]["schools"]["Row"];
type AcademicPeriodRow = Database["public"]["Tables"]["academic_periods"]["Row"];
type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
type TeacherAssignmentRow = Database["public"]["Tables"]["teacher_assignments"]["Row"];
type ClassEnrollmentRow = Database["public"]["Tables"]["class_enrollments"]["Row"];
type StudentRow = Database["public"]["Tables"]["students"]["Row"];

type AssignmentWithSubject = Pick<
  TeacherAssignmentRow,
  | "id"
  | "external_id"
  | "semester"
  | "multiple_allocation"
  | "curriculum_subject_external_id"
  | "source"
  | "raw_metadata"
> & {
  subjects: SubjectRow | null;
};

type EnrollmentWithStudent = Pick<
  ClassEnrollmentRow,
  "id" | "external_id" | "status" | "raw_metadata"
> & {
  students?: StudentRow | null;
};

type ClassWithRelations = ClassRow & {
  schools: SchoolRow | null;
  academic_periods: AcademicPeriodRow | null;
  teacher_assignments: AssignmentWithSubject[] | null;
  class_enrollments: EnrollmentWithStudent[] | null;
};

type QueryState<T> = {
  data: T;
  error: string | null;
  configured: boolean;
};

const classSelect = `
  id,
  external_id,
  school_id,
  academic_period_id,
  name,
  grade,
  letter,
  course,
  shift,
  room,
  stage,
  student_count,
  status,
  source,
  raw_metadata,
  created_at,
  updated_at,
  last_synced_at,
  schools:schools!classes_school_id_fkey(
    id,
    external_id,
    name,
    city,
    state,
    source,
    raw_metadata,
    created_at,
    updated_at,
    last_synced_at
  ),
  academic_periods:academic_periods!classes_academic_period_id_fkey(
    id,
    external_id,
    year,
    name,
    is_active,
    source,
    created_at,
    updated_at,
    last_synced_at
  ),
  teacher_assignments(
    id,
    external_id,
    semester,
    multiple_allocation,
    curriculum_subject_external_id,
    source,
    raw_metadata,
    subjects:subjects!teacher_assignments_subject_id_fkey(
      id,
      class_id,
      external_id,
      curriculum_subject_external_id,
      name,
      workload_hours,
      weekly_lessons,
      workload,
      component_type,
      status,
      source,
      raw_metadata,
      created_at,
      updated_at,
      last_synced_at
    )
  ),
  class_enrollments(
    id,
    external_id,
    status,
    raw_metadata,
    students:students!class_enrollments_student_id_fkey(
      id,
      external_id,
      name,
      enrollment_number,
      status,
      source,
      raw_metadata,
      created_at,
      updated_at,
      last_synced_at
    )
  )
`;

export async function getTurmasData(
  filtros: TurmasFiltros
): Promise<
  QueryState<{
    turmas: Turma[];
    todasAsTurmas: Turma[];
    periodos: PeriodoLetivo[];
  }>
> {
  if (!isSupabaseConfigured()) {
    return {
      data: { turmas: [], todasAsTurmas: [], periodos: [] },
      error:
        "Supabase ainda não está configurado. Defina as variáveis públicas do projeto para carregar dados reais.",
      configured: false
    };
  }

  try {
    const supabase = await createRlsClient();
    const { data, error } = await supabase
      .from("classes")
      .select(classSelect)
      .order("name", { ascending: true });

    if (error) {
      return {
        data: { turmas: [], todasAsTurmas: [], periodos: [] },
        error:
          getReadableError(error) ??
          "Não foi possível carregar os dados de turmas no momento.",
        configured: true
      };
    }

    const turmas = ((data ?? []) as ClassWithRelations[]).map(mapClassToTurma);

    const periodos = Array.from(
      new Map(
        turmas.map((turma) => [turma.periodoLetivo.id, turma.periodoLetivo])
      ).values()
    ).sort((left, right) => (right.ano ?? 0) - (left.ano ?? 0));

    return {
      data: {
        turmas: filterTurmas(turmas, filtros),
        todasAsTurmas: turmas,
        periodos
      },
      error: null,
      configured: true
    };
  } catch (error) {
    return {
      data: { turmas: [], todasAsTurmas: [], periodos: [] },
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao consultar turmas.",
      configured: true
    };
  }
}

export async function getTurmaDetail(
  turmaId: string
): Promise<QueryState<Turma | null>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error:
        "Supabase ainda não está configurado. Defina as variáveis públicas do projeto para carregar a turma.",
      configured: false
    };
  }

  try {
    const supabase = await createRlsClient();
    const { data, error } = await supabase
      .from("classes")
      .select(classSelect)
      .eq("id", turmaId)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: getReadableError(error),
        configured: true
      };
    }

    return {
      data: data ? mapClassToTurma(data as ClassWithRelations) : null,
      error: null,
      configured: true
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao consultar a turma.",
      configured: true
    };
  }
}

function mapClassToTurma(row: ClassWithRelations): Turma {
  const disciplinas = mapSubjects(row.teacher_assignments);
  const alunos = mapStudents(row.class_enrollments);
  const quantidadeAlunos =
    alunos.length || row.class_enrollments?.length || row.student_count || 0;

  return {
    id: row.id,
    externalId: row.external_id,
    nome: row.name,
    serie: row.grade,
    letra: row.letter,
    curso: row.course,
    turno: row.shift,
    sala: row.room,
    etapa: row.stage,
    quantidadeAlunos,
    status: row.status,
    escola: mapSchool(row.schools),
    periodoLetivo: mapAcademicPeriod(row.academic_periods),
    disciplinas,
    alunos
  };
}

function mapSchool(row: SchoolRow | null | undefined): Escola {
  return {
    id: row?.id ?? "",
    externalId: row?.external_id ?? null,
    nome: row?.name ?? "Escola não informada",
    cidade: row?.city ?? null,
    estado: row?.state ?? null
  };
}

function mapAcademicPeriod(
  row: AcademicPeriodRow | null | undefined
): PeriodoLetivo {
  return {
    id: row?.id ?? "",
    externalId: row?.external_id ?? null,
    ano: row?.year ?? null,
    nome:
      row?.name ??
      (row?.year ? `Período letivo ${row.year}` : "Período letivo não informado"),
    ativo: row?.is_active ?? false
  };
}

function mapSubjects(rows: AssignmentWithSubject[] | null): TurmaDisciplina[] {
  const subjectMap = new Map<string, TurmaDisciplina>();

  for (const assignment of rows ?? []) {
    if (!assignment.subjects) {
      continue;
    }

    const subject = assignment.subjects;

    if (!subjectMap.has(subject.id)) {
      subjectMap.set(subject.id, {
        id: subject.id,
        externalId: subject.external_id,
        curriculumSubjectExternalId: subject.curriculum_subject_external_id,
        nome: subject.name,
        cargaHorariaTotal: subject.workload ?? subject.workload_hours,
        aulasSemanais: subject.weekly_lessons,
        tipoComponente: subject.component_type,
        status: subject.status
      });
    }
  }

  return Array.from(subjectMap.values()).sort((left, right) =>
    left.nome.localeCompare(right.nome, "pt-BR")
  );
}

function mapStudents(rows: EnrollmentWithStudent[] | null): TurmaAluno[] {
  const studentMap = new Map<string, TurmaAluno>();

  for (const enrollment of rows ?? []) {
    if (!enrollment.students) {
      continue;
    }

    const student = enrollment.students;

    if (!studentMap.has(student.id)) {
      studentMap.set(student.id, {
        id: student.id,
        externalId: student.external_id,
        nome: student.name,
        matricula: student.enrollment_number,
        status: student.status
      });
    }
  }

  return Array.from(studentMap.values()).sort((left, right) =>
    left.nome.localeCompare(right.nome, "pt-BR")
  );
}

function getReadableError(error: PostgrestError | null) {
  if (!error) {
    return null;
  }

  return error.message;
}
