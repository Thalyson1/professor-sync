export interface SiagePageState {
  url: string;
  pageType: 'login' | 'turmas' | 'frequencia' | 'registro_aula' | 'outra';
  turmaId?: string;
  turmaNome?: string;
  componenteCurricular?: string;
}

export function detectSiagePage(url: string): SiagePageState {
  const state: SiagePageState = {
    url,
    pageType: 'outra',
  };

  if (url.includes('/auth') || url.includes('/login')) {
    state.pageType = 'login';
    return state;
  }

  if (url.includes('/turmas') || url.includes('/curriculo-professor')) {
    state.pageType = 'turmas';
    return state;
  }

  if (url.includes('/frequencia') || url.includes('/diario-classe-frequencia')) {
    state.pageType = 'frequencia';
    return state;
  }

  if (url.includes('/registro') || url.includes('/diario-classe-registro') || url.includes('/aula')) {
    state.pageType = 'registro_aula';
    return state;
  }

  return state;
}

export function getFriendlyHelpMessage(pageType: SiagePageState['pageType']): {
  title: string;
  description: string;
  actionText: string;
} {
  switch (pageType) {
    case 'login':
      return {
        title: '🔒 Faça login no SIAGE',
        description: 'Entre com seus dados da Secretaria de Educação. O Professor Sync ativará automaticamente assim que você entrar!',
        actionText: 'Aguardando Login',
      };
    case 'turmas':
      return {
        title: '📚 Suas Turmas Identificadas!',
        description: 'Sincronizamos suas turmas e disciplinas da Rede Estadual PB automaticamente.',
        actionText: 'Ver Turmas',
      };
    case 'frequencia':
      return {
        title: '⚡ Chamada Rápida Disponível',
        description: 'Marque apenas os alunos que FALTARAM hoje e nós preenchemos a chamada do SIAGE para você.',
        actionText: 'Iniciar Chamada',
      };
    case 'registro_aula':
      return {
        title: '✨ Registro de Aula com IA',
        description: 'Digite o que você ensinou hoje em palavras simples e geramos o registro oficial para o SIAGE.',
        actionText: 'Gerar Registro',
      };
    default:
      return {
        title: '👋 Professor Sync Ativo',
        description: 'Navegue pelo SIAGE normalmente. Estaremos aqui para automatizar suas tarefas burocráticas.',
        actionText: 'Abrir Assistente',
      };
  }
}
