import fs from "node:fs/promises";
import path from "node:path";

import {
  CLASS_TEXT_PATTERN,
  SENSITIVE_PARAM_KEYS,
  STUDENT_KEYWORDS,
  STUDENT_NAME_PATTERN,
} from "./keywords.mjs";

export const pocRoot = path.resolve("scripts/siage-poc");
export const outputRoot = path.join(pocRoot, "output");
export const screenshotRoot = path.join(outputRoot, "screenshots");
export const htmlRoot = path.join(outputRoot, "html");
export const networkRoot = path.join(outputRoot, "network");
export const rawRoot = path.join(outputRoot, "raw");
export const normalizedRoot = path.join(outputRoot, "normalized");
export const sessionRoot = path.join(pocRoot, "session");
export const sessionFile = path.join(sessionRoot, "siage-session.json");
export const classesFile = path.join(outputRoot, "siage-classes.json");
export const studentsFile = path.join(outputRoot, "siage-students.json");
export const networkSummaryFile = path.join(outputRoot, "network-summary.json");

export function parseArgs(argv) {
  const options = {
    url: process.env.SIAGE_POC_URL ?? "",
    freshSession: false,
    maxPages: 8,
    saveHtml: true,
  };

  const recognized = {
    url: options.url ? "env" : "default",
    freshSession: "default",
    maxPages: "default",
    saveHtml: "default",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const nextArg = argv[index + 1];

    if (arg === "--url") {
      const value = normalizeCliValue(nextArg);

      if (value) {
        options.url = value;
        recognized.url = "cli";
        index += 1;
      }

      continue;
    }

    if (arg.startsWith("--url=")) {
      const value = normalizeCliValue(arg.slice("--url=".length));

      if (value) {
        options.url = value;
        recognized.url = "cli";
      }

      continue;
    }

    if (arg === "--fresh-session") {
      if (looksLikeValueToken(nextArg)) {
        options.freshSession = parseBooleanValue(nextArg, true);
        recognized.freshSession = "cli";
        index += 1;
      } else {
        options.freshSession = true;
        recognized.freshSession = "cli";
      }

      continue;
    }

    if (arg.startsWith("--fresh-session=")) {
      options.freshSession = parseBooleanValue(
        arg.slice("--fresh-session=".length),
        true
      );
      recognized.freshSession = "cli";
      continue;
    }

    if (arg === "--max-pages") {
      const parsed = parsePositiveInteger(nextArg);

      if (parsed !== null) {
        options.maxPages = parsed;
        recognized.maxPages = "cli";
        index += 1;
      }

      continue;
    }

    if (arg.startsWith("--max-pages=")) {
      const parsed = parsePositiveInteger(arg.slice("--max-pages=".length));

      if (parsed !== null) {
        options.maxPages = parsed;
        recognized.maxPages = "cli";
      }

      continue;
    }

    if (arg === "--save-html") {
      if (looksLikeValueToken(nextArg)) {
        options.saveHtml = parseBooleanValue(nextArg, true);
        recognized.saveHtml = "cli";
        index += 1;
      } else {
        options.saveHtml = true;
        recognized.saveHtml = "cli";
      }

      continue;
    }

    if (arg.startsWith("--save-html=")) {
      options.saveHtml = parseBooleanValue(arg.slice("--save-html=".length), true);
      recognized.saveHtml = "cli";
    }
  }

  return {
    ...options,
    recognized,
  };
}

function normalizeCliValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/^['"]|['"]$/g, "");
}

