import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { chromium } from "playwright";

import {
  ensureDirectories,
  logItem,
  logSection,
  normalizedRoot,
  parseArgs,
  rawRoot,
  readJsonFile,
  sanitizeDiagnosticValue,
  sanitizeJsonPayload,
  sanitizeUrl,
  sessionFile,
  shouldTrackRequest,
  slugify,
  writeJsonFile,
} from "./utils.mjs";

const previewFile = path.join(normalizedRoot, "siage-sync-preview.json");

async function main() {
  const options = parseArgs(process.argv.slice(2));

  await ensureDirectories();

  const storageState = await readJsonFile(sessionFile).catch(() => null);

  if (!storageState) {
    throw new Error(
      "Sessão autenticada não encontrada. Execute primeiro a POC principal para gerar scripts/siage-poc/session/siage-session.json."
    );
  }

  const appOrigin = options.url
    ? new URL(options.url).origin
    : deriveOriginFromStorageState(storageState);

  if (!appOrigin) {
    throw new Error(
      'Não foi possível determinar a origem do SIAGE. Informe --url="https://professor.see.pb.gov.br/auth".'
    );
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: sessionFile });
  const page = await context.newPage();
  const discovery = createDiscoveryState();

  attachDiscoveryListeners(page, discovery);

  try {
    logSection("Leitura autenticada");
    logItem("Origem do app", appOrigin);

    const listUrl = new URL("/diario/minhas-turmas/listagem-turmas", appOrigin).toString();
    await page.goto(listUrl, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await waitForDiscovery(discovery);

    const runtime = finalizeRuntime(discovery);

    logSection("Contexto descoberto");
    logItem("API base", runtime.apiBaseUrl);
    logItem("Ano letivo", runtime.academicYearId || "não encontrado");
    logItem(
      "Matrícula profissional",
      runtime.professionalEnrollmentId || "não encontrada"
    );

    const professionalEnrollmentsPayload =
      discovery.initialResponses.professionalEnrollments ??
      (await fetchEndpoint({
        context,
        runtime,
        relativeUrl: "/api/profissional/minhas-matriculas",
        rawLabel: "professional-enrollments",
      }));

    await saveRawPayload("professional-enrollments", professionalEnrollmentsPayload);

    const enrollmentOptions = getEnrollmentOptions(professionalEnrollmentsPayload);
    logItem("Matrículas encontradas", enrollmentOptions.length);

    const selectedEnrollment =
      selectActiveEnrollment(enrollmentOptions) ??
      enrollmentOptions[0] ??
      null;

    if (!selectedEnrollment) {
      throw new Error("Nenhuma matrícula profissional foi encontrada.");
    }

    const professionalEnrollmentId =
      selectedEnrollment.id || runtime.professionalEnrollmentId || null;

    if (!professionalEnrollmentId) {
      throw new Error("Não foi possível descobrir profissionalMatriculaId.");
    }

    logItem("Matrícula selecionada", professionalEnrollmentId);

    const professionalPayload =
      discovery.initialResponses.professional ??
      (await fetchEndpoint({
        context,
        runtime,
        relativeUrl: "/api/profissional",
        rawLabel: "professional",
      }));

    await saveRawPayload("professional", professionalPayload);

    const firstClassesPage =
      discovery.initialResponses.classesPage1 ??
      (await fetchEndpoint({
        context,
        runtime,
        relativeUrl: buildClassesPath({
          academicYearId: runtime.academicYearId,
          professionalEnrollmentId,
          page: 1,
        }),
        rawLabel: "classes-page-1",
      }));

    await saveRawPayload("classes-page-1", firstClassesPage);

    const classPageCount = getClassesPageCount(firstClassesPage);
    const classRows = [...getClassRows(firstClassesPage)];

    logItem("Turmas encontradas na página 1", classRows.length);
    logItem("Páginas de turmas", classPageCount);

    for (let currentPage = 2; currentPage <= classPageCount; currentPage += 1) {
      try {
        const pagePayload = await fetchEndpoint({
          context,
          runtime,
          relativeUrl: buildClassesPath({
            academicYearId: runtime.academicYearId,
            professionalEnrollmentId,
            page: currentPage,
          }),
          rawLabel: `classes-page-${currentPage}`,
        });

        await saveRawPayload(`classes-page-${currentPage}`, pagePayload);
        classRows.push(...getClassRows(pagePayload));
        logItem("Página de turmas processada", currentPage);
      } catch (error) {
        console.error(
          `Erro ao processar a página de turmas ${currentPage}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    const schoolExternalId =
      getValue(firstClassesPage, [
        "data.escolaId",
        "data.schoolId",
      ]) ?? null;

    const classes = [];
    const subjects = [];
    const students = [];
    const enrollments = [];
    const schools = [];
    const classErrors = [];

    for (const classRow of classRows) {
      const normalizedClass = normalizeClassRow({
        classRow,
        schoolExternalId,
        academicYearId: runtime.academicYearId,
      });

      classes.push(normalizedClass);
      subjects.push(normalizeSubjectRow(classRow));
      schools.push(normalizeSchoolRecord(classRow, schoolExternalId));

      try {
        const classPagePayload = await fetchAllStudentPages({
          context,
          runtime,
          professionalEnrollmentId,
          classRow,
        });

        for (const rawPayload of classPagePayload.rawPayloads) {
          await saveRawPayload(rawPayload.label, rawPayload.payload);
        }

        if (classPagePayload.headerPayload) {
          await saveRawPayload(
            classPagePayload.headerLabel,
            classPagePayload.headerPayload
          );
        }

        const normalizedStudents = classPagePayload.studentRows.map((studentRow) =>
          normalizeStudentRow(studentRow)
        );

        const normalizedEnrollments = classPagePayload.studentRows.map((studentRow) =>
          normalizeEnrollmentRow({
            studentRow,
            classExternalId: normalizedClass.externalId,
          })
        );

        students.push(...normalizedStudents);
        enrollments.push(...normalizedEnrollments);

        normalizedClass.studentCount =
          normalizedClass.studentCount ?? normalizedStudents.length;

        if (classPagePayload.headerPayload) {
          normalizedClass.rawMetadata = {
            ...normalizedClass.rawMetadata,
            header: sanitizeJsonPayload(
              getValue(classPagePayload.headerPayload, ["data"]) ??
                classPagePayload.headerPayload
            ),
          };
        }

        logItem(
          `Alunos na turma ${normalizedClass.externalId}`,
          normalizedStudents.length
        );
      } catch (error) {
        classErrors.push({
          classExternalId: normalizedClass.externalId,
          message: error instanceof Error ? error.message : String(error),
        });
        console.error(
          `Erro ao processar a turma ${normalizedClass.externalId}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    const uniqueSchools = dedupeBy(schools, (item) => item.externalId);
    const uniqueClasses = dedupeBy(classes, (item) => item.externalId);
    const uniqueSubjects = dedupeBy(subjects, (item) => item.externalId);
    const uniqueStudents = dedupeBy(students, (item) => item.externalId);
    const uniqueEnrollments = dedupeBy(
      enrollments,
      (item) => item.externalId || `${item.studentExternalId}:${item.classExternalId}`
    );

    logSection("Deduplicação");
    logItem("Escolas removidas", schools.length - uniqueSchools.length);
    logItem("Turmas removidas", classes.length - uniqueClasses.length);
    logItem("Disciplinas removidas", subjects.length - uniqueSubjects.length);
    logItem("Alunos removidos", students.length - uniqueStudents.length);
    logItem("Vínculos removidos", enrollments.length - uniqueEnrollments.length);

    const normalizedPreview = {
      metadata: {
        generatedAt: new Date().toISOString(),
        source: "siage",
        academicYearId: runtime.academicYearId ?? "",
        professionalEnrollmentId,
      },
      professional: normalizeProfessional(professionalPayload, selectedEnrollment),
      schools: uniqueSchools,
      classes: uniqueClasses,
      subjects: uniqueSubjects,
      students: uniqueStudents,
      enrollments: uniqueEnrollments,
      diagnostics: {
        fieldsFound: collectFieldPresence({
          professionalPayload,
          classRows,
          studentRows: uniqueStudents,
        }).found,
        fieldsMissing: collectFieldPresence({
          professionalPayload,
          classRows,
          studentRows: uniqueStudents,
        }).missing,
        classErrors,
      },
    };

    await writeJsonFile(previewFile, normalizedPreview);

    logSection("Resumo");
    logItem("Preview normalizado", previewFile);
    logItem("Turmas processadas", uniqueClasses.length);
    logItem("Alunos processados", uniqueStudents.length);
    logItem("Erros por turma", classErrors.length);
  } finally {
    await browser.close();
  }
}

function createDiscoveryState() {
  return {
    apiBaseUrl: null,
    academicYearId: null,
    professionalEnrollmentId: null,
    templateHeaders: null,
    initialResponses: {
      professionalEnrollments: null,
      professional: null,
      classesPage1: null,
    },
  };
}

function attachDiscoveryListeners(page, discovery) {
  page.on("response", async (response) => {
    const request = response.request();

    if (!shouldTrackRequest(request) || request.method() !== "GET") {
      return;
    }

    const responseUrl = response.url();

    if (!responseUrl.includes("/api/")) {
      return;
    }

    discovery.apiBaseUrl ??= new URL(responseUrl).origin;
    discovery.templateHeaders ??= filterForwardHeaders(await request.allHeaders());

    if (responseUrl.includes("/api/formacao-turma-aluno/curriculo-professor/turmas")) {
      const url = new URL(responseUrl);
      discovery.academicYearId ??= url.searchParams.get("anoLetivoId");
      discovery.professionalEnrollmentId ??=
        url.searchParams.get("profissionalMatriculaId");
      discovery.initialResponses.classesPage1 ??= await safeReadJson(response);
      return;
    }

    if (responseUrl.includes("/api/profissional/minhas-matriculas")) {
      discovery.initialResponses.professionalEnrollments ??= await safeReadJson(response);
      return;
    }

    if (responseUrl.endsWith("/api/profissional")) {
      discovery.initialResponses.professional ??= await safeReadJson(response);
    }
  });
}

async function waitForDiscovery(discovery) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 15000) {
    if (
      discovery.apiBaseUrl &&
      discovery.templateHeaders &&
      discovery.academicYearId
    ) {
      return;
    }

    await delay(250);
  }

  throw new Error(
    "Não foi possível descobrir automaticamente a base da API e os parâmetros necessários."
  );
}

function finalizeRuntime(discovery) {
  return {
    apiBaseUrl: discovery.apiBaseUrl,
    academicYearId: discovery.academicYearId,
    professionalEnrollmentId: discovery.professionalEnrollmentId,
    templateHeaders: discovery.templateHeaders,
  };
}

async function fetchEndpoint({ context, runtime, relativeUrl, rawLabel }) {
  const absoluteUrl = new URL(relativeUrl, runtime.apiBaseUrl).toString();
  const response = await context.request.get(absoluteUrl, {
    failOnStatusCode: false,
    headers: runtime.templateHeaders,
  });

  if (!response.ok()) {
    throw new Error(`GET ${sanitizeUrl(absoluteUrl)} retornou ${response.status()}.`);
  }

  const payload = await response.json();

  if (rawLabel) {
    logItem("Endpoint lido", sanitizeUrl(absoluteUrl));
  }

  return payload;
}

async function fetchAllStudentPages({
  context,
  runtime,
  professionalEnrollmentId,
  classRow,
}) {
  const turmaId = classRow.formacaoTurmaId || classRow.turmaId;
  const componenteCurricularId =
    classRow.componenteCurricularLocalId ||
    classRow.componenteCurricularId ||
    classRow.curriculoComponenteCurricularId;

  if (!turmaId || !componenteCurricularId) {
    throw new Error("A turma não possui os identificadores necessários para buscar alunos.");
  }

  const rawPayloads = [];
  const studentRows = [];

  let currentPage = 1;
  let totalPages = 1;

  do {
    const label = `students-${slugify(`${turmaId}-${componenteCurricularId}`)}-page-${currentPage}`;
    const payload = await fetchEndpoint({
      context,
      runtime,
      relativeUrl: buildStudentsPath({
        turmaId,
        componenteCurricularId,
        professionalEnrollmentId,
        page: currentPage,
      }),
      rawLabel: label,
    });

    rawPayloads.push({ label, payload });
    studentRows.push(...getStudentRows(payload));
    totalPages = getStudentPageCount(payload);
    logItem("Página de alunos processada", `${turmaId} -> ${currentPage}/${totalPages}`);
    currentPage += 1;
  } while (currentPage <= totalPages);

  let headerPayload = null;
  const headerLabel = `class-header-${slugify(`${turmaId}-${componenteCurricularId}`)}`;

  try {
    headerPayload = await fetchEndpoint({
      context,
      runtime,
      relativeUrl: buildHeaderPath({
        turmaId,
        componenteCurricularId,
        professionalEnrollmentId,
      }),
      rawLabel: headerLabel,
    });
  } catch (error) {
    console.error(
      `Erro ao buscar cabeçalho da turma ${turmaId}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return {
    studentRows,
    rawPayloads,
    headerPayload,
    headerLabel,
  };
}

function buildClassesPath({ academicYearId, professionalEnrollmentId, page }) {
  const url = new URL(
    "/api/formacao-turma-aluno/curriculo-professor/turmas",
    "https://placeholder.local"
  );
  url.searchParams.set("anoLetivoId", academicYearId);
  url.searchParams.set("profissionalMatriculaId", professionalEnrollmentId);
  url.searchParams.set("page", String(page));
  return `${url.pathname}${url.search}`;
}

function buildStudentsPath({
  turmaId,
  componenteCurricularId,
  professionalEnrollmentId,
  page,
}) {
  const url = new URL(
    `/api/formacao-turma-aluno/professor/turmas/${turmaId}/alunos`,
    "https://placeholder.local"
  );
  url.searchParams.set("componenteCurricularId", componenteCurricularId);
  url.searchParams.set("profissionalMatriculaId", professionalEnrollmentId);
  url.searchParams.set("page", String(page));
  return `${url.pathname}${url.search}`;
}

function buildHeaderPath({
  turmaId,
  componenteCurricularId,
  professionalEnrollmentId,
}) {
  const url = new URL(
    "/api/DiarioClasseFrequencia/get-cabecario-listagem",
    "https://placeholder.local"
  );
  url.searchParams.set("turmaId", turmaId);
  url.searchParams.set("componenteCurricularId", componenteCurricularId);
  url.searchParams.set("profissionalMatriculaId", professionalEnrollmentId);
  return `${url.pathname}${url.search}`;
}

function getEnrollmentOptions(payload) {
  return getValue(payload, ["data.profissionalMatriculaListDto"]) ?? [];
}

function selectActiveEnrollment(enrollments) {
  return (
    enrollments.find((item) =>
      String(item.situacao || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .includes("EXERCICIO")
    ) ?? null
  );
}

function getClassesPageCount(payload) {
  const total = getValue(payload, ["data.turmas.total", "data.total"]);
  const perPage = getValue(payload, ["data.turmas.numPerPage", "data.numPerPage"]);
  const pageCount = getValue(payload, ["data.turmas.pageCount", "data.pageCount", "pageCount"]);

  if (typeof total === "number" && typeof perPage === "number" && perPage > 0) {
    return Math.max(1, Math.ceil(total / perPage));
  }

  if (typeof pageCount === "number" && pageCount > 0) {
    return pageCount;
  }

  return 1;
}

function getClassRows(payload) {
  return getValue(payload, ["data.turmas.data", "data.data", "data"]) ?? [];
}

function getStudentRows(payload) {
  return (
    getValue(payload, ["data.alunos.data", "data.alunos", "alunos", "data.data"]) ?? []
  );
}

function getStudentPageCount(payload) {
  const total = getValue(payload, ["data.alunos.total", "data.total"]);
  const perPage = getValue(payload, ["data.alunos.numPerPage", "data.numPerPage"]);
  const pageCount = getValue(payload, [
    "data.alunos.pageCount",
    "data.pageCount",
    "pageCount",
  ]);

  if (typeof total === "number" && typeof perPage === "number" && perPage > 0) {
    return Math.max(1, Math.ceil(total / perPage));
  }

  if (typeof pageCount === "number" && pageCount > 0) {
    return pageCount;
  }

  return 1;
}

function normalizeProfessional(payload, selectedEnrollment) {
  const data = getValue(payload, ["data"]) ?? {};

  return {
    externalId: data.id ?? selectedEnrollment?.id ?? null,
    name: sanitizeDiagnosticValue(data.nome ?? selectedEnrollment?.nome ?? ""),
    cpf: sanitizeDiagnosticValue(data.cpf ?? ""),
    email: sanitizeDiagnosticValue(
      data.emailInstitucional ?? data.emailPessoal ?? data.email ?? ""
    ),
    enrollmentExternalId: selectedEnrollment?.id ?? null,
    role: selectedEnrollment?.cargo ?? null,
    status: selectedEnrollment?.situacao ?? null,
    rawMetadata: sanitizeJsonPayload({
      possuiNomeSocial: data.possuiNomeSocial ?? null,
      sexo: data.sexo ?? null,
      corRaca: data.corRaca ?? null,
      utbCodigo: selectedEnrollment?.codigoUtb ?? null,
      alocacao: selectedEnrollment?.alocacao ?? null,
    }),
  };
}

function normalizeSchoolRecord(classRow, schoolExternalId) {
  return {
    externalId: schoolExternalId ?? classRow.escolaId ?? classRow.codigoUtb ?? "unknown-school",
    name: classRow.nomeEscola ?? null,
    rawMetadata: sanitizeJsonPayload({
      utbCodigo: classRow.utbCodigo ?? null,
      sala: classRow.sala ?? null,
    }),
  };
}

function normalizeClassRow({ classRow, schoolExternalId, academicYearId }) {
  const classExternalId =
    classRow.id ??
    `${classRow.formacaoTurmaId ?? "turma"}:${classRow.componenteCurricularLocalId ?? "componente"}`;

  return {
    externalId: classExternalId,
    name: classRow.turma ?? classRow.nomeTurma ?? null,
    grade: classRow.temporalidade ?? parseGrade(classRow.turma ?? classRow.nomeTurma ?? ""),
    letter: parseLetter(classRow.turma ?? classRow.nomeTurma ?? ""),
    shift: classRow.turno ?? null,
    schoolExternalId: schoolExternalId ?? null,
    academicYearExternalId: academicYearId ?? null,
    subjectExternalId:
      classRow.componenteCurricularLocalId ??
      classRow.componenteCurricularId ??
      null,
    curriculumSubjectExternalId:
      classRow.curriculoMatrizItinerarioComponenteCurricularId ??
      classRow.curriculoMatrizCurricularBnccComponenteCurricularId ??
      null,
    studentCount: null,
    rawMetadata: sanitizeJsonPayload({
      formacaoTurmaId: classRow.formacaoTurmaId ?? null,
      formacaoTurmaMatrizCurricularId:
        classRow.formacaoTurmaMatrizCurricularId ?? null,
      componenteCurricular: classRow.componenteCurricular ?? null,
      tipoComponente: classRow.tipoComponente ?? null,
      sala: classRow.sala ?? null,
      etapa: classRow.etapa ?? null,
      curso: classRow.curso ?? null,
      semestre: classRow.semestre ?? null,
      ehSemestral: classRow.ehSemestral ?? null,
    }),
  };
}

function normalizeSubjectRow(classRow) {
  return {
    externalId:
      classRow.componenteCurricularLocalId ??
      classRow.componenteCurricularId ??
      classRow.id ??
      "unknown-subject",
    name: classRow.componenteCurricular ?? null,
    curriculumSubjectExternalId:
      classRow.curriculoMatrizItinerarioComponenteCurricularId ??
      classRow.curriculoMatrizCurricularBnccComponenteCurricularId ??
      null,
    rawMetadata: sanitizeJsonPayload({
      tipoComponente: classRow.tipoComponente ?? null,
      cargaHoraria: classRow.cargaHoraria ?? null,
      cargaHorariaStr: classRow.cargaHorariaStr ?? null,
      itinerario: classRow.itinerario ?? null,
    }),
  };
}

function normalizeStudentRow(studentRow) {
  const externalId =
    studentRow.id ??
    studentRow.formacaoTurmaAlunoId ??
    studentRow.estudanteMatricula ??
    studentRow.matricula ??
    `student-${slugify(studentRow.nome ?? "unknown")}`;

  return {
    externalId,
    name: sanitizeDiagnosticValue(studentRow.nome ?? ""),
    enrollmentNumber: sanitizeDiagnosticValue(
      studentRow.estudanteMatricula ?? studentRow.matricula ?? ""
    ),
    status: resolveStudentStatus(studentRow),
    rawMetadata: sanitizeJsonPayload({
      formacaoTurmaAlunoId: studentRow.formacaoTurmaAlunoId ?? null,
      tipoRemanejamento: studentRow.tipoRemanejamento ?? null,
      dataRemanejamento: studentRow.dataRemanejamento ?? null,
      tipoMovimentacao: studentRow.tipoMovimentacao ?? null,
      dataMovimentacao: studentRow.dataMovimentacao ?? null,
    }),
  };
}

function normalizeEnrollmentRow({ studentRow, classExternalId }) {
  const studentExternalId =
    studentRow.id ??
    studentRow.formacaoTurmaAlunoId ??
    studentRow.estudanteMatricula ??
    studentRow.matricula ??
    `student-${slugify(studentRow.nome ?? "unknown")}`;

  return {
    externalId: studentRow.formacaoTurmaAlunoId ?? null,
    studentExternalId,
    classExternalId,
    status: resolveStudentStatus(studentRow),
    source: "siage",
  };
}

function resolveStudentStatus(studentRow) {
  if (studentRow.tipoMovimentacao) {
    return String(studentRow.tipoMovimentacao).toUpperCase();
  }

  if (studentRow.tipoRemanejamento) {
    return String(studentRow.tipoRemanejamento).toUpperCase();
  }

  return "ACTIVE";
}

function parseGrade(value) {
  const match = value.match(/\d+ª?\s*s[ée]rie/i);
  return match?.[0] ?? null;
}

function parseLetter(value) {
  const match =
    value.match(/s[ée]rie\s+([A-Z])\b/i) ??
    value.match(/turma\s+([A-Z])\b/i) ??
    value.match(/-\s*([A-Z])\s*-/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function dedupeBy(items, keyBuilder) {
  const seen = new Set();

  return items.filter((item) => {
    const key = keyBuilder(item);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function saveRawPayload(label, payload) {
  const filePath = path.join(rawRoot, `${slugify(label)}.json`);
  await writeJsonFile(filePath, sanitizeJsonPayload(payload));
}

async function safeReadJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function filterForwardHeaders(headers) {
  const blockedHeaders = new Set([
    "cookie",
    "content-length",
    "host",
    "connection",
    "accept-encoding",
  ]);

  return Object.fromEntries(
    Object.entries(headers).filter(
      ([key]) => !key.startsWith(":") && !blockedHeaders.has(key.toLowerCase())
    )
  );
}

function deriveOriginFromStorageState(storageState) {
  const origin = storageState?.origins?.[0]?.origin;

  if (typeof origin === "string" && origin.startsWith("http")) {
    return origin;
  }

  return null;
}

function getValue(source, paths) {
  for (const currentPath of paths) {
    const value = currentPath
      .split(".")
      .reduce(
        (accumulator, segment) =>
          accumulator && accumulator[segment] !== undefined
            ? accumulator[segment]
            : undefined,
        source
      );

    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return null;
}

function collectFieldPresence({ professionalPayload, classRows, studentRows }) {
  const expected = {
    professional: ["data.id", "data.nome", "data.cpf", "data.emailInstitucional"],
    classes: [
      "formacaoTurmaId",
      "componenteCurricularLocalId",
      "curriculoMatrizItinerarioComponenteCurricularId",
      "turma",
      "turno",
      "semestre",
    ],
    students: [
      "formacaoTurmaAlunoId",
      "estudanteMatricula",
      "nome",
      "tipoMovimentacao",
    ],
  };

  const found = [];
  const missing = [];

  for (const field of expected.professional) {
    if (getValue(professionalPayload, [field]) !== null) {
      found.push(`professional.${field}`);
    } else {
      missing.push(`professional.${field}`);
    }
  }

  for (const field of expected.classes) {
    if (classRows.some((row) => row?.[field] !== undefined && row?.[field] !== null)) {
      found.push(`classes.${field}`);
    } else {
      missing.push(`classes.${field}`);
    }
  }

  for (const field of expected.students) {
    if (
      studentRows.some((row) => {
        if (field === "estudanteMatricula") {
          return row?.enrollmentNumber !== undefined && row?.enrollmentNumber !== null;
        }

        if (field === "nome") {
          return row?.name !== undefined && row?.name !== null;
        }

        return row?.rawMetadata?.[field] !== undefined || row?.[field] !== undefined;
      })
    ) {
      found.push(`students.${field}`);
    } else {
      missing.push(`students.${field}`);
    }
  }

  return { found, missing };
}

main().catch((error) => {
  console.error(
    `Falha na leitura estruturada do SIAGE: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
  process.exitCode = 1;
});
