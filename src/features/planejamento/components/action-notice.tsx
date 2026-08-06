type ActionNoticeProps = {
  status?: string;
  error?: string;
};

const statusMessages: Record<string, string> = {
  created: "Planejamento criado como rascunho com sucesso.",
  updated: "Planejamento atualizado com sucesso.",
  deleted: "Planejamento excluído com sucesso.",
  "unit-created": "Unidade criada com sucesso.",
  "unit-updated": "Unidade atualizada com sucesso.",
  "unit-deleted": "Unidade excluída com sucesso.",
  "unit-moved": "Ordem das unidades atualizada.",
  "lesson-created": "Aula planejada criada com sucesso.",
  "lesson-updated": "Aula planejada atualizada com sucesso.",
  "lesson-deleted": "Aula planejada excluída com sucesso.",
  "lesson-moved": "Ordem das aulas atualizada."
};

export function ActionNotice({ status, error }: ActionNoticeProps) {
  if (error) {
    return (
      <p className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
        {error}
      </p>
    );
  }

  if (status && statusMessages[status]) {
    return (
      <p className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
        {statusMessages[status]}
      </p>
    );
  }

  return null;
}
