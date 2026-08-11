import { SIAGE_METHODOLOGIES } from "../utils/constants";
import { isEducationBase } from "../utils/status-rules";

import type { AiPlanningDraft, AiPlanningRequest } from "./types";

export function validateAiPlanningRequest(input: AiPlanningRequest) {
  const errors: string[] = [];

  if (!input.context.teacherAssignmentId) {
    errors.push("Selecione uma atribuição válida para gerar o planejamento.");
  }

  if (!input.description.trim()) {
    errors.push("Informe a descrição, ementa ou diretrizes pedagógicas.");
  }

  if (!isEducationBase(input.educationBase)) {
    errors.push("Selecione uma base educacional válida.");
  }

  if (input.workloadHours !== null && input.workloadHours <= 0) {
    errors.push("A carga horária deve ser maior que zero.");
  }

  if (input.weeklyLessons !== null && input.weeklyLessons <= 0) {
    errors.push("A quantidade de aulas semanais deve ser maior que zero.");
  }

  return errors;
}

export function validateAiPlanningDraft(draft: AiPlanningDraft) {
  const errors: string[] = [];

  if (!draft.title.trim()) {
    errors.push("A IA não retornou um título válido para o planejamento.");
  }

  if (!draft.description.trim()) {
    errors.push("A IA não retornou uma descrição válida para o planejamento.");
  }

  if (!isEducationBase(draft.educationBase)) {
    errors.push("A IA retornou uma base educacional inválida.");
  }

  const usedUnitPositions = new Set<number>();
  const usedLessonNumbers = new Set<number>();
  const usedLessonPositions = new Set<number>();

  draft.methodologies.forEach((methodology) => {
    if (!SIAGE_METHODOLOGIES.includes(methodology as (typeof SIAGE_METHODOLOGIES)[number])) {
      errors.push(`A IA retornou uma metodologia incompatível com o SIAGE: ${methodology}.`);
    }
  });

  draft.units.forEach((unit, unitIndex) => {
    if (!unit.title.trim()) {
      errors.push(`A unidade ${unitIndex + 1} não possui título válido.`);
    }

    if (usedUnitPositions.has(unit.position)) {
      errors.push("As unidades retornadas pela IA possuem posições duplicadas.");
    }

    usedUnitPositions.add(unit.position);

    unit.lessons.forEach((lesson, lessonIndex) => {
      if (!lesson.title.trim()) {
        errors.push(`A aula ${lessonIndex + 1} da unidade ${unitIndex + 1} não possui título válido.`);
      }

      if (usedLessonNumbers.has(lesson.lessonNumber)) {
        errors.push("A IA retornou números de aula duplicados no mesmo planejamento.");
      }

      if (usedLessonPositions.has(lesson.position)) {
        errors.push("A IA retornou posições de aula duplicadas no mesmo planejamento.");
      }

      if (
        !SIAGE_METHODOLOGIES.includes(
          lesson.methodology as (typeof SIAGE_METHODOLOGIES)[number]
        )
      ) {
        errors.push(
          `A IA retornou uma metodologia inválida na aula ${lesson.lessonNumber}.`
        );
      }

      if (lesson.durationLessons <= 0) {
        errors.push(`A aula ${lesson.lessonNumber} possui quantidade de tempos inválida.`);
      }

      usedLessonNumbers.add(lesson.lessonNumber);
      usedLessonPositions.add(lesson.position);
    });
  });

  return errors;
}
