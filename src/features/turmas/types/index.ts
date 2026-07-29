export type ModalidadeTurma = "integral" | "eja";

export type TurnoTurma = "integral" | "night";

export type StatusTurma = "active" | "inactive";

export type StatusSemestre = "planned" | "active" | "completed";

export type StatusDisciplina = "active" | "inactive";

export type SecaoTurma =
  | "visao-geral"
  | "planejamento"
  | "cronograma"
  | "registro-aula"
  | "frequencia"
  | "avaliacoes";

export type Escola = {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
};

export type Semestre = {
  id: string;
  ano: number;
  semestre: 1 | 2;
  dataInicio: string;
  dataFim: string;
  status: StatusSemestre;
};

export type Disciplina = {
  id: string;
  nome: string;
  cargaHorariaTotal: number;
  aulasSemanais: number;
  status: StatusDisciplina;
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
  turno: TurnoTurma;
  modalidade: ModalidadeTurma;
  quantidadeAlunos: number;
  status: StatusTurma;
  escola: Escola;
  semestre: Semestre;
  disciplinas: Disciplina[];
  resumo: ResumoTurma;
};

export type TurmasFiltros = {
  busca: string;
  turno: string;
  modalidade: string;
  semestre: string;
};

export type TurmaFormValues = {
  nome: string;
  serie: string;
  curso: string;
  turno: TurnoTurma;
  modalidade: ModalidadeTurma;
  quantidadeAlunos: number;
  escolaId: string;
  semestreId: string;
  status: StatusTurma;
};

export type DisciplinaFormValues = {
  turmaId: string;
  nome: string;
  cargaHorariaTotal: number;
  aulasSemanais: number;
  status: StatusDisciplina;
};

export type FormActionState = {
  status: "idle" | "success" | "error";
  message: string;
};
