type TurmasSearchProps = {
  defaultValue: string;
};

export function TurmasSearch({ defaultValue }: TurmasSearchProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[var(--foreground)]">Busca</span>
      <input
        type="search"
        name="busca"
        defaultValue={defaultValue}
        placeholder="Buscar por turma, curso ou disciplina"
        className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
      />
    </label>
  );
}
