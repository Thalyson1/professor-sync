export type ModalidadeTurma = "Integral" | "EJA";

export type TurnoTurma = "Integral" | "Noite";

export type StatusTurma = "Ativa" | "Inativa";

export type SecaoTurma =
  | "visao-geral"
  | "planejamento"
  | "cronograma"
  | "registro-aula"
  | "frequencia"
  | "avaliacoes";

export type Disciplina = {
  id: string;
  nome: string;
  cargaHorariaTotal: number;
};

export type Aula = {
  id: string;
  data: string;
  titulo: string;
  conteudo: string;
  status: "planejada" | "realizada";
  cargaHoraria: number;
};

export type IndicadorTurma = {
  id: string;
  label: string;
  valor: string;
  apoio: string;
};

export type ResumoTurma = {
  proximaAula: string;
  conteudoPrevisto: string;
  aulasRealizadas: number;
  aulasPlanejadas: number;
  cargaHorariaCumprida: number;
  frequenciasPendentes: number;
  registrosPendentes: number;
  avaliacoesCadastradas: number;
  proximasAulas: Aula[];
};

export type Turma = {
  id: string;
  nome: string;
  serie: string;
  curso: string;
  disciplina: Disciplina;
  turno: TurnoTurma;
  modalidade: ModalidadeTurma;
  quantidadeAlunos: number;
  semestre: string;
  status: StatusTurma;
  resumo: ResumoTurma;
};
