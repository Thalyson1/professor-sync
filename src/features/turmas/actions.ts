"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

import type { FormActionState } from "./types";

const initialState: FormActionState = {
  status: "idle",
  message: ""
};

export async function createTurmaAction(
  _previousState: FormActionState = initialState,
  formData: FormData
): Promise<FormActionState> {
  void _previousState;

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Configure o Supabase antes de cadastrar turmas com dados persistidos."
    };
  }

  const schoolId = String(formData.get("escolaId") ?? "");
  const semesterId = String(formData.get("semestreId") ?? "");
  const name = String(formData.get("nome") ?? "").trim();
  const grade = String(formData.get("serie") ?? "").trim();
  const course = String(formData.get("curso") ?? "").trim();
  const shift = String(formData.get("turno") ?? "");
  const modality = String(formData.get("modalidade") ?? "");
  const studentCount = Number(formData.get("quantidadeAlunos") ?? 0);
  const status = String(formData.get("status") ?? "");

  if (!schoolId || !semesterId || !name || !grade || !course) {
    return {
      status: "error",
      message: "Preencha todos os campos obrigatórios da turma."
    };
  }

  if (shift !== "integral" && shift !== "night") {
    return {
      status: "error",
      message: "Selecione um turno válido."
    };
  }

  if (modality !== "integral" && modality !== "eja") {
    return {
      status: "error",
      message: "Selecione uma modalidade válida."
    };
  }

  if (status !== "active" && status !== "inactive") {
    return {
      status: "error",
      message: "Selecione um status válido."
    };
  }

  if (!Number.isInteger(studentCount) || studentCount < 0) {
    return {
      status: "error",
      message: "Informe uma quantidade de alunos válida."
    };
  }

  const payload: Database["public"]["Tables"]["classes"]["Insert"] = {
    school_id: schoolId,
    semester_id: semesterId,
    name,
    grade,
    course,
    shift,
    modality,
    student_count: studentCount,
    status
  };

  const supabase = await createClient();
  const { error } = await supabase.from("classes").insert(payload);

  if (error) {
    return {
      status: "error",
      message: `Não foi possível cadastrar a turma: ${error.message}`
    };
  }

  revalidatePath("/turmas");

  return {
    status: "success",
    message: "Turma cadastrada com sucesso."
  };
}

export async function createDisciplinaAction(
  _previousState: FormActionState = initialState,
  formData: FormData
): Promise<FormActionState> {
  void _previousState;

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Configure o Supabase antes de cadastrar disciplinas com dados persistidos."
    };
  }

  const turmaId = String(formData.get("turmaId") ?? "");
  const name = String(formData.get("nome") ?? "").trim();
  const workloadHours = Number(formData.get("cargaHorariaTotal") ?? 0);
  const weeklyLessons = Number(formData.get("aulasSemanais") ?? 0);
  const status = String(formData.get("status") ?? "");

  if (!turmaId || !name) {
    return {
      status: "error",
      message: "Preencha os campos obrigatórios da disciplina."
    };
  }

  if (
    !Number.isInteger(workloadHours) ||
    workloadHours <= 0 ||
    !Number.isInteger(weeklyLessons) ||
    weeklyLessons <= 0
  ) {
    return {
      status: "error",
      message: "Informe carga horária e aulas semanais com valores válidos."
    };
  }

  if (status !== "active" && status !== "inactive") {
    return {
      status: "error",
      message: "Selecione um status válido para a disciplina."
    };
  }

  const payload: Database["public"]["Tables"]["subjects"]["Insert"] = {
    class_id: turmaId,
    name,
    workload_hours: workloadHours,
    weekly_lessons: weeklyLessons,
    status
  };

  const supabase = await createClient();
  const { error } = await supabase.from("subjects").insert(payload);

  if (error) {
    return {
      status: "error",
      message: `Não foi possível cadastrar a disciplina: ${error.message}`
    };
  }

  revalidatePath("/turmas");
  revalidatePath(`/turmas/${turmaId}`);

  return {
    status: "success",
    message: "Disciplina cadastrada com sucesso."
  };
}
