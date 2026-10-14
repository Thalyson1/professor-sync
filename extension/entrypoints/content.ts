import { detectSiagePage, getFriendlyHelpMessage } from '../utils/siage-detector';
import {
  fetchTeacherClassesFromSiage,
  scrapeSiageTableFromDOM,
  mergeAndSaveClasses,
  getSiageSessionFromStorage,
  fetchRegisteredLessons,
  getPeriodoForDate,
  validatePasswordIfProvided,
  insertLessonViaApi,
  fetchClassStudentsFromSiage,
  fetchClassAttendanceHistory,
  fetchAttendanceDetailsById,
  saveAttendanceViaApi,
  formatLessonDateWithWeekday,
  getWeekdayIndex,
  TEMPO_OPTIONS,
  formatTemposLabel,
  normalizeTemposList,
  SIAGE_API_BASE,
  type SiageFetchedClass,
} from '../utils/siage-api';

export default defineContentScript({
  matches: ['*://professor.see.pb.gov.br/*'],
  main() {
    console.log('[Professor Sync Extension] Injetado no SIAGE com sucesso.');
    // Limpar imediatamente qualquer fila legada presa no storage
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.remove([
        'ps_queue_running',
        'ps_pending_queue',
        'ps_current_lesson',
        'ps_auto_fill_pending',
      ]);
    }
    injectFloatingWidget();
    setupMessageListeners();
    setupAutomaticDomScraper();
    setupPasswordModalAutofill();
  },
});

function setupMessageListeners() {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.action === 'SYNC_TURMAS') {
        autoCrawlAndFetchAllClasses().then(classes => {
          sendResponse(classes);
        });
        return true;
      }

      if (message.action === 'FILL_DIARY_TEXT') {
        fillSiageForm({
          topic: message.payload.topic,
          methodology: message.payload.methodology,
          observations: message.payload.observations,
        });
        sendResponse({ success: true });
        return true;
      }

      if (message.action === 'FILL_ATTENDANCE') {
        fillSiageAttendance(message.payload.absentNames || []);
        sendResponse({ success: true });
        return true;
      }

      if (message.action === 'FILL_LESSON_PLAN') {
        const planList = message.payload?.plan || [];
        const options = {
          forceDates: message.payload?.forceDates,
          forceAll: message.payload?.forceAll,
        };
        batchRegisterPendingLessonsViaApi(planList, options);
        sendResponse({ success: true });
        return true;
      }

      if (message.action === 'GET_ATTENDANCE_DATA') {
        (async () => {
          try {
            const session = getSiageSessionFromStorage();
            if (!session) {
              sendResponse({ success: false, error: 'Sessão do SIAGE não encontrada' });
              return;
            }
            const classInfo = getSiageActiveTurmaInfo();
            const urlMatch = window.location.pathname.match(/\/turma\/([a-f0-9\-]+)/i);
            const formacaoTurmaId = urlMatch ? urlMatch[1] : (session.dadosAlocacao?.formacaoTurmaId || '5495f10a-e789-41d5-9452-b7c51c32b833');
            const compId = session.dadosAlocacao?.componenteCurricularTabComponenteCurricularLocalId ||
              session.dadosAlocacao?.curriculoComponenteCurricularId ||
              'a5aad79d-cecd-4b43-8c2a-89fe92a778e2';
            const matrizBncc = session.dadosAlocacao?.curriculoMatrizCurricularBnccComponenteCurricularId || null;
            const matrizItin = session.dadosAlocacao?.curriculoMatrizItinerarioComponenteCurricularId || null;

            const [students, lessonsResult, history] = await Promise.all([
              fetchClassStudentsFromSiage(formacaoTurmaId, compId),
              fetchRegisteredLessons(session, formacaoTurmaId, compId),
              fetchClassAttendanceHistory(session, formacaoTurmaId, compId),
            ]);

            sendResponse({
              success: true,
              classInfo,
              formacaoTurmaId,
              componenteCurricularId: compId,
              matrizCurricularBnccComponenteId: matrizBncc,
              matrizItinerarioComponenteId: matrizItin,
              students,
              lessons: Array.from(lessonsResult.dates),
              history,
            });
          } catch (err: any) {
            sendResponse({ success: false, error: err.message || 'Erro ao consultar dados' });
          }
        })();
        return true;
      }

      if (message.action === 'SUBMIT_ATTENDANCE') {
        (async () => {
          try {
            const session = getSiageSessionFromStorage();
            if (!session) {
              sendResponse({ success: false, error: 'Sessão do SIAGE não encontrada' });
              return;
            }
            const res = await saveAttendanceViaApi(session, message.payload);
            if (res.success) {
              showToast('✅ Frequência salva com sucesso no SIAGE!', 'success');
            } else {
              showToast(`⚠️ Erro ao salvar frequência: ${res.error || ''}`, 'error');
            }
            sendResponse(res);
          } catch (err: any) {
            sendResponse({ success: false, error: err.message || 'Erro ao salvar frequência' });
          }
        })();
        return true;
      }
    });
  }
}

/**
 * Detecta o botão azul principal "Registrar Aula" da tela do SIAGE
 */
/**
 * Dispara eventos de clique reativos (mousedown, mouseup, click)
 */
function triggerClick(el: HTMLElement) {
  try {
    el.focus();
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    el.click();
  } catch (e) {
    el.click();
  }
}

/**
 * Detecta o botão azul principal "Registrar Aula" da tela do SIAGE
 */
function findRegistrarAulaButton(): HTMLElement | null {
  // 1. Prioridade máxima: botão de ação específico do SIAGE
  const specificBtn = document.querySelector<HTMLButtonElement>(
    'button.btn-primary-dark, button.rounded-pill.btn-primary-dark'
  );
  if (specificBtn && (specificBtn.textContent || '').toLowerCase().includes('registrar')) {
    return specificBtn;
  }

  // 2. Apenas tags <button> reais, excluindo breadcrumbs, tabs, cabeçalhos e calendário
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button, .btn')).filter(
    b => b.offsetParent !== null && !b.closest('.nav-tabs, nav, .sidebar, #sidebar, #page-title, .breadcrumb')
  );

  const match = buttons.find(b => {
    const txt = (b.textContent || '').trim().toLowerCase();
    return (txt.includes('registrar aula') || txt.includes('nova aula') || txt.includes('cadastrar aula')) && !txt.includes('calendário');
  });

  return match || null;
}



/**
 * Normaliza textos para comparação flexível (sem acentos, pontuação, minúsculas)
 */
