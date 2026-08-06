import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";
import { ActionNotice } from "@/features/planejamento/components/action-notice";
import { PlanningAssignmentCard } from "@/features/planejamento/components/planning-assignment-card";
import { PlanningFilters } from "@/features/planejamento/components/planning-filters";
import { getPlanningAssignments } from "@/features/planejamento/data/queries";

export const dynamic = "force-dynamic";

type PlanejamentoPageProps = {
  searchParams: Promise<{
    serie?: string;
    disciplina?: string;
    semestre?: string;
    status?: string;
    base?: string;
    error?: string;
    notice?: string;
  }>;
};

export default async function PlanejamentoPage({
  searchParams
}: PlanejamentoPageProps) {
  const params = await searchParams;
  const filters = {
    serie: params.serie ?? "",
    disciplina: params.disciplina ?? "",
    semestre: params.semestre ?? "",
    status: params.status ?? "",
    base: params.base ?? ""
  };

  const { data, error, configured } = await getPlanningAssignments(filters);
  const hasFilters = Object.values(filters).some((value) => value.length > 0);

  return (
    <PageSection
      title="Planejamento"
      description="Organize o planejamento semestral a partir das atribuições reais importadas do SIAGE, sem repetir turmas ou disciplinas fora do contexto do professor."
    >
      <ActionNotice status={params.notice} error={params.error} />

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Atribuições do professor
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Cada card representa uma atribuição real de turma + disciplina. A partir
              dela você pode abrir um planejamento existente ou criar um novo rascunho.
            </p>
          </div>

          <Link
            href="/planejamento/novo"
            className="inline-flex items-center justify-center rounded-2xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            Novo planejamento
          </Link>
        </div>

        <form method="get" className="mt-6 space-y-4">
          <PlanningFilters current={filters} items={data.allItems} />
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              Aplicar filtros
            </button>
            <Link
              href="/planejamento"
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              Limpar filtros
            </Link>
          </div>
        </form>
      </section>

      {error ? (
        <EmptyState
          title={
            configured
              ? "Não foi possível carregar o módulo de planejamento"
              : "Supabase ainda não configurado"
          }
          description={error}
        />
      ) : data.items.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {data.items.map((item) => (
            <PlanningAssignmentCard key={item.assignmentId} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            hasFilters
              ? "Nenhuma atribuição encontrada com os filtros atuais"
              : "Nenhuma atribuição disponível"
          }
          description={
            hasFilters
              ? "Ajuste os filtros para encontrar outras atribuições reais do professor."
              : "As atribuições do SIAGE ainda não estão disponíveis para este professor no banco atual."
          }
        />
      )}
    </PageSection>
  );
}
