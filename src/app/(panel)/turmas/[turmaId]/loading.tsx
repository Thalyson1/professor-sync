import { PageSection } from "@/components/ui/page-section";

export default function TurmaDetailLoading() {
  return (
    <PageSection
      title="Carregando turma"
      description="Buscando dados reais da turma e seus alunos."
    >
      <div className="space-y-4">
        <div className="h-52 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--card)]" />
        <div className="h-16 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--card)]" />
        <div className="h-96 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--card)]" />
      </div>
    </PageSection>
  );
}
