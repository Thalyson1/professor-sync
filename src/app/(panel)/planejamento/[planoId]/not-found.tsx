import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";

export default function PlanningNotFound() {
  return (
    <PageSection
      title="Planejamento não encontrado"
      description="O planejamento solicitado não foi localizado ou não está disponível neste ambiente."
    >
      <EmptyState
        title="Registro indisponível"
        description="Volte para a listagem e escolha outro planejamento válido."
      />
      <Link
        href="/planejamento"
        className="inline-flex items-center justify-center rounded-2xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
      >
        Voltar para Planejamento
      </Link>
    </PageSection>
  );
}
