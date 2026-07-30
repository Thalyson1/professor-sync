import Link from "next/link";

import { PageSection } from "@/components/ui/page-section";
import { TurmaCard } from "@/features/turmas/components/turma-card";
import { TurmasDataState } from "@/features/turmas/components/turmas-data-state";
import { TurmasEmptyState } from "@/features/turmas/components/turmas-empty-state";
import { TurmasFilters } from "@/features/turmas/components/turmas-filters";
import { TurmasSearch } from "@/features/turmas/components/turmas-search";
import { getTurmasData } from "@/features/turmas/data/queries";
import { getTurmasFilterOptions } from "@/features/turmas/utils/turmas";

export const dynamic = "force-dynamic";

type TurmasPageProps = {
  searchParams: Promise<{
    busca?: string;
    turno?: string;
    periodo?: string;
  }>;
};

export default async function TurmasPage({ searchParams }: TurmasPageProps) {
  const resolvedSearchParams = await searchParams;
  const filtros = {
    busca: resolvedSearchParams.busca ?? "",
    turno: resolvedSearchParams.turno ?? "",
    periodo: resolvedSearchParams.periodo ?? ""
  };

  const { data, error, configured } = await getTurmasData(filtros);
  const filterOptions = getTurmasFilterOptions(data.todasAsTurmas);
  const turmasFiltradas = data.turmas;
  const hasFilters = Object.values(filtros).some((value) => value.length > 0);

  return (
    <PageSection
      title="Minhas turmas"
      description="Consulte as turmas reais importadas do SIAGE, filtre por turno e período letivo e acesse o diário de cada turma para acompanhar as próximas etapas do Professor Sync."
    >
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Turmas sincronizadas
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              A listagem mostra apenas as turmas escolares únicas e reúne, em cada
              card, as disciplinas atribuídas ao professor.
            </p>
          </div>
        </div>

        <form method="get" className="mt-6 space-y-4">
          <TurmasSearch defaultValue={filtros.busca} />
          <TurmasFilters
            turnoAtual={filtros.turno}
            periodoAtual={filtros.periodo}
            turnos={filterOptions.turnos}
            periodos={filterOptions.periodos}
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              Aplicar filtros
            </button>
            <Link
              href="/turmas"
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              Limpar filtros
            </Link>
          </div>
        </form>
      </section>

      {error ? (
        <TurmasDataState
          title={
            configured
              ? "Não foi possível carregar as turmas"
              : "Supabase ainda não configurado"
          }
          description={error}
        />
      ) : turmasFiltradas.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {turmasFiltradas.map((turma) => (
            <TurmaCard key={turma.id} turma={turma} />
          ))}
        </div>
      ) : (
        <TurmasEmptyState hasFilters={hasFilters} />
      )}
    </PageSection>
  );
}
