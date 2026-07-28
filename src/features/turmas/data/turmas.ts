import type { Turma } from "../types";

export const turmasMock: Turma[] = [
  {
    id: "1a-serie-a-informatica-desenvolvimento-web",
    nome: "1ª Série A",
    serie: "1ª Série",
    curso: "Informática",
    disciplina: {
      id: "desenvolvimento-web",
      nome: "Desenvolvimento Web",
      cargaHorariaTotal: 80
    },
    turno: "Integral",
    modalidade: "Integral",
    quantidadeAlunos: 32,
    semestre: "2026.2",
    status: "Ativa",
    resumo: {
      proximaAula: "31 de julho de 2026",
      conteudoPrevisto: "Estrutura semântica em HTML5 e organização do projeto.",
      aulasRealizadas: 18,
      aulasPlanejadas: 24,
      cargaHorariaCumprida: 36,
      frequenciasPendentes: 2,
      registrosPendentes: 1,
      avaliacoesCadastradas: 3,
      proximasAulas: [
        {
          id: "aula-1",
          data: "2026-07-31",
          titulo: "Fundamentos de HTML5",
          conteudo: "Tags estruturais, cabeçalho, navegação e boas práticas.",
          status: "planejada",
          cargaHoraria: 2
        },
        {
          id: "aula-2",
          data: "2026-08-04",
          titulo: "Primeiros estilos com CSS",
          conteudo: "Seletores, cascata e organização visual inicial.",
          status: "planejada",
          cargaHoraria: 2
        },
        {
          id: "aula-3",
          data: "2026-08-07",
          titulo: "Layout responsivo",
          conteudo: "Flexbox, espaçamentos e adaptação para telas menores.",
          status: "planejada",
          cargaHoraria: 2
        }
      ]
    }
  },
  {
    id: "2a-serie-a-informatica-sistemas-operacionais",
    nome: "2ª Série A",
    serie: "2ª Série",
    curso: "Informática",
    disciplina: {
      id: "sistemas-operacionais",
      nome: "Sistemas Operacionais",
      cargaHorariaTotal: 60
    },
    turno: "Integral",
    modalidade: "Integral",
    quantidadeAlunos: 29,
    semestre: "2026.2",
    status: "Ativa",
    resumo: {
      proximaAula: "30 de julho de 2026",
      conteudoPrevisto: "Gerenciamento de processos e escalonamento de CPU.",
      aulasRealizadas: 20,
      aulasPlanejadas: 26,
      cargaHorariaCumprida: 40,
      frequenciasPendentes: 1,
      registrosPendentes: 2,
      avaliacoesCadastradas: 2,
      proximasAulas: [
        {
          id: "aula-4",
          data: "2026-07-30",
          titulo: "Processos e threads",
          conteudo: "Ciclo de vida de processos e paralelismo básico.",
          status: "planejada",
          cargaHoraria: 2
        },
        {
          id: "aula-5",
          data: "2026-08-03",
          titulo: "Escalonamento",
          conteudo: "Algoritmos FCFS, SJF e Round Robin.",
          status: "planejada",
          cargaHoraria: 2
        },
        {
          id: "aula-6",
          data: "2026-08-06",
          titulo: "Sincronização",
          conteudo: "Semáforos, exclusão mútua e regiões críticas.",
          status: "planejada",
          cargaHoraria: 2
        }
      ]
    }
  },
  {
    id: "3a-serie-a-informatica-pratica-poo",
    nome: "3ª Série A",
    serie: "3ª Série",
    curso: "Informática",
    disciplina: {
      id: "pratica-aplicacoes-poo",
      nome: "Prática de Aplicações Orientadas a Objetos",
      cargaHorariaTotal: 80
    },
    turno: "Integral",
    modalidade: "Integral",
    quantidadeAlunos: 27,
    semestre: "2026.2",
    status: "Ativa",
    resumo: {
      proximaAula: "01 de agosto de 2026",
      conteudoPrevisto: "Encapsulamento, herança e composição em aplicações reais.",
      aulasRealizadas: 22,
      aulasPlanejadas: 28,
      cargaHorariaCumprida: 44,
      frequenciasPendentes: 0,
      registrosPendentes: 2,
      avaliacoesCadastradas: 4,
      proximasAulas: [
        {
          id: "aula-7",
          data: "2026-08-01",
          titulo: "Modelagem orientada a objetos",
          conteudo: "Classes, responsabilidades e relacionamento entre objetos.",
          status: "planejada",
          cargaHoraria: 2
        },
        {
          id: "aula-8",
          data: "2026-08-05",
          titulo: "Herança e polimorfismo",
          conteudo: "Reuso de código e especialização de comportamentos.",
          status: "planejada",
          cargaHoraria: 2
        },
        {
          id: "aula-9",
          data: "2026-08-08",
          titulo: "Projeto prático",
          conteudo: "Estruturação de uma aplicação orientada a objetos em etapas.",
          status: "planejada",
          cargaHoraria: 2
        }
      ]
    }
  },
  {
    id: "2a-serie-b-informatica-arquitetura-hardware",
    nome: "2ª Série B",
    serie: "2ª Série",
    curso: "Informática",
    disciplina: {
      id: "arquitetura-hardware",
      nome: "Arquitetura de Hardware",
      cargaHorariaTotal: 60
    },
    turno: "Integral",
    modalidade: "Integral",
    quantidadeAlunos: 31,
    semestre: "2026.2",
    status: "Ativa",
    resumo: {
      proximaAula: "05 de agosto de 2026",
      conteudoPrevisto: "Placas-mãe, barramentos e comunicação entre componentes.",
      aulasRealizadas: 16,
      aulasPlanejadas: 24,
      cargaHorariaCumprida: 32,
      frequenciasPendentes: 3,
      registrosPendentes: 2,
      avaliacoesCadastradas: 2,
      proximasAulas: [
        {
          id: "aula-10",
          data: "2026-08-05",
          titulo: "Arquitetura interna do computador",
          conteudo: "Componentes principais e fluxo de dados.",
          status: "planejada",
          cargaHoraria: 2
        },
        {
          id: "aula-11",
          data: "2026-08-09",
          titulo: "Memórias e barramentos",
          conteudo: "Memória RAM, cache e vias de comunicação.",
          status: "planejada",
          cargaHoraria: 2
        }
      ]
    }
  },
  {
    id: "eja-3a-fase-programacao",
    nome: "3ª Fase A",
    serie: "3ª Fase",
    curso: "Informática",
    disciplina: {
      id: "linguagem-programacao",
      nome: "Linguagem de Programação",
      cargaHorariaTotal: 50
    },
    turno: "Noite",
    modalidade: "EJA",
    quantidadeAlunos: 24,
    semestre: "2026.2",
    status: "Ativa",
    resumo: {
      proximaAula: "29 de julho de 2026",
      conteudoPrevisto: "Estruturas condicionais e resolução de problemas práticos.",
      aulasRealizadas: 14,
      aulasPlanejadas: 20,
      cargaHorariaCumprida: 28,
      frequenciasPendentes: 4,
      registrosPendentes: 3,
      avaliacoesCadastradas: 1,
      proximasAulas: [
        {
          id: "aula-12",
          data: "2026-07-29",
          titulo: "Condicionais",
          conteudo: "Uso de if, else e tomada de decisão em algoritmos.",
          status: "planejada",
          cargaHoraria: 2
        },
        {
          id: "aula-13",
          data: "2026-08-02",
          titulo: "Estruturas de repetição",
          conteudo: "Loops para automação de tarefas simples.",
          status: "planejada",
          cargaHoraria: 2
        }
      ]
    }
  },
  {
    id: "eja-4a-fase-sistemas-operacionais",
    nome: "4ª Fase B",
    serie: "4ª Fase",
    curso: "Informática",
    disciplina: {
      id: "sistemas-operacionais-eja",
      nome: "Sistemas Operacionais",
      cargaHorariaTotal: 40
    },
    turno: "Noite",
    modalidade: "EJA",
    quantidadeAlunos: 21,
    semestre: "2026.1",
    status: "Inativa",
    resumo: {
      proximaAula: "Sem aulas agendadas",
      conteudoPrevisto: "Turma encerrada no semestre anterior.",
      aulasRealizadas: 18,
      aulasPlanejadas: 18,
      cargaHorariaCumprida: 36,
      frequenciasPendentes: 0,
      registrosPendentes: 0,
      avaliacoesCadastradas: 2,
      proximasAulas: []
    }
  }
];
