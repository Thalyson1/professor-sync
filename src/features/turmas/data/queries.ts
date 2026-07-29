import type { PostgrestError } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

import { getTurmaResumo } from "../utils/turmas";
import type { Escola, Semestre, Turma, TurmasFiltros } from "../types";

type SchoolRow = Database["public"]["Tables"]["schools"]["Row"];
type SemesterRow = Database["public"]["Tables"]["semesters"]["Row"];
type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];

type ClassWithRelations = ClassRow & {
  schools: SchoolRow | null;
  semesters: SemesterRow | null;
  subjects: SubjectRow[] | null;
};

type QueryState<T> = {
  data: T;
  error: string | null;
  configured: boolean;
};

export async function getTurmasData(
  filtros: TurmasFiltros
): Promise<
  QueryState<{
    turmas: Turma[];
    todasAsTurmas: Turma[];
    escolas: Escola[];
    semestres: Semestre[];
  }>
> {
  if (!isSupabaseConfigured()) {
    return {
      data: { turmas: [], todasAsTurmas: [], escolas: [], semestres: [] },
      error:
        "Supabase ainda não está configurado. Defina as variáveis públicas do projeto para carregar dados reais.",
      configured: false
    };
  }

  try {
    const supabase = await createClient();

    const [classesResult, schoolsResult, semestersResult] = await Promise.all([
      supabase
        .from("classes")
        .select(
          "id, school_id, semester_id, name, grade, course, shift, modality, student_count, status, created_at, updated_at, schools(*), semesters(*), subjects(*)"
        )
        .order("name", { ascending: true }),
      supabase.from("schools").select("*").order("name", { ascending: true }),
      supabase
        .from("semesters")
        .select("*")
        .order("year", { ascending: false })
        .order("semester", { ascending: false })
    ]);

    const classesError = classesResult.error;
    const schoolsError = schoolsResult.error;
    const semestersError = semestersResult.error;

    if (classesError || schoolsError || semestersError) {
      return {
        data: { turmas: [], todasAsTurmas: [], escolas: [], semestres: [] },
        error:
          getReadableError(classesError ?? schoolsError ?? semestersError) ??
          "Não foi possível carregar os dados de turmas no momento.",
        configured: true
      };
    }

    const turmas = ((classesResult.data ?? []) as ClassWithRelations[]).map(
      mapClassToTurma
    );
    const escolas = (schoolsResult.data ?? []).map(mapSchool);
    const semestres = (semestersResult.data ?? []).map(mapSemester);

    return {
      data: {
        turmas: applyTurmasFilters(turmas, filtros),
        todasAsTurmas: turmas,
        escolas,
        semestres
      },
      error: null,
      configured: true
    };
  } catch (error) {
    return {
      data: { turmas: [], todasAsTurmas: [], escolas: [], semestres: [] },
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
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("classes")
      .select(
        "id, school_id, semester_id, name, grade, course, shift, modality, student_count, status, created_at, updated_at, schools(*), semesters(*), subjects(*)"
      )
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

function applyTurmasFilters(turmas: Turma[], filtros: TurmasFiltros) {
  const termoBusca = filtros.busca.trim().toLocaleLowerCase("pt-BR");

  return turmas.filter((turma) => {
    const correspondeBusca =
      termoBusca.length === 0 ||
      [
        turma.nome,
        turma.serie,
        turma.curso,
        turma.escola.nome,
        `${turma.semestre.ano}.${turma.semestre.semestre}`,
        ...turma.disciplinas.map((disciplina) => disciplina.nome)
      ].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(termoBusca)
      );

    const correspondeTurno =
      filtros.turno.length === 0 || turma.turno === filtros.turno;
    const correspondeModalidade =
      filtros.modalidade.length === 0 || turma.modalidade === filtros.modalidade;
    const correspondeSemestre =
      filtros.semestre.length === 0 || turma.semestre.id === filtros.semestre;

    return (
      correspondeBusca &&
      correspondeTurno &&
      correspondeModalidade &&
      correspondeSemestre
    );
  });
}

function mapClassToTurma(row: ClassWithRelations): Turma {
  return {
    id: row.id,
    nome: row.name,
    serie: row.grade,
    curso: row.course,
    turno: row.shift,
    modalidade: row.modality,
    quantidadeAlunos: row.student_count,
    status: row.status,
    escola: mapSchool(row.schools),
    semestre: mapSemester(row.semesters),
    disciplinas: (row.subjects ?? []).map((subject) => ({
      id: subject.id,
      nome: subject.name,
      cargaHorariaTotal: subject.workload_hours,
      aulasSemanais: subject.weekly_lessons,
      status: subject.status
    })),
    resumo: getTurmaResumo(row.id)
  };
}

function mapSchool(row: SchoolRow | null | undefined): Escola {
  return {
    id: row?.id ?? "",
    nome: row?.name ?? "Escola não informada",
    cidade: row?.city ?? "-",
    estado: row?.state ?? "-"
  };
}

function mapSemester(row: SemesterRow | null | undefined): Semestre {
  return {
    id: row?.id ?? "",
    ano: row?.year ?? new Date().getFullYear(),
    semestre: row?.semester ?? 1,
    dataInicio: row?.start_date ?? "",
    dataFim: row?.end_date ?? "",
    status: row?.status ?? "planned"
  };
}

function getReadableError(error: PostgrestError | null) {
  if (!error) {
    return null;
  }

  return error.message;
}