function normalizeCompareStr(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detecta o nome da turma e o componente curricular ativo exibidos na página do SIAGE
 */
function getSiageActiveTurmaInfo(): { turma: string; disciplina: string; label: string } {
  let turma = '';
  let disciplina = '';

  // Procura no container principal, ignorando barras laterais e menus de navegação
  const mainContainer: HTMLElement | null = document.querySelector('main, .main-content, #content, .container-fluid, router-outlet + *');
  const searchScope: Element = mainContainer || document.body;

  // Clona para remover navbars/sidebars com segurança
  const scopeClone = searchScope.cloneNode(true) as HTMLElement;
  const navEls = scopeClone.querySelectorAll('nav, aside, .sidebar, .menu, #sidebar, #menu, .navbar, header, .nav-tabs, .dropdown-menu, .menu-item');
  navEls.forEach(el => el.remove());

  const headers = Array.from(scopeClone.querySelectorAll('h1, h2, h3, h4, .breadcrumb, .card-header, .card-title, .page-title, th'));
  const headerTexts = headers.map(e => (e.textContent || '').trim()).join(' ');
  const scopeText = scopeClone.textContent || '';
  const pageInnerText = (document.body?.innerText || '');

  // 1. Extração da Turma (ex: "1ª série B", "1º Ano B", "1º B")
  const turmaMatch = headerTexts.match(/(\d[ºª°]?\s*Série\s*[A-Z]|\d[ºª°]?\s*Ano\s*[A-Z]|\b\d[ºª°]?\s*[A-Z]\b)/i) 
    || scopeText.match(/(\d[ºª°]?\s*Série\s*[A-Z]|\d[ºª°]?\s*Ano\s*[A-Z])/i)
    || pageInnerText.match(/(\d[ºª°]?\s*Série\s*[A-Z]|\d[ºª°]?\s*Ano\s*[A-Z])/i);

  if (turmaMatch) {
    turma = turmaMatch[0].trim();
  }

  // 2. Extração do Componente Curricular:
  // Método A: Regex explícita para "Componente Curricular: <Nome>" ou "Disciplina: <Nome>"
  const compRegex = /(?:Componente\s*Curricular|Disciplina)\s*[:\-]\s*([^•\n\r\t]+?)(?=\s*(?:Turno|Sala|Tipo|Curso|Carga|Prof|Matrícula|E-mail|$))/i;
  const compMatch = scopeText.match(compRegex) || pageInnerText.match(compRegex);

  if (compMatch && compMatch[1]) {
    const rawComp = compMatch[1].replace(/\s+/g, ' ').trim();
    if (rawComp && rawComp.length >= 2 && rawComp.length < 80 && !rawComp.toLowerCase().startsWith('componente')) {
      disciplina = rawComp;
    }
  }

  // Método B: Varredura de elementos estruturados no DOM
  if (!disciplina) {
    const candidateNodes = Array.from(scopeClone.querySelectorAll('p, div, span, strong, b, h1, h2, h3, h4, h5, dt, dd, th, td, label'));
    for (const node of candidateNodes) {
      const txt = (node.textContent || '').trim();
      if (txt.includes('Componente Curricular') || txt.includes('Disciplina')) {
        const m = txt.match(/(?:Componente\s*Curricular|Disciplina)\s*[:\-]?\s*([^•\n\r\t]+?)(?=\s*(?:Turno|Sala|Tipo|Curso|Carga|Prof|Matrícula|E-mail|$))/i);
        if (m && m[1]) {
          const val = m[1].replace(/\s+/g, ' ').trim();
          if (val && val.length >= 2 && val.length < 80 && !val.toLowerCase().startsWith('componente')) {
            disciplina = val;
            break;
          }
        }

        // Se o elemento for apenas o rótulo "Componente Curricular:", verifica o próximo elemento irmão
        const next = node.nextElementSibling;
        if (next && next.textContent) {
          const siblingVal = next.textContent.trim().split(/\s{2,}|\n|•/)[0];
          if (siblingVal && siblingVal.length >= 2 && siblingVal.length < 80 && !siblingVal.toLowerCase().includes('componente')) {
            disciplina = siblingVal;
            break;
          }
        }
      }
    }
  }

  // Método C: Obter da sessão ativa do SIAGE (dadosAlocacao)
  if (!disciplina) {
    try {
      const session = getSiageSessionFromStorage();
      if (session?.dadosAlocacao) {
        const alloc = session.dadosAlocacao;
        const allocComp = alloc.componenteCurricular || alloc.nomeComponenteCurricular || alloc.componenteCurricularNome || alloc.disciplina || '';
        if (allocComp && typeof allocComp === 'string') {
          disciplina = allocComp.trim();
        }
        if (!turma) {
          turma = alloc.turma || alloc.nomeTurma || alloc.anoEtapaTurma || '';
        }
      }
    } catch (e) {}
  }

  // Método D: Fallback por regex de disciplinas comuns do currículo
  if (!disciplina) {
    const discMatch = (headerTexts + ' ' + scopeText).match(/(Práticas\s*Integradoras\s*I*|Linguagem\s*de\s*Programação\s*I*|LP\s*I*|Estrutura\s*de\s*Dados|Engenharia\s*de\s*Software|Desenvolvimento\s*WEB|Banco\s*de\s*Dados|Redes\s*de\s*Computadores|Sistemas\s*Operacionais|Robótica|Matemática|Física|Química|Português|Língua\s*Portuguesa|Biologia|História|Geografia|Filosofia|Sociologia|Inglês|Artes|Educação\s*Física)/i);
    if (discMatch) {
      disciplina = discMatch[0].trim();
    }
  }

  const label = disciplina && turma ? `${disciplina} • ${turma}` : turma || disciplina || 'Turma Ativa';
  return { turma, disciplina, label };
}

function extractTurmaShortCode(str: string): string {
  if (!str) return '';
  const m = str.match(/(\d)\s*[ªº°]?\s*(?:série|ano)?\s*([a-z])/i);
  if (m) {
    return `${m[1]}${m[2]}`.toLowerCase();
  }
  return str.toLowerCase().replace(/[^\w]/g, '');
}

/**
 * Calcula uma pontuação de aderência entre uma aba da planilha Excel e a turma/componente ativo do SIAGE
 */
function scoreSheetMatch(
  sheet: { sheetName: string; sheetTitle?: string; lessons: any[] },
  classInfo: { turma: string; disciplina: string }
): number {
  let score = 0;
  const sheetCombined = `${sheet.sheetName} ${sheet.sheetTitle || ''}`;
  const normSheet = normalizeCompareStr(sheetCombined);

  // 1. MATCH DE TURMA (ex: "1b" <-> "1b")
  const targetTurmaCode = extractTurmaShortCode(classInfo.turma);
  const sheetTurmaCode = extractTurmaShortCode(sheetCombined);

  if (targetTurmaCode && sheetTurmaCode) {
    if (sheetTurmaCode === targetTurmaCode) {
      score += 100; // Match exato da turma (ex: 1º B)
    } else {
      // Casamento parcial (mesmo ano/série: 1º ano)
      if (sheetTurmaCode[0] === targetTurmaCode[0]) score += 25;
      // Casamento parcial (mesma letra/turma: turma B)
      if (sheetTurmaCode[1] && targetTurmaCode[1] && sheetTurmaCode[1] === targetTurmaCode[1]) score += 15;
    }
  }

  // 2. MATCH DO COMPONENTE CURRICULAR / DISCIPLINA
  if (classInfo.disciplina) {
    const normTargetDisc = normalizeCompareStr(classInfo.disciplina);

    // a) Casamento da frase inteira da disciplina
    if (normSheet.includes(normTargetDisc)) {
      score += 200;
    }

    // b) Casamento dos numerais romanos (I, II, III, etc.)
    const targetRoman = classInfo.disciplina.match(/\b(I{1,3}|IV|V)\b/i)?.[1]?.toUpperCase();
    const sheetRoman = sheetCombined.match(/\b(I{1,3}|IV|V)\b/i)?.[1]?.toUpperCase();
    if (targetRoman && sheetRoman) {
      if (targetRoman === sheetRoman) {
        score += 40;
      } else {
        score -= 80; // Penalidade por numeral romano divergente (ex: I vs II)
      }
    }

    // c) Casamento de palavras significativas (tokens com mais de 2 letras)
    const stopWords = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com', 'o', 'a', 'os', 'as', 'i', 'ii', 'iii', 'iv', 'v']);
    const targetWords = normTargetDisc
      .split(' ')
      .filter(w => w.length > 2 && !stopWords.has(w));

    let matchedWordCount = 0;
    for (const word of targetWords) {
      if (normSheet.includes(word)) {
        score += 50;
        matchedWordCount++;
      }
    }

    if (targetWords.length > 0 && matchedWordCount === targetWords.length) {
      score += 60; // Bônus por casar todas as palavras significativas da disciplina
    }

    // d) Casamento por sigla / acrônimo da disciplina (ex: PI -> Práticas Integradoras, LP -> Linguagem de Programação)
    const acronym = targetWords.map(w => w[0]).join('');
    if (acronym.length >= 2) {
      const acronymRegex = new RegExp(`(^|[^a-z0-9])${acronym}([^a-z0-9]|$)`, 'i');
      if (acronymRegex.test(normSheet)) {
        score += 45;
      }
    }

    // e) Penalidade forte se a aba contiver o nome de OUTRA disciplina conhecida
    const conflictingDisciplines = [
      { name: 'linguagem de programacao', acronym: 'lp' },
      { name: 'praticas integradoras', acronym: 'pi' },
      { name: 'estrutura de dados', acronym: 'ed' },
      { name: 'engenharia de software', acronym: 'es' },
      { name: 'desenvolvimento web', acronym: 'dw' },
      { name: 'banco de dados', acronym: 'bd' },
      { name: 'redes de computadores', acronym: 'rc' },
      { name: 'sistemas operacionais', acronym: 'so' },
      { name: 'robotica', acronym: 'rob' },
      { name: 'matematica', acronym: 'mat' },
      { name: 'fisica', acronym: 'fis' },
      { name: 'quimica', acronym: 'qui' },
      { name: 'biologia', acronym: 'bio' },
      { name: 'historia', acronym: 'hist' },
      { name: 'geografia', acronym: 'geo' },
      { name: 'portugues', acronym: 'port' },
    ];

    for (const conf of conflictingDisciplines) {
      if (!normTargetDisc.includes(conf.name)) {
        const hasConfName = normSheet.includes(conf.name);
        const hasConfAcronym = conf.acronym && new RegExp(`(^|[^a-z0-9])${conf.acronym}([^a-z0-9]|$)`, 'i').test(normSheet);
        if (hasConfName || hasConfAcronym) {
          score -= 150; // Penalidade decisiva para não misturar matérias diferentes da mesma turma!
        }
      }
    }
  }

  return score;
}

/**
 * Procura a aba da planilha Excel correspondente à turma e componente curricular ativo
 */
function findMatchingSheet(
  savedSheets: Array<{ sheetName: string; sheetTitle?: string; lessons: any[] }>,
  classInfo: { turma: string; disciplina: string }
): { sheetName: string; sheetTitle?: string; lessons: any[] } | null {
  if (!savedSheets || savedSheets.length === 0) return null;

  // Filtra abas que não possuem aulas (ex: Visão geral, Horários, etc.)
  const lessonSheets = savedSheets.filter(s => {
    const nameLower = s.sheetName.toLowerCase();
    return !nameLower.includes('visão geral') &&
           !nameLower.includes('visao geral') &&
           !nameLower.includes('horário') &&
           !nameLower.includes('horario') &&
           !nameLower.includes('eixo') &&
           !nameLower.includes('resumo') &&
           !nameLower.includes('instruç') &&
           s.lessons && s.lessons.length > 0;
  });

  const candidates = lessonSheets.length > 0 ? lessonSheets : savedSheets;
  if (candidates.length === 1) return candidates[0];

  // Ordena os candidatos pela maior pontuação
  const scored = candidates
    .map(sheet => ({ sheet, score: scoreSheetMatch(sheet, classInfo) }))
    .sort((a, b) => b.score - a.score);

  console.log('[ProfessorSync] Score de casamento de abas:', scored.map(s => `${s.sheet.sheetName}: ${s.score}`));

  // Se o melhor candidato tiver pontuação positiva, retorna ele
  if (scored.length > 0 && scored[0].score > 0) {
    return scored[0].sheet;
  }

  // Fallback seguro: retorna o primeiro candidato com aulas
  return candidates[0] || null;
}

function parseSiageDateStr(dateStr: string): Date | null {
  if (!dateStr) return null;
  const str = String(dateStr).trim();

  // 1. Formato ISO: YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d);
  }

  // 2. Formato PT-BR: DD/MM/YYYY
  const brMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (brMatch) {
    let d = parseInt(brMatch[1], 10);
    let m = parseInt(brMatch[2], 10) - 1;
    const y = parseInt(brMatch[3], 10);

    // Se m >= 12 e d < 12, pode estar no formato americano MM/DD/YYYY
    if (m >= 12 && d < 12) {
      const temp = d;
      d = m + 1;
      m = temp - 1;
    }

    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d);
  }

  // 3. Formato PT-BR curto: DD/MM/YY
  const shortYearMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})/);
  if (shortYearMatch) {
    let d = parseInt(shortYearMatch[1], 10);
    let m = parseInt(shortYearMatch[2], 10) - 1;
    const y = 2000 + parseInt(shortYearMatch[3], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d);
  }

  // 4. Formato sem ano: DD/MM (assume 2026)
  const noYearMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})$/);
  if (noYearMatch) {
    const d = parseInt(noYearMatch[1], 10);
    const m = parseInt(noYearMatch[2], 10) - 1;
    return new Date(2026, m, d);
  }

  // 5. Fallback para JS timestamp string
  const timestamp = Date.parse(str);
  if (!isNaN(timestamp)) {
    const parsed = new Date(timestamp);
    if (parsed.getFullYear() >= 2020 && parsed.getFullYear() <= 2035) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }
  }

  return null;
}

function isDateTodayOrPast(dateStr: string): boolean {
  const d = parseSiageDateStr(dateStr);
  if (!d) return true;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d <= today;
}

