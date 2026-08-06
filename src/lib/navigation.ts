export type NavigationItem = {
  href: string;
  label: string;
  description: string;
};

export const navigationItems: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "Visão geral",
    description: "Acompanhe os principais indicadores da rotina do professor."
  },
  {
    href: "/turmas",
    label: "Turmas",
    description: "Gerencie suas turmas e acompanhe a organização por disciplina."
  },
  {
    href: "/planejamento",
    label: "Planejamento",
    description: "Estruture planos, cronogramas e etapas pedagógicas."
  },
  {
    href: "/frequencia",
    label: "Frequência",
    description: "Registre pendências e acompanhe o status das presenças."
  },
  {
    href: "/avaliacoes",
    label: "Avaliações",
    description: "Organize avaliações, lançamentos e próximos registros."
  },
  {
    href: "/sincronizacao",
    label: "Sincronização",
    description: "Centralize o envio e o acompanhamento de integrações futuras."
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    description: "Ajuste preferências gerais da plataforma."
  }
];

export function getPageMetadata(pathname: string) {
  if (pathname.startsWith("/turmas/")) {
    return {
      href: pathname,
      label: "Diário da turma",
      description:
        "Acompanhe visão geral, planejamento e registros provisórios da turma selecionada."
    };
  }

  if (pathname === "/planejamento/novo") {
    return {
      href: pathname,
      label: "Novo planejamento",
      description:
        "Crie um rascunho semestral vinculado a uma atribuição real do professor."
    };
  }

  if (pathname.startsWith("/planejamento/")) {
    return {
      href: pathname,
      label: "Editor de planejamento",
      description:
        "Edite informações gerais, unidades e aulas planejadas do semestre."
    };
  }

  return (
    navigationItems.find((item) => item.href === pathname) ?? {
      href: pathname,
      label: "Professor Sync",
      description: "Área principal da plataforma."
    }
  );
}

export function isPathActive(currentPath: string, itemHref: string) {
  return currentPath === itemHref || currentPath.startsWith(`${itemHref}/`);
}
