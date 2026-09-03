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
  buildCancelledLessonPayload,
  buildCompletedLessonPayload,
  buildPlannedLessonInsertPayload,
  buildPostponedLessonPayload,
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
const {
  deriveLessonExecutionRecord,
  parseLessonExecutionSnapshot,
  serializeLessonExecutionSnapshot
} = require(path.join(
  projectRoot,
  "src/features/planejamento/utils/execution.ts"
));
const {
  buildAutomaticLessonDistribution,
  getLessonVisualStatus,
  sortLessonsChronologically
} = require(path.join(
  projectRoot,
  "src/features/planejamento/utils/schedule.ts"
));
const { validateLessonRecordUpdate } = require(path.join(
  projectRoot,
  "src/features/registros/schemas.ts"
));
const { buildSiageLessonPayload } = require(path.join(
  projectRoot,
  "src/features/siage/lesson-records/index.ts"
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
  },
  {
    name: "buildAutomaticLessonDistribution distributes lessons chronologically with shared dates",
    run() {
      const result = buildAutomaticLessonDistribution(
        [
          {
            id: "lesson-1",
            lessonNumber: 1,
            durationLessons: 1,
            plannedDate: null,
            position: 0,
            status: "planned"
          },
          {
            id: "lesson-2",
            lessonNumber: 2,
            durationLessons: 1,
            plannedDate: null,
            position: 1,
            status: "planned"
          },
          {
            id: "lesson-3",
            lessonNumber: 3,
            durationLessons: 2,
            plannedDate: null,
            position: 2,
            status: "planned"
          }
        ],
        {
          teachingPlanId: "plan-1",
          startDate: "2026-08-11",
          weekDays: [2, 4],
          lessonsPerMeeting: 2,
          endDate: null,
          overwriteScheduledDates: false
        }
      );

      assert.equal(result.success, true);

      if (result.success) {
        assert.deepEqual(result.updates, [
          { lessonId: "lesson-1", plannedDate: "2026-08-11" },
          { lessonId: "lesson-2", plannedDate: "2026-08-11" },
          { lessonId: "lesson-3", plannedDate: "2026-08-13" }
        ]);
      }
    }
  },
  {
    name: "buildAutomaticLessonDistribution skips completed lessons and preserves scheduled ones without overwrite",
    run() {
      const result = buildAutomaticLessonDistribution(
        [
          {
            id: "lesson-1",
            lessonNumber: 1,
            durationLessons: 1,
            plannedDate: "2026-08-11",
            position: 0,
            status: "planned"
          },
          {
            id: "lesson-2",
            lessonNumber: 2,
            durationLessons: 1,
            plannedDate: null,
            position: 1,
            status: "completed"
          },
          {
            id: "lesson-3",
            lessonNumber: 3,
            durationLessons: 1,
            plannedDate: null,
            position: 2,
            status: "planned"
          }
        ],
        {
          teachingPlanId: "plan-1",
          startDate: "2026-08-12",
          weekDays: [3],
          lessonsPerMeeting: 1,
          endDate: null,
          overwriteScheduledDates: false
        }
      );

      assert.equal(result.success, true);

      if (result.success) {
        assert.deepEqual(result.updates, [
          { lessonId: "lesson-3", plannedDate: "2026-08-12" }
        ]);
        assert.deepEqual(result.skippedLessonIds, ["lesson-1"]);
      }
    }
  },
  {
    name: "sortLessonsChronologically prioritizes date then position then lesson number",
    run() {
      const result = sortLessonsChronologically([
        {
          id: "lesson-3",
          teachingPlanId: "plan-1",
          planUnitId: null,
          title: "Aula 3",
          knowledgeObjects: null,
          objectives: null,
          methodology: null,
          observationsTemplate: null,
          plannedDate: null,
          actualDate: null,
          lessonNumber: 3,
          durationLessons: 1,
          status: "planned",
          position: 2,
          completedAt: null,
          postponedFrom: null,
          executionNotes: null,
          createdAt: "",
          updatedAt: ""
        },
        {
          id: "lesson-2",
          teachingPlanId: "plan-1",
          planUnitId: null,
          title: "Aula 2",
          knowledgeObjects: null,
          objectives: null,
          methodology: null,
          observationsTemplate: null,
          plannedDate: "2026-08-12",
          actualDate: null,
          lessonNumber: 2,
          durationLessons: 1,
          status: "planned",
          position: 1,
          completedAt: null,
          postponedFrom: null,
          executionNotes: null,
          createdAt: "",
          updatedAt: ""
        },
        {
          id: "lesson-1",
          teachingPlanId: "plan-1",
          planUnitId: null,
          title: "Aula 1",
          knowledgeObjects: null,
          objectives: null,
          methodology: null,
          observationsTemplate: null,
          plannedDate: "2026-08-12",
          actualDate: null,
          lessonNumber: 1,
          durationLessons: 1,
          status: "planned",
          position: 0,
          completedAt: null,
          postponedFrom: null,
          executionNotes: null,
          createdAt: "",
          updatedAt: ""
        }
      ]);

      assert.deepEqual(
        result.map((lesson) => lesson.id),
        ["lesson-1", "lesson-2", "lesson-3"]
      );
    }
  },
  {
    name: "serialize and parse execution snapshot preserve content differences",
    run() {
      const serialized = serializeLessonExecutionSnapshot({
        followedPlan: false,
        note: "A turma precisou de retomada",
        actualKnowledgeObjects: "Revisão de algoritmos",
        actualObjectives: "Retomar estruturas condicionais",
        actualMethodology: "Aula dialogada",
        actualObservations: "Participação parcial"
      });
      const parsed = parseLessonExecutionSnapshot(serialized);

      assert.equal(parsed.followedPlan, false);
      assert.equal(parsed.actualKnowledgeObjects, "Revisão de algoritmos");
      assert.equal(parsed.actualMethodology, "Aula dialogada");
    }
  },
  {
    name: "deriveLessonExecutionRecord preserves original planning and applies real execution override",
    run() {
      const executionNotes = serializeLessonExecutionSnapshot({
        followedPlan: false,
        note: "Mudança de conteúdo por revisão",
        actualKnowledgeObjects: "Revisão de lógica",
        actualObjectives: "Corrigir lacunas da turma",
        actualMethodology: "Aula prática",
        actualObservations: "Retomada antes do conteúdo novo"
      });

      const result = deriveLessonExecutionRecord({
        id: "lesson-1",
        teachingPlanId: "plan-1",
        planUnitId: null,
        title: "Introdução",
        knowledgeObjects: "Conteúdo original",
        objectives: "Objetivo original",
        methodology: "Aula dialogada",
        observationsTemplate: "Observação original",
        plannedDate: "2026-08-11",
        actualDate: "2026-08-12",
        lessonNumber: 1,
        durationLessons: 1,
        status: "completed",
        position: 0,
        completedAt: "2026-08-12T10:00:00.000Z",
        postponedFrom: null,
        executionNotes,
        createdAt: "",
        updatedAt: ""
      });

      assert.equal(result.knowledgeObjects, "Revisão de lógica");
      assert.equal(result.methodology, "Aula prática");
      assert.equal(result.plannedDate, "2026-08-11");
      assert.equal(result.actualDate, "2026-08-12");
    }
  },
  {
    name: "execution payloads preserve the intended status transitions",
    run() {
      const completed = buildCompletedLessonPayload(
        {
          id: "lesson-1",
          teachingPlanId: "plan-1",
          actualDate: "2026-09-03",
          followedPlan: true,
          note: null,
          actualKnowledgeObjects: null,
          actualObjectives: null,
          actualMethodology: null,
          actualObservations: null
        },
        "{\"version\":1}"
      );
      const postponed = buildPostponedLessonPayload(
        "2026-09-03",
        {
          id: "lesson-1",
          teachingPlanId: "plan-1",
          plannedDate: "2026-09-10",
          note: "Feriado escolar"
        },
        "{\"version\":1}"
      );
      const cancelled = buildCancelledLessonPayload("Sem aula por conselho.");

      assert.equal(completed.status, "completed");
      assert.equal(completed.actual_date, "2026-09-03");
      assert.ok(completed.completed_at);
      assert.deepEqual(postponed, {
        status: "postponed",
        planned_date: "2026-09-10",
        postponed_from: "2026-09-03",
        execution_notes: "{\"version\":1}"
      });
      assert.deepEqual(cancelled, {
        status: "cancelled",
        execution_notes: "Sem aula por conselho."
      });
    }
  },
  {
    name: "getLessonVisualStatus reflects cronograma states including sem data",
    run() {
      assert.equal(
        getLessonVisualStatus({
          id: "lesson-1",
          teachingPlanId: "plan-1",
          planUnitId: null,
          title: "Sem data",
          knowledgeObjects: null,
          objectives: null,
          methodology: null,
          observationsTemplate: null,
          plannedDate: null,
          actualDate: null,
          lessonNumber: 1,
          durationLessons: 1,
          status: "planned",
          position: 0,
          completedAt: null,
          postponedFrom: null,
          executionNotes: null,
          createdAt: "",
          updatedAt: ""
        }),
        "Sem data"
      );
      assert.equal(
        getLessonVisualStatus({
          id: "lesson-2",
          teachingPlanId: "plan-1",
          planUnitId: null,
          title: "Realizada",
          knowledgeObjects: null,
          objectives: null,
          methodology: null,
          observationsTemplate: null,
          plannedDate: "2026-08-11",
          actualDate: "2026-08-11",
          lessonNumber: 2,
          durationLessons: 1,
          status: "completed",
          position: 1,
          completedAt: "2026-08-11T10:00:00.000Z",
          postponedFrom: null,
          executionNotes: null,
          createdAt: "",
          updatedAt: ""
        }),
        "Realizada"
      );
    }
  },
  {
    name: "lesson record validation accepts SIAGE-compatible execution data",
    run() {
      const result = validateLessonRecordUpdate({
        id: "record-1",
        lessonDate: "2026-09-03",
        knowledgeObjects: "VariÃ¡veis e tipos",
        methodology: "Aula contextualizada",
        observations: "ExercÃ­cios concluÃ­dos.",
        numberOfLessons: 2
      });
      assert.equal(result.success, true);
    }
  },
  {
    name: "lesson record validation rejects incompatible methodologies",
    run() {
      const result = validateLessonRecordUpdate({
        id: "record-1",
        lessonDate: "2026-09-03",
        methodology: "Metodologia inventada",
        numberOfLessons: 1
      });
      assert.equal(result.success, false);
    }
  },
  {
    name: "SIAGE lesson mapper remains partial without a captured write payload",
    run() {
      const result = buildSiageLessonPayload({});
      assert.equal(result.supported, false);
      assert.equal(result.payload, null);
      assert.ok(result.pendingInternalFields.includes("methodology"));
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