/**
 * Registra aulas pendentes diretamente pela API oficial do SIAGE
 * (sem depender de navegação por cliques ou abrir rotas /registrar)
 */
async function batchRegisterPendingLessonsViaApi(
  planList: any[] = [],
  options?: { forceDates?: string[]; forceAll?: boolean }
) {
  if (typeof chrome === 'undefined' || !chrome.runtime?.id || !chrome.storage?.local) {
    showToast('⚠️ Por favor, recarregue a página do SIAGE (F5) para sincronizar com a extensão.', 'error');
    return;
  }

  // 1. Limpar qualquer fila legada que estivesse presa
  chrome.storage.local.remove([
    'ps_queue_running',
    'ps_pending_queue',
    'ps_current_lesson',
    'ps_auto_fill_pending',
  ]);

  // 2. Obter a sessão ativa do SIAGE no localStorage
  const session = getSiageSessionFromStorage();
  if (!session || !session.token) {
    showToast('⚠️ Sessão do SIAGE não encontrada. Faça login ou recarregue a página (F5).', 'error');
    return;
  }

  try {
    chrome.storage.local.get(['savedSheets', 'savedPlan', 'siagePassword', 'siageClasses'], async (result) => {
      const savedSheets: Array<{ sheetName: string; sheetTitle?: string; lessons: any[] }> = result.savedSheets || [];
      const classInfo = getSiageActiveTurmaInfo();
      let matchedSheet: { sheetName: string; sheetTitle?: string; lessons: any[] } | null = null;
      let targetLessons: any[] = [];

      // 1. Casar com as abas da planilha Excel usando pontuação inteligente (turma + componente)
      if (savedSheets.length > 0) {
        matchedSheet = findMatchingSheet(savedSheets, classInfo);
        if (matchedSheet && matchedSheet.lessons.length > 0) {
          targetLessons = matchedSheet.lessons;
          showToast(`📚 Turma ${classInfo.label} casada com a aba "${matchedSheet.sheetName}" (${matchedSheet.lessons.length} aulas)!`, 'info');
        } else {
          matchedSheet = savedSheets[0];
          targetLessons = matchedSheet.lessons;
        }
      } else if (planList.length > 0) {
        targetLessons = planList;
      } else if (result.savedPlan && result.savedPlan.length > 0) {
        targetLessons = result.savedPlan;
      }

      if (targetLessons.length === 0) {
        showToast('❌ Nenhuma aula encontrada no plano Excel. Envie sua planilha primeiro.', 'error');
        return;
      }

      if (targetLessons.every((l: any) => !l.date)) {
        showToast(
          matchedSheet
            ? `⚠️ A aba "${matchedSheet.sheetName}" não possui coluna de datas reconhecidas. Verifique a coluna de datas (DD/MM/AAAA).`
            : '⚠️ As aulas da planilha estão sem datas reconhecidas. Por favor, reenvie seu arquivo Excel (.xlsx) pelo popup da extensão.',
          'error'
        );
        return;
      }

      // 2. Extrair formacaoTurmaId da URL ou da alocação
      const urlMatch = window.location.pathname.match(/\/turma\/([a-f0-9\-]+)/i);
      const formacaoTurmaId = urlMatch ? urlMatch[1] : (session.dadosAlocacao?.formacaoTurmaId || '');

      if (!formacaoTurmaId) {
        showToast('⚠️ Por favor, acesse a página de Registro de Aula da sua turma no SIAGE.', 'error');
        return;
      }

      // 3. Obter componenteCurricularId e escolaId
      let curriculoComponenteCurricularId =
        session.dadosAlocacao?.componenteCurricularTabComponenteCurricularLocalId ||
        session.dadosAlocacao?.curriculoComponenteCurricularId ||
        '';
      let escolaId = session.dadosAlocacao?.escolaId || '';

      const sessionComp = (session.dadosAlocacao?.componenteCurricular || '').toLowerCase();
      const pageComp = (classInfo.disciplina || '').toLowerCase();
      const compMismatch = Boolean(pageComp && sessionComp && !sessionComp.includes(pageComp) && !pageComp.includes(sessionComp));

      if (!curriculoComponenteCurricularId || compMismatch || (session.dadosAlocacao?.formacaoTurmaId && session.dadosAlocacao.formacaoTurmaId !== formacaoTurmaId)) {
        try {
          const turmasUrl = `${SIAGE_API_BASE}/formacao-turma-aluno/curriculo-professor/turmas?profissionalMatriculaId=${session.matriculaId}&page=1&size=50`;
          const res = await fetch(turmasUrl, {
            headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
          });
          if (res.ok) {
            const tData = await res.json();
            escolaId = escolaId || tData.data?.escolaId || tData.escolaId || '';
            const rawTurmas = tData.data?.turmas?.data || tData.turmas?.data || tData.items || [];
            const matchedT = rawTurmas.find((t: any) => {
              if (t.formacaoTurmaId !== formacaoTurmaId) return false;
              if (!classInfo.disciplina) return true;
              const tComp = (t.componenteCurricular || t.nomeComponenteCurricular || t.disciplina || '').toLowerCase();
              return normalizeCompareStr(tComp).includes(normalizeCompareStr(classInfo.disciplina)) ||
                     normalizeCompareStr(classInfo.disciplina).includes(normalizeCompareStr(tComp));
            }) || rawTurmas.find((t: any) => t.formacaoTurmaId === formacaoTurmaId);

            if (matchedT) {
              curriculoComponenteCurricularId =
                matchedT.curriculoMatrizItinerarioComponenteCurricularId ||
                matchedT.componenteCurricularLocalId ||
                matchedT.curriculoComponenteCurricularId ||
                matchedT.id;
            }
          }
        } catch (e) {}
      }

      if (!curriculoComponenteCurricularId) {
        curriculoComponenteCurricularId = 'a5aad79d-cecd-4b43-8c2a-89fe92a778e2';
      }

      // 4. Buscar aulas já registradas para não duplicar
      showToast('🔍 Verificando aulas já registradas no SIAGE...', 'info');
      const { dates: registeredDates, counts: registeredCounts } = await fetchRegisteredLessons(
        session,
        formacaoTurmaId,
        curriculoComponenteCurricularId
      );

      const pendingLessons = computePendingLessons(targetLessons, registeredCounts, options);

      if (pendingLessons.length === 0 && savedSheets.length <= 1) {
        const today = new Date();
        showToast(`✅ Todas as aulas de ${classInfo.label} até ${today.toLocaleDateString('pt-BR')} já estão registradas no SIAGE! (${registeredCounts.size} aula(s) registrada(s))`, 'success');
        return;
      }

      // Abre o Modal Seguro de Auditoria e Aprovação Prévia com Seletor de Abas
      showPendingLessonsApprovalModal(
        pendingLessons,
        classInfo,
        {
          savedSheets,
          currentSheet: matchedSheet,
          registeredCounts,
          options,
        },
        async (chosenLessons = pendingLessons) => {
          // Validar senha antes se estiver configurada
          if (result.siagePassword) {
            await validatePasswordIfProvided(session, result.siagePassword);
          }

          let successCount = 0;
          let failCount = 0;

          for (let i = 0; i < chosenLessons.length; i++) {
            const lesson = chosenLessons[i];
            updateModalProgress(i + 1, chosenLessons.length, lesson.date);

            const d = parseSiageDateStr(lesson.date)!;
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const isoDate = `${yyyy}-${mm}-${dd}`;

            const periodo = await getPeriodoForDate(session, escolaId || 'f1289131-068e-404f-a5bd-4c7510908e22', isoDate);

            const res = await insertLessonViaApi(session, {
              date: isoDate,
              periodo,
              topic: lesson.topic,
              methodology: lesson.methodology,
              observations: lesson.observations,
              formacaoTurmaId,
              curriculoComponenteCurricularId,
            });

            if (res.success) {
              successCount++;
            } else {
              failCount++;
              console.warn(`[SIAGE] Erro na aula ${lesson.date}:`, res.error);
            }

            await new Promise(r => setTimeout(r, 400));
          }

          finishModalProgress(successCount, failCount, chosenLessons.length);
        }
      );
    });
  } catch (e) {
    showToast('⚠️ Erro ao processar requisições. Recarregue a página (F5).', 'error');
  }
}

/**
 * Filtra aulas do plano que ainda não foram lançadas no diário do SIAGE
 */
function computePendingLessons(
  lessons: any[],
  registeredCounts: Map<string, number>,
  options?: { forceDates?: string[]; forceAll?: boolean }
): any[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const planOccurrences = new Map<string, number>();

  return (lessons || []).filter((lesson: any) => {
    if (!lesson.topic) return false;
    if (!lesson.date) return false;

    const d = parseSiageDateStr(lesson.date);
    if (!d) return false;
    if (d > today) return false;

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const isoDate = `${yyyy}-${mm}-${dd}`;
    const ptBrDate = `${dd}/${mm}/${yyyy}`;

    const isForced = Boolean(
      options?.forceAll ||
      options?.forceDates?.some(
        f => f.includes(isoDate) || f.includes(ptBrDate) || f.includes(lesson.date.trim())
      )
    );

    if (isForced) {
      return true;
    }

    // Suporte a múltiplas aulas na mesma data (ex: 2 aulas no mesmo dia na planilha)
    const occurrencesSeen = (planOccurrences.get(isoDate) || 0) + 1;
    planOccurrences.set(isoDate, occurrencesSeen);

    const countInSiage = registeredCounts.get(isoDate) || 0;
    return occurrencesSeen > countInSiage;
  }).sort((a: any, b: any) => {
    const da = parseSiageDateStr(a.date)?.getTime() || 0;
    const db = parseSiageDateStr(b.date)?.getTime() || 0;
    if (da !== db) return da - db;
    return (a.number || 0) - (b.number || 0);
  });
}

