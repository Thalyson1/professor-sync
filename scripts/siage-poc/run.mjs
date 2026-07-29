import fs from "node:fs/promises";

import { chromium } from "playwright";

import { CLASS_KEYWORDS } from "./keywords.mjs";
import {
  classesFile,
  collectNavigationSummary,
  ensureDirectories,
  extractClassRecords,
  extractStudents,
  logItem,
  logSection,
  parseArgs,
  sameOrigin,
  sanitizeUrl,
  savePageArtifacts,
  sessionFile,
  studentsFile,
  uniqueBy,
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
  const origin = new URL(options.url).origin;

  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) {
      logItem("Página atual", sanitizeUrl(frame.url()));
    }
  });

  page.on("response", (response) => {
    const responseUrl = response.url();
    const lowerUrl = responseUrl.toLowerCase();

    if (
      sameOrigin(responseUrl, origin) &&
      CLASS_KEYWORDS.some((keyword) => lowerUrl.includes(keyword))
    ) {
      console.log(
        `[network] ${response.status()} ${response.request().method()} ${sanitizeUrl(responseUrl)}`
      );
    }
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
      await waitForEnter("Pressione Enter para continuar a inspeção.");
      await page.waitForLoadState("networkidle").catch(() => undefined);
    }

    const authenticatedAfterPrompt = await isLikelyAuthenticated(page);
    logItem("Autenticado", authenticatedAfterPrompt ? "sim" : "não confirmado");

    await context.storageState({ path: sessionFile });
    logItem("Sessão salva", sessionFile);

    await savePageArtifacts(page, "02-authenticated", options.saveHtml);

    const candidatePages = await discoverPages(page, origin, options.maxPages);
    const discoveredClasses = [];

    for (const candidate of candidatePages) {
      logSection(`Inspecionando ${candidate.label}`);
      console.log(`Visitando: ${sanitizeUrl(candidate.href)}`);

      try {
        if (page.url() !== candidate.href) {
          await page.goto(candidate.href, { waitUntil: "domcontentloaded" });
          await page.waitForLoadState("networkidle").catch(() => undefined);
        }

        await logPageState(page);
        await savePageArtifacts(page, `page-${candidate.label}`, options.saveHtml);

        const classes = await extractClassRecords(page);
        logItem("Quantidade de turmas encontradas", classes.length);

        for (const classRecord of classes) {
          discoveredClasses.push({
            ...classRecord,
            inspectedFrom: candidate.href,
            inspectedLabel: candidate.label,
          });
        }
      } catch (error) {
        console.error(
          `Erro de navegação em ${sanitizeUrl(candidate.href)}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    const uniqueClasses = uniqueBy(
      discoveredClasses,
      (item) => `${item.href || item.title}|${item.text}`
    );

    await writeJsonFile(classesFile, uniqueClasses);
    logItem("Arquivo de turmas", classesFile);

    const studentsByClass = [];

    for (const classRecord of uniqueClasses) {
      if (!classRecord.href || !sameOrigin(classRecord.href, origin)) {
        continue;
      }

      logSection(`Abrindo turma ${classRecord.title}`);

      try {
        await page.goto(classRecord.href, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle").catch(() => undefined);

        await logPageState(page);
        await savePageArtifacts(
          page,
          `class-${classRecord.title}`,
          options.saveHtml
        );

        const students = uniqueBy(
          await extractStudents(page),
          (item) => `${item.name}|${item.raw}`
        );

        logItem("Quantidade de alunos", students.length);

        studentsByClass.push({
          class: {
            title: classRecord.title,
            href: classRecord.href,
            text: classRecord.text,
          },
          pageUrl: page.url(),
          students,
        });
      } catch (error) {
        console.error(
          `Erro ao abrir turma ${classRecord.title}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    await writeJsonFile(studentsFile, studentsByClass);
    logItem("Arquivo de alunos", studentsFile);

    logSection("Resumo");
    logItem("Turmas extraídas", uniqueClasses.length);
    logItem("Turmas com alunos", studentsByClass.length);
    console.log("Feche o navegador quando terminar a inspeção visual.");
    await page.waitForEvent("close");
  } finally {
    await browser.close();
  }
}

async function discoverPages(page, origin, maxPages) {
  const { menus, links } = await collectNavigationSummary(page);
  const title = await page.title();

  logItem("Título da página", title || "(sem título)");
  logItem(
    "Menus encontrados",
    menus.length ? menus.map((item) => item.label).join(" | ") : "nenhum"
  );
  logItem(
    "Links encontrados",
    links.length
      ? links
          .slice(0, 20)
          .map((item) => `${item.text || "(sem texto)"} -> ${sanitizeUrl(item.href)}`)
          .join(" | ")
      : "nenhum"
  );

  const rankedLinks = links
    .filter((item) => item.href && sameOrigin(item.href, origin))
    .map((item) => ({
      href: item.href,
      label: slugLabel(item.text || item.href),
      score: scoreLink(item.text, item.href),
    }))
    .filter((item) => item.score > 0);

  const uniqueLinks = uniqueBy(
    [
      {
        href: page.url(),
        label: "landing-page",
        score: 100,
      },
      ...rankedLinks,
    ],
    (item) => item.href
  );

  return uniqueLinks
    .sort((left, right) => right.score - left.score)
    .slice(0, maxPages);
}

function scoreLink(text, href) {
  const value = `${text || ""} ${href || ""}`.toLowerCase();

  if (value.includes("turma") || value.includes("disciplina")) {
    return 100;
  }

  if (value.includes("aluno") || value.includes("diario") || value.includes("diário")) {
    return 80;
  }

  if (CLASS_KEYWORDS.some((keyword) => value.includes(keyword))) {
    return 50;
  }

  return 0;
}

async function isLikelyAuthenticated(page) {
  const passwordFields = page.locator('input[type="password"]');

  if ((await passwordFields.count()) > 0) {
    return false;
  }

  const bodyText = (await page.locator("body").innerText()).toLowerCase();

  return (
    bodyText.includes("turma") ||
    bodyText.includes("disciplina") ||
    bodyText.includes("diario") ||
    bodyText.includes("diário") ||
    bodyText.includes("aluno")
  );
}

async function logPageState(page) {
  logItem("Página atual", sanitizeUrl(page.url()));
  logItem("Título da página", (await page.title()) || "(sem título)");
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

function slugLabel(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "page";
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
