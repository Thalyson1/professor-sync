import type { SecaoTurma, Turma, TurmasFiltros } from "../types";

export const turmaSections: Array<{ id: SecaoTurma; label: string }> = [
  { id: "visao-geral", label: "Visão geral" },
  { id: "planejamento", label: "Planejamento" },
  { id: "cronograma", label: "Cronograma" },
  { id: "registro-aula", label: "Registro de aula" },
  { id: "frequencia", label: "Frequência" },
  { id: "avaliacoes", label: "Avaliações" }
];

export const TURMA_SHIFT_OPTIONS = [
  { value: "integral", label: "Integral" },
  { value: "night", label: "Noite" }
] as const;

export const TURMA_MODALITY_OPTIONS = [
  { value: "integral", label: "Integral" },
  { value: "eja", label: "EJA" }
] as const;

export const TURMA_STATUS_OPTIONS = [
  { value: "active", label: "Ativa" },
  { value: "inactive", label: "Inativa" }
] as const;

export const SUBJECT_STATUS_OPTIONS = [
  { value: "active", label: "Ativa" },
  { value: "inactive", label: "Inativa" }
] as const;

export function filterTurmas(turmas: Turma[], filtros: TurmasFiltros) {
  const termoBusca = filtros.busca.trim().toLocaleLowerCase("pt-BR");

  return turmas.filter((turma) => {
    const searchableValues = [
      turma.nome,
      turma.serie,
      turma.letra ?? "",
      turma.curso,
      turma.escola.nome,
      turma.sala ?? "",
      formatTurno(turma.turno),
      formatAcademicPeriodLabel(turma.periodoLetivo),
      ...turma.disciplinas.map((disciplina) => disciplina.nome)
    ];

    const correspondeBusca =
      termoBusca.length === 0 ||
      searchableValues.some((valor) =>
        valor.toLocaleLowerCase("pt-BR").includes(termoBusca)
      );

    const correspondeTurno =
      filtros.turno.length === 0 || turma.turno === filtros.turno;
    const correspondePeriodo =
      filtros.periodo.length === 0 ||
      turma.periodoLetivo.id === filtros.periodo ||
      formatAcademicPeriodLabel(turma.periodoLetivo) === filtros.periodo;

    return correspondeBusca && correspondeTurno && correspondePeriodo;
  });
}

export function getTurmasFilterOptions(turmas: Turma[]) {
  return {
    turnos: Array.from(new Set(turmas.map((turma) => turma.turno))),
    periodos: Array.from(
      new Map(
        turmas.map((turma) => [turma.periodoLetivo.id, turma.periodoLetivo])
      ).values()
    ).sort((left, right) => (right.ano ?? 0) - (left.ano ?? 0))
  };
}

export function getTurmaSection(section?: string): SecaoTurma {
  const sectionId = section ?? "visao-geral";

  return turmaSections.some((item) => item.id === sectionId)
    ? (sectionId as SecaoTurma)
    : "visao-geral";
}

export function formatTurno(turno: string) {
  if (turno === "night") {
    return "Noite";
  }

  if (turno === "morning") {
    return "Manhã";
  }

  if (turno === "afternoon") {
    return "Tarde";
  }

  return turno === "integral" ? "Integral" : turno;
}

export function formatStatus(status: string) {
  return status === "inactive" ? "Inativa" : "Ativa";
}

export function formatSemesterLabel(semestre: {
  ano: number;
  semestre: number;
}) {
  return `${semestre.ano}.${semestre.semestre}`;
}

export function formatAcademicPeriodLabel(periodo: {
  nome: string;
  ano: number | null;
}) {
  if (periodo.nome && periodo.ano) {
    return `${periodo.nome} · ${periodo.ano}`;
  }

  if (periodo.nome) {
    return periodo.nome;
  }

  if (periodo.ano) {
    return String(periodo.ano);
  }

  return "Período letivo não informado";
}

export function getTurmaDisplayName(
  turma: Pick<Turma, "nome" | "serie" | "letra">
) {
  const prefixoSerie = [turma.serie, turma.letra].filter(Boolean).join(" ");

  return prefixoSerie && !turma.nome.includes(prefixoSerie)
    ? `${prefixoSerie} - ${turma.nome}`
    : turma.nome;
}