function parseBooleanValue(value, fallback) {
  const normalized = normalizeCliValue(value).toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (["true", "1", "yes", "y", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "n", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function parsePositiveInteger(value) {
  const normalized = normalizeCliValue(value);
  const parsed = Number.parseInt(normalized, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function looksLikeValueToken(value) {
  if (typeof value !== "string") {
    return false;
  }

  return !value.startsWith("--");
}

export async function ensureDirectories() {
  await Promise.all([
    fs.mkdir(outputRoot, { recursive: true }),
    fs.mkdir(screenshotRoot, { recursive: true }),
    fs.mkdir(htmlRoot, { recursive: true }),
    fs.mkdir(networkRoot, { recursive: true }),
    fs.mkdir(rawRoot, { recursive: true }),
    fs.mkdir(normalizedRoot, { recursive: true }),
    fs.mkdir(sessionRoot, { recursive: true }),
  ]);
}

export function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function sanitizeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);

    for (const key of [...url.searchParams.keys()]) {
      if (SENSITIVE_PARAM_KEYS.some((fragment) => key.toLowerCase().includes(fragment))) {
        url.searchParams.set(key, "[redacted]");
      }
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

export function sameOrigin(targetUrl, origin) {
  try {
    return new URL(targetUrl).origin === origin;
  } catch {
    return false;
  }
}

export function logSection(title) {
  console.log(`\n=== ${title} ===`);
}

export function logItem(label, value) {
  console.log(`${label}: ${value}`);
}

export async function savePageArtifacts(page, label, saveHtml) {
  const safeLabel = slugify(label) || "page";
  const screenshotPath = path.join(screenshotRoot, `${safeLabel}.png`);
  const htmlPath = path.join(htmlRoot, `${safeLabel}.html`);

  await page.screenshot({ path: screenshotPath, fullPage: true });

  if (saveHtml) {
    const html = await page.content();
    await fs.writeFile(htmlPath, html, "utf8");
  }

  return {
    screenshotPath,
    htmlPath: saveHtml ? htmlPath : null,
  };
}

export async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function readJsonFile(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

export function classifySiageRoute(rawUrl) {
  const url = sanitizeUrl(rawUrl).toLowerCase();

  if (url.includes("/diario/minhas-turmas/listagem-turmas/turma/") && url.includes("/frequencia/cadastrar")) {
    return "cadastro-frequencia";
  }

  if (url.includes("/diario/minhas-turmas/listagem-turmas/turma/") && url.includes("/frequencia")) {
    return "frequencia";
  }

  if (
    url.includes("/diario/minhas-turmas/listagem-turmas/turma/") &&
    (url.includes("/registro-aula") || url.includes("/registrar"))
  ) {
    return "registro-aula";
  }

  if (url.includes("/diario/minhas-turmas/listagem-turmas/turma/") && url.includes("/novo-registro-avaliacoes")) {
    return "avaliacoes";
  }

  if (url.includes("/diario/minhas-turmas/listagem-turmas/turma/")) {
    return "pagina-da-turma";
  }

  if (url.includes("/diario/minhas-turmas/listagem-turmas")) {
    return "listagem-de-turmas";
  }

  if (url.includes("/diario")) {
    return "diario";
  }

  return "outra";
}

export function shouldTrackRequest(request) {
  const resourceType = request.resourceType();

  if (resourceType !== "fetch" && resourceType !== "xhr") {
    return false;
  }

  const url = request.url().toLowerCase();

  if (
    url.endsWith(".js") ||
    url.endsWith(".css") ||
    url.endsWith(".png") ||
    url.endsWith(".jpg") ||
    url.endsWith(".jpeg") ||
    url.endsWith(".gif") ||
    url.endsWith(".svg") ||
    url.endsWith(".webp") ||
    url.endsWith(".ico") ||
    url.endsWith(".woff") ||
    url.endsWith(".woff2") ||
    url.endsWith(".ttf") ||
    url.endsWith(".otf") ||
    url.endsWith(".map")
  ) {
    return false;
  }

  return true;
}

const SENSITIVE_FIELD_FRAGMENTS = [
  "nome",
  "aluno",
  "cpf",
  "matricula",
  "email",
  "telefone",
  "documento",
];

export function sanitizeJsonPayload(value) {
  return sanitizeValue(value, "");
}

export function sanitizeDiagnosticValue(value) {
  if (typeof value !== "string") {
    return value;
  }

  return maskString(value);
}

function sanitizeValue(value, keyName) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, keyName));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        sanitizeValue(nestedValue, key),
      ])
    );
  }

  if (typeof value === "string") {
    if (isSensitiveKey(keyName) || containsSensitiveString(value)) {
      return maskString(value);
    }

    return value;
  }

  return value;
}

function isSensitiveKey(keyName) {
  const normalizedKey = keyName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return SENSITIVE_FIELD_FRAGMENTS.some((fragment) => normalizedKey.includes(fragment));
}

function containsSensitiveString(value) {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return (
    /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/.test(normalized) ||
    /\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/.test(normalized) ||
    /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9?\d{4})-?\d{4}\b/.test(normalized) ||
    /\b[A-ZÀ-Ý][a-zà-ÿ]+(?:\s+[A-ZÀ-Ý][a-zà-ÿ]+){1,}\b/u.test(value)
  );
}

function maskString(value) {
  if (!value) {
    return value;
  }

  if (value.length <= 4) {
    return "[redacted]";
  }

  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

export function buildNetworkFileName(index, label, method, urlPathname) {
  const baseName = slugify(`${String(index).padStart(3, "0")}-${label}-${method}-${urlPathname}`);
  return `${baseName || `request-${index}`}.json`;
}

export function classifyEndpoint(rawUrl) {
  const value = sanitizeUrl(rawUrl).toLowerCase();

  if (value.includes("frequencia")) {
    return "frequencia";
  }

  if (value.includes("avali")) {
    return "avaliacoes";
  }

  if (value.includes("registro-aula") || value.includes("registrar")) {
    return "registro-de-aula";
  }

  if (value.includes("disciplina")) {
    return "disciplinas";
  }

  if (value.includes("aluno")) {
    return "alunos";
  }

  if (value.includes("turma")) {
    return "turmas";
  }

  return "nao-classificado";
}

export async function waitForEnter(promptText) {
  const readline = await import("node:readline/promises");
  const { stdin, stdout } = await import("node:process");
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    await rl.question(`${promptText}\n`);
  } finally {
    rl.close();
  }
}

