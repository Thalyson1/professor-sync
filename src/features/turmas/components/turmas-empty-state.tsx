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
          ? "Ajuste a busca ou os filtros de turno e período letivo para encontrar outras turmas."
          : "Assim que as turmas forem sincronizadas no Supabase, elas aparecerão aqui para consulta."
      }
    />
  );
}
