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
  return (
    navigationItems.find((item) => item.href === pathname) ?? {
      href: pathname,
      label: "Professor Sync",
      description: "Área principal da plataforma."
    }
  );
}
