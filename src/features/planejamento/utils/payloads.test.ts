import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPlannedLessonInsertPayload,
  buildTeachingPlanInsertPayload,
  normalizeNullableText
} from "./payloads";

test("normalizeNullableText trims and converts empty strings to null", () => {
  assert.equal(normalizeNullableText("  Planejamento  "), "Planejamento");
  assert.equal(normalizeNullableText("   "), null);
  assert.equal(normalizeNullableText(undefined), null);
});

test("buildTeachingPlanInsertPayload normalizes nullable fields", () => {
  const payload = buildTeachingPlanInsertPayload({
    teacherAssignmentId: "assignment-1",
    title: "  Plano de Ensino  ",
    description: "  Descrição inicial  ",
    educationBase: "technical",
    workloadHours: 40,
    weeklyLessons: 2,
    semester: " 2026.2 ",
    status: "draft"
  });

  assert.deepEqual(payload, {
    teacher_assignment_id: "assignment-1",
    title: "Plano de Ensino",
    description: "Descrição inicial",
    education_base: "technical",
    workload_hours: 40,
    weekly_lessons: 2,
    semester: "2026.2",
    status: "draft"
  });
});

test("buildPlannedLessonInsertPayload sets defaults and nullables", () => {
  const payload = buildPlannedLessonInsertPayload(
    {
      teachingPlanId: "plan-1",
      planUnitId: null,
      title: " Aula 01 ",
      knowledgeObjects: " ",
      objectives: "Objetivo",
      methodology: null,
      observationsTemplate: "",
      plannedDate: null,
      lessonNumber: 1,
      durationLessons: 2
    },
    0
  );

  assert.equal(payload.title, "Aula 01");
  assert.equal(payload.knowledge_objects, null);
  assert.equal(payload.objectives, "Objetivo");
  assert.equal(payload.status, "planned");
  assert.equal(payload.position, 0);
});
