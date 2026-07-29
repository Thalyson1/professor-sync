export const CLASS_KEYWORDS = [
  "turma",
  "turmas",
  "disciplina",
  "disciplinas",
  "diario",
  "diário",
  "classe",
  "classes",
  "matricula",
  "matrícula",
  "ensino",
  "aluno",
  "alunos",
];

export const STUDENT_KEYWORDS = [
  "aluno",
  "alunos",
  "discente",
  "discentes",
  "matricula",
  "matrícula",
  "nome",
  "chamada",
];

export const SENSITIVE_PARAM_KEYS = [
  "token",
  "access_token",
  "refresh_token",
  "password",
  "senha",
  "cookie",
  "session",
  "jwt",
  "auth",
];

export const CLASS_TEXT_PATTERN =
  /(\d+ª?\s*(série|serie|fase)|turma|informática|informatica|disciplina)/i;

export const STUDENT_NAME_PATTERN =
  /^[A-ZÀ-Ý][A-Za-zÀ-ÿ'`.-]+(?:\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ'`.-]+){1,}$/u;
