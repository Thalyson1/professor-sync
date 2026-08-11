import test from "node:test";
import assert from "node:assert/strict";

import {
  canArchiveTeachingPlan,
  getTeachingPlanStatusLabel,
  isEducationBase,
  isPlannedLessonStatus,
  isTeachingPlanStatus
} from "./status-rules";

test("status guards validate allowed values", () => {
  assert.equal(isEducationBase("technical"), true);
  assert.equal(isEducationBase("bncc"), true);
  assert.equal(isEducationBase("other"), false);

  assert.equal(isTeachingPlanStatus("active"), true);
  assert.equal(isTeachingPlanStatus("invalid"), false);

  assert.equal(isPlannedLessonStatus("planned"), true);
  assert.equal(isPlannedLessonStatus("draft"), false);
});

test("canArchiveTeachingPlan blocks already archived plans", () => {
  assert.equal(canArchiveTeachingPlan("draft"), true);
  assert.equal(canArchiveTeachingPlan("archived"), false);
});

test("getTeachingPlanStatusLabel returns Portuguese labels", () => {
  assert.equal(getTeachingPlanStatusLabel("draft"), "Rascunho");
  assert.equal(getTeachingPlanStatusLabel("completed"), "Concluído");
});
