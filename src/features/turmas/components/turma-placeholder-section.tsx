import { EmptyState } from "@/components/ui/empty-state";

import type { SecaoTurma } from "../types";

const sectionContent: Record<
  Exclude<SecaoTurma, "visao-geral">,
  { title: string; description: string }
> = {
  planejamento: {
    title: "Planejamento será implementado posteriormente",
    description:
      "Esta seção receberá planos, unidades, objetivos e apoio à organização pedagógica da turma."
  },
  cronograma: {
    title: "Cronograma será implementado posteriormente",
    description:
      "Aqui ficará a visão de aulas previstas, remanejamentos e acompanhamento temporal da disciplina."
  },
  "registro-aula": {
    title: "Registro de aula será implementado posteriormente",
    description:
      "O diário de aula ainda não está funcional. Por enquanto, a rota permanece navegável com conteúdo simulado."
  },
  frequencia: {
    title: "Frequência será implementada posteriormente",
    description:
      "O lançamento de presença e faltas ainda não foi desenvolvido nesta etapa do projeto."
  },
  avaliacoes: {
    title: "Avaliações serão implementadas posteriormente",
    description:
      "Os registros e acompanhamentos de avaliações chegarão em uma próxima fase, sem integrações reais por enquanto."
  }
};

type TurmaPlaceholderSectionProps = {
  section: Exclude<SecaoTurma, "visao-geral">;
};

export function TurmaPlaceholderSection({
  section
}: TurmaPlaceholderSectionProps) {
  const content = sectionContent[section];

  return (
    <EmptyState title={content.title} description={content.description} />
  );
}
