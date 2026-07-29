import type { ResumoTurma } from "../types";

export const turmaOverviewMock: Record<string, ResumoTurma> = {
  "1f4ce06d-c418-4c1b-9d4c-67098d778201": {
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
        id: "aula-web-1",
        data: "2026-07-31",
        titulo: "Fundamentos de HTML5",
        conteudo: "Tags estruturais, cabeçalho, navegação e boas práticas.",
        status: "planejada",
        cargaHoraria: 2
      },
      {
        id: "aula-web-2",
        data: "2026-08-04",
        titulo: "Primeiros estilos com CSS",
        conteudo: "Seletores, cascata e organização visual inicial.",
        status: "planejada",
        cargaHoraria: 2
      }
    ]
  },
  "1f4ce06d-c418-4c1b-9d4c-67098d778202": {
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
        id: "aula-so-1",
        data: "2026-07-30",
        titulo: "Processos e threads",
        conteudo: "Ciclo de vida de processos e paralelismo básico.",
        status: "planejada",
        cargaHoraria: 2
      },
      {
        id: "aula-so-2",
        data: "2026-08-03",
        titulo: "Escalonamento",
        conteudo: "Algoritmos FCFS, SJF e Round Robin.",
        status: "planejada",
        cargaHoraria: 2
      }
    ]
  },
  "1f4ce06d-c418-4c1b-9d4c-67098d778203": {
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
        id: "aula-poo-1",
        data: "2026-08-01",
        titulo: "Modelagem orientada a objetos",
        conteudo: "Classes, responsabilidades e relacionamento entre objetos.",
        status: "planejada",
        cargaHoraria: 2
      },
      {
        id: "aula-poo-2",
        data: "2026-08-05",
        titulo: "Herança e polimorfismo",
        conteudo: "Reuso de código e especialização de comportamentos.",
        status: "planejada",
        cargaHoraria: 2
      }
    ]
  }
};
