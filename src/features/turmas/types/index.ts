export type ModalidadeTurma = "integral" | "eja";

export type TurnoTurma = "integral" | "morning" | "afternoon" | "night" | string;

export type StatusTurma = "active" | "inactive" | string;

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
  externalId: string | null;
  nome: string;
  cidade: string | null;
  estado: string | null;
};

export type Semestre = {
  id: string;
  ano: number;
  semestre: 1 | 2;
  dataInicio: string;
  dataFim: string;
  status: StatusSemestre;
};

export type PeriodoLetivo = {
  id: string;
  externalId: string | null;
  ano: number | null;
  nome: string;
  ativo: boolean;
};

export type Disciplina = {
  id: string;
  externalId: string | null;
  curriculumSubjectExternalId: string | null;
  nome: string;
  cargaHorariaTotal: number | null;
  aulasSemanais: number | null;
  tipoComponente: string | null;
  status: StatusDisciplina | string;
};

export type Aluno = {
  id: string;
  externalId: string | null;
  nome: string;
  matricula: string | null;
  status: string | null;
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
  externalId: string | null;
  nome: string;
  serie: string;
  letra: string | null;
  curso: string;
  turno: TurnoTurma;
  sala: string | null;
  etapa: string | null;
  quantidadeAlunos: number;
  status: StatusTurma;
  escola: Escola;
  periodoLetivo: PeriodoLetivo;
  disciplinas: Disciplina[];
  alunos: Aluno[];
  resumo: ResumoTurma;
};

export type TurmasFiltros = {
  busca: string;
  turno: string;
  periodo: string;
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
