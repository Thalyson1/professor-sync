import { turmaOverviewMock } from "../data/turma-overview";
import type {
  IndicadorTurma,
  ResumoTurma,
  SecaoTurma,
  Turma,
  TurmasFiltros
} from "../types";

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
      turma.curso,
      turma.escola.nome,
      formatTurno(turma.turno),
      formatModalidade(turma.modalidade),
      formatSemesterLabel(turma.semestre),
      ...turma.disciplinas.map((disciplina) => disciplina.nome)
    ];

    const correspondeBusca =
      termoBusca.length === 0 ||
      searchableValues.some((valor) =>
        valor.toLocaleLowerCase("pt-BR").includes(termoBusca)
      );

    const correspondeTurno =
      filtros.turno.length === 0 || turma.turno === filtros.turno;
    const correspondeModalidade =
      filtros.modalidade.length === 0 || turma.modalidade === filtros.modalidade;
    const correspondeSemestre =
      filtros.semestre.length === 0 ||
      turma.semestre.id === filtros.semestre ||
      formatSemesterLabel(turma.semestre) === filtros.semestre;

    return (
      correspondeBusca &&
      correspondeTurno &&
      correspondeModalidade &&
      correspondeSemestre
    );
  });
}

export function getTurmasFilterOptions(turmas: Turma[]) {
  return {
    turnos: Array.from(new Set(turmas.map((turma) => turma.turno))),
    modalidades: Array.from(new Set(turmas.map((turma) => turma.modalidade))),
    semestres: Array.from(
      new Map(
        turmas.map((turma) => [turma.semestre.id, turma.semestre])
      ).values()
    ).sort(
      (left, right) =>
        right.ano - left.ano || right.semestre - left.semestre
    )
  };
}

export function getTurmaIndicators(turma: Turma): IndicadorTurma[] {
  return [
    {
      id: "proxima-aula",
      label: "Próxima aula",
      valor: turma.resumo.proximaAula,
      apoio: "Data simulada da próxima aula prevista para a turma."
    },
    {
      id: "conteudo-previsto",
      label: "Conteúdo previsto",
      valor: turma.resumo.conteudoPrevisto,
      apoio: "Tema principal planejado para a próxima aula."
    },
    {
      id: "aulas-realizadas",
      label: "Aulas realizadas",
      valor: String(turma.resumo.aulasRealizadas),
      apoio: "Quantidade já registrada neste semestre."
    },
    {
      id: "aulas-planejadas",
      label: "Aulas planejadas",
      valor: String(turma.resumo.aulasPlanejadas),
      apoio: "Total previsto no planejamento atual."
    },
    {
      id: "carga-cumprida",
      label: "Carga horária cumprida",
      valor: `${turma.resumo.cargaHorariaCumprida}h`,
      apoio: "Carga simulada já cumprida até aqui."
    },
    {
      id: "frequencias-pendentes",
      label: "Frequências pendentes",
      valor: String(turma.resumo.frequenciasPendentes),
      apoio: "Pendências de presença ainda não tratadas."
    },
    {
      id: "registros-pendentes",
      label: "Registros pendentes",
      valor: String(turma.resumo.registrosPendentes),
      apoio: "Aulas aguardando preenchimento futuro."
    },
    {
      id: "avaliacoes-cadastradas",
      label: "Avaliações cadastradas",
      valor: String(turma.resumo.avaliacoesCadastradas),
      apoio: "Quantidade simulada de avaliações disponíveis."
    }
  ];
}

export function getTurmaSection(section?: string): SecaoTurma {
  const sectionId = section ?? "visao-geral";

  return turmaSections.some((item) => item.id === sectionId)
    ? (sectionId as SecaoTurma)
    : "visao-geral";
}

export function formatTurno(turno: string) {
  return turno === "night" ? "Noite" : "Integral";
}

export function formatModalidade(modalidade: string) {
  return modalidade === "eja" ? "EJA" : "Integral";
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

export function getTurmaResumo(turmaId: string): ResumoTurma {
  return (
    turmaOverviewMock[turmaId] ?? {
      proximaAula: "Sem aulas planejadas",
      conteudoPrevisto: "Sem conteúdo planejado no momento.",
      aulasRealizadas: 0,
      aulasPlanejadas: 0,
      cargaHorariaCumprida: 0,
      frequenciasPendentes: 0,
      registrosPendentes: 0,
      avaliacoesCadastradas: 0,
      proximasAulas: []
    }
  );
}
