import { PageSection } from "@/components/ui/page-section";

export default function PlanoEditorLoading() {
  return (
    <PageSection
      title="Carregando planejamento"
      description="Buscando plano, unidades e aulas planejadas."
    >
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--card)]" />
        <div className="h-96 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--card)]" />
        <div className="h-96 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--card)]" />
      </div>
    </PageSection>
  );
}