function renderLessonListHtml(lessons: any[]): string {
  if (!lessons || lessons.length === 0) {
    return `
      <div style="padding: 28px 16px; text-align: center; background: #141417; border-radius: 8px; border: 1px solid #27272a;">
        <span style="font-size: 26px; display: block; margin-bottom: 6px;">🎉</span>
        <strong style="color: #34d399; font-size: 13px; display: block; margin-bottom: 4px;">
          Nenhuma aula pendente nesta aba!
        </strong>
        <p style="margin: 0; font-size: 11px; color: #a1a1aa;">
          Todas as datas letivas até hoje já constam como registradas no SIAGE.
        </p>
      </div>
    `;
  }

  return lessons.map((l, i) => `
    <div style="
      background: #141417;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 10px 12px;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input type="checkbox" class="ps-lesson-check" data-idx="${i}" checked style="cursor: pointer; width: 14px; height: 14px;" />
          <span style="
            background: rgba(52, 211, 153, 0.15);
            color: #34d399;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 4px;
          ">
            Aula ${l.number || i + 1} • 📅 ${formatLessonDateWithWeekday(l.date, 'long')}
          </span>
        </label>
        <span style="font-size: 11px; color: #71717a;">
          ${l.periodo || '4º Período'}
        </span>
      </div>
      <div style="font-size: 12px; color: #f4f4f5; font-weight: 500; margin-bottom: 4px; line-height: 1.4; padding-left: 22px;">
        <strong style="color: #a1a1aa;">Conteúdo:</strong> ${l.topic}
      </div>
      <div style="font-size: 11px; color: #a1a1aa; margin-bottom: 2px; padding-left: 22px;">
        <strong style="color: #71717a;">Metodologia:</strong> ${l.methodology || 'Aula dialogada, Estudo de caso'}
      </div>
      ${l.observations ? `
        <div style="font-size: 11px; color: #71717a; padding-left: 22px;">
          <strong style="color: #52525b;">Observações:</strong> ${l.observations}
        </div>
      ` : ''}
    </div>
  `).join('');
}

