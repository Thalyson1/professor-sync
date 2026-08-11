import test from "node:test";
import assert from "node:assert/strict";

import {
  createPlannedLessonSchema,
  createPlanUnitSchema,
  createTeachingPlanSchema,
  updateTeachingPlanSchema
} from "./index";

test("createTeachingPlanSchema accepts valid payload", () => {
  const result = createTeachingPlanSchema.safeParse({
    teacherAssignmentId: "assignment-1",
    title: "Plano Semestral",
    description: "Descrição",
    educationBase: "technical",
    workloadHours: 40,
    weeklyLessons: 2,
    semester: "2026.2",
    status: "draft"
  });

  assert.equal(result.success, true);
});

test("createTeachingPlanSchema rejects invalid education base", () => {
  const result = createTeachingPlanSchema.safeParse({
    teacherAssignmentId: "assignment-1",
    title: "Plano",
    educationBase: "invalid"
  });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.ok(
      result.errors.includes("Selecione uma base educacional válida.")
    );
  }
});

test("updateTeachingPlanSchema requires id and valid status", () => {
  const result = updateTeachingPlanSchema.safeParse({
    id: "",
    teacherAssignmentId: "assignment-1",
    title: "Plano",
    educationBase: "technical",
    status: "wrong"
  });

  assert.equal(result.success, false);
});

test("createPlanUnitSchema validates title and plan id", () => {
  const result = createPlanUnitSchema.safeParse({
    teachingPlanId: "",
    title: ""
  });

  assert.equal(result.success, false);
});

test("createPlannedLessonSchema validates methodology and lesson number", () => {
  const result = createPlannedLessonSchema.safeParse({
    teachingPlanId: "plan-1",
    title: "Aula 01",
    methodology: "Inválida",
    lessonNumber: 0,
    durationLessons: 0
  });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.ok(result.errors.length >= 2);
  }
});
