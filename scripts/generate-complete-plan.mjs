import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const XLSX = require('../extension/node_modules/xlsx');

// 1. Calendário e Feriados 2026 - Paraíba (SEE-PB)
const holidaysSet = new Set([
  '2026-01-01', // Confraternização Universal
  '2026-02-16', // Carnaval
  '2026-02-17', // Carnaval
  '2026-02-18', // Quarta de Cinzas
  '2026-04-03', // Sexta-feira Santa
  '2026-04-21', // Tiradentes
  '2026-05-01', // Dia do Trabalho
  '2026-06-04', // Corpus Christi
  '2026-06-24', // São João
  '2026-08-05', // Fundação da Paraíba
  '2026-09-07', // Independência
  '2026-10-12', // N. Sra Aparecida
  '2026-10-15', // Dia do Professor
  '2026-10-28', // Dia do Servidor Público
  '2026-11-02', // Finados
  '2026-11-15', // Proclamação da República
  '2026-11-20', // Consciência Negra
  '2026-12-25', // Natal
]);

// Recesso Escolar Junino (18 a 30 de junho)
for (let d = 18; d <= 30; d++) {
  holidaysSet.add(`2026-06-${String(d).padStart(2, '0')}`);
}

const bimesters = [
  { num: 1, start: new Date(2026, 1, 10), end: new Date(2026, 3, 23) },
  { num: 2, start: new Date(2026, 3, 24), end: new Date(2026, 6, 23) },
  { num: 3, start: new Date(2026, 6, 24), end: new Date(2026, 9, 7) },
  { num: 4, start: new Date(2026, 9, 8), end: new Date(2026, 11, 22) },
];

