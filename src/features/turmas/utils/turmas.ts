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

export function getTurmaIndicators(turma: Turma): IndicadorTurma[] {
  return [
    {
      id: "proxima-aula",
      label: "Próxima aula",
      valor: turma.resumo.proximaAula,
      apoio: "Indicador provisório enquanto o cronograma real ainda não foi implementado."
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
      apoio: "Quantidade simulada para a visão inicial do diário."
    },
    {
      id: "aulas-planejadas",
      label: "Aulas planejadas",
      valor: String(turma.resumo.aulasPlanejadas),
      apoio: "Total previsto no planejamento provisório."
    },
    {
      id: "carga-cumprida",
      label: "Carga horária cumprida",
      valor: `${turma.resumo.cargaHorariaCumprida}h`,
      apoio: "Carga provisória derivada das disciplinas importadas."
    },
    {
      id: "frequencias-pendentes",
      label: "Frequências pendentes",
      valor: String(turma.resumo.frequenciasPendentes),
      apoio: "Contagem simulada até o módulo de frequência existir."
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
      apoio: "Total provisório ligado às disciplinas da turma."
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

export function buildTurmaResumo(turma: {
  nome: string;
  quantidadeAlunos: number;
  disciplinas: Array<{ nome: string; cargaHorariaTotal: number | null }>;
}): ResumoTurma {
  const primeiraDisciplina = turma.disciplinas[0]?.nome ?? "Conteúdo pendente";
  const segundaDisciplina = turma.disciplinas[1]?.nome ?? primeiraDisciplina;
  const aulasPlanejadas = Math.max(turma.disciplinas.length * 6, 6);
  const aulasRealizadas = Math.max(
    Math.min(aulasPlanejadas - 2, turma.quantidadeAlunos > 0 ? 4 : 0),
    0
  );
  const cargaHorariaCumprida = turma.disciplinas.reduce(
    (total, disciplina) =>
      total + Math.min(disciplina.cargaHorariaTotal ?? 0, 20),
    0
  );

  return {
    proximaAula:
      turma.quantidadeAlunos > 0 ? "Próxima aula agendada" : "Sem aulas planejadas",
    conteudoPrevisto: primeiraDisciplina,
    aulasRealizadas,
    aulasPlanejadas,
    cargaHorariaCumprida,
    frequenciasPendentes: turma.quantidadeAlunos > 0 ? 1 : 0,
    registrosPendentes: turma.quantidadeAlunos > 0 ? 2 : 0,
    avaliacoesCadastradas: turma.disciplinas.length,
    proximasAulas: turma.quantidadeAlunos
      ? [
          {
            id: `${turma.nome}-aula-1`,
            data: "2026-08-03",
            titulo: primeiraDisciplina,
            conteudo: `Planejamento introdutório para ${primeiraDisciplina}.`,
            status: "planejada",
            cargaHoraria: 2
          },
          {
            id: `${turma.nome}-aula-2`,
            data: "2026-08-10",
            titulo: segundaDisciplina,
            conteudo: `Sequência prevista da disciplina ${segundaDisciplina}.`,
            status: "planejada",
            cargaHoraria: 2
          }
        ]
      : []
  };
}
