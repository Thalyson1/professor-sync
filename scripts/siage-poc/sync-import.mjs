import { readFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

import {
  logItem,
  logSection,
  sanitizeJsonPayload,
} from "./utils.mjs";

const inputFile = path.resolve(
  "scripts/siage-poc/output/normalized/siage-sync-preview.json"
);
const batchSize = 100;

async function main() {
  loadLocalEnvFiles();

  const dryRun = parseDryRunFlag(process.argv.slice(2));
  const preview = await readPreviewFile(inputFile);
  const payload = buildImportPayload(preview);
  const validation = validateImportPayload(payload, preview);

  logSection(dryRun ? "Dry Run" : "Importação");
  logItem("Arquivo", inputFile);
  logItem("Lote", batchSize);
  logItem("Modo", dryRun ? "dry-run" : "write");
  printCounts(payload);

  if (validation.inconsistencies.length > 0) {
    console.log("Inconsistências encontradas:");
    for (const item of validation.inconsistencies) {
      console.log(`- ${item}`);
    }
  }

  if (dryRun) {
    return;
  }

  if (validation.inconsistencies.length > 0) {
    throw new Error(
      "O preview normalizado possui inconsistências e não pode ser importado nesta execução."
    );
  }

  const env = requireImportEnv();
  const supabase = createClient(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const syncRun = await createSyncRun(supabase, payload);
  const state = {
    errorCount: 0,
  };

  try {
    const schoolsMap = await upsertByExternalId({
      supabase,
      syncRunId: syncRun.id,
      state,
      table: "schools",
      entityType: "school",
      rows: payload.schools.map((item) => ({
        external_id: item.externalId,
        name: item.name,
        source: item.source,
        raw_metadata: item.rawMetadata,
        last_synced_at: item.lastSyncedAt,
      })),
    });

    const academicPeriodsMap = await upsertByExternalId({
      supabase,
      syncRunId: syncRun.id,
      state,
      table: "academic_periods",
      entityType: "academic_period",
      rows: payload.academicPeriods.map((item) => ({
        external_id: item.externalId,
        year: item.year,
        name: item.name,
        is_active: item.isActive,
        source: item.source,
        last_synced_at: item.lastSyncedAt,
      })),
    });

    const professionalsMap = await upsertByExternalId({
      supabase,
      syncRunId: syncRun.id,
      state,
      table: "professionals",
      entityType: "professional",
      rows: payload.professionals.map((item) => ({
        external_id: item.externalId,
        name: item.name,
        email: item.email,
        role: item.role,
        status: item.status,
        source: item.source,
        raw_metadata: item.rawMetadata,
        last_synced_at: item.lastSyncedAt,
      })),
    });

    const professionalEnrollmentsMap = await upsertByExternalId({
      supabase,
      syncRunId: syncRun.id,
      state,
      table: "professional_enrollments",
      entityType: "professional_enrollment",
      rows: payload.professionalEnrollments.map((item) => ({
        external_id: item.externalId,
        professional_id: requireMappedId(
          professionalsMap,
          item.professionalExternalId,
          "professional",
          item.externalId
        ),
        school_id: item.schoolExternalId
          ? requireMappedId(
              schoolsMap,
              item.schoolExternalId,
              "school",
              item.externalId
            )
          : null,
        status: item.status,
        source: item.source,
        raw_metadata: item.rawMetadata,
        last_synced_at: item.lastSyncedAt,
      })),
    });

    const classesMap = await upsertByExternalId({
      supabase,
      syncRunId: syncRun.id,
      state,
      table: "classes",
      entityType: "class",
      rows: payload.classes.map((item) => ({
        external_id: item.externalId,
        school_id: requireMappedId(
          schoolsMap,
          item.schoolExternalId,
          "school",
          item.externalId
        ),
        academic_period_id: requireMappedId(
          academicPeriodsMap,
          item.academicPeriodExternalId,
          "academic_period",
          item.externalId
        ),
        name: item.name,
        grade: item.grade,
        letter: item.letter,
        shift: normalizeLegacyShift(item.shift),
        room: item.room,
        course: item.course,
        stage: item.stage,
        student_count: item.studentCount,
        source: item.source,
        raw_metadata: item.rawMetadata,
        last_synced_at: item.lastSyncedAt,
      })),
    });

    const subjectsMap = await upsertByExternalId({
      supabase,
      syncRunId: syncRun.id,
      state,
      table: "subjects",
      entityType: "subject",
      rows: payload.subjects.map((item) => ({
        external_id: item.externalId,
        curriculum_subject_external_id: item.curriculumSubjectExternalId,
        name: item.name,
        workload: item.workload,
        component_type: item.componentType,
        source: item.source,
        raw_metadata: item.rawMetadata,
        last_synced_at: item.lastSyncedAt,
      })),
    });

    const teacherAssignmentsMap = await upsertByExternalId({
      supabase,
      syncRunId: syncRun.id,
      state,
      table: "teacher_assignments",
      entityType: "teacher_assignment",
      rows: payload.teacherAssignments.map((item) => ({
        external_id: item.externalId,
        class_id: requireMappedId(
          classesMap,
          item.classExternalId,
          "class",
          item.externalId
        ),
        subject_id: requireMappedId(
          subjectsMap,
          item.subjectExternalId,
          "subject",
          item.externalId
        ),
        professional_enrollment_id: requireMappedId(
          professionalEnrollmentsMap,
          item.professionalEnrollmentExternalId,
          "professional_enrollment",
          item.externalId
        ),
        curriculum_subject_external_id: item.curriculumSubjectExternalId,
        semester: item.semester,
        multiple_allocation: item.multipleAllocation,
        source: item.source,
        raw_metadata: item.rawMetadata,
        last_synced_at: item.lastSyncedAt,
      })),
    });

    const studentsMap = await upsertByExternalId({
      supabase,
      syncRunId: syncRun.id,
      state,
      table: "students",
      entityType: "student",
      rows: payload.students.map((item) => ({
        external_id: item.externalId,
        name: item.name,
        enrollment_number: item.enrollmentNumber,
        status: item.status,
        source: item.source,
        raw_metadata: item.rawMetadata,
        last_synced_at: item.lastSyncedAt,
      })),
    });

    await upsertByCompositeKey({
      supabase,
      syncRunId: syncRun.id,
      state,
      table: "class_enrollments",
      entityType: "class_enrollment",
      onConflict: "class_id,student_id",
      rows: payload.classEnrollments.map((item) => ({
        class_id: requireMappedId(
          classesMap,
          item.classExternalId,
          "class",
          item.externalId
        ),
        student_id: requireMappedId(
          studentsMap,
          item.studentExternalId,
          "student",
          item.externalId
        ),
        external_id: item.externalId,
        status: item.status,
        source: item.source,
        raw_metadata: item.rawMetadata,
        last_synced_at: item.lastSyncedAt,
      })),
    });

    await upsertByCompositeKey({
      supabase,
      syncRunId: syncRun.id,
      state,
      table: "assignment_students",
      entityType: "assignment_student",
      onConflict: "teacher_assignment_id,student_id",
      rows: payload.assignmentStudents.map((item) => ({
        teacher_assignment_id: requireMappedId(
          teacherAssignmentsMap,
          item.teacherAssignmentExternalId,
          "teacher_assignment",
          item.externalId
        ),
        student_id: requireMappedId(
          studentsMap,
          item.studentExternalId,
          "student",
          item.externalId
        ),
        external_id: item.externalId,
        source: item.source,
        raw_metadata: item.rawMetadata,
        last_synced_at: item.lastSyncedAt,
      })),
    });

    await finishSyncRun({
      supabase,
      syncRunId: syncRun.id,
      status: state.errorCount > 0 ? "failed" : "success",
      errorCount: state.errorCount,
      payload,
    });
  } catch (error) {
    state.errorCount += 1;
    await insertSyncError({
      supabase,
      syncRunId: syncRun.id,
      entityType: "sync_run",
      externalId: payload.metadata.professionalEnrollmentId,
      message: error instanceof Error ? error.message : String(error),
      details: {
        source: payload.metadata.source,
      },
    });

    await finishSyncRun({
      supabase,
      syncRunId: syncRun.id,
      status: "failed",
      errorCount: state.errorCount,
      payload,
    });

    throw error;
  }
}

function loadLocalEnvFiles() {
  const envFiles = [".env.local", ".env"];

  for (const fileName of envFiles) {
    const fullPath = path.resolve(fileName);

    try {
      const content = readFileSync(fullPath, "utf8");
      applyEnvContent(content);
    } catch {
      // Ignore missing local env files.
    }
  }
}

function parseDryRunFlag(argv) {
  if (process.env.npm_config_dry_run === "true") {
    return true;
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const nextArg = argv[index + 1];

    if (arg === "--dry-run") {
      if (typeof nextArg === "string" && !nextArg.startsWith("--")) {
        return !["false", "0", "no", "off"].includes(nextArg.toLowerCase());
      }

      return true;
    }

    if (arg.startsWith("--dry-run=")) {
      const value = arg.slice("--dry-run=".length).toLowerCase();
      return !["false", "0", "no", "off"].includes(value);
    }
  }

  return false;
}

function applyEnvContent(content) {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (!key || process.env[key]) {
      continue;
    }

    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

async function readPreviewFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Não foi possível ler o preview normalizado em ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function buildImportPayload(preview) {
  const source = preview.metadata?.source ?? "siage";
  const lastSyncedAt = preview.metadata?.generatedAt ?? new Date().toISOString();
  const academicYearId = preview.metadata?.academicYearId ?? "";
  const academicYear = deriveAcademicYear(preview);
  const schoolExternalId = preview.schools?.[0]?.externalId ?? null;

  const academicPeriods = [
    {
      externalId: academicYearId,
      year: academicYear,
      name: academicYear ? `Ano letivo ${academicYear}` : "Ano letivo SIAGE",
      isActive: true,
      source,
      lastSyncedAt,
    },
  ].filter((item) => item.externalId);

  const professionals = [
    {
      externalId: preview.professional?.externalId,
      name: preview.professional?.name,
      email: preview.professional?.email ?? null,
      role: preview.professional?.role ?? null,
      status: preview.professional?.status ?? null,
      source,
      rawMetadata: sanitizeJsonPayload(preview.professional?.rawMetadata ?? {}),
      lastSyncedAt,
    },
  ].filter((item) => item.externalId);

  const professionalEnrollments = [
    {
      externalId: preview.professional?.enrollmentExternalId,
      professionalExternalId: preview.professional?.externalId,
      schoolExternalId,
      status: preview.professional?.status ?? null,
      source,
      rawMetadata: sanitizeJsonPayload(preview.professional?.rawMetadata ?? {}),
      lastSyncedAt,
    },
  ].filter((item) => item.externalId);

  return {
    metadata: {
      generatedAt: lastSyncedAt,
      source,
      academicYearId,
      professionalEnrollmentId:
        preview.professional?.enrollmentExternalId ??
        preview.metadata?.professionalEnrollmentId ??
        "",
    },
    schools: (preview.schools ?? []).map((item) => ({
      externalId: item.externalId,
      name: item.name,
      source,
      rawMetadata: sanitizeJsonPayload(item.rawMetadata ?? {}),
      lastSyncedAt,
    })),
    academicPeriods,
    professionals,
    professionalEnrollments,
    classes: (preview.classes ?? []).map((item) => ({
      externalId: item.externalId,
      schoolExternalId: item.schoolExternalId,
      academicPeriodExternalId: item.academicYearExternalId,
      name: item.name,
      grade: item.grade,
      letter: item.letter,
      shift: item.shift,
      room: item.room ?? null,
      course: item.course ?? null,
      stage: item.stage ?? null,
      studentCount: item.studentCount ?? 0,
      source,
      rawMetadata: sanitizeJsonPayload(item.rawMetadata ?? {}),
      lastSyncedAt,
    })),
    subjects: (preview.subjects ?? []).map((item) => ({
      externalId: item.externalId,
      curriculumSubjectExternalId: item.curriculumSubjectExternalId ?? null,
      name: item.name,
      workload: item.workload ?? null,
      componentType: item.componentType ?? null,
      source,
      rawMetadata: sanitizeJsonPayload(item.rawMetadata ?? {}),
      lastSyncedAt,
    })),
    teacherAssignments: (preview.teacherAssignments ?? []).map((item) => ({
      externalId: item.externalId,
      classExternalId: item.classExternalId,
      subjectExternalId: item.subjectExternalId,
      professionalEnrollmentExternalId: item.professionalEnrollmentExternalId,
      curriculumSubjectExternalId: item.curriculumSubjectExternalId ?? null,
      semester: item.semester ?? null,
      multipleAllocation: item.multipleAllocation ?? null,
      source,
      rawMetadata: sanitizeJsonPayload(item.rawMetadata ?? {}),
      lastSyncedAt,
    })),
    students: (preview.students ?? []).map((item) => ({
      externalId: item.externalId,
      name: item.name,
      enrollmentNumber: item.enrollmentNumber ?? null,
      status: item.status ?? null,
      source,
      rawMetadata: sanitizeJsonPayload(item.rawMetadata ?? {}),
      lastSyncedAt,
    })),
    classEnrollments: (preview.classEnrollments ?? []).map((item) => ({
      externalId: item.externalId,
      classExternalId: item.classExternalId,
      studentExternalId: item.studentExternalId,
      status: item.status ?? null,
      source,
      rawMetadata: sanitizeJsonPayload(item.rawMetadata ?? {}),
      lastSyncedAt,
    })),
    assignmentStudents: (preview.assignmentStudents ?? []).map((item) => ({
      externalId: item.externalId,
      teacherAssignmentExternalId: item.teacherAssignmentExternalId,
      studentExternalId: item.studentExternalId,
      source,
      rawMetadata: sanitizeJsonPayload(item.rawMetadata ?? {}),
      lastSyncedAt,
    })),
  };
}

function deriveAcademicYear(preview) {
  const candidate =
    preview.metadata?.generatedAt?.slice(0, 4) ??
    preview.classes?.[0]?.rawMetadata?.header?.turmaEtapa?.match(/\b(20\d{2})\b/)?.[1] ??
    null;

  const parsed = Number.parseInt(candidate ?? "", 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateImportPayload(payload, preview) {
  const requiredCollections = [
    "schools",
    "academicPeriods",
    "professionals",
    "professionalEnrollments",
    "classes",
    "subjects",
    "teacherAssignments",
    "students",
    "classEnrollments",
    "assignmentStudents",
  ];

  for (const collectionName of requiredCollections) {
    if (!Array.isArray(payload[collectionName])) {
      throw new Error(`A coleção ${collectionName} não está em formato de array.`);
    }
  }

  const inconsistencies = [...(preview.diagnostics?.inconsistencies ?? [])];

  const classIds = new Set(payload.classes.map((item) => item.externalId));
  const subjectIds = new Set(payload.subjects.map((item) => item.externalId));
  const assignmentIds = new Set(
    payload.teacherAssignments.map((item) => item.externalId)
  );
  const studentIds = new Set(payload.students.map((item) => item.externalId));
  const schoolIds = new Set(payload.schools.map((item) => item.externalId));
  const academicPeriodIds = new Set(
    payload.academicPeriods.map((item) => item.externalId)
  );
  const professionalIds = new Set(
    payload.professionals.map((item) => item.externalId)
  );
  const professionalEnrollmentIds = new Set(
    payload.professionalEnrollments.map((item) => item.externalId)
  );

  for (const item of payload.classes) {
    if (!schoolIds.has(item.schoolExternalId)) {
      inconsistencies.push(`class-sem-school:${item.externalId}`);
    }

    if (!academicPeriodIds.has(item.academicPeriodExternalId)) {
      inconsistencies.push(`class-sem-academic-period:${item.externalId}`);
    }
  }

  for (const item of payload.professionalEnrollments) {
    if (!professionalIds.has(item.professionalExternalId)) {
      inconsistencies.push(`professional-enrollment-sem-professional:${item.externalId}`);
    }
  }

  for (const item of payload.teacherAssignments) {
    if (!classIds.has(item.classExternalId)) {
      inconsistencies.push(`teacher-assignment-sem-class:${item.externalId}`);
    }

    if (!subjectIds.has(item.subjectExternalId)) {
      inconsistencies.push(`teacher-assignment-sem-subject:${item.externalId}`);
    }

    if (!professionalEnrollmentIds.has(item.professionalEnrollmentExternalId)) {
      inconsistencies.push(
        `teacher-assignment-sem-professional-enrollment:${item.externalId}`
      );
    }
  }

  for (const item of payload.classEnrollments) {
    if (!classIds.has(item.classExternalId)) {
      inconsistencies.push(`class-enrollment-sem-class:${item.externalId}`);
    }

    if (!studentIds.has(item.studentExternalId)) {
      inconsistencies.push(`class-enrollment-sem-student:${item.externalId}`);
    }
  }

  for (const item of payload.assignmentStudents) {
    if (!assignmentIds.has(item.teacherAssignmentExternalId)) {
      inconsistencies.push(`assignment-student-sem-assignment:${item.externalId}`);
    }

    if (!studentIds.has(item.studentExternalId)) {
      inconsistencies.push(`assignment-student-sem-student:${item.externalId}`);
    }
  }

  return {
    inconsistencies: [...new Set(inconsistencies)],
  };
}

function printCounts(payload) {
  logItem("schools", payload.schools.length);
  logItem("academicPeriods", payload.academicPeriods.length);
  logItem("professionals", payload.professionals.length);
  logItem("professionalEnrollments", payload.professionalEnrollments.length);
  logItem("classes", payload.classes.length);
  logItem("subjects", payload.subjects.length);
  logItem("teacherAssignments", payload.teacherAssignments.length);
  logItem("students", payload.students.length);
  logItem("classEnrollments", payload.classEnrollments.length);
  logItem("assignmentStudents", payload.assignmentStudents.length);
}

function requireImportEnv() {
  const url = process.env.SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de executar a importação."
    );
  }

  return { url, serviceRoleKey };
}

async function createSyncRun(supabase, payload) {
  const row = {
    source: payload.metadata.source,
    status: "running",
    started_at: new Date().toISOString(),
    classes_count: payload.classes.length,
    subjects_count: payload.subjects.length,
    students_count: payload.students.length,
    assignments_count: payload.teacherAssignments.length,
    class_enrollments_count: payload.classEnrollments.length,
    assignment_students_count: payload.assignmentStudents.length,
    error_count: 0,
    metadata: {
      inputFile,
      generatedAt: payload.metadata.generatedAt,
      academicYearId: payload.metadata.academicYearId,
      professionalEnrollmentId: payload.metadata.professionalEnrollmentId,
    },
  };

  const { data, error } = await supabase
    .from("sync_runs")
    .insert(row)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Não foi possível criar sync_runs: ${error?.message ?? "unknown error"}`);
  }

  return data;
}

async function finishSyncRun({
  supabase,
  syncRunId,
  status,
  errorCount,
  payload,
}) {
  const { error } = await supabase
    .from("sync_runs")
    .update({
      status,
      finished_at: new Date().toISOString(),
      error_count: errorCount,
      classes_count: payload.classes.length,
      subjects_count: payload.subjects.length,
      students_count: payload.students.length,
      assignments_count: payload.teacherAssignments.length,
      class_enrollments_count: payload.classEnrollments.length,
      assignment_students_count: payload.assignmentStudents.length,
    })
    .eq("id", syncRunId);

  if (error) {
    throw new Error(`Não foi possível finalizar sync_runs: ${error.message}`);
  }
}

async function upsertByExternalId({
  supabase,
  syncRunId,
  state,
  table,
  entityType,
  rows,
}) {
  const processed = [];

  for (const chunk of chunkArray(rows, batchSize)) {
    try {
      const { data, error } = await supabase
        .from(table)
        .upsert(chunk, {
          onConflict: "source,external_id",
        })
        .select("id, external_id, source");

      if (error) {
        throw error;
      }

      processed.push(...(data ?? []));
    } catch {
      await processRowsIndividually({
        supabase,
        syncRunId,
        state,
        table,
        entityType,
        rows: chunk,
        onConflict: "source,external_id",
        processed,
      });
    }
  }

  return new Map(
    processed.map((item) => [`${item.source}:${item.external_id}`, item.id])
  );
}

async function upsertByCompositeKey({
  supabase,
  syncRunId,
  state,
  table,
  entityType,
  onConflict,
  rows,
}) {
  for (const chunk of chunkArray(rows, batchSize)) {
    try {
      const { error } = await supabase.from(table).upsert(chunk, { onConflict });

      if (error) {
        throw error;
      }
    } catch {
      await processRowsIndividually({
        supabase,
        syncRunId,
        state,
        table,
        entityType,
        rows: chunk,
        onConflict,
      });
    }
  }
}

async function processRowsIndividually({
  supabase,
  syncRunId,
  state,
  table,
  entityType,
  rows,
  onConflict,
  processed = null,
}) {
  for (const row of rows) {
    const query = supabase.from(table).upsert(row, { onConflict });
    const result = processed
      ? await query.select("id, external_id, source")
      : await query;
    const { data, error } = result;

    if (error) {
      state.errorCount += 1;
      await insertSyncError({
        supabase,
        syncRunId,
        entityType,
        externalId: row.external_id ?? row.externalId ?? row.enrollment_number ?? null,
        message: error.message,
        details: {
          table,
          row,
        },
      });
      continue;
    }

    if (processed && data) {
      processed.push(...data);
    }
  }
}

async function insertSyncError({
  supabase,
  syncRunId,
  entityType,
  externalId,
  message,
  details,
}) {
  await supabase.from("sync_errors").insert({
    sync_run_id: syncRunId,
    entity_type: entityType,
    external_id: externalId,
    message,
    details,
  });
}

function requireMappedId(map, externalId, entityType, ownerExternalId) {
  const key = `siage:${externalId}`;
  const value = map.get(key);

  if (!value) {
    throw new Error(
      `Não foi possível resolver ${entityType}=${externalId} para o registro ${ownerExternalId}.`
    );
  }

  return value;
}

function normalizeLegacyShift(shift) {
  const normalized = String(shift ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  if (normalized === "integral") {
    return "integral";
  }

  if (normalized === "night" || normalized === "noite" || normalized === "noturno") {
    return "night";
  }

  return "integral";
}

function chunkArray(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

main().catch((error) => {
  console.error(
    `Falha na importação do preview SIAGE: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
  process.exitCode = 1;
});