function formatDateISO(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateBR(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// 0: Domingo, 1: Segunda, 2: Terça, 3: Quarta, 4: Quinta, 5: Sexta, 6: Sábado
// schedule: Array de { jsWeekday: number, count: number }
// Ex: [{ jsWeekday: 2, count: 1 }, { jsWeekday: 3, count: 1 }] -> 1 aula na terça e 1 na quarta
function getDaysForSchedule(schedule) {
  const days = [];
  for (const bim of bimesters) {
    const curr = new Date(bim.start);
    while (curr <= bim.end) {
      const w = curr.getDay();
      const schedItem = schedule.find(s => s.jsWeekday === w);
      if (schedItem) {
        const iso = formatDateISO(curr);
        if (!holidaysSet.has(iso)) {
          days.push({
            date: new Date(curr),
            formatted: formatDateBR(curr),
            bimestre: bim.num,
            count: schedItem.count,
          });
        }
      }
      curr.setDate(curr.getDate() + 1);
    }
  }
  days.sort((a, b) => a.date.getTime() - b.date.getTime());
  return days;
}

// 2. Banco rico e sequencial de conteúdos curriculares (sem repetir o mesmo texto!)
const syllabusBySubject = {
  LP: [
    { t: "Introdução à programação, lógica computacional e pensamento algorítmico", m: "Aula dialogada com exemplos do cotidiano e atividade diagnóstica." },
    { t: "Algoritmos: sequência de passos, instruções ordenadas e refinamento", m: "Resolução coletiva de problemas e elaboração individual de algoritmos." },
    { t: "Fluxogramas: símbolos, sequência, tomadas de decisão simples e loops", m: "Demonstração no quadro e construção guiada de fluxogramas." },
    { t: "Pseudocódigo e tradução de fluxogramas em instruções estruturadas", m: "Exemplos no quadro e exercícios práticos em duplas." },
    { t: "Ambiente de desenvolvimento, comandos básicos de saída e sintaxe inicial", m: "Demonstração prática e primeiros programas em laboratório." },
    { t: "Variáveis, constantes, tipos de dados primitivos e atribuição de valores", m: "Aula dialogada e exercícios curtos de identificação e escrita de código." },
    { t: "Entrada de dados interativa e conversão de tipos em programas", m: "Demonstração em laboratório e prática individual acompanhada." },
    { t: "Operadores aritméticos, expressões matemáticas e precedência", m: "Resolução guiada de cálculos e pequenos programas utilitários." },
    { t: "Revisão prática dos fundamentos e aplicação da Avaliação Bimestral I", m: "Avaliação individual sem consulta e resolução de dúvidas." },
    { t: "Operadores relacionais e comparação de grandezas e valores", m: "Exemplos no quadro e exercícios práticos em laboratório." },
    { t: "Operadores lógicos (E, OU, NÃO) e composição de condições complexas", m: "Aula dialogada com tabelas-verdade e exercícios graduais." },
    { t: "Estrutura condicional simples (if) e desvio de fluxo de execução", m: "Demonstração prática e resolução orientada de problemas reais." },
    { t: "Estrutura condicional composta (if/else) e caminhos alternativos", m: "Exercícios individuais de fixação com correção coletiva." },
    { t: "Condicionais encadeadas, aninhamento e validação de dados de entrada", m: "Construção guiada de programas com acompanhamento individual." },
    { t: "Estrutura de múltipla escolha (switch/case) e menus interativos", m: "Prática em laboratório com implementação de menu de opções." },
    { t: "Revisão e consolidação do 2º Bimestre / Avaliação Bimestral II", m: "Avaliação formal prática no laboratório e fechamento de notas." },
    { t: "Estruturas de repetição: laço while, condição de parada e sentinela", m: "Demonstração passo a passo e exercícios investigativos no computador." },
    { t: "Problemas práticos com laço while: contadores, acumuladores e flags", m: "Resolução de problemas em duplas e teste de mesa com a turma." },
    { t: "Estrutura de repetição for: iteração controlada e contagem definida", m: "Demonstração passo a passo e prática individual intensiva." },
    { t: "Comparações entre while e for: escolhendo o laço ideal para cada caso", m: "Desafios práticos de refatoração de código em duplas." },
    { t: "Vetores (arrays unidimensionais): conceitos, índices e percurso", m: "Apresentação dialogada e manipulação inicial de coleções no código." },
    { t: "Operações em vetores: busca de elementos, soma, média, maior e menor", m: "Prática no laboratório com algoritmos clássicos de agregação." },
    { t: "Revisão de laços e vetores / Avaliação Bimestral III", m: "Avaliação bimestral prática e nivelamento pedagógico." },
    { t: "Funções e procedimentos: modularização e organização de código", m: "Exemplos guiados de divisão de grandes problemas em subprogramas." },
    { t: "Passagem de parâmetros por valor e retorno de valores em funções", m: "Exercícios práticos de criação de bibliotecas de funções próprias." },
    { t: "Escopo de variáveis: variáveis locais versus variáveis globais", m: "Análise de erros comuns de escopo e depuração orientada." },
    { t: "Manipulação de strings e operações com texto em programas", m: "Prática de tratamento e formatação de texto em laboratório." },
    { t: "Noções de matrizes (arrays bidimensionais) e tabelas de dados", m: "Exposição dialogada com matrizes e tabuleiros práticos." },
    { t: "Projeto Prático Integrador: levantamento de requisitos e protótipo", m: "Desenvolvimento orientado em equipe com mentoria do professor." },
    { t: "Projeto Prático Integrador: codificação, testes e correções", m: "Maratona de programação em laboratório e resolução de bugs." },
    { t: "Apresentação dos projetos finais da turma e Avaliação Bimestral IV", m: "Seminário prático de demonstração dos sistemas e devolutiva." },
    { t: "Encerramento do ano letivo, recuperação final e consolidação no SIAGE", m: "Atendimento individualizado e plantão de dúvidas de recuperação." },
  ],
  DW: [
    { t: "Fundamentos da Web: arquitetura cliente-servidor, HTTP e navegadores", m: "Aula dialogada introdutória e análise do funcionamento da Internet." },
    { t: "Estruturação de documentos com HTML5 semântico: tags estruturais", m: "Demonstração prática e construção da primeira página web semântica." },
    { t: "Textos, listas, links de navegação e incorporação de mídias em HTML5", m: "Prática guiada em laboratório com elaboração de página informativa." },
    { t: "Formulários na Web: inputs variados, labels, validações nativas e botões", m: "Construção de formulário completo de cadastro de usuários." },
    { t: "Tabelas acessíveis e organização tabular de informações no HTML5", m: "Exercícios práticos de estruturação de dados em formato de tabela." },
    { t: "Introdução ao CSS3: sintaxe, seletores, classes, IDs e cores", m: "Estilização básica de páginas criadas previamente nas aulas de HTML." },
    { t: "Modelo de caixas (Box Model): margin, border, padding, width e height", m: "Demonstração com inspetor do navegador e ajustes de layout no quadro." },
    { t: "Tipografia, fontes web do Google Fonts e estilização visual moderna", m: "Aplicação prática de padrões tipográficos e hierarquia visual." },
    { t: "Revisão de HTML5 e CSS3 básico / Avaliação Bimestral I", m: "Avaliação prática de construção de página institucional." },
    { t: "Layout moderno com CSS Flexbox: containers, eixos e alinhamentos", m: "Prática no laboratório com jogos educativos e montagem de barras de navegação." },
    { t: "Flexbox avançado: flex-grow, flex-shrink, flex-wrap e cards responsivos", m: "Criação de galeria moderna de produtos/cards totalmente flexível." },
    { t: "Introdução ao CSS Grid Layout: linhas, colunas, gaps e áreas nomeadas", m: "Demonstração prática de grids complexos para portais de notícias." },
    { t: "Design responsivo: media queries, viewports e adaptação mobile", m: "Prática de adaptação de layout desktop para telas de smartphone." },
    { t: "Efeitos visuais no CSS: gradientes, sombras, transições e pseudo-classes", m: "Exercícios de microinterações visuais em botões e links de navegação." },
    { t: "Revisão de Layout Responsivo e Flex/Grid / Avaliação Bimestral II", m: "Avaliação prática de layout responsivo completo para mobile e desktop." },
    { t: "Introdução ao JavaScript no navegador: inclusão, console e sintaxe", m: "Primeiros scripts interativos executados no console do navegador." },
    { t: "Variáveis (let, const), tipos de dados e operadores em JavaScript", m: "Prática guiada com cálculos simples e exibição de alertas dinâmicos." },
    { t: "Manipulação do DOM: seleção de elementos (querySelector, getElementById)", m: "Modificação de textos e atributos HTML dinamicamente com JavaScript." },
    { t: "Eventos no navegador:addEventListener, cliques e formulários dinâmicos", m: "Criação de botões interativos e contadores numéricos na tela." },
    { t: "Alteração dinâmica de estilos e classes CSS via JavaScript (classList)", m: "Implementação prática de alternância de tema claro/escuro (Dark Mode)." },
    { t: "Validação avançada de formulários com feedback visual em tempo real", m: "Construção guiada de formulário inteligente com validação customizada." },
    { t: "Revisão de JavaScript Interativo / Avaliação Bimestral III", m: "Avaliação prática de interação e validação de dados no navegador." },
    { t: "Trabalhando com Arrays e Objetos Literais JSON no JavaScript", m: "Criação e manipulação de listas dinâmicas de dados na memória." },
    { t: "Renderização dinâmica de listas na tela a partir de dados em memória", m: "Construção de uma aplicação prática de lista de tarefas (To-Do List)." },
    { t: "Armazenamento local no navegador com a API localStorage", m: "Persistência de dados locais para que as informações não se percam ao atualizar." },
    { t: "Introdução ao consumo de APIs REST com Fetch API e formato JSON", m: "Consulta prática de APIs públicas reais (ex: consulta de CEP via ViaCEP)." },
    { t: "Tratamento de promessas (Promises) e sintaxe async/await em JavaScript", m: "Exercícios guiados de requisições assíncronas com tratamento de erros." },
    { t: "Projeto Web Completo: planejamento, arquitetura e divisão de tarefas", m: "Definição do escopo de um sistema web completo em equipes." },
    { t: "Projeto Web Completo: desenvolvimento integrado de frontend e lógica", m: "Laboratório intensivo de desenvolvimento com mentoria do professor." },
    { t: "Projeto Web Completo: testes, correções de bugs e deploy online", m: "Hospedagem das aplicações em plataformas gratuitas (Vercel/GitHub Pages)." },
    { t: "Apresentação dos projetos web da turma e Avaliação Bimestral IV", m: "Banca avaliadora de demonstração dos sistemas web construídos." },
    { t: "Encerramento do ano letivo, recuperação final e consolidação de notas", m: "Atendimento de recuperação final e fechamento de diários no SIAGE." },
  ],
  PAOO: [
    { t: "Introdução à Programação Orientada a Objetos: limites do paradigma estruturado", m: "Aula dialogada e comparativo prático entre código funcional e orientado a objetos." },
    { t: "Conceitos fundamentais de OO: Classes, Objetos, Estado e Comportamento", m: "Modelagem de objetos reais em sala e abstração de atributos e métodos." },
    { t: "Criação de classes, instanciação de objetos e operador new em código", m: "Demonstração prática e escrita da primeira classe e objeto em laboratório." },
    { t: "Atributos de instância e métodos: passagem de argumentos e retorno", m: "Exercícios guiados com métodos de cálculo e representação de entidades." },
    { t: "Modificadores de visibilidade e princípio do Encapsulamento (public, private)", m: "Discussão sobre proteção de dados e proteção contra estados inconsistentes." },
    { t: "Métodos acessores e modificadores (Getters e Setters) e regras de validação", m: "Implementação prática de validações de negócio dentro dos setters." },
    { t: "Métodos Construtores: inicialização segura de objetos e sobrecarga de construtores", m: "Construção de classes com múltiplos construtores no laboratório." },
    { t: "A palavra-chave this e referências de memória de objetos em execução", m: "Exemplos visuais de ponteiros e endereçamento de memória de objetos." },
    { t: "Revisão dos fundamentos de Classes e Encapsulamento / Avaliação Bimestral I", m: "Avaliação bimestral prática e modelagem de classes." },
    { t: "Conceito de Herança: reutilização de código e relação 'É UM' entre classes", m: "Modelagem hierárquica (ex: Pessoa -> Aluno, Professor) e código prático." },
    { t: "Uso da palavra super, chamada de construtores da superclasse e herança direta", m: "Exercícios de especialização de classes com reutilização de lógica." },
    { t: "Sobrescrita de métodos (Override) e polimorfismo em tempo de execução", m: "Demonstração prática de comportamentos distintos em classes filhas." },
    { t: "Classes Abstratas: definição de contratos base sem instanciação direta", m: "Implementação de esqueletos de classes e métodos abstratos obrigatórios." },
    { t: "Interfaces: contratos rígidos de comportamento e implementação múltipla", m: "Construção de interfaces e desacoplamento de responsabilidades." },
    { t: "Diferenças práticas entre Herança e Composição de Objetos ('Tem Um')", m: "Refatoração de código com foco nas boas práticas de orientação a objetos." },
    { t: "Revisão de Herança, Polimorfismo e Interfaces / Avaliação Bimestral II", m: "Avaliação formal prática de POO no laboratório de informática." },
    { t: "Tratamento de Exceções: blocos try, catch, finally e robustez de software", m: "Identificação de falhas em tempo de execução e tratamento profissional de erros." },
    { t: "Criação de exceções personalizadas de negócio para regras da aplicação", m: "Prática guiada com mensagens de erro customizadas e validação de regras." },
    { t: "Coleções de Objetos (Lists, Maps, Sets): manipulação de listas tipadas", m: "Substituição de vetores fixos por coleções dinâmicas de objetos." },
    { t: "Operações em coleções de objetos: filtros, buscas, ordenação e iteração", m: "Exercícios em laboratório de CRUD em memória com listas de objetos." },
    { t: "Padrões de Projeto (Design Patterns) - Introdução e Padrão Singleton", m: "Demonstração do padrão Singleton para controle de instância única no sistema." },
    { t: "Padrão de Projeto Factory Method: encapsulamento da criação de objetos", m: "Implementação prática de fábrica de objetos flexível e extensível." },
    { t: "Revisão de Coleções, Exceções e Padrões / Avaliação Bimestral III", m: "Avaliação bimestral de POO avançada com tratamento de dados e coleções." },
    { t: "Introdução à persistência de dados: mapeamento de objetos para banco de dados", m: "Discussão sobre o abismo objeto-relacional e necessidade de persistência." },
    { t: "Camada de Acesso a Dados (DAO / Repository Pattern): isolamento de responsabilidades", m: "Criação de classes Repository para centralizar operações de dados." },
    { t: "Testes Unitários com foco em classes e métodos: garantindo a qualidade", m: "Escrita dos primeiros testes automatizados para validar regras de classes." },
    { t: "Projeto Prático Final de POO: especificação da arquitetura do sistema", m: "Definição dos diagramas de classes e planejamento das entidades em equipes." },
    { t: "Projeto Prático Final: desenvolvimento orientado a objetos e regras de negócio", m: "Laboratório prático intensivo de programação orientada a objetos." },
    { t: "Projeto Prático Final: integração, testes de ponta a ponta e depuração", m: "Polimento do código, boas práticas e documentação das classes." },
    { t: "Apresentação dos Projetos Orientados a Objetos e Avaliação Bimestral IV", m: "Banca e demonstração técnica do funcionamento dos sistemas orientados a objetos." },
    { t: "Encerramento do ano letivo, recuperação final e consolidação de notas", m: "Plantão pedagógico final de recuperação e lançamento oficial no SIAGE." },
  ],
  ED: [
    { t: "Introdução às Estruturas de Dados: conceitos, importância e tipos abstratos de dados (TAD)", m: "Aula expositiva dialogada e discussão sobre organização de dados na memória." },
    { t: "Alocação estática versus dinâmica de memória: ponteiros, referências e ciclo de vida", m: "Demonstração prática de endereçamento de memória em laboratório." },
    { t: "Vetores e matrizes como estruturas lineares básicas: representação e percurso", m: "Exercícios de busca sequencial e ordenação elementar." },
    { t: "Conceito de Listas Encadeadas: nós, ponteiros para próximo elemento e cabeça da lista", m: "Modelagem visual no quadro e escrita das primeiras estruturas de nós." },
    { t: "Operações em Listas Simplesmente Encadeadas: inserção no início, fim e busca", m: "Implementação prática guiada em laboratório de informática." },
    { t: "Operações de remoção e liberação de memória em Listas Encadeadas", m: "Prática em duplas com depuração e prevenção de memory leaks." },
    { t: "Listas Duplamente Encadeadas: vantagens, ponteiros anterior/próximo e percurso reverso", m: "Resolução de exercícios práticos no computador." },
    { t: "Revisão prática de Listas e Ponteiros / Avaliação Bimestral I", m: "Avaliação bimestral individual no laboratório." },
    { t: "Estrutura de Dados Pilha (Stack): princípio LIFO (Last-In, First-Out) e casos de uso", m: "Analogia com pilha de pratos e primeiras implementações com array." },
    { t: "Operações fundamentais em Pilha: push (empilhar), pop (desempilhar) e peek (topo)", m: "Implementação prática e teste de mesa com expressões matemáticas." },
    { t: "Aplicações reais de Pilhas: verificação de parênteses balanceados e botão 'Desfazer'", m: "Construção de mini-projeto de validação de sintaxe." },
    { t: "Estrutura de Dados Fila (Queue): princípio FIFO (First-In, First-Out) e filas de atendimento", m: "Demonstração prática de enfileiramento e desenfileiramento." },
    { t: "Implementação de Fila com lista encadeada e controle de início e fim", m: "Laboratório prático simulando fila de impressão ou chamados." },
    { t: "Filas Circulares e Filas com Prioridade (Priority Queue): conceitos e casos de uso", m: "Exercícios em duplas comparando eficiência de filas simples e circulares." },
    { t: "Revisão e consolidação de Pilhas e Filas / Avaliação Bimestral II", m: "Avaliação prática bimestral com resolução de desafios de código." },
    { t: "Recursividade e estruturas recursivas: caso base e passo recursivo", m: "Análise da pilha de execução (call stack) e cálculo fatorial recursivo." },
    { t: "Algoritmos de Ordenação I: Bubble Sort e Insertion Sort (análise e código)", m: "Comparativo de desempenho com contagem de trocas e iterações." },
    { t: "Algoritmos de Ordenação II: Selection Sort e introdução ao QuickSort", m: "Implementação em laboratório e medição de tempo de execução." },
    { t: "Algoritmos de Busca: Busca Linear versus Busca Binária em vetores ordenados", m: "Demonstração da redução logarítmica de passos na busca binária." },
    { t: "Tabelas Hash (Tabelas de Dispersão): funções hash, chaves e pares chave-valor", m: "Apresentação dialogada e implementação de dicionários simples." },
    { t: "Tratamento de colisões em Tabelas Hash: encadeamento separado e sondagem aberta", m: "Prática guiada solucionando colisões em pequenos arrays." },
    { t: "Revisão de Algoritmos de Ordenação e Tabelas Hash / Avaliação Bimestral III", m: "Avaliação bimestral de algoritmos e estruturas de dados." },
    { t: "Estruturas Não Lineares: Introdução a Árvores (Trees) e conceitos de raiz, nós e folhas", m: "Modelagem hierárquica e analogia com árvore genealógica e diretórios." },
    { t: "Árvores Binárias de Busca (BST): propriedades de ordenação e busca eficiente", m: "Desenho das árvores no quadro e inserção de elementos ordenados." },
    { t: "Percursos em Árvores Binárias: Pré-ordem, Em-ordem e Pós-ordem", m: "Algoritmos recursivos de visitação de nós em laboratório." },
    { t: "Noções de Grafos: vértices, arestas, representação por matriz e lista de adjacência", m: "Discussão prática sobre redes sociais e mapas de rotas mais curtas." },
    { t: "Projeto Integrador de Estrutura de Dados: definição do tema e arquitetura", m: "Planejamento em equipes de um sistema que utiliza listas, pilhas ou árvores." },
    { t: "Projeto Integrador: desenvolvimento guiado e manipulação das estruturas", m: "Maratona de codificação em laboratório com mentoria do professor." },
    { t: "Projeto Integrador: testes, medição de eficiência e correções de bugs", m: "Refatoração de código e preparação para demonstração técnica." },
    { t: "Apresentação dos Projetos de Estruturas de Dados e Avaliação Bimestral IV", m: "Banca e demonstração dos sistemas construídos pelos alunos." },
    { t: "Encerramento do ano letivo, recuperação final e consolidação no SIAGE", m: "Atendimento de recuperação final e fechamento de notas." },
  ]
};

// 3. Configuração das Turmas Reais do Professor (incluindo aulas quebradas):
// jsWeekday: 1: Segunda, 2: Terça, 3: Quarta, 4: Quinta, 5: Sexta
const classesInfo = [
  { sheetName: "PAOO 3-A", subj: "PAOO", schedule: [{ jsWeekday: 3, count: 2 }] }, // Quarta (2 geminadas)
  { sheetName: "PAOO 3-B", subj: "PAOO", schedule: [{ jsWeekday: 5, count: 2 }] }, // Sexta (2 geminadas)
  { sheetName: "LP 1-A",   subj: "LP",   schedule: [{ jsWeekday: 2, count: 2 }] }, // Terça (2 geminadas)
  { sheetName: "LP 1-B",   subj: "LP",   schedule: [{ jsWeekday: 2, count: 2 }] }, // Terça (2 geminadas)
  { sheetName: "LP 1-C",   subj: "LP",   schedule: [{ jsWeekday: 2, count: 2 }] }, // Terça (2 geminadas)
  { sheetName: "DW 2-A",   subj: "DW",   schedule: [{ jsWeekday: 4, count: 2 }] }, // Quinta (2 geminadas)
  // Exemplo real de DATA QUEBRADA: 1 aula na Terça (2) e 1 aula na Quarta (3)
  { sheetName: "Estrut Dados - 3A", subj: "ED", schedule: [{ jsWeekday: 2, count: 1 }, { jsWeekday: 3, count: 1 }] },
];

// 4. Montar o Workbook com todas as abas
const workbook = XLSX.utils.book_new();

console.log("Gerando planejamento anual completo para as turmas (incluindo datas quebradas)...");

for (const cls of classesInfo) {
  const classDays = getDaysForSchedule(cls.schedule);
  const syllabus = syllabusBySubject[cls.subj] || syllabusBySubject.LP;
  const rows = [];
  let aulaCount = 1;

  for (let i = 0; i < classDays.length; i++) {
    const item = classDays[i];
    let obs = "";

    // Anotações de início de bimestre e avaliações
    if (i === 0 || item.bimestre !== classDays[i - 1].bimestre) {
      obs = `Início do ${item.bimestre}º Bimestre`;
    }
    if (i === classDays.length - 1 || (i + 1 < classDays.length && classDays[i + 1].bimestre !== item.bimestre)) {
      obs = "Avaliação Bimestral";
    }

    const topicItem = syllabus[i % syllabus.length];
    let topicText = topicItem.t;
    let methodText = topicItem.m;

    if (obs === "Avaliação Bimestral") {
      topicText = `Revisão de conteúdos e aplicação da Avaliação Bimestral do ${item.bimestre}º Bimestre`;
      methodText = "Aplicação de instrumento avaliativo individual e resolução de dúvidas pós-avaliação.";
    }

    let aulaLabel = "";
    if (item.count === 1) {
      aulaLabel = `${aulaCount}`;
      aulaCount += 1;
    } else {
      aulaLabel = `${aulaCount} e ${aulaCount + item.count - 1}`;
      aulaCount += item.count;
    }

    rows.push({
      "Aula": aulaLabel,
      "Data": item.formatted,
      "Conteúdo (Objeto de Conhecimento)": topicText,
      "Metodologia": methodText,
      "Observações": obs,
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Definir larguras de colunas profissionais
  worksheet['!cols'] = [
    { wch: 10 }, // Aula
    { wch: 14 }, // Data
    { wch: 65 }, // Conteúdo
    { wch: 55 }, // Metodologia
    { wch: 25 }, // Observações
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, cls.sheetName);
  console.log(`✓ Aba "${cls.sheetName}": ${rows.length} aulas geradas.`);
}

// 5. Salvar o arquivo Excel físico na raiz do projeto
const outputPath = path.resolve(process.cwd(), 'Planejamento_Anual_Completo.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`\n======================================================`);
console.log(`SUCESSO! Arquivo Excel gerado em:`);
console.log(outputPath);
console.log(`======================================================`);
