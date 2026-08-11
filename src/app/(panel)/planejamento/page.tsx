import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";
import { ActionNotice } from "@/features/planejamento/components/action-notice";
import { PlanningAssignmentCard } from "@/features/planejamento/components/planning-assignment-card";
import { PlanningFilters } from "@/features/planejamento/components/planning-filters";
import { listTeachingPlans } from "@/features/planejamento/queries";

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

  const { data: plans, error, configured } = await listTeachingPlans();
  const hasFilters = Object.values(filters).some((value) => value.length > 0);
  const filteredPlans = plans.filter((plan) => {
    const semester = plan.semester ?? plan.assignment.semester ?? "";

    if (filters.serie && plan.assignment.grade !== filters.serie) {
      return false;
    }

    if (filters.disciplina && plan.assignment.subjectName !== filters.disciplina) {
      return false;
    }

    if (filters.semestre && semester !== filters.semestre) {
      return false;
    }

    if (filters.status && plan.status !== filters.status) {
      return false;
    }

    if (filters.base && plan.educationBase !== filters.base) {
      return false;
    }

    return true;
  });

  return (
    <PageSection
      title="Planejamento"
      description="Acompanhe os planejamentos semestrais reais do professor, com filtros simples e edição direta do conteúdo pedagógico."
    >
      <ActionNotice status={params.notice} error={params.error} />

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Planejamentos cadastrados
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Cada card representa um planejamento persistido no banco, já vinculado a uma turma e disciplina reais.
            </p>
          </div>

          <Link
            href="/planejamento/novo"
            className="inline-flex items-center justify-center rounded-2xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            Criar planejamento
          </Link>
        </div>

        <form method="get" className="mt-6 space-y-4">
          <PlanningFilters current={filters} items={plans} />
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
              ? "Não foi possível carregar os planejamentos"
              : "Supabase ainda não configurado"
          }
          description={error}
        />
      ) : filteredPlans.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredPlans.map((plan) => (
            <PlanningAssignmentCard key={plan.id} item={plan} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            hasFilters
              ? "Nenhum planejamento encontrado com os filtros atuais"
              : "Nenhum planejamento cadastrado"
          }
          description={
            hasFilters
              ? "Ajuste os filtros para visualizar outros planejamentos do professor."
              : "Crie o primeiro planejamento para começar a organizar o semestre."
          }
        />
      )}
    </PageSection>
  );
}
