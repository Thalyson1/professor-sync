import { EmptyState } from "@/components/ui/empty-state";

type TurmasEmptyStateProps = {
  hasFilters: boolean;
};

export function TurmasEmptyState({ hasFilters }: TurmasEmptyStateProps) {
  return (
    <EmptyState
      title={
        hasFilters
          ? "Nenhuma turma encontrada com os filtros atuais"
          : "Nenhuma turma disponível"
      }
      description={
        hasFilters
          ? "Ajuste a busca ou os filtros de turno, modalidade e semestre para encontrar outras turmas cadastradas."
          : "Ainda não existem turmas cadastradas no banco para esta visualização."
      }
    />
  );
}
