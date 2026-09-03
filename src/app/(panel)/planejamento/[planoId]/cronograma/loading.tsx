import { PageSection } from "@/components/ui/page-section";

export default function CronogramaLoadingPage() {
  return (
    <PageSection
      title="Carregando cronograma"
      description="Preparando as aulas planejadas e as ações do dia."
    >
      <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-sm text-[var(--muted)]">
        Carregando cronograma...
      </div>
    </PageSection>
  );
}
