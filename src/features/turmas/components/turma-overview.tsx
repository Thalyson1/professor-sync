import { IndicatorCard } from "@/components/ui/indicator-card";

import { getTurmaIndicators } from "../utils/turmas";
import type { Turma } from "../types";

import { UpcomingLessonsList } from "./upcoming-lessons-list";
import { AddDisciplinaForm } from "./add-disciplina-form";

type TurmaOverviewProps = {
  turma: Turma;
};

export function TurmaOverview({ turma }: TurmaOverviewProps) {
  const indicators = getTurmaIndicators(turma);

  return (
    <div className="space-y-6">
      <AddDisciplinaForm turmaId={turma.id} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {indicators.map((indicator) => (
          <IndicatorCard
            key={indicator.id}
            label={indicator.label}
            value={indicator.valor}
            helper={indicator.apoio}
          />
        ))}
      </div>

      <UpcomingLessonsList aulas={turma.resumo.proximasAulas} />
    </div>
  );
}
