/* eslint-disable @typescript-eslint/no-require-imports */

const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const ts = require("typescript");

const projectRoot = __dirname ? path.resolve(__dirname, "..") : process.cwd();

require.extensions[".ts"] = function registerTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true
    },
    fileName: filename
  });

  module._compile(outputText, filename);
};

const {
  createPlannedLessonSchema,
  createPlanUnitSchema,
  createTeachingPlanSchema,
  updateTeachingPlanSchema
} = require(path.join(
  projectRoot,
  "src/features/planejamento/schemas/index.ts"
));
const {
  buildPlannedLessonInsertPayload,
  buildTeachingPlanInsertPayload,
  normalizeNullableText
} = require(path.join(
  projectRoot,
  "src/features/planejamento/utils/payloads.ts"
));
const {
  canArchiveTeachingPlan,
  getEducationBaseLabel,
  getTeachingPlanStatusLabel,
  isEducationBase,
  isPlannedLessonStatus,
  isTeachingPlanStatus
} = require(path.join(
  projectRoot,
  "src/features/planejamento/utils/status-rules.ts"
));
const { parseAiPlanningDraft } = require(path.join(
  projectRoot,
  "src/features/planejamento/ai/parser.ts"
));

const tests = [
  {
    name: "createTeachingPlanSchema accepts valid payload",
    run() {
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
    }
  },
  {
    name: "createTeachingPlanSchema rejects invalid education base",
    run() {
      const result = createTeachingPlanSchema.safeParse({
        teacherAssignmentId: "assignment-1",
        title: "Plano",
        educationBase: "invalid"
      });

      assert.equal(result.success, false);

      if (!result.success) {
        assert.ok(result.errors.includes("Selecione uma base educacional válida."));
      }
    }
  },
  {
    name: "updateTeachingPlanSchema requires id and valid status",
    run() {
      const result = updateTeachingPlanSchema.safeParse({
        id: "",
        teacherAssignmentId: "assignment-1",
        title: "Plano",
        educationBase: "technical",
        status: "wrong"
      });

      assert.equal(result.success, false);
    }
  },
  {
    name: "createPlanUnitSchema validates title and plan id",
    run() {
      const result = createPlanUnitSchema.safeParse({
        teachingPlanId: "",
        title: ""
      });

      assert.equal(result.success, false);
    }
  },
  {
    name: "createPlannedLessonSchema validates methodology and lesson number",
    run() {
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
    }
  },
  {
    name: "normalizeNullableText trims and converts empty strings to null",
    run() {
      assert.equal(normalizeNullableText("  Planejamento  "), "Planejamento");
      assert.equal(normalizeNullableText("   "), null);
      assert.equal(normalizeNullableText(undefined), null);
    }
  },
  {
    name: "buildTeachingPlanInsertPayload normalizes nullable fields",
    run() {
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
    }
  },
  {
    name: "buildPlannedLessonInsertPayload sets defaults and nullables",
    run() {
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
    }
  },
  {
    name: "status guards validate allowed values",
    run() {
      assert.equal(isEducationBase("technical"), true);
      assert.equal(isEducationBase("bncc"), true);
      assert.equal(isEducationBase("other"), false);
      assert.equal(isTeachingPlanStatus("active"), true);
      assert.equal(isTeachingPlanStatus("invalid"), false);
      assert.equal(isPlannedLessonStatus("planned"), true);
      assert.equal(isPlannedLessonStatus("draft"), false);
    }
  },
  {
    name: "canArchiveTeachingPlan blocks already archived plans",
    run() {
      assert.equal(canArchiveTeachingPlan("draft"), true);
      assert.equal(canArchiveTeachingPlan("archived"), false);
    }
  },
  {
    name: "getTeachingPlanStatusLabel returns Portuguese labels",
    run() {
      assert.equal(getTeachingPlanStatusLabel("draft"), "Rascunho");
      assert.equal(getTeachingPlanStatusLabel("completed"), "Concluído");
    }
  }
  ,
  {
    name: "getEducationBaseLabel returns Portuguese labels",
    run() {
      assert.equal(getEducationBaseLabel("technical"), "Base técnica");
      assert.equal(getEducationBaseLabel("bncc"), "BNCC");
    }
  },
  {
    name: "parseAiPlanningDraft accepts a valid structured draft",
    run() {
      const result = parseAiPlanningDraft({
        title: "Plano gerado",
        description: "Organização semestral",
        educationBase: "technical",
        generalObjectives: ["Consolidar fundamentos da disciplina"],
        methodologies: ["Aula dialogada", "Aula prática"],
        assessmentStrategies: ["Avaliações diagnósticas e atividades práticas"],
        units: [
          {
            title: "Unidade 1",
            description: "Introdução aos conteúdos centrais",
            position: 0,
            lessons: [
              {
                lessonNumber: 1,
                title: "Aula 1",
                knowledgeObjects: "Conceitos iniciais",
                objectives: "Compreender os fundamentos",
                methodology: "Aula dialogada",
                observationsTemplate: "Registrar avanços da turma",
                durationLessons: 1,
                position: 0
              }
            ]
          }
        ]
      });

      assert.equal(result.success, true);
    }
  },
  {
    name: "parseAiPlanningDraft rejects invalid SIAGE methodologies",
    run() {
      const result = parseAiPlanningDraft({
        title: "Plano gerado",
        description: "Organização semestral",
        educationBase: "technical",
        generalObjectives: ["Consolidar fundamentos da disciplina"],
        methodologies: ["Metodologia inventada"],
        assessmentStrategies: ["Avaliações diagnósticas"],
        units: [
          {
            title: "Unidade 1",
            description: "Introdução",
            position: 0,
            lessons: [
              {
                lessonNumber: 1,
                title: "Aula 1",
                knowledgeObjects: "Conceitos iniciais",
                objectives: "Compreender os fundamentos",
                methodology: "Metodologia inventada",
                observationsTemplate: "Registrar avanços da turma",
                durationLessons: 1,
                position: 0
              }
            ]
          }
        ]
      });

      assert.equal(result.success, false);
    }
  }
];

let failures = 0;

for (const testCase of tests) {
  try {
    testCase.run();
    console.log(`PASS ${testCase.name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${testCase.name}`);
    console.error(error);
  }
}

if (failures > 0) {
  console.error(`\n${failures} teste(s) falharam.`);
  process.exit(1);
}

console.log(`\n${tests.length} teste(s) passaram.`);
