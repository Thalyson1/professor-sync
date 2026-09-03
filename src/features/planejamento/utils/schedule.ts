import type {
  AutoDistributeLessonsInput,
  PlannedLesson,
  PlannedLessonWithContext
} from "../types";

type DistributionLesson = Pick<
  PlannedLesson,
  "id" | "lessonNumber" | "durationLessons" | "plannedDate" | "position" | "status"
>;

export type LessonDistributionUpdate = {
  lessonId: string;
  plannedDate: string;
};

export type LessonDistributionResult =
  | {
      success: true;
      updates: LessonDistributionUpdate[];
      skippedLessonIds: string[];
    }
  | {
      success: false;
      message: string;
    };

export function sortLessonsChronologically<T extends PlannedLesson>(lessons: T[]) {
  return [...lessons].sort((left, right) => {
    const leftDate = left.plannedDate ?? "9999-12-31";
    const rightDate = right.plannedDate ?? "9999-12-31";

    return (
      leftDate.localeCompare(rightDate) ||
      left.position - right.position ||
      left.lessonNumber - right.lessonNumber
    );
  });
}

export function buildAutomaticLessonDistribution(
  lessons: DistributionLesson[],
  input: AutoDistributeLessonsInput
): LessonDistributionResult {
  if (input.weekDays.length === 0) {
    return {
      success: false,
      message: "Selecione pelo menos um dia da semana para distribuir as aulas."
    };
  }

  if (input.lessonsPerMeeting <= 0) {
    return {
      success: false,
      message: "A quantidade de tempos por encontro deve ser maior que zero."
    };
  }

  const startDate = parseDateOnly(input.startDate);

  if (!startDate) {
    return {
      success: false,
      message: "Informe uma data inicial vÃ¡lida."
    };
  }

  const endDate = input.endDate ? parseDateOnly(input.endDate) : null;

  if (input.endDate && !endDate) {
    return {
      success: false,
      message: "Informe uma data final vÃ¡lida."
    };
  }

  if (endDate && endDate < startDate) {
    return {
      success: false,
      message: "A data final nÃ£o pode ser anterior Ã  data inicial."
    };
  }

  const eligibleLessons = lessons
    .filter((lesson) => lesson.status !== "completed")
    .sort((left, right) => left.position - right.position || left.lessonNumber - right.lessonNumber);

  const lessonsToSchedule = eligibleLessons.filter((lesson) =>
    input.overwriteScheduledDates ? true : lesson.plannedDate === null
  );
  const skippedLessonIds = eligibleLessons
    .filter((lesson) => !lessonsToSchedule.some((candidate) => candidate.id === lesson.id))
    .map((lesson) => lesson.id);

  if (lessonsToSchedule.length === 0) {
    return {
      success: false,
      message:
        "NÃ£o hÃ¡ aulas elegÃ­veis para distribuiÃ§Ã£o automÃ¡tica com as regras atuais."
    };
  }

  const oversizedLesson = lessonsToSchedule.find(
    (lesson) => lesson.durationLessons > input.lessonsPerMeeting
  );

  if (oversizedLesson) {
    return {
      success: false,
      message:
        "Existe aula com quantidade de tempos maior que a capacidade informada por encontro."
    };
  }

  const updates: LessonDistributionUpdate[] = [];
  let cursor = new Date(startDate);
  let remainingCapacity = 0;

  for (const lesson of lessonsToSchedule) {
    let placed = false;

    while (!placed) {
      if (!matchesWeekDay(cursor, input.weekDays)) {
        cursor = addDays(cursor, 1);
        remainingCapacity = 0;
        continue;
      }

      if (endDate && cursor > endDate) {
        return {
          success: false,
          message:
            "NÃ£o foi possÃ­vel distribuir todas as aulas dentro do intervalo informado."
        };
      }

      if (remainingCapacity === 0) {
        remainingCapacity = input.lessonsPerMeeting;
      }

      if (lesson.durationLessons <= remainingCapacity) {
        updates.push({
          lessonId: lesson.id,
          plannedDate: formatDateOnly(cursor)
        });
        remainingCapacity -= lesson.durationLessons;
        placed = true;

        if (remainingCapacity === 0) {
          cursor = addDays(cursor, 1);
        }
      } else {
        cursor = addDays(cursor, 1);
        remainingCapacity = 0;
      }
    }
  }

  return {
    success: true,
    updates,
    skippedLessonIds
  };
}

export function getLessonVisualStatus(lesson: PlannedLesson) {
  if (lesson.status === "completed") {
    return "Realizada";
  }

  if (lesson.status === "postponed") {
    return "Adiada";
  }

  if (lesson.status === "cancelled") {
    return "Cancelada";
  }

  if (!lesson.plannedDate) {
    return "Sem data";
  }

  return "Planejada";
}

export function isLessonScheduledForToday(
  lesson: PlannedLessonWithContext,
  today: string
) {
  return lesson.plannedDate === today;
}

function parseDateOnly(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function matchesWeekDay(value: Date, weekDays: number[]) {
  return weekDays.includes(value.getDay());
}

function addDays(value: Date, amount: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
}
