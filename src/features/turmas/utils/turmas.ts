import { turmasMock } from "../data/turmas";
import type { IndicadorTurma, SecaoTurma, Turma } from "../types";

export type TurmasFiltros = {
  busca: string;
  turno: string;
  modalidade: string;
  semestre: string;
};

export const turmaSections: Array<{ id: SecaoTurma; label: string }> = [
  { id: "visao-geral", label: "Visão geral" },
  { id: "planejamento", label: "Planejamento" },
  { id: "cronograma", label: "Cronograma" },
  { id: "registro-aula", label: "Registro de aula" },
  { id: "frequencia", label: "Frequência" },
  { id: "avaliacoes", label: "Avaliações" }
];

export function getTurmas() {
  return turmasMock;
}

export function getTurmaById(turmaId: string) {
  return turmasMock.find((turma) => turma.id === turmaId);
}

export function getTurmasFilterOptions() {
  return {
    turnos: Array.from(new Set(turmasMock.map((turma) => turma.turno))),
    modalidades: Array.from(new Set(turmasMock.map((turma) => turma.modalidade))),
    semestres: Array.from(new Set(turmasMock.map((turma) => turma.semestre))).sort(
      (left, right) => right.localeCompare(left)
    )
  };
}

export function filterTurmas(turmas: Turma[], filtros: TurmasFiltros) {
  const termoBusca = filtros.busca.trim().toLocaleLowerCase("pt-BR");

  return turmas.filter((turma) => {
    const correspondeBusca =
      termoBusca.length === 0 ||
      [
        turma.nome,
        turma.serie,
        turma.curso,
        turma.disciplina.nome,
        turma.modalidade,
        turma.semestre
      ].some((valor) => valor.toLocaleLowerCase("pt-BR").includes(termoBusca));

    const correspondeTurno =
      filtros.turno.length === 0 || turma.turno === filtros.turno;
    const correspondeModalidade =
      filtros.modalidade.length === 0 || turma.modalidade === filtros.modalidade;
    const correspondeSemestre =
      filtros.semestre.length === 0 || turma.semestre === filtros.semestre;

    return (
      correspondeBusca &&
      correspondeTurno &&
      correspondeModalidade &&
      correspondeSemestre
    );
  });
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
