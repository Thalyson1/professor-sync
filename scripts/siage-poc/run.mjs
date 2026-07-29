import fs from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

import {
  buildNetworkFileName,
  classifyEndpoint,
  classifySiageRoute,
  ensureDirectories,
  logItem,
  logSection,
  networkRoot,
  networkSummaryFile,
  parseArgs,
  sanitizeJsonPayload,
  sanitizeUrl,
  savePageArtifacts,
  sessionFile,
  shouldTrackRequest,
  waitForEnter,
  writeJsonFile,
} from "./utils.mjs";

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.url) {
    throw new Error(
      'Informe a URL inicial do SIAGE com --url="https://..." ou pela variável SIAGE_POC_URL.'
    );
  }

  await ensureDirectories();
  logStartupOptions(options);

  const storageState = !options.freshSession && (await fileExists(sessionFile))
    ? sessionFile
    : undefined;

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext(
    storageState ? { storageState } : undefined
  );
  const page = await context.newPage();

  const captureState = {
    active: false,
    currentRouteLabel: "outra",
    requests: [],
    requestMap: new Map(),
    routeHits: {
      "listagem-de-turmas": 0,
      "pagina-da-turma": 0,
      frequencia: 0,
      "cadastro-frequencia": 0,
      "registro-aula": 0,
      avaliacoes: 0,
    },
  };

  page.on("framenavigated", (frame) => {
    if (frame !== page.mainFrame()) {
      return;
    }

    const currentUrl = frame.url();
    const routeLabel = classifySiageRoute(currentUrl);
    captureState.currentRouteLabel = routeLabel;

    logItem("Página atual", sanitizeUrl(currentUrl));

    if (routeLabel !== "outra" && routeLabel !== "diario") {
      console.log(`[contexto] ${routeLabel}`);
    }
  });

  page.on("request", (request) => {
    if (!captureState.active || !shouldTrackRequest(request)) {
      return;
    }

    const requestUrl = sanitizeUrl(request.url());
    const routeLabel = captureState.currentRouteLabel;

    captureState.requestMap.set(request, {
      id: `${captureState.requests.length + captureState.requestMap.size + 1}`,
      method: request.method(),
      url: requestUrl,
      resourceType: request.resourceType(),
      routeLabel,
      startedAt: new Date().toISOString(),
      classifiedAs: classifyEndpoint(requestUrl),
    });
  });

  page.on("response", async (response) => {
    if (!captureState.active) {
      return;
    }

    const request = response.request();

    if (!shouldTrackRequest(request)) {
      return;
    }

    const requestRecord = captureState.requestMap.get(request);

    if (!requestRecord) {
      return;
    }

    const headers = response.headers();
    const contentType = headers["content-type"] || "unknown";
    const isJson = contentType.toLowerCase().includes("application/json");

    let approxSize = Number.parseInt(headers["content-length"] ?? "", 10);

    if (!Number.isFinite(approxSize)) {
      approxSize = null;
    }

    let networkFile = null;

    if (isJson) {
      const payload = await safeReadJson(response);

      if (payload !== null) {
        const sanitizedPayload = sanitizeJsonPayload(payload);
        networkFile = await saveSanitizedNetworkPayload(
          captureState.requests.length + 1,
          requestRecord,
          sanitizedPayload
        );

        if (approxSize === null) {
          approxSize = Buffer.byteLength(JSON.stringify(sanitizedPayload), "utf8");
        }
      }
    }

    const record = {
      ...requestRecord,
      status: response.status(),
      contentType,
      approxSize,
      capturedAt: new Date().toISOString(),
      networkFile,
    };

    captureState.requests.push(record);
    captureState.requestMap.delete(request);

    if (record.routeLabel in captureState.routeHits) {
      captureState.routeHits[record.routeLabel] += 1;
    }

    console.log(
      `[network:${record.routeLabel}] ${record.status} ${record.method} ${record.resourceType} ${record.contentType} ${record.approxSize ?? "unknown"}B ${record.url}`
    );
  });

  page.on("requestfailed", (request) => {
    if (!captureState.active || !shouldTrackRequest(request)) {
      return;
    }

    const requestUrl = sanitizeUrl(request.url());
    console.error(
      `[network:error] ${request.method()} ${request.resourceType()} ${requestUrl} ${request.failure()?.errorText ?? "request failed"}`
    );
  });

  try {
    await page.goto(options.url, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => undefined);

    logSection("Abertura");
    await logPageState(page);
    await savePageArtifacts(page, "01-initial", options.saveHtml);

    const authenticatedBeforePrompt = await isLikelyAuthenticated(page);

    if (!authenticatedBeforePrompt) {
      logSection("Login manual");
      console.log("Faça o login manualmente no navegador aberto pelo Playwright.");
      console.log("Depois que a área autenticada carregar, volte ao terminal e pressione Enter.");
      await waitForEnter("Pressione Enter quando o login estiver concluído.");
      await page.waitForLoadState("networkidle").catch(() => undefined);
    }

    const authenticatedAfterPrompt = await isLikelyAuthenticated(page);
    logItem("Autenticado", authenticatedAfterPrompt ? "sim" : "não confirmado");

    await context.storageState({ path: sessionFile });
    logItem("Sessão salva", sessionFile);
    await savePageArtifacts(page, "02-authenticated", options.saveHtml);

    logSection("Captura interativa");
    console.log("Pressione Enter para iniciar a captura de requisições fetch/XHR.");
    await waitForEnter("Captura pronta para iniciar.");
    captureState.active = true;
    console.log("Captura iniciada. Navegue manualmente no SIAGE.");
    console.log("Ao terminar, volte ao terminal e pressione Enter para encerrar.");
    await waitForEnter("Pressione Enter para finalizar a captura.");
    captureState.active = false;

    await savePageArtifacts(page, "03-final-state", options.saveHtml);
    await writeJsonFile(networkSummaryFile, buildNetworkSummary(captureState.requests, captureState.routeHits));

    logSection("Resumo");
    logItem("Arquivo de resumo", networkSummaryFile);
    logItem("Requisições capturadas", captureState.requests.length);
    logItem("JSONs sanitizados", captureState.requests.filter((item) => item.networkFile).length);
  } finally {
    await browser.close();
  }
}