function showPendingLessonsApprovalModal(
  initialPendingLessons: any[],
  classInfo: { label: string; disciplina?: string; turma?: string },
  context: {
    savedSheets: Array<{ sheetName: string; sheetTitle?: string; lessons: any[] }>;
    currentSheet: { sheetName: string; sheetTitle?: string; lessons: any[] } | null;
    registeredCounts: Map<string, number>;
    options?: { forceDates?: string[]; forceAll?: boolean };
  },
  onConfirm: (chosenLessons: any[]) => Promise<void>
) {
  const existing = document.getElementById('ps-preview-modal-overlay');
  if (existing) existing.remove();

  let currentPending = [...initialPendingLessons];
  let currentSheet = context.currentSheet;

  const overlay = document.createElement('div');
  overlay.id = 'ps-preview-modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(6px);
    z-index: 99999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  overlay.innerHTML = `
    <div id="ps-preview-modal-card" style="
      width: 520px;
      max-width: 90vw;
      max-height: 85vh;
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 14px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 24px rgba(52, 211, 153, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    ">
      <!-- Header -->
      <div style="
        padding: 16px 20px;
        background: #18181b;
        border-bottom: 1px solid #27272a;
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="
            width: 34px;
            height: 34px;
            border-radius: 8px;
            background: rgba(52, 211, 153, 0.15);
            border: 1px solid rgba(52, 211, 153, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
          ">🔍</div>
          <div>
            <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: #f4f4f5;">
              Auditoria de Aulas Pendentes
            </h3>
            <span style="font-size: 12px; color: #34d399; font-weight: 600;">
              ${classInfo.label} • <span id="ps-modal-pending-count">${currentPending.length}</span> aula(s) identificadas
            </span>
          </div>
        </div>
        <button id="ps-modal-btn-x" style="
          background: transparent;
          border: none;
          color: #a1a1aa;
          font-size: 22px;
          cursor: pointer;
          line-height: 1;
        ">&times;</button>
      </div>

      <!-- Body / List of lessons -->
      <div style="
        padding: 16px 20px;
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: #09090b;
      ">
        <!-- Seletor de Aba da Planilha -->
        <div style="
          background: #141417;
          border: 1px solid #27272a;
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 600; color: #a1a1aa;">
              📊 Aba da Planilha Utilizada:
            </span>
            <span id="ps-modal-sheet-badge" style="font-size: 11px; color: #34d399; font-weight: 700;">
              ${currentSheet ? `${currentSheet.sheetName} (${currentSheet.lessons.length} aulas)` : 'Plano Geral'}
            </span>
          </div>
          ${context.savedSheets && context.savedSheets.length > 1 ? `
            <select id="ps-modal-sheet-select" style="
              background: #09090b;
              border: 1px solid #3f3f46;
              color: #f4f4f5;
              padding: 6px 10px;
              border-radius: 6px;
              font-size: 12px;
              cursor: pointer;
              outline: none;
              width: 100%;
            ">
              ${context.savedSheets.map(s => `
                <option value="${s.sheetName}" ${currentSheet && s.sheetName === currentSheet.sheetName ? 'selected' : ''}>
                  ${s.sheetName} (${s.lessons?.length || 0} aulas)
                </option>
              `).join('')}
            </select>
          ` : ''}
        </div>

        <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
          O assistente identificou as seguintes aulas pendentes para esta turma. Você pode desmarcar datas que caírem em feriado:
        </p>

        <div id="ps-modal-lessons-list" style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
          ${renderLessonListHtml(currentPending)}
        </div>
      </div>

      <!-- Dica sobre feriados -->
      <div style="
        margin: 0 20px 10px 20px;
        padding: 8px 12px;
        background: rgba(56, 189, 248, 0.08);
        border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 8px;
        display: flex;
        gap: 8px;
        align-items: center;
      ">
        <span style="font-size: 14px;">💡</span>
        <span style="font-size: 11px; color: #38bdf8; line-height: 1.4;">
          <strong>Tratamento de Feriados:</strong> Se alguma aula da planilha caiu em feriado ou dia não letivo, basta desmarcar a caixinha dela acima antes de confirmar.
        </span>
      </div>

      <!-- Warning note -->
      <div style="
        margin: 0 20px 12px 20px;
        padding: 10px 12px;
        background: rgba(234, 179, 8, 0.08);
        border: 1px solid rgba(234, 179, 8, 0.25);
        border-radius: 8px;
        display: flex;
        gap: 8px;
        align-items: flex-start;
      ">
        <span style="font-size: 14px;">⚠️</span>
        <span style="font-size: 11px; color: #fde047; line-height: 1.4;">
          <strong>Confirmação de Segurança:</strong> Nenhuma alteração é gravada no SIAGE até você clicar no botão abaixo.
        </span>
      </div>

      <!-- Footer / Actions -->
      <div id="ps-modal-footer" style="
        padding: 14px 20px;
        background: #18181b;
        border-top: 1px solid #27272a;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 10px;
      ">
        <button id="ps-modal-btn-cancel" style="
          padding: 8px 16px;
          border-radius: 6px;
          background: #27272a;
          color: #f4f4f5;
          border: 1px solid #3f3f46;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        ">
          ❌ Cancelar / Ajustar
        </button>
        <button id="ps-modal-btn-confirm" style="
          padding: 8px 20px;
          border-radius: 6px;
          background: #34d399;
          color: #09090b;
          border: none;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(52, 211, 153, 0.25);
        ">
          ✅ Confirmar e Inserir Aulas
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeModal = () => {
    overlay.remove();
    showToast('🚫 Inserção cancelada. Nenhuma aula foi gravada.', 'info');
  };

  overlay.querySelector('#ps-modal-btn-x')?.addEventListener('click', closeModal);
  overlay.querySelector('#ps-modal-btn-cancel')?.addEventListener('click', closeModal);

  // Escuta alteração do Seletor de Abas no Modal
  const sheetSelect = overlay.querySelector<HTMLSelectElement>('#ps-modal-sheet-select');
  if (sheetSelect) {
    sheetSelect.addEventListener('change', () => {
      const selectedName = sheetSelect.value;
      const targetSheet = context.savedSheets.find(s => s.sheetName === selectedName);
      if (targetSheet) {
        currentSheet = targetSheet;
        currentPending = computePendingLessons(targetSheet.lessons, context.registeredCounts, context.options);

        // Atualiza cabeçalho e contagem
        const countBadge = overlay.querySelector('#ps-modal-pending-count');
        if (countBadge) countBadge.textContent = String(currentPending.length);

        const sheetBadge = overlay.querySelector('#ps-modal-sheet-badge');
        if (sheetBadge) sheetBadge.textContent = `${targetSheet.sheetName} (${targetSheet.lessons.length} aulas)`;

        // Atualiza lista de aulas
        const listContainer = overlay.querySelector('#ps-modal-lessons-list');
        if (listContainer) {
          listContainer.innerHTML = renderLessonListHtml(currentPending);
        }

        // Atualiza botão de confirmar se não houver aulas
        const confirmBtn = overlay.querySelector<HTMLButtonElement>('#ps-modal-btn-confirm');
        if (confirmBtn) {
          confirmBtn.disabled = currentPending.length === 0;
          confirmBtn.style.opacity = currentPending.length === 0 ? '0.5' : '1';
          confirmBtn.style.cursor = currentPending.length === 0 ? 'not-allowed' : 'pointer';
        }
      }
    });
  }

  overlay.querySelector('#ps-modal-btn-confirm')?.addEventListener('click', () => {
    const checkedCheckboxes = Array.from(overlay.querySelectorAll<HTMLInputElement>('.ps-lesson-check:checked'));
    const selectedIndices = checkedCheckboxes.map(cb => parseInt(cb.getAttribute('data-idx') || '0', 10));
    const chosenLessons = selectedIndices.map(idx => currentPending[idx]).filter(Boolean);

    if (chosenLessons.length === 0) {
      alert('Nenhuma aula selecionada para registrar.');
      return;
    }

    const footer = overlay.querySelector('#ps-modal-footer');
    if (footer) {
      footer.innerHTML = `
        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #34d399; font-weight: 600;">
            <span id="ps-pbar-status">⏳ Iniciando gravação segura no SIAGE...</span>
            <span id="ps-pbar-percent">0%</span>
          </div>
          <div style="height: 6px; background: #27272a; border-radius: 4px; overflow: hidden;">
            <div id="ps-pbar-fill" style="width: 0%; height: 100%; background: #34d399; transition: width 0.3s ease;"></div>
          </div>
        </div>
      `;
    }
    onConfirm(chosenLessons);
  });
}

function updateModalProgress(current: number, total: number, dateStr: string) {
  const percent = Math.round((current / total) * 100);
  const statusEl = document.getElementById('ps-pbar-status');
  const percentEl = document.getElementById('ps-pbar-percent');
  const fillEl = document.getElementById('ps-pbar-fill');

  if (statusEl) statusEl.textContent = `📝 [${current}/${total}] Salvando aula de ${dateStr}...`;
  if (percentEl) percentEl.textContent = `${percent}%`;
  if (fillEl) fillEl.style.width = `${percent}%`;
}

function finishModalProgress(successCount: number, failCount: number, total: number) {
  const footer = document.getElementById('ps-modal-footer');
  if (footer) {
    footer.innerHTML = `
      <div style="flex: 1; display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 13px; color: #34d399; font-weight: 700;">
          🎉 Concluído: ${successCount} de ${total} aula(s) registradas com sucesso!
        </span>
        <button id="ps-modal-reload-btn" style="
          padding: 8px 18px;
          border-radius: 6px;
          background: #34d399;
          color: #000;
          font-weight: 700;
          font-size: 12px;
          border: none;
          cursor: pointer;
        ">
          🔄 Atualizar Tela do SIAGE
        </button>
      </div>
    `;

    document.getElementById('ps-modal-reload-btn')?.addEventListener('click', () => {
      window.location.reload();
    });
  }
}

/**
 * Clica no botão Salvar/Gravar do formulário do SIAGE
 */
async function submitSiageForm(): Promise<boolean> {
  await new Promise(r => setTimeout(r, 500));

  const saveButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input[type="submit"], .btn, mat-button')
  ).filter(b => b.offsetParent !== null && !(b as HTMLButtonElement).disabled);

  const saveBtn = saveButtons.find(b => {
    const txt = (b.textContent || b.getAttribute('value') || b.getAttribute('title') || '').trim().toLowerCase();
    return (
      (txt.includes('salvar') || txt.includes('gravar') || txt.includes('confirmar') || txt.includes('finalizar')) &&
      !txt.includes('voltar') && !txt.includes('cancelar')
    );
  });

  if (saveBtn) {
    showToast('💾 Enviando e salvando registro no SIAGE...', 'info');
    saveBtn.click();
    return true;
  }
  return false;
}

/**
 * Injeta textos de formulário especificamente na tela "Registro de Aula" do SIAGE
 */
async function fillSiageForm(data: { date?: string; topic: string; methodology?: string; observations?: string }): Promise<boolean> {
  let filledAny = false;

  // 0. Preencher a Data no campo do formulário se informada
  if (data.date) {
    const dateInput = getSiageFormDateInput();
    if (dateInput) {
      injectValueToElement(dateInput, data.date);
      dateInput.dispatchEvent(new Event('input', { bubbles: true }));
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      dateInput.dispatchEvent(new Event('blur', { bubbles: true }));
      await new Promise(r => setTimeout(r, 600));
      filledAny = true;
    }
  }

  // 1. Radio 'Avulso' (suporta HTML nativo e Angular Material mat-radio-button)
  const nativeRadios = document.querySelectorAll<HTMLInputElement>('input[type="radio"]');
  nativeRadios.forEach(r => {
    const parentText = (r.parentElement?.textContent || r.labels?.[0]?.textContent || r.value || '').toLowerCase();
    if (parentText.includes('avulso') && !r.checked) {
      r.click();
      r.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  const matRadios = document.querySelectorAll<HTMLElement>('mat-radio-button, .mat-radio-button');
  matRadios.forEach(mr => {
    const txt = (mr.textContent || mr.getAttribute('value') || '').toLowerCase();
    if (txt.includes('avulso')) {
      const input = mr.querySelector<HTMLInputElement>('input[type="radio"]');
      if (input && !input.checked) {
        mr.click();
        input.click();
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (!mr.classList.contains('mat-radio-checked')) {
        mr.click();
      }
    }
  });

  // 2. Metodologia
  await selectSiageMethodology(data.methodology);

  // 3. Textareas (Objetos de conhecimento e Observações)
  let textareas = Array.from(document.querySelectorAll<HTMLTextAreaElement>('textarea')).filter(
    t => t.offsetParent !== null
  );

  if (textareas.length === 0) {
    showToast('❌ Abra a tela de Registro de Aula para preencher.', 'error');
    return false;
  }

  let objetoField: HTMLTextAreaElement | null = null;
  let obsField: HTMLTextAreaElement | null = null;

  textareas.forEach(t => {
    const labelText = (
      t.parentElement?.textContent ||
      t.previousElementSibling?.textContent ||
      t.getAttribute('formcontrolname') ||
      t.getAttribute('placeholder') ||
      ''
    ).toLowerCase();

    if (labelText.includes('objeto') || labelText.includes('conhecimento') || labelText.includes('conteudo')) {
      objetoField = t;
    } else if (labelText.includes('observa')) {
      obsField = t;
    }
  });

  if (!objetoField && textareas.length > 0) objetoField = textareas[0];
  if (!obsField && textareas.length > 1) obsField = textareas[1];

  if (objetoField && data.topic) {
    injectValueToElement(objetoField, data.topic);
    filledAny = true;
  }

  if (obsField && data.observations) {
    injectValueToElement(obsField, data.observations);
    filledAny = true;
  }

  if (filledAny) {
    showToast('✨ "Objetos de Conhecimento", "Metodologia" e "Observações" preenchidos!', 'success');
  }

  return filledAny;
}

async function selectSiageMethodology(customMethodology?: string) {
  const desiredTargets = customMethodology
    ? [customMethodology.toLowerCase(), 'prática', 'expositiva', 'laboratório', 'resolução de problemas', 'estudo de caso']
    : ['expositiva', 'prática', 'laboratório', 'resolução de problemas'];

  // Native select
  const nativeSelects = document.querySelectorAll<HTMLSelectElement>('select');
  nativeSelects.forEach(select => {
    const parentText = (select.parentElement?.textContent || select.previousElementSibling?.textContent || '').toLowerCase();
    if (parentText.includes('metodologia')) {
      for (const option of Array.from(select.options)) {
        if (desiredTargets.some(m => option.text.toLowerCase().includes(m))) {
          option.selected = true;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    }
  });

  // Angular Material mat-select / ng-select
  const matSelects = document.querySelectorAll<HTMLElement>('mat-select, .mat-select, div[role="combobox"], ng-select');
  for (const ms of Array.from(matSelects)) {
    const parentText = (ms.parentElement?.textContent || ms.previousElementSibling?.textContent || ms.getAttribute('formcontrolname') || '').toLowerCase();
    if (parentText.includes('metodologia') || ms.id?.includes('metodologia') || ms.getAttribute('formcontrolname')?.includes('metodologia')) {
      ms.click();
      await new Promise(r => setTimeout(r, 300));

      const options = document.querySelectorAll<HTMLElement>('mat-option, .mat-option, div[role="option"], .ng-option');
      let clicked = false;
      options.forEach(opt => {
        if (clicked) return;
        const optText = (opt.textContent || '').toLowerCase();
        if (desiredTargets.some(m => optText.includes(m))) {
          opt.click();
          clicked = true;
        }
      });

      document.body.click();
    }
  }
}

function fillSiageAttendance(absentNames: string[]) {
  const rows = document.querySelectorAll('table tr, tr.mat-row, .frequencia-item, tbody tr');

  rows.forEach(row => {
    const rowText = (row.textContent || '').toLowerCase();
    const isAbsent = absentNames.some(name => rowText.includes(name.toLowerCase().trim()));

    const checkboxes = row.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    const radios = row.querySelectorAll<HTMLInputElement>('input[type="radio"]');

    if (checkboxes.length > 0) {
      checkboxes.forEach(cb => {
        if (isAbsent && !cb.checked) {
          cb.click();
        }
      });
    } else if (radios.length > 0) {
      radios.forEach(radio => {
        const val = (radio.value || radio.id || '').toLowerCase();
        if (isAbsent && (val.includes('falta') || val.includes('ausente') || val.includes('f'))) {
          radio.click();
        }
      });
    }
  });

  showToast(`⚡ Frequência atualizada no SIAGE! (${absentNames.length} falta(s) processada(s))`, 'success');
}

function injectValueToElement(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  el.focus();
  const prototype = Object.getPrototypeOf(el);
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  if (valueSetter) {
    valueSetter.call(el, value);
  } else {
    el.value = value;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true }));
}

function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const existing = document.getElementById('ps-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'ps-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 99999999;
    padding: 12px 20px;
    border-radius: 8px;
    background: ${type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#2563eb'};
    color: #ffffff;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    transition: opacity 0.3s ease;
  `;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

async function autoCrawlAndFetchAllClasses(): Promise<SiageFetchedClass[]> {
  let classes = await fetchTeacherClassesFromSiage();

  try {
    let hasNextPage = true;
    let attempts = 0;

    while (hasNextPage && attempts < 6) {
      const domClasses = scrapeSiageTableFromDOM();
      if (domClasses.length > 0) {
        classes = await mergeAndSaveClasses(domClasses);
      }

      const nextBtn = document.querySelector<HTMLButtonElement | HTMLAnchorElement>(
        '.mat-paginator-navigation-next:not([disabled]):not(.mat-button-disabled), button[aria-label="Próxima página"]:not([disabled]), li.pagination-next:not(.disabled) a, .mat-mdc-paginator-navigation-next:not([disabled])'
      );

      if (nextBtn && !nextBtn.hasAttribute('disabled')) {
        console.log(`[Professor Sync] Avançando para a próxima página do DOM (tentativa ${attempts + 1})...`);
        nextBtn.click();
        await new Promise(res => setTimeout(res, 700));
        attempts++;
      } else {
        hasNextPage = false;
      }
    }
  } catch (err) {
    console.warn('[Professor Sync] Erro no auto-crawl do DOM:', err);
  }

  return classes;
}

function setupAutomaticDomScraper() {
  const scrapeAndSave = () => {
    const scraped = scrapeSiageTableFromDOM();
    if (scraped.length > 0) {
      mergeAndSaveClasses(scraped);
    }
  };

  setTimeout(scrapeAndSave, 1500);

  const observer = new MutationObserver(() => {
    scrapeAndSave();
  });

  const tableOrBody = document.querySelector('table, .mat-paginator, body');
  if (tableOrBody) {
    observer.observe(tableOrBody, { childList: true, subtree: true });
  }
}

function injectFloatingWidget() {
  if (document.getElementById('ps-floating-widget')) return;

  const widgetBtn = document.createElement('div');
  widgetBtn.id = 'ps-floating-widget';
  widgetBtn.innerHTML = `
    <div class="ps-btn-content">
      <span class="ps-sparkle">✨</span>
      <span class="ps-btn-text">Professor Sync</span>
    </div>
  `;

  const drawer = document.createElement('div');
  drawer.id = 'ps-floating-drawer';
  drawer.innerHTML = `
    <div class="ps-drawer-header">
      <div style="display: flex; align-items: center; gap: 8px;">
        <div class="ps-icon">PS</div>
        <div>
          <strong style="color: #f4f4f5; font-size: 14px; display: block;">Professor Sync</strong>
          <span style="color: #34d399; font-size: 11px;">🟢 Assistente Ativo</span>
        </div>
      </div>
      <button id="ps-close-drawer" class="ps-close-btn">&times;</button>
    </div>

    <div class="ps-drawer-body">
      <div class="ps-card" style="border-left: 3px solid #34d399; background: rgba(52, 211, 153, 0.05); margin-bottom: 12px;">
        <h4 style="margin-bottom: 4px; color: #34d399; font-size: 13px;">📚 Turma Identificada</h4>
        <p style="font-size: 11px; color: #a1a1aa; line-height: 1.4;">
          Sincronizado com a sua planilha Excel mestre.
        </p>
      </div>

      <div class="ps-card">
        <h4 style="margin-bottom: 6px; color: #34d399; font-size: 13px;">⚡ Diário de Classe (Excel)</h4>
        <p style="font-size: 11px; color: #a1a1aa; margin-bottom: 12px; line-height: 1.4;">
          Lê as aulas pendentes da sua planilha e abre a tela de conferência antes de inserir no SIAGE:
        </p>

        <button id="ps-fill-diary" class="ps-action-btn primary">
          🚀 Registrar Aulas Pendentes (Excel)
        </button>
      </div>
 
      <div class="ps-card" style="margin-top: 10px; border-left: 3px solid #38bdf8; background: rgba(56, 189, 248, 0.05);">
        <h4 style="margin-bottom: 6px; color: #38bdf8; font-size: 13px;">⚡ Fazer Chamada / Frequência</h4>
        <p style="font-size: 11px; color: #a1a1aa; margin-bottom: 12px; line-height: 1.4;">
          Lance a frequência dos alunos, edite os tempos de aula (ex: 3º ou 6º/7º) e filtre por dia da semana direto nesta tela:
        </p>

        <button id="ps-open-attendance-modal" class="ps-action-btn" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); border-color: rgba(56, 189, 248, 0.4); color: #fff; font-weight: 700;">
          📋 Abrir Chamada da Turma
        </button>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #ps-floating-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      background: linear-gradient(135deg, #09090b 0%, #18181b 100%);
      color: #f4f4f5;
      padding: 10px 16px;
      border-radius: 30px;
      border: 1px solid rgba(52, 211, 153, 0.4);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(52, 211, 153, 0.2);
      cursor: pointer;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 700;
      transition: all 0.25s ease;
      user-select: none;
    }

    #ps-floating-widget:hover {
      transform: translateY(-2px) scale(1.03);
      border-color: #34d399;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5), 0 0 20px rgba(52, 211, 153, 0.35);
    }

    .ps-btn-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ps-sparkle {
      font-size: 15px;
    }

    #ps-floating-drawer {
      position: fixed;
      top: 0;
      right: -360px;
      width: 340px;
      height: 100vh;
      background: #09090b;
      color: #f4f4f5;
      box-shadow: -8px 0 32px rgba(0, 0, 0, 0.6);
      z-index: 9999999;
      transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      font-family: system-ui, -apple-system, sans-serif;
      border-left: 1px solid #27272a;
    }

    #ps-floating-drawer.open {
      right: 0;
    }

    .ps-drawer-header {
      padding: 16px;
      background: #18181b;
      border-bottom: 1px solid #27272a;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .ps-icon {
      width: 28px;
      height: 28px;
      background: #34d399;
      color: #000;
      font-weight: 800;
      font-size: 13px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ps-close-btn {
      background: transparent;
      border: none;
      color: #a1a1aa;
      font-size: 22px;
      cursor: pointer;
      line-height: 1;
    }

    .ps-close-btn:hover {
      color: #fff;
    }

    .ps-drawer-body {
      padding: 16px;
      flex: 1;
      overflow-y: auto;
    }

    .ps-card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 10px;
      padding: 12px;
    }

    .ps-action-btn {
      width: 100%;
      padding: 10px;
      border-radius: 6px;
      border: none;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .ps-action-btn.primary {
      background: #34d399;
      color: #000;
    }

    .ps-action-btn.primary:hover {
      background: #10b981;
    }

    .ps-action-btn.secondary {
      background: #27272a;
      color: #f4f4f5;
      border: 1px solid #3f3f46;
    }

    .ps-action-btn.secondary:hover {
      background: #3f3f46;
    }

    .ps-textarea {
      width: 100%;
      height: 70px;
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 6px;
      padding: 8px;
      color: #fff;
      font-size: 12px;
      box-sizing: border-box;
      resize: vertical;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(widgetBtn);
  document.body.appendChild(drawer);

  const updateDrawerTitle = () => {
    const classInfo = getSiageActiveTurmaInfo();
    const helpCardTitle = drawer.querySelector('.ps-card h4');
    const helpCardDesc = drawer.querySelector('.ps-card p');
    if (helpCardTitle) {
      helpCardTitle.textContent = `📚 Turma: ${classInfo.label}`;
    }
    if (helpCardDesc && typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['savedSheets'], res => {
        const savedSheets = res.savedSheets || [];
        const matched = findMatchingSheet(savedSheets, classInfo);
        if (matched) {
          helpCardDesc.innerHTML = `Componente: <strong style="color: #34d399;">${classInfo.disciplina || 'Identificado'}</strong><br/>Aba Excel casada: <strong style="color: #38bdf8;">"${matched.sheetName}"</strong> (${matched.lessons?.length || 0} aulas)`;
        } else {
          helpCardDesc.textContent = `Componente: ${classInfo.disciplina || 'Não detectado'}`;
        }
      });
    }
  };

  widgetBtn.addEventListener('click', () => {
    drawer.classList.toggle('open');
    updateDrawerTitle();
  });

  document.getElementById('ps-close-drawer')?.addEventListener('click', () => {
    drawer.classList.remove('open');
  });

  document.getElementById('ps-fill-diary')?.addEventListener('click', () => {
    batchRegisterPendingLessonsViaApi([]);
  });

  document.getElementById('ps-open-attendance-modal')?.addEventListener('click', () => {
    drawer.classList.remove('open');
    showInPageAttendanceModal();
  });
}

/**
 * Modal in-page completo para lançamento de chamada diretamente na tela do SIAGE
 */
async function showInPageAttendanceModal() {
  const session = getSiageSessionFromStorage();
  if (!session) {
    showToast('⚠️ Sessão do SIAGE não encontrada. Recarregue a página (F5).', 'error');
    return;
  }

  showToast('⏳ Carregando dados de chamada da turma...', 'info');

  const classInfo = getSiageActiveTurmaInfo();
  const urlMatch = window.location.pathname.match(/\/turma\/([a-f0-9\-]+)/i);
  const formacaoTurmaId = urlMatch ? urlMatch[1] : (session.dadosAlocacao?.formacaoTurmaId || '');
  const compId = session.dadosAlocacao?.componenteCurricularTabComponenteCurricularLocalId ||
    session.dadosAlocacao?.curriculoComponenteCurricularId ||
    'a5aad79d-cecd-4b43-8c2a-89fe92a778e2';
  const matrizBncc = session.dadosAlocacao?.curriculoMatrizCurricularBnccComponenteCurricularId || null;
  const matrizItin = session.dadosAlocacao?.curriculoMatrizItinerarioComponenteCurricularId || null;

  let students: any[] = [];
  let registeredLessons: string[] = [];
  let history: any[] = [];

  try {
    const [fetchedStudents, lessonsResult, fetchedHistory] = await Promise.all([
      fetchClassStudentsFromSiage(formacaoTurmaId, compId),
      fetchRegisteredLessons(session, formacaoTurmaId, compId),
      fetchClassAttendanceHistory(session, formacaoTurmaId, compId),
    ]);
    students = fetchedStudents.map(s => ({ ...s, present: true }));
    history = fetchedHistory || [];
    registeredLessons = Array.from(new Set(
      Array.from(lessonsResult.dates)
        .filter((d: string) => d && d.length >= 8)
        .map((d: string) => {
          if (d.includes('/')) {
            const parts = d.split('/');
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          return d.slice(0, 10);
        })
    )).sort((a, b) => b.localeCompare(a));
  } catch (err: any) {
    showToast(`⚠️ Erro ao carregar dados: ${err.message || ''}`, 'error');
    return;
  }

  if (students.length === 0) {
    showToast('⚠️ Nenhum aluno encontrado para esta turma.', 'error');
    return;
  }

  let selectedTempos: string[] = history[0]?.tempos?.length ? normalizeTemposList(history[0].tempos) : ['TEMPO_3'];
  let weekdayFilter: 'ALL' | 'PENDING' | number = 'ALL';
  let callMode: 'single' | 'batch' = 'single';
  let batchSelectedDates: string[] = [];
  let selectedDate = registeredLessons[0] || '';

  const existingOverlay = document.getElementById('ps-inpage-attendance-overlay');
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = 'ps-inpage-attendance-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.78);
    backdrop-filter: blur(6px);
    z-index: 99999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  const renderModalContent = () => {
    const filtered = registeredLessons.filter(dateStr => {
      if (weekdayFilter === 'ALL') return true;
      if (weekdayFilter === 'PENDING') {
        return !history.some(h => h.data?.startsWith(dateStr));
      }
      const wIdx = getWeekdayIndex(dateStr);
      return wIdx === weekdayFilter;
    });

    if (callMode === 'single' && !filtered.includes(selectedDate) && filtered.length > 0) {
      selectedDate = filtered[0];
    }

    const absencesCount = students.filter(s => !s.present).length;
    const presentCount = students.length - absencesCount;
    const existingRec = history.find(h => h.data?.startsWith(selectedDate));

    overlay.innerHTML = `
      <div style="
        width: 560px;
        max-width: 92vw;
        max-height: 88vh;
        background: #09090b;
        border: 1px solid #27272a;
        border-radius: 14px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 24px rgba(56, 189, 248, 0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      ">
        <!-- Header -->
        <div style="
          padding: 14px 18px;
          background: #18181b;
          border-bottom: 1px solid #27272a;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 8px;
              background: rgba(56, 189, 248, 0.15);
              border: 1px solid rgba(56, 189, 248, 0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
            ">📋</div>
            <div>
              <h3 style="margin: 0; font-size: 14px; font-weight: 700; color: #f4f4f5;">
                Frequência & Chamada Oficial
              </h3>
              <span style="font-size: 11px; color: #38bdf8; font-weight: 600;">
                ${classInfo.label} • ${students.length} Alunos
              </span>
            </div>
          </div>
          <button id="ps-inpage-att-close" style="
            background: transparent;
            border: none;
            color: #a1a1aa;
            font-size: 22px;
            cursor: pointer;
            line-height: 1;
          ">&times;</button>
        </div>

        <!-- Body -->
        <div style="padding: 14px 18px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; background: #09090b;">
          
          <!-- Seletor de Tempos de Aula -->
          <div style="background: #141416; padding: 10px; border-radius: 8px; border: 1px solid #27272a;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; color: #a1a1aa; font-weight: 600;">
                ⏱️ Tempos de Aula: <strong style="color: #34d399;">${formatTemposLabel(selectedTempos)}</strong>
              </span>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px;">
              ${TEMPO_OPTIONS.map(opt => {
                const isSel = selectedTempos.includes(opt.id);
                return `
                  <button type="button" class="ps-tempo-chip" data-id="${opt.id}" style="
                    padding: 3px 8px;
                    font-size: 11px;
                    font-weight: 700;
                    border-radius: 4px;
                    border: ${isSel ? '1px solid #34d399' : '1px solid #27272a'};
                    background: ${isSel ? 'rgba(52, 211, 153, 0.2)' : '#18181b'};
                    color: ${isSel ? '#34d399' : '#a1a1aa'};
                    cursor: pointer;
                  ">${opt.short}</button>
                `;
              }).join('')}
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
              <span style="font-size: 10px; color: #71717a;">Atalhos:</span>
              <button type="button" class="ps-tempo-preset" data-preset="3" style="padding: 2px 6px; font-size: 10px; border-radius: 3px; border: 1px solid #27272a; background: #18181b; color: #a1a1aa; cursor: pointer;">3º Tempo</button>
              <button type="button" class="ps-tempo-preset" data-preset="6-7" style="padding: 2px 6px; font-size: 10px; border-radius: 3px; border: 1px solid #27272a; background: #18181b; color: #a1a1aa; cursor: pointer;">6º e 7º</button>
              <button type="button" class="ps-tempo-preset" data-preset="1-2" style="padding: 2px 6px; font-size: 10px; border-radius: 3px; border: 1px solid #27272a; background: #18181b; color: #a1a1aa; cursor: pointer;">1º e 2º</button>
              <button type="button" class="ps-tempo-preset" data-preset="4-5" style="padding: 2px 6px; font-size: 10px; border-radius: 3px; border: 1px solid #27272a; background: #18181b; color: #a1a1aa; cursor: pointer;">4º e 5º</button>
            </div>
          </div>

          <!-- Filtro Dia da Semana e Modo -->
          <div style="background: #141416; padding: 10px; border-radius: 8px; border: 1px solid #27272a;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; color: #a1a1aa; font-weight: 600;">
                📅 Filtrar Dia da Semana:
              </span>
              <div style="display: flex; gap: 4px;">
                <button type="button" id="ps-inpage-mode-single" style="
                  padding: 2px 7px;
                  font-size: 10px;
                  border-radius: 4px;
                  border: ${callMode === 'single' ? '1px solid #34d399' : '1px solid #27272a'};
                  background: ${callMode === 'single' ? 'rgba(52, 211, 153, 0.15)' : '#18181b'};
                  color: ${callMode === 'single' ? '#34d399' : '#71717a'};
                  cursor: pointer;
                  font-weight: 600;
                ">🎯 Individual</button>
                <button type="button" id="ps-inpage-mode-batch" style="
                  padding: 2px 7px;
                  font-size: 10px;
                  border-radius: 4px;
                  border: ${callMode === 'batch' ? '1px solid #38bdf8' : '1px solid #27272a'};
                  background: ${callMode === 'batch' ? 'rgba(56, 189, 248, 0.15)' : '#18181b'};
                  color: ${callMode === 'batch' ? '#38bdf8' : '#71717a'};
                  cursor: pointer;
                  font-weight: 600;
                ">⚡ Lote</button>
              </div>
            </div>

            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              ${[
                { id: 'ALL', label: 'Todas' },
                { id: 'PENDING', label: 'Pendentes' },
                { id: '2', label: 'Terças' },
                { id: '3', label: 'Quartas' },
                { id: '4', label: 'Quintas' },
                { id: '5', label: 'Sextas' },
                { id: '1', label: 'Segundas' },
              ].map(f => {
                const isAct = String(weekdayFilter) === f.id;
                return `
                  <button type="button" class="ps-inpage-weekday-btn" data-wid="${f.id}" style="
                    padding: 3px 7px;
                    font-size: 10px;
                    font-weight: 600;
                    border-radius: 4px;
                    border: ${isAct ? '1px solid #38bdf8' : '1px solid #27272a'};
                    background: ${isAct ? 'rgba(56, 189, 248, 0.2)' : '#141416'};
                    color: ${isAct ? '#38bdf8' : '#a1a1aa'};
                    cursor: pointer;
                  ">${f.label}</button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Datas -->
          ${callMode === 'single' ? `
            <div style="background: #141416; padding: 10px; border-radius: 8px; border: 1px solid #27272a;">
              <label style="font-size: 11px; color: #a1a1aa; font-weight: 600; display: block; margin-bottom: 4px;">
                📅 Aula Vinculada do Diário:
              </label>
              ${filtered.length > 0 ? `
                <select id="ps-inpage-date-select" style="
                  width: 100%;
                  background: #09090b;
                  color: #f4f4f5;
                  border: 1px solid #27272a;
                  border-radius: 6px;
                  padding: 7px 10px;
                  font-size: 12px;
                  outline: none;
                ">
                  ${filtered.map(d => {
                    const isReg = history.some(h => h.data?.startsWith(d));
                    return `<option value="${d}" ${d === selectedDate ? 'selected' : ''}>📅 ${formatLessonDateWithWeekday(d)} ${isReg ? '• (Chamada Existente)' : '• (Pendente)'}</option>`;
                  }).join('')}
                </select>
              ` : `
                <span style="font-size: 11px; color: #eab308;">Nenhuma aula encontrada para o filtro.</span>
              `}

              ${selectedDate ? `
                <div style="margin-top: 6px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="
                    font-size: 10px;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-weight: 700;
                    background: ${existingRec ? 'rgba(56, 189, 248, 0.15)' : 'rgba(52, 211, 153, 0.15)'};
                    color: ${existingRec ? '#38bdf8' : '#34d399'};
                    border: 1px solid ${existingRec ? 'rgba(56, 189, 248, 0.3)' : 'rgba(52, 211, 153, 0.3)'};
                  ">
                    ${existingRec ? `🔄 Modo Correção (${existingRec.presenca}% presença)` : '⚡ Nova Chamada'}
                  </span>
                  <span style="font-size: 11px; font-weight: 700; color: ${absencesCount > 0 ? '#ef4444' : '#34d399'};">
                    ${presentCount} Presente(s) • ${absencesCount} Falta(s)
                  </span>
                </div>
              ` : ''}
            </div>
          ` : `
            <div style="background: #141416; padding: 10px; border-radius: 8px; border: 1px solid #27272a;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 11px; color: #a1a1aa; font-weight: 600;">
                  Selecione as datas para enviar (${batchSelectedDates.length} selecionada(s)):
                </span>
                <div style="display: flex; gap: 6px;">
                  <button type="button" id="ps-inpage-batch-all" style="font-size: 10px; padding: 2px 6px; background: #27272a; border: none; color: #34d399; border-radius: 3px; cursor: pointer;">Marcar Todas</button>
                  <button type="button" id="ps-inpage-batch-clear" style="font-size: 10px; padding: 2px 6px; background: #27272a; border: none; color: #a1a1aa; border-radius: 3px; cursor: pointer;">Limpar</button>
                </div>
              </div>
              <div style="max-height: 120px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">
                ${filtered.map(d => {
                  const isSel = batchSelectedDates.includes(d);
                  const isReg = history.some(h => h.data?.startsWith(d));
                  return `
                    <label style="
                      display: flex;
                      align-items: center;
                      gap: 8px;
                      padding: 5px 8px;
                      border-radius: 4px;
                      background: ${isSel ? 'rgba(56, 189, 248, 0.12)' : '#18181b'};
                      border: 1px solid ${isSel ? 'rgba(56, 189, 248, 0.3)' : '#27272a'};
                      font-size: 11px;
                      cursor: pointer;
                      color: ${isSel ? '#f4f4f5' : '#a1a1aa'};
                    ">
                      <input type="checkbox" class="ps-inpage-batch-check" data-date="${d}" ${isSel ? 'checked' : ''} />
                      <span style="font-weight: 600;">📅 ${formatLessonDateWithWeekday(d)}</span>
                      <span style="font-size: 10px; color: ${isReg ? '#38bdf8' : '#eab308'}; margin-left: auto;">
                        ${isReg ? 'Existente' : 'Pendente'}
                      </span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          `}

          <!-- Alunos -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
            <span style="font-size: 11px; color: #a1a1aa; font-weight: 600;">
              Alunos (${students.length}):
            </span>
            <button type="button" id="ps-inpage-all-present" style="
              font-size: 10px;
              padding: 2px 6px;
              background: #27272a;
              border: none;
              color: #34d399;
              border-radius: 3px;
              cursor: pointer;
            ">✅ Marcar Todos Presentes</button>
          </div>

          <div style="
            display: flex;
            flex-direction: column;
            gap: 6px;
            max-height: 170px;
            overflow-y: auto;
            padding-right: 2px;
          ">
            ${students.map((st, i) => `
              <div class="ps-inpage-student-row" data-idx="${i}" style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 7px 10px;
                border-radius: 6px;
                background: ${st.present ? 'rgba(255,255,255,0.03)' : 'rgba(239, 68, 68, 0.15)'};
                border: 1px solid ${st.present ? '#27272a' : 'rgba(239, 68, 68, 0.4)'};
                cursor: pointer;
              ">
                <span style="
                  font-size: 11px;
                  color: ${st.present ? '#f4f4f5' : '#fca5a5'};
                  font-weight: ${st.present ? '500' : '700'};
                  text-transform: uppercase;
                  max-width: 320px;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">${st.name}</span>
                <span style="
                  font-size: 10px;
                  font-weight: 700;
                  padding: 2px 6px;
                  border-radius: 4px;
                  background: ${st.present ? '#059669' : '#dc2626'};
                  color: #fff;
                ">${st.present ? 'PRESENTE' : 'FALTOU'}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Footer -->
        <div id="ps-inpage-footer" style="
          padding: 12px 18px;
          background: #18181b;
          border-top: 1px solid #27272a;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        ">
          <button id="ps-inpage-cancel-btn" style="
            padding: 8px 14px;
            border-radius: 6px;
            background: #27272a;
            color: #f4f4f5;
            border: 1px solid #3f3f46;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
          ">Fechar</button>

          ${callMode === 'single' ? `
            <button id="ps-inpage-submit-single" style="
              padding: 8px 18px;
              border-radius: 6px;
              background: #34d399;
              color: #09090b;
              border: none;
              font-size: 12px;
              font-weight: 700;
              cursor: pointer;
            ">🚀 ${existingRec ? 'Atualizar Frequência' : 'Lançar Frequência'} (${formatTemposLabel(selectedTempos)})</button>
          ` : `
            <button id="ps-inpage-submit-batch" style="
              padding: 8px 18px;
              border-radius: 6px;
              background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
              color: #fff;
              border: none;
              font-size: 12px;
              font-weight: 700;
              cursor: pointer;
            ">🚀 Gravar Chamada em ${batchSelectedDates.length} Datas (${formatTemposLabel(selectedTempos)})</button>
          `}
        </div>
      </div>
    `;

    // Bind event handlers
    overlay.querySelector('#ps-inpage-att-close')?.addEventListener('click', () => overlay.remove());
    overlay.querySelector('#ps-inpage-cancel-btn')?.addEventListener('click', () => overlay.remove());

    // Chips de tempo
    overlay.querySelectorAll('.ps-tempo-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const tid = btn.getAttribute('data-id')!;
        if (selectedTempos.includes(tid)) {
          selectedTempos = selectedTempos.filter(t => t !== tid);
        } else {
          selectedTempos = [...selectedTempos, tid].sort();
        }
        renderModalContent();
      });
    });

    // Presets de tempo
    overlay.querySelectorAll('.ps-tempo-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const pr = btn.getAttribute('data-preset');
        if (pr === '3') selectedTempos = ['TEMPO_3'];
        else if (pr === '6-7') selectedTempos = ['TEMPO_6', 'TEMPO_7'];
        else if (pr === '1-2') selectedTempos = ['TEMPO_1', 'TEMPO_2'];
        else if (pr === '4-5') selectedTempos = ['TEMPO_4', 'TEMPO_5'];
        renderModalContent();
      });
    });

    // Modo Single vs Batch
    overlay.querySelector('#ps-inpage-mode-single')?.addEventListener('click', () => {
      callMode = 'single';
      renderModalContent();
    });
    overlay.querySelector('#ps-inpage-mode-batch')?.addEventListener('click', () => {
      callMode = 'batch';
      renderModalContent();
    });

    // Filtros de dia da semana
    overlay.querySelectorAll('.ps-inpage-weekday-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const wid = btn.getAttribute('data-wid')!;
        if (wid === 'ALL' || wid === 'PENDING') {
          weekdayFilter = wid;
        } else {
          weekdayFilter = parseInt(wid, 10);
        }
        renderModalContent();
      });
    });

    // Single select
    const dateSel = overlay.querySelector<HTMLSelectElement>('#ps-inpage-date-select');
    if (dateSel) {
      dateSel.addEventListener('change', () => {
        selectedDate = dateSel.value;
        const match = history.find(h => h.data?.startsWith(selectedDate));
        if (match?.tempos?.length) selectedTempos = normalizeTemposList(match.tempos);
        renderModalContent();
      });
    }

    // Batch checks
    overlay.querySelectorAll<HTMLInputElement>('.ps-inpage-batch-check').forEach(chk => {
      chk.addEventListener('change', () => {
        const d = chk.getAttribute('data-date')!;
        if (chk.checked) {
          if (!batchSelectedDates.includes(d)) batchSelectedDates.push(d);
        } else {
          batchSelectedDates = batchSelectedDates.filter(x => x !== d);
        }
        renderModalContent();
      });
    });

    overlay.querySelector('#ps-inpage-batch-all')?.addEventListener('click', () => {
      batchSelectedDates = [...filtered];
      renderModalContent();
    });

    overlay.querySelector('#ps-inpage-batch-clear')?.addEventListener('click', () => {
      batchSelectedDates = [];
      renderModalContent();
    });

    // Marcar todos presentes
    overlay.querySelector('#ps-inpage-all-present')?.addEventListener('click', () => {
      students.forEach(s => s.present = true);
      renderModalContent();
    });

    // Alternar aluno
    overlay.querySelectorAll('.ps-inpage-student-row').forEach(row => {
      row.addEventListener('click', () => {
        const idx = parseInt(row.getAttribute('data-idx') || '0', 10);
        students[idx].present = !students[idx].present;
        renderModalContent();
      });
    });

    // Submit single
    overlay.querySelector('#ps-inpage-submit-single')?.addEventListener('click', async () => {
      if (selectedTempos.length === 0) {
        alert('Selecione ao menos um tempo de aula.');
        return;
      }
      if (!selectedDate) {
        alert('Selecione uma data para lançar a frequência.');
        return;
      }

      const footer = overlay.querySelector('#ps-inpage-footer');
      if (footer) footer.innerHTML = '<span style="font-size: 12px; color: #34d399;">⏳ Gravando frequência no SIAGE...</span>';

      const payload = {
        id: existingRec?.id,
        formacaoTurmaId,
        componenteCurricularId: compId,
        matrizCurricularBnccComponenteId: matrizBncc,
        matrizItinerarioComponenteId: matrizItin,
        dataAula: selectedDate,
        periodo: existingRec?.periodo || 'PERIODO_4',
        tempos: normalizeTemposList(selectedTempos),
        students: students.map(s => ({
          formacaoTurmaAlunoId: s.id,
          matriculaAvulsaId: s.matriculaAvulsaId,
          nomeAluno: s.name,
          matricula: s.enrollmentNumber || '',
          present: s.present,
        })),
      };

      const res = await saveAttendanceViaApi(session, payload);
      if (res.success) {
        showToast(`✅ Frequência de ${formatLessonDateWithWeekday(selectedDate)} salva com sucesso!`, 'success');
        overlay.remove();
      } else {
        showToast(`⚠️ Falha ao salvar frequência: ${res.error || ''}`, 'error');
        renderModalContent();
      }
    });

    // Submit batch
    overlay.querySelector('#ps-inpage-submit-batch')?.addEventListener('click', async () => {
      if (batchSelectedDates.length === 0) {
        alert('Selecione ao menos uma data.');
        return;
      }
      if (selectedTempos.length === 0) {
        alert('Selecione ao menos um tempo de aula.');
        return;
      }

      if (!window.confirm(`Deseja gravar a frequência para as ${batchSelectedDates.length} datas selecionadas com ${formatTemposLabel(selectedTempos)}?`)) {
        return;
      }

      const footer = overlay.querySelector('#ps-inpage-footer');
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < batchSelectedDates.length; i++) {
        const d = batchSelectedDates[i];
        if (footer) {
          footer.innerHTML = `<span style="font-size: 12px; color: #38bdf8;">⏳ [${i + 1}/${batchSelectedDates.length}] Gravando data ${formatLessonDateWithWeekday(d)}...</span>`;
        }

        const rec = history.find(h => h.data?.startsWith(d));
        const payload = {
          id: rec?.id,
          formacaoTurmaId,
          componenteCurricularId: compId,
          matrizCurricularBnccComponenteId: matrizBncc,
          matrizItinerarioComponenteId: matrizItin,
          dataAula: d,
          periodo: rec?.periodo || 'PERIODO_4',
          tempos: normalizeTemposList(selectedTempos),
          students: students.map(s => ({
            formacaoTurmaAlunoId: s.id,
            matriculaAvulsaId: s.matriculaAvulsaId,
            nomeAluno: s.name,
            matricula: s.enrollmentNumber || '',
            present: s.present,
          })),
        };

        const res = await saveAttendanceViaApi(session, payload);
        if (res.success) successCount++;
        else failCount++;
      }

      showToast(`🎉 Lote concluído! ${successCount} data(s) salva(s)${failCount > 0 ? `, ${failCount} com falha` : ''}`, 'success');
      overlay.remove();
    });
  };

  renderModalContent();
  document.body.appendChild(overlay);
}