export async function collectNavigationSummary(page) {
  return page.evaluate(() => {
    const isVisible = (element) => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }

      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      return (
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        rect.width > 0 &&
        rect.height > 0
      );
    };

    const navElements = Array.from(
      document.querySelectorAll("nav, aside, [role='navigation'], [role='menubar'], [role='menu']")
    );

    const menus = navElements
      .filter(isVisible)
      .map((element) => ({
        label:
          element.getAttribute("aria-label") ||
          element.getAttribute("title") ||
          element.textContent?.trim().slice(0, 120) ||
          "menu",
      }));

    const links = Array.from(document.querySelectorAll("a, button"))
      .filter(isVisible)
      .map((element) => ({
        text:
          element.getAttribute("aria-label") ||
          element.getAttribute("title") ||
          element.textContent?.trim() ||
          "",
        href:
          element instanceof HTMLAnchorElement
            ? element.href
            : element.getAttribute("data-href") || "",
        role: element.getAttribute("role") || element.tagName.toLowerCase(),
      }))
      .filter((item) => item.text || item.href);

    return { menus, links };
  });
}

export async function extractClassRecords(page) {
  return page.evaluate((patternSource) => {
    const pattern = new RegExp(patternSource, "i");

    const isVisible = (element) => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }

      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      return (
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        rect.width > 0 &&
        rect.height > 0
      );
    };

    const rows = Array.from(document.querySelectorAll("table tr"))
      .filter(isVisible)
      .map((row) => {
        const columns = Array.from(row.querySelectorAll("th, td"))
          .map((cell) => cell.textContent?.trim() || "")
          .filter(Boolean);
        const link = row.querySelector("a[href]");
        const text = columns.join(" | ");

        return {
          source: "table-row",
          pageUrl: window.location.href,
          headers: columns,
          text,
          href: link instanceof HTMLAnchorElement ? link.href : "",
          title: columns[0] || text,
        };
      })
      .filter((record) => pattern.test(record.text));

    const cards = Array.from(document.querySelectorAll("a[href], article, section, div"))
      .filter(isVisible)
      .map((element) => {
        const text = element.textContent?.replace(/\s+/g, " ").trim() || "";
        const href =
          element instanceof HTMLAnchorElement
            ? element.href
            : element.querySelector("a[href]") instanceof HTMLAnchorElement
              ? element.querySelector("a[href]").href
              : "";

        return {
          source: "card-like",
          pageUrl: window.location.href,
          headers: [],
          text,
          href,
          title: text.slice(0, 140),
        };
      })
      .filter((record) => pattern.test(record.text))
      .slice(0, 30);

    return [...rows, ...cards];
  }, CLASS_TEXT_PATTERN.source);
}

export async function extractStudents(page) {
  return page.evaluate((keywordList, namePatternSource) => {
    const keywords = keywordList.map((item) => item.toLowerCase());
    const namePattern = new RegExp(namePatternSource, "u");

    const isVisible = (element) => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }

      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      return (
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        rect.width > 0 &&
        rect.height > 0
      );
    };

    const rows = Array.from(document.querySelectorAll("table tr"))
      .filter(isVisible)
      .map((row) => {
        const columns = Array.from(row.querySelectorAll("th, td"))
          .map((cell) => cell.textContent?.trim() || "")
          .filter(Boolean);
        const raw = columns.join(" | ");

        return {
          source: "table-row",
          pageUrl: window.location.href,
          raw,
          columns,
          name: columns.find((column) => namePattern.test(column)) || "",
        };
      })
      .filter((record) => {
        const lower = record.raw.toLowerCase();
        return (
          record.name ||
          keywords.some((keyword) => lower.includes(keyword))
        );
      });

    const listItems = Array.from(document.querySelectorAll("li, article, section, div"))
      .filter(isVisible)
      .map((element) => {
        const raw = element.textContent?.replace(/\s+/g, " ").trim() || "";

        return {
          source: "list-like",
          pageUrl: window.location.href,
          raw,
          columns: [],
          name: raw.match(namePattern)?.[0] || "",
        };
      })
      .filter((record) => {
        const lower = record.raw.toLowerCase();
        return (
          record.name ||
          keywords.some((keyword) => lower.includes(keyword))
        );
      })
      .slice(0, 100);

    return [...rows, ...listItems];
  }, STUDENT_KEYWORDS, STUDENT_NAME_PATTERN.source);
}

export function uniqueBy(items, keyBuilder) {
  const seen = new Set();

  return items.filter((item) => {
    const key = keyBuilder(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
