import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";

export default function TurmaNotFoundPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/turmas"
        className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
      >
        <span aria-hidden="true">←</span>
        <span>Voltar para turmas</span>
      </Link>

      <EmptyState
        title="Turma não encontrada"
        description="O identificador informado não corresponde a nenhuma turma simulada disponível no momento."
      />
    </div>
  );
}
