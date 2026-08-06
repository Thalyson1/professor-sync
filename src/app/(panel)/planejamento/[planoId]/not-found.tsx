import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageSection } from "@/components/ui/page-section";

export default function PlanejamentoNotFound() {
  return (
    <PageSection
      title="Planejamento não encontrado"
      description="O plano solicitado não existe no banco atual ou ainda não foi criado."
    >
      <EmptyState
        title="Não encontramos este planejamento"
        description="Volte para a listagem de atribuições para escolher um plano válido."
      />
      <Link
        href="/planejamento"
        className="inline-flex items-center justify-center rounded-2xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
      >
        Voltar para planejamento
      </Link>
    </PageSection>
  );
}