function setupPasswordModalAutofill() {
  let isProcessingModal = false;

  const checkPasswordModal = () => {
    if (isProcessingModal) return;

    const passwordInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="password"]')).filter(
      p => p.offsetParent !== null
    );

    if (passwordInputs.length > 0 && typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.storage?.local) {
      isProcessingModal = true;
      try {
        chrome.storage.local.get(['siagePassword'], (result) => {
          const savedPass = result.siagePassword;
          if (savedPass && passwordInputs[0] && !passwordInputs[0].value) {
            injectValueToElement(passwordInputs[0], savedPass);
            showToast('🔑 Senha de confirmação preenchida automaticamente!', 'info');

            setTimeout(() => {
              const modal = passwordInputs[0].closest(
                '.mat-dialog-container, .cdk-overlay-pane, .modal, div[role="dialog"], mat-dialog-container'
              );
              if (modal) {
                const confirmBtn = modal.querySelector<HTMLButtonElement>(
                  'button[type="submit"], button.mat-primary, button.mat-raised-button, button.ui-btn-primary'
                );
                if (confirmBtn && !confirmBtn.disabled) {
                  confirmBtn.click();
                  showToast('🚀 Registro confirmado e salvo no SIAGE!', 'success');
                }
              }
              isProcessingModal = false;
            }, 450);
          } else {
            isProcessingModal = false;
          }
        });
      } catch (e) {
        isProcessingModal = false;
      }
    }
  };

  const observer = new MutationObserver(() => {
    checkPasswordModal();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