function buildNetworkSummary(records, routeHits) {
  return {
    generatedAt: new Date().toISOString(),
    totalRequests: records.length,
    highlightedRoutes: routeHits,
    endpointClassification: summarizeEndpointClasses(records),
    requests: records,
  };
}

function summarizeEndpointClasses(records) {
  const summary = {
    turmas: 0,
    alunos: 0,
    frequencia: 0,
    avaliacoes: 0,
    "registro-de-aula": 0,
    disciplinas: 0,
    "nao-classificado": 0,
  };

  for (const record of records) {
    if (!(record.classifiedAs in summary)) {
      summary["nao-classificado"] += 1;
      continue;
    }

    summary[record.classifiedAs] += 1;
  }

  return summary;
}

function logStartupOptions(options) {
  logSection("Opções reconhecidas");
  logItem("url", `${sanitizeUrl(options.url)} (${options.recognized.url})`);
  logItem(
    "freshSession",
    `${String(options.freshSession)} (${options.recognized.freshSession})`
  );
  logItem("maxPages", `${String(options.maxPages)} (${options.recognized.maxPages})`);
  logItem("saveHtml", `${String(options.saveHtml)} (${options.recognized.saveHtml})`);
}

async function logPageState(page) {
  logItem("Página atual", sanitizeUrl(page.url()));
  logItem("Título da página", (await page.title()) || "(sem título)");
}

async function isLikelyAuthenticated(page) {
  const passwordFields = page.locator('input[type="password"]');

  if ((await passwordFields.count()) > 0) {
    return false;
  }

  const bodyText = (await page.locator("body").innerText()).toLowerCase();

  return bodyText.includes("turma") || bodyText.includes("diario") || bodyText.includes("diário");
}

async function saveSanitizedNetworkPayload(index, requestRecord, payload) {
  const pathname = safePathname(requestRecord.url);
  const fileName = buildNetworkFileName(
    index,
    requestRecord.routeLabel,
    requestRecord.method,
    pathname
  );
  const filePath = path.join(networkRoot, fileName);

  await writeJsonFile(filePath, payload);
  return filePath;
}

async function safeReadJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function safePathname(rawUrl) {
  try {
    return new URL(rawUrl).pathname;
  } catch {
    return rawUrl;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

main().catch((error) => {
  console.error(
    `Falha na execução da prova de conceito: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
  process.exitCode = 1;
});
