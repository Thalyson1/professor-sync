type SelectOption = {
  label: string;
  value: string;
};

type TurmasFiltersProps = {
  turnoAtual: string;
  modalidadeAtual: string;
  semestreAtual: string;
  turnos: string[];
  modalidades: string[];
  semestres: string[];
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
  modalidadeAtual,
  semestreAtual,
  turnos,
  modalidades,
  semestres
}: TurmasFiltersProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <FilterSelect
        label="Turno"
        name="turno"
        defaultValue={turnoAtual}
        options={[
          { label: "Todos os turnos", value: "" },
          ...turnos.map((turno) => ({ label: turno, value: turno }))
        ]}
      />
      <FilterSelect
        label="Modalidade"
        name="modalidade"
        defaultValue={modalidadeAtual}
        options={[
          { label: "Todas as modalidades", value: "" },
          ...modalidades.map((modalidade) => ({
            label: modalidade,
            value: modalidade
          }))
        ]}
      />
      <FilterSelect
        label="Semestre"
        name="semestre"
        defaultValue={semestreAtual}
        options={[
          { label: "Todos os semestres", value: "" },
          ...semestres.map((semestre) => ({ label: semestre, value: semestre }))
        ]}
      />
    </div>
  );
}
