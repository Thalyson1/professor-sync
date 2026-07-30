type SelectOption = {
  label: string;
  value: string;
};

type TurmasFiltersProps = {
  turnoAtual: string;
  periodoAtual: string;
  turnos: string[];
  periodos: Array<{
    id: string;
    ano: number | null;
    nome: string;
  }>;
};

function FilterSelect({
  label,
  name,
  defaultValue,
  options
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: SelectOption[];
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TurmasFilters({
  turnoAtual,
  periodoAtual,
  turnos,
  periodos
}: TurmasFiltersProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FilterSelect
        label="Turno"
        name="turno"
        defaultValue={turnoAtual}
        options={[
          { label: "Todos os turnos", value: "" },
          ...turnos.map((turno) => ({
            label: turno === "night" ? "Noite" : turno === "integral" ? "Integral" : turno,
            value: turno
          }))
        ]}
      />
      <FilterSelect
        label="Período letivo"
        name="periodo"
        defaultValue={periodoAtual}
        options={[
          { label: "Todos os períodos", value: "" },
          ...periodos.map((periodo) => ({
            label:
              periodo.nome && periodo.ano
                ? `${periodo.nome} · ${periodo.ano}`
                : periodo.nome || String(periodo.ano ?? ""),
            value: periodo.id
          }))
        ]}
      />
    </div>
  );
}
