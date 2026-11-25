/**
 * Módulo de Integração com o iEscolar Online de Marizópolis
 * Sistema: PrimeFaces 11 (JSF) - https://marizopolis.iescolaronline.com.br/
 *
 * Escopo:
 * - Leitura e agrupamento de aulas da planilha anual até a data de hoje (horário local de Marizópolis).
 * - Tratamento de aulas geminadas (mesma data -> quantidade 2 e unificação de conteúdos).
 * - Identificação do diário aberto (Escola Batista, turma, turno e disciplina).
 * - Interface de prévia anual categorizada (prontas, registradas, indisponíveis, quantidade incompatível e conferência).
 * - Preenchimento assistido de uma data por vez para revisão e gravação manual pelo professor.
 */

import type { ParsedLessonRow, ParsedWorkbookSheet } from './excel-parser';

export interface IescolarDiaryInfo {
  escola?: string;
  turma?: string;
  turno?: string;
  disciplina?: string;
  anoLetivo?: string;
  label: string;
}

export type IescolarPreviewStatus =
  | 'pronta'
  | 'registrada'
  | 'indisponivel'
  | 'quantidade_incompativel'
  | 'conferencia';

export interface IescolarPreviewGroup {
  date: string; // DD/MM/AAAA
  isoDate: string; // YYYY-MM-DD
  lessons: ParsedLessonRow[];
  quantity: number;
  combinedTopic: string;
  combinedMethodology?: string;
  combinedObservations?: string;
  combinedBncc?: string;
  combinedRecursos?: string;
  status: IescolarPreviewStatus;
  statusReason: string;
  unmappedFields: string[];
}

/**
 * Retorna a data atual no fuso horário local de Marizópolis (America/Fortaleza - UTC-3)
 * zerada em 00:00:00 para comparações de corte.
 */
export function getMarizopolisCurrentDate(): Date {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Fortaleza',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.format(now).split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  } catch {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
}

/**
 * Converte data DD/MM/AAAA ou YYYY-MM-DD para objeto Date em meia-noite local
 */
export function parseDateToMidnight(dateStr: string): Date | null {
  if (!dateStr) return null;
  const str = dateStr.trim();

  // DD/MM/AAAA
  const brMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (brMatch) {
    const d = parseInt(brMatch[1], 10);
    const m = parseInt(brMatch[2], 10) - 1;
    const y = parseInt(brMatch[3], 10);
    return new Date(y, m, d);
  }

  // YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    return new Date(y, m, d);
  }

  return null;
}

/**
 * Normaliza textos para comparação flexível (minúsculas, sem acentos e sem pontuação)
 */
export function normalizeText(str: string): string {
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
 * Detecta o diário aberto na tela do iEscolar
 * (Procura Escola Batista, turma, turno e disciplina nos cabeçalhos, painéis e breadcrumbs)
 */
export function detectIescolarDiaryInfo(): IescolarDiaryInfo {
  let escola = '';
  let turma = '';
  let turno = '';
  let disciplina = '';

  const scopeClone = document.body.cloneNode(true) as HTMLElement;
  scopeClone.querySelectorAll('script, style, noscript').forEach(el => el.remove());

  const fullText = scopeClone.innerText || scopeClone.textContent || '';
  const headers = Array.from(
    scopeClone.querySelectorAll('h1, h2, h3, h4, h5, .ui-panel-title, .ui-card-title, .breadcrumb, .ui-breadcrumb, .page-title, th')
  ).map(e => (e.textContent || '').trim()).join(' • ');

  // 1. Escola (ex: Escola Batista, Escola Municipal Batista, etc.)
  const escolaMatch = fullText.match(/(?:Escola\s*(?:Municipal)?\s*Batista|Escola\s*[^•\n\r,]+)/i);
  if (escolaMatch) {
    escola = escolaMatch[0].trim();
  }

  // 2. Turma (ex: "6º Ano A", "6º A", "7ª Série B", "1º Ano", "3º Ano")
  const turmaMatch = headers.match(/(\d[ºª°]?\s*(?:Ano|Série|Serie)\s*[A-Z]|\b\d[ºª°]?\s*[A-Z]\b)/i)
    || fullText.match(/(?:Turma|Ano\/Turma)\s*[:\-]?\s*([0-9ºª°\sA-Za-z]+?)(?=\s*(?:Turno|Disciplina|Componente|Matrícula|$|\n|•))/i);
  if (turmaMatch) {
    turma = (turmaMatch[1] || turmaMatch[0]).replace(/\s+/g, ' ').trim();
  }

  // 3. Turno (ex: Manhã, Tarde, Noite, Matutino, Vespertino, Integral)
  const turnoMatch = fullText.match(/(?:Turno\s*[:\-]?\s*)(Manhã|Tarde|Noite|Matutino|Vespertino|Integral)/i)
    || fullText.match(/\b(Manhã|Matutino|Tarde|Vespertino|Integral)\b/i);
  if (turnoMatch) {
    turno = turnoMatch[1] ? turnoMatch[1].trim() : turnoMatch[0].trim();
  }

  // 4. Disciplina / Componente Curricular:
  // Suporte a "Pensamento Computacional", "Informática", "Matemática", etc.
  const discRegex = /(?:Disciplina|Componente\s*Curricular)\s*[:\-]?\s*([^•\n\r\t]+?)(?=\s*(?:Turno|Turma|Professor|Sala|Carga|Horário|$))/i;
  const discMatch = fullText.match(discRegex) || headers.match(discRegex);
  if (discMatch && discMatch[1]) {
    const rawDisc = discMatch[1].replace(/\s+/g, ' ').trim();
    if (rawDisc.length >= 2 && rawDisc.length < 80) {
      disciplina = rawDisc;
    }
  }

  // Fallback por disciplinas conhecidas
  if (!disciplina) {
    const commonDisciplines = [
      'Pensamento Computacional',
      'Informática',
      'Informatica',
      'Matemática',
      'Matematica',
      'Língua Portuguesa',
      'Portugues',
      'Ciências',
      'Historia',
      'Geografia',
      'Artes',
      'Educação Física',
      'Inglês',
      'Ensino Religioso',
      'Robótica',
    ];
    for (const d of commonDisciplines) {
      if (normalizeText(headers).includes(normalizeText(d)) || normalizeText(fullText).includes(normalizeText(d))) {
        disciplina = d;
        break;
      }
    }
  }

  const parts = [disciplina, turma, turno].filter(Boolean);
  const label = parts.length > 0 ? parts.join(' • ') : (escola ? `${escola} • Diário Aberto` : 'Diário iEscolar Aberto');

  return { escola, turma, turno, disciplina, label };
}

/**
 * Associa a aba correta da planilha com o diário aberto no iEscolar
 */
export function findMatchingSheetForIescolar(
  savedSheets: ParsedWorkbookSheet[],
  diaryInfo: IescolarDiaryInfo
): { sheet: ParsedWorkbookSheet | null; isAmbiguous: boolean; score: number } {
  if (!savedSheets || savedSheets.length === 0) {
    return { sheet: null, isAmbiguous: false, score: 0 };
  }

  // Filtra abas auxiliares
  const lessonSheets = savedSheets.filter(s => {
    const n = s.sheetName.toLowerCase();
    return !n.includes('visão') && !n.includes('visao') && !n.includes('horario') && !n.includes('resumo') && s.lessons.length > 0;
  });

  const candidates = lessonSheets.length > 0 ? lessonSheets : savedSheets;
  if (candidates.length === 1) {
    return { sheet: candidates[0], isAmbiguous: false, score: 100 };
  }

  const normTurma = normalizeText(diaryInfo.turma || '');
  const normDisc = normalizeText(diaryInfo.disciplina || '');
  const normTurno = normalizeText(diaryInfo.turno || '');

  const scored = candidates.map(s => {
    let score = 0;
    const combined = normalizeText(`${s.sheetName} ${s.sheetTitle || ''}`);

    // Match de Disciplina
    if (normDisc && combined.includes(normDisc)) {
      score += 150;
    } else if (normDisc) {
      // Tokens da disciplina
      const discWords = normDisc.split(' ').filter(w => w.length > 2);
      for (const w of discWords) {
        if (combined.includes(w)) score += 30;
      }
    }

    // Casamento especial: Informática vs Pensamento Computacional no 2º semestre
    if (
      (normDisc.includes('pensamento') && combined.includes('computacional')) ||
      (normDisc.includes('computacional') && combined.includes('pensamento')) ||
      (normDisc.includes('informatica') && combined.includes('informatica'))
    ) {
      score += 120;
    }

    // Match de Turma
    if (normTurma) {
      const turmaWords = normTurma.split(' ').filter(Boolean);
      for (const tw of turmaWords) {
        if (combined.includes(tw)) score += 40;
      }
    }

    // Match de Turno
    if (normTurno && combined.includes(normTurno)) {
      score += 25;
    }

    return { sheet: s, score };
  }).sort((a, b) => b.score - a.score);

  if (scored.length === 0 || scored[0].score <= 0) {
    return { sheet: candidates[0], isAmbiguous: true, score: 0 };
  }

  const isAmbiguous = scored.length > 1 && (scored[0].score - scored[1].score < 30);
  return { sheet: scored[0].sheet, isAmbiguous, score: scored[0].score };
}

/**
 * Inspeciona o calendário PrimeFaces e tabelas de registros da página
 * para identificar quais datas já possuem aulas gravadas.
 */
export function detectIescolarRegisteredDates(): { dates: Set<string>; uncertainDates: Set<string> } {
  const dates = new Set<string>();
  const uncertainDates = new Set<string>();

  // 1. Calendário PrimeFaces (.ui-datepicker-calendar ou p:calendar inline)
  const calendarCells = document.querySelectorAll<HTMLElement>(
    '.ui-datepicker-calendar td, .p-datepicker-calendar td, table[class*="calendar"] td'
  );

  calendarCells.forEach(cell => {
    const dayLink = cell.querySelector('a, span');
    const dayText = (dayLink?.textContent || cell.textContent || '').trim();
    const dayNum = parseInt(dayText, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) return;

    // Recupera mês e ano do cabeçalho do calendário
    const calContainer = cell.closest('.ui-datepicker, .p-datepicker, .ui-calendar');
    let monthIdx = -1;
    let yearNum = -1;

    if (calContainer) {
      const monthEl = calContainer.querySelector('.ui-datepicker-month, .p-datepicker-month');
      const yearEl = calContainer.querySelector('.ui-datepicker-year, .p-datepicker-year');
      const monthText = normalizeText(monthEl?.textContent || '');
      const yearText = (yearEl?.textContent || '').trim();

      const months = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      monthIdx = months.findIndex(m => monthText.includes(m));
      yearNum = parseInt(yearText, 10);
    }

    // Se não encontrou no header, tenta atributos da célula
    const dataYear = cell.getAttribute('data-year');
    const dataMonth = cell.getAttribute('data-month');
    if (dataYear && dataMonth) {
      yearNum = parseInt(dataYear, 10);
      monthIdx = parseInt(dataMonth, 10);
    }

    if (monthIdx === -1 || isNaN(yearNum)) {
      const today = getMarizopolisCurrentDate();
      yearNum = today.getFullYear();
      monthIdx = today.getMonth();
    }

    const dd = String(dayNum).padStart(2, '0');
    const mm = String(monthIdx + 1).padStart(2, '0');
    const dateFormatted = `${dd}/${mm}/${yearNum}`;

    // Sinais de aula registrada no PrimeFaces:
    // .ui-state-highlight, .has-event, .dia-com-aula, cores de fundo ativas, ícone de check
    const hasHighlightClass = cell.classList.contains('ui-state-highlight') ||
      Boolean(dayLink?.classList.contains('ui-state-highlight')) ||
      cell.classList.contains('has-event') ||
      cell.classList.contains('p-highlight') ||
      Boolean(cell.querySelector('.pi-check, .ui-icon-check, .fa-check, [class*="registrad"]'));

    const styleBg = (cell.getAttribute('style') || '') + (dayLink?.getAttribute('style') || '');
    const hasColorIndicator = styleBg.includes('background') && !styleBg.includes('transparent');

    if (hasHighlightClass || hasColorIndicator) {
      dates.add(dateFormatted);
    } else {
      // Indicadores parciais para conferência (tooltip com texto de aula)
      const titleAttr = (cell.getAttribute('title') || dayLink?.getAttribute('title') || '').toLowerCase();
      if (titleAttr.includes('aula') || titleAttr.includes('registro') || titleAttr.includes('conteudo')) {
        uncertainDates.add(dateFormatted);
      }
    }
  });

  // 2. Tabela de histórico / registros (.ui-datatable)
  const tableRows = document.querySelectorAll('.ui-datatable table tbody tr, .p-datatable tbody tr');
  tableRows.forEach(row => {
    const text = row.textContent || '';
    const dateMatches = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/g);
    if (dateMatches) {
      dateMatches.forEach(dStr => {
        const parts = dStr.split(/[-/.]/);
        const dd = parts[0].padStart(2, '0');
        const mm = parts[1].padStart(2, '0');
        const yyyy = parts[2];
        dates.add(`${dd}/${mm}/${yyyy}`);
      });
    }
  });

  return { dates, uncertainDates };
}

/**
 * Monta a lista estruturada de prévia até a data atual, agrupando por dia
 * e classificando status rigorosamente.
 */
export function buildIescolarPreview(
  sheetLessons: ParsedLessonRow[],
  diaryInfo: IescolarDiaryInfo,
  registeredData: { dates: Set<string>; uncertainDates: Set<string> }
): IescolarPreviewGroup[] {
  const marizopolisToday = getMarizopolisCurrentDate();

  // 1. Agrupar linhas da planilha pela mesma data mantendo a ordem
  const groupsMap = new Map<string, ParsedLessonRow[]>();

  for (const lesson of sheetLessons) {
    if (!lesson.date || !lesson.topic) continue;
    const existing = groupsMap.get(lesson.date) || [];
    existing.push(lesson);
    groupsMap.set(lesson.date, existing);
  }

  const result: IescolarPreviewGroup[] = [];

  for (const [dateStr, lessons] of groupsMap.entries()) {
    const dateObj = parseDateToMidnight(dateStr);
    if (!dateObj) continue;

    // Regra: mantém as aulas futuras na planilha para próxima execução (não entram na prévia de preenchimento)
    if (dateObj > marizopolisToday) {
      continue;
    }

    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const isoDate = `${yyyy}-${mm}-${dd}`;

    const quantity = lessons.length;

    // Unificação de Conteúdos
    const combinedTopic = lessons.length > 1
      ? lessons.map((l, idx) => `Aula ${l.number || idx + 1}: ${l.topic}`).join('\n')
      : lessons[0].topic;

    // Unificação de Metodologias
    const metList = Array.from(new Set(lessons.map(l => l.methodology).filter(Boolean)));
    const combinedMethodology = metList.length > 0 ? metList.join('; ') : undefined;

    // Observações
    const obsList = Array.from(new Set(lessons.map(l => l.observations).filter(Boolean)));
    const combinedObservations = obsList.length > 0 ? obsList.join('; ') : undefined;

    // BNCC opcional
    const bnccList = Array.from(new Set(lessons.map(l => l.bncc).filter(Boolean)));
    const combinedBncc = bnccList.length > 0 ? bnccList.join('; ') : undefined;

    // Recursos Didáticos opcionais
    const recList = Array.from(new Set(lessons.map(l => l.recursosDidaticos).filter(Boolean)));
    const combinedRecursos = recList.length > 0 ? recList.join('; ') : undefined;

    const unmappedFields: string[] = [];

    // Classificação de Status
    let status: IescolarPreviewStatus = 'pronta';
    let statusReason = 'Pronta para preenchimento';

    if (registeredData.dates.has(dateStr)) {
      status = 'registrada';
      statusReason = 'Data já sinalizada como registrada no diário (mantida fora do preenchimento)';
    } else if (registeredData.uncertainDates.has(dateStr)) {
      status = 'conferencia';
      statusReason = 'Possui indício de registro anterior no calendário. Confira antes de preencher';
    } else if (quantity > 4) {
      status = 'quantidade_incompativel';
      statusReason = `Quantidade elevada (${quantity} aulas no mesmo dia). Verifique a planilha`;
    } else {
      // Pronta
      status = 'pronta';
      statusReason = quantity === 2
        ? 'Pronta (Aulas Geminadas: 2 aulas agrupadas para preenchimento)'
        : 'Pronta para preenchimento';
    }

    result.push({
      date: dateStr,
      isoDate,
      lessons,
      quantity,
      combinedTopic,
      combinedMethodology,
      combinedObservations,
      combinedBncc,
      combinedRecursos,
      status,
      statusReason,
      unmappedFields,
    });
  }

  // Ordenação cronológica rigorosa
  return result.sort((a, b) => {
    const da = parseDateToMidnight(a.date)?.getTime() || 0;
    const db = parseDateToMidnight(b.date)?.getTime() || 0;
    return da - db;
  });
}

/**
 * Preenche no formulário do iEscolar rigorosamente UMA ÚNICA DATA por vez.
 * Não aciona o botão salvar: prepara os campos e deixa aberto para conferência do professor.
 */
export async function fillIescolarSingleDate(
  group: IescolarPreviewGroup,
  expectedDiary: IescolarDiaryInfo
): Promise<{ success: boolean; message: string; unmappedWarnings?: string[] }> {
  // 1. Verificação de Sessão Ativa
  if (
    window.location.pathname.includes('/login') ||
    document.querySelector('#formLogin, input[type="password"][id*="login"]')
  ) {
    return {
      success: false,
      message: 'Sessão do iEscolar expirada ou não autenticada. Faça login novamente no portal.',
    };
  }

  // 2. Conferência de Diário e Turma
  const currentDiary = detectIescolarDiaryInfo();
  if (
    expectedDiary.disciplina &&
    currentDiary.disciplina &&
    !normalizeText(currentDiary.disciplina).includes(normalizeText(expectedDiary.disciplina)) &&
    !normalizeText(expectedDiary.disciplina).includes(normalizeText(currentDiary.disciplina))
  ) {
    return {
      success: false,
      message: `Atenção: A disciplina da tela aberta (${currentDiary.disciplina}) difere da selecionada (${expectedDiary.disciplina}). Verifique o diário aberto antes de prosseguir.`,
    };
  }

  const unmappedWarnings: string[] = [];

  // 3. Preenchimento da Data no Calendário / Campo de Data
  const dateInput = document.querySelector<HTMLInputElement>(
    'input.hasDatepicker, input.ui-calendar, input[id*="data"], input[name*="data"], .ui-datepicker input'
  );

  let dateSet = false;
  if (dateInput) {
    injectValue(dateInput, group.date);
    dateSet = true;
    // Aguarda processamento de eventos JSF / PrimeFaces
    await new Promise(r => setTimeout(r, 400));
  } else {
    // Tenta clicar diretamente no dia do calendário inline PrimeFaces
    const dayNum = parseInt(group.date.split('/')[0], 10);
    const dayCells = Array.from(document.querySelectorAll('.ui-datepicker-calendar td a, table[class*="calendar"] td a'));
    const matchedCell = dayCells.find(a => (a.textContent || '').trim() === String(dayNum));
    if (matchedCell) {
      (matchedCell as HTMLElement).click();
      dateSet = true;
      await new Promise(r => setTimeout(r, 600));
    }
  }

  if (!dateSet) {
    return {
      success: false,
      message: 'Controle de calendário ou campo de Data não localizado na tela do diário.',
    };
  }

  // 4. Preenchimento da Quantidade de Aulas (ex: 1, 2 para aulas geminadas)
  const qtySelect = document.querySelector<HTMLSelectElement>(
    'select[id*="quantidade"], select[id*="qtd"], select[name*="quantidade"], select[name*="qtd"], select[id*="aulas"]'
  );

  const pfQtyMenu = document.querySelector<HTMLElement>(
    'div.ui-selectonemenu[id*="quantidade"], div.ui-selectonemenu[id*="qtd"], div.ui-selectonemenu[id*="aulas"]'
  );

  const qtyInput = document.querySelector<HTMLInputElement>(
    'input[id*="quantidade"], input[id*="qtd"], input.ui-spinner-input'
  );

  let qtySet = false;
  if (pfQtyMenu) {
    // PrimeFaces SelectOneMenu
    pfQtyMenu.click();
    await new Promise(r => setTimeout(r, 200));
    const menuId = pfQtyMenu.id;
    const panel = document.getElementById(`${menuId}_panel`) || document.querySelector('.ui-selectonemenu-panel:not([style*="display: none"])');
    if (panel) {
      const items = Array.from(panel.querySelectorAll('li.ui-selectonemenu-item'));
      const targetItem = items.find(li => (li.textContent || '').trim() === String(group.quantity) || (li.textContent || '').includes(`${group.quantity} aula`));
      if (targetItem) {
        (targetItem as HTMLElement).click();
        qtySet = true;
      }
    }
    document.body.click();
  } else if (qtySelect) {
    for (const opt of Array.from(qtySelect.options)) {
      if (opt.value === String(group.quantity) || opt.text.includes(String(group.quantity))) {
        opt.selected = true;
        qtySelect.dispatchEvent(new Event('change', { bubbles: true }));
        qtySet = true;
        break;
      }
    }
  } else if (qtyInput) {
    injectValue(qtyInput, String(group.quantity));
    qtySet = true;
  }

  if (!qtySet && group.quantity > 1) {
    unmappedWarnings.push(`Seletor de quantidade de aulas não foi alterado automaticamente. Verifique se o formulário exige selecionar "${group.quantity} aulas" manualmente.`);
  }

  // 5. Preenchimento do Conteúdo / Objeto de Conhecimento
  let contentSet = false;

  // Caso A: Editor Rico PrimeFaces (p:textEditor / Quill)
  const quillEditor = document.querySelector<HTMLElement>('.ui-texteditor .ql-editor');
  if (quillEditor) {
    quillEditor.innerHTML = `<p>${group.combinedTopic.replace(/\n/g, '<br/>')}</p>`;
    quillEditor.dispatchEvent(new Event('input', { bubbles: true }));
    // Sincroniza com o input hidden do JSF
    const container = quillEditor.closest('.ui-texteditor');
    const hiddenInput = container?.querySelector<HTMLInputElement>('input[type="hidden"]');
    if (hiddenInput) {
      hiddenInput.value = quillEditor.innerHTML;
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    contentSet = true;
  }

  // Caso B: CKEditor (pe:ckEditor)
  const win = window as any;
  if (!contentSet && win.CKEDITOR && win.CKEDITOR.instances) {
    for (const instName of Object.keys(win.CKEDITOR.instances)) {
      if (instName.toLowerCase().includes('conteudo') || instName.toLowerCase().includes('objeto')) {
        win.CKEDITOR.instances[instName].setData(group.combinedTopic.replace(/\n/g, '<br/>'));
        contentSet = true;
        break;
      }
    }
  }

  // Caso C: Textarea nativo ou PrimeFaces (p:inputTextarea)
  if (!contentSet) {
    const textareas = Array.from(document.querySelectorAll<HTMLTextAreaElement>('textarea')).filter(
      t => t.offsetParent !== null
    );

    const targetArea = textareas.find(t => {
      const idOrName = (t.id + ' ' + (t.name || '') + ' ' + (t.getAttribute('placeholder') || '')).toLowerCase();
      return idOrName.includes('conteudo') || idOrName.includes('objeto') || idOrName.includes('descricao') || idOrName.includes('aula');
    }) || textareas[0];

    if (targetArea) {
      injectValue(targetArea, group.combinedTopic);
      contentSet = true;
    }
  }

  if (!contentSet) {
    return {
      success: false,
      message: 'Campo de Conteúdo / Objeto de Conhecimento não localizado no formulário.',
    };
  }

  // 6. Preenchimento de Metodologia (opcional)
  if (group.combinedMethodology) {
    const metArea = document.querySelector<HTMLTextAreaElement | HTMLInputElement>(
      'textarea[id*="metodologia"], textarea[name*="metodologia"], input[id*="metodologia"]'
    );
    if (metArea) {
      injectValue(metArea, group.combinedMethodology);
    } else {
      unmappedWarnings.push('Campo de Metodologia não encontrado como campo de texto livre no formulário.');
    }
  }

  // 7. Recursos Didáticos (opcional)
  if (group.combinedRecursos) {
    const recArea = document.querySelector<HTMLTextAreaElement | HTMLInputElement>(
      'textarea[id*="recurso"], textarea[name*="recurso"], textarea[id*="didatico"], input[id*="recurso"]'
    );
    if (recArea) {
      injectValue(recArea, group.combinedRecursos);
    } else {
      unmappedWarnings.push('Campo de Recursos Didáticos não localizado na tela.');
    }
  }

  // 8. BNCC (opcional)
  if (group.combinedBncc) {
    const bnccArea = document.querySelector<HTMLTextAreaElement | HTMLInputElement>(
      'textarea[id*="bncc"], input[id*="bncc"], [id*="habilidade"] input'
    );
    if (bnccArea) {
      injectValue(bnccArea, group.combinedBncc);
    } else {
      unmappedWarnings.push('Controle de Habilidades BNCC não localizado para preenchimento automático.');
    }
  }

  // Foca no primeiro campo preenchido e destaca visualmente
  const firstField = dateInput || document.querySelector('textarea, .ql-editor');
  if (firstField) {
    (firstField as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
    (firstField as HTMLElement).focus();
  }

  return {
    success: true,
    message: `Campos da aula de ${group.date} preenchidos com sucesso no iEscolar! Revise os dados e acione o botão de Gravação do sistema.`,
    unmappedWarnings,
  };
}

/**
 * Injeta valor em elemento disparando eventos nativos para o JSF / PrimeFaces
 */
function injectValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
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

/**
 * Renderiza o modal completo de prévia e auditoria para o iEscolar
 */
export function showIescolarPreviewModal(
  savedSheets: ParsedWorkbookSheet[],
  onClose?: () => void
) {
  const existing = document.getElementById('ps-iescolar-modal-overlay');
  if (existing) existing.remove();

  const diaryInfo = detectIescolarDiaryInfo();
  const registeredData = detectIescolarRegisteredDates();
  const matchResult = findMatchingSheetForIescolar(savedSheets, diaryInfo);

  let currentSheet = matchResult.sheet;
  let isAmbiguous = matchResult.isAmbiguous;

  const overlay = document.createElement('div');
  overlay.id = 'ps-iescolar-modal-overlay';
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

  const renderModal = () => {
    const previewGroups = currentSheet
      ? buildIescolarPreview(currentSheet.lessons, diaryInfo, registeredData)
      : [];

    const readyCount = previewGroups.filter(g => g.status === 'pronta').length;
    const regCount = previewGroups.filter(g => g.status === 'registrada').length;
    const confCount = previewGroups.filter(g => g.status === 'conferencia').length;

    overlay.innerHTML = `
      <div style="
        width: 620px;
        max-width: 94vw;
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
            ">🎓</div>
            <div>
              <h3 style="margin: 0; font-size: 14px; font-weight: 700; color: #f4f4f5;">
                iEscolar Online — Registro de Aula (Marizópolis)
              </h3>
              <span style="font-size: 11px; color: #38bdf8; font-weight: 600;">
                ${diaryInfo.label}
              </span>
            </div>
          </div>
          <button id="ps-iescolar-btn-close" style="
            background: transparent;
            border: none;
            color: #a1a1aa;
            font-size: 22px;
            cursor: pointer;
            line-height: 1;
          ">&times;</button>
        </div>

        <!-- Body -->
        <div style="padding: 14px 18px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #09090b;">
          
          <!-- Seletor de Aba da Planilha -->
          <div style="background: #141416; padding: 10px; border-radius: 8px; border: 1px solid #27272a;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; color: #a1a1aa; font-weight: 600;">
                📊 Aba da Planilha Vinculada:
              </span>
              <span style="font-size: 11px; color: #34d399; font-weight: 700;">
                ${currentSheet ? `${currentSheet.sheetName} (${currentSheet.lessons.length} aulas)` : 'Nenhuma aba carregada'}
              </span>
            </div>

            ${savedSheets.length > 1 ? `
              <select id="ps-iescolar-sheet-select" style="
                width: 100%;
                background: #09090b;
                color: #f4f4f5;
                border: 1px solid ${isAmbiguous ? '#eab308' : '#3f3f46'};
                border-radius: 6px;
                padding: 6px 10px;
                font-size: 12px;
                outline: none;
                cursor: pointer;
              ">
                ${savedSheets.map(s => `
                  <option value="${s.sheetName}" ${currentSheet && s.sheetName === currentSheet.sheetName ? 'selected' : ''}>
                    ${s.sheetName} (${s.lessons?.length || 0} aulas)
                  </option>
                `).join('')}
              </select>
            ` : ''}

            ${isAmbiguous ? `
              <div style="margin-top: 6px; font-size: 10px; color: #fde047; display: flex; align-items: center; gap: 4px;">
                <span>⚠️</span>
                <span>Mais de uma aba compatível com a disciplina/turma. Por favor, confirme a aba desejada no seletor acima.</span>
              </div>
            ` : ''}
          </div>

          <!-- Resumo de Auditoria -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
            <div style="background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.25); border-radius: 6px; padding: 6px 8px; text-align: center;">
              <span style="font-size: 10px; color: #a1a1aa; display: block;">Prontas p/ Preencher</span>
              <strong style="color: #34d399; font-size: 15px;">${readyCount}</strong>
            </div>
            <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 6px; padding: 6px 8px; text-align: center;">
              <span style="font-size: 10px; color: #a1a1aa; display: block;">Já no Diário</span>
              <strong style="color: #38bdf8; font-size: 15px;">${regCount}</strong>
            </div>
            <div style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.25); border-radius: 6px; padding: 6px 8px; text-align: center;">
              <span style="font-size: 10px; color: #a1a1aa; display: block;">Em Conferência</span>
              <strong style="color: #fde047; font-size: 15px;">${confCount}</strong>
            </div>
          </div>

          <!-- Instruções de Fluxo -->
          <div style="background: rgba(56, 189, 248, 0.06); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 6px; padding: 8px 10px; font-size: 11px; color: #38bdf8; line-height: 1.4;">
            💡 <strong>Fluxo de Preenchimento:</strong> Escolha uma data e clique em <strong>Preencher</strong>. A extensão preencherá os campos na tela do iEscolar e você revisa os dados antes de clicar em Salvar/Gravar.
          </div>

          <!-- Lista de Datas Agrupadas -->
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
            ${previewGroups.length === 0 ? `
              <div style="text-align: center; padding: 30px 10px; color: #a1a1aa; font-size: 12px; background: #141416; border-radius: 8px; border: 1px solid #27272a;">
                <p>Nenhuma aula identificada para preenchimento até a data de hoje.</p>
                <span style="font-size: 10px; color: #71717a;">Datas futuras da planilha são preservadas para as próximas execuções.</span>
              </div>
            ` : previewGroups.map((g, i) => {
              const isReady = g.status === 'pronta';
              const isReg = g.status === 'registrada';
              const isConf = g.status === 'conferencia';

              const badgeColor = isReady ? '#34d399' : isReg ? '#38bdf8' : isConf ? '#fde047' : '#ef4444';
              const badgeBg = isReady ? 'rgba(52, 211, 153, 0.15)' : isReg ? 'rgba(56, 189, 248, 0.15)' : isConf ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)';
              const badgeLabel = isReady ? 'PRONTA' : isReg ? 'JÁ REGISTRADA' : isConf ? 'CONFERÊNCIA' : 'INCOMPATÍVEL';

              return `
                <div style="
                  background: #141416;
                  border: 1px solid #27272a;
                  border-radius: 8px;
                  padding: 10px 12px;
                  display: flex;
                  flex-direction: column;
                  gap: 6px;
                ">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="
                        font-size: 10px;
                        font-weight: 700;
                        padding: 2px 6px;
                        border-radius: 4px;
                        background: ${badgeBg};
                        color: ${badgeColor};
                        border: 1px solid ${badgeColor};
                      ">${badgeLabel}</span>
                      <strong style="color: #f4f4f5; font-size: 12px;">📅 ${g.date}</strong>
                      <span style="
                        font-size: 10px;
                        padding: 1px 6px;
                        border-radius: 3px;
                        background: ${g.quantity > 1 ? 'rgba(168, 85, 247, 0.15)' : '#27272a'};
                        color: ${g.quantity > 1 ? '#c084fc' : '#a1a1aa'};
                        border: 1px solid ${g.quantity > 1 ? 'rgba(168, 85, 247, 0.4)' : '#3f3f46'};
                        font-weight: 600;
                      ">
                        ${g.quantity > 1 ? `⚡ ${g.quantity} Aulas (Geminadas)` : '1 Aula'}
                      </span>
                    </div>

                    ${isReady || isConf ? `
                      <button
                        type="button"
                        class="ps-iescolar-fill-btn"
                        data-idx="${i}"
                        style="
                          padding: 5px 12px;
                          border-radius: 5px;
                          background: #34d399;
                          color: #09090b;
                          border: none;
                          font-size: 11px;
                          font-weight: 700;
                          cursor: pointer;
                          display: flex;
                          align-items: center;
                          gap: 4px;
                          transition: all 0.15s ease;
                        "
                      >
                        ⚡ Preencher
                      </button>
                    ` : `
                      <span style="font-size: 10px; color: #71717a;">Não selecionável</span>
                    `}
                  </div>

                  <!-- Conteúdo Previsto -->
                  <div style="font-size: 11px; color: #e4e4e7; line-height: 1.4; background: #09090b; padding: 6px 8px; border-radius: 4px;">
                    <strong style="color: #a1a1aa;">Conteúdo:</strong> ${g.combinedTopic.replace(/\n/g, ' • ')}
                  </div>

                  ${g.combinedMethodology ? `
                    <div style="font-size: 10px; color: #a1a1aa;">
                      <strong style="color: #71717a;">Metodologia:</strong> ${g.combinedMethodology}
                    </div>
                  ` : ''}

                  <!-- Motivo / Observações -->
                  <div style="font-size: 10px; color: ${isReady ? '#71717a' : badgeColor};">
                    ℹ️ ${g.statusReason}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Footer -->
        <div style="
          padding: 12px 18px;
          background: #18181b;
          border-top: 1px solid #27272a;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span style="font-size: 11px; color: #a1a1aa;">
            Marizópolis — iEscolar Online • Modo Revisão Ativo
          </span>
          <button id="ps-iescolar-btn-footer-close" style="
            padding: 6px 14px;
            border-radius: 6px;
            background: #27272a;
            color: #f4f4f5;
            border: 1px solid #3f3f46;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
          ">
            Fechar Painel
          </button>
        </div>
      </div>
    `;

    // Handlers
    const closeHandler = () => {
      overlay.remove();
      if (onClose) onClose();
    };

    overlay.querySelector('#ps-iescolar-btn-close')?.addEventListener('click', closeHandler);
    overlay.querySelector('#ps-iescolar-btn-footer-close')?.addEventListener('click', closeHandler);

    // Seletor de abas
    const selectEl = overlay.querySelector<HTMLSelectElement>('#ps-iescolar-sheet-select');
    if (selectEl) {
      selectEl.addEventListener('change', () => {
        const found = savedSheets.find(s => s.sheetName === selectEl.value);
        if (found) {
          currentSheet = found;
          isAmbiguous = false;
          renderModal();
        }
      });
    }

    // Botões de Preenchimento Individual
    overlay.querySelectorAll('.ps-iescolar-fill-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.getAttribute('data-idx') || '0', 10);
        const targetGroup = previewGroups[idx];
        if (!targetGroup) return;

        btn.setAttribute('disabled', 'true');
        btn.textContent = '⏳ Preenchendo...';

        const fillRes = await fillIescolarSingleDate(targetGroup, diaryInfo);

        if (fillRes.success) {
          overlay.remove();
          showIescolarToast(fillRes.message, 'success');
          if (fillRes.unmappedWarnings && fillRes.unmappedWarnings.length > 0) {
            setTimeout(() => {
              showIescolarToast(`⚠️ Nota: ${fillRes.unmappedWarnings!.join(' ')}`, 'info');
            }, 1800);
          }
        } else {
          btn.removeAttribute('disabled');
          btn.textContent = '⚡ Preencher';
          showIescolarToast(`⚠️ ${fillRes.message}`, 'error');
        }
      });
    });
  };

  renderModal();
  document.body.appendChild(overlay);
}

/**
 * Toast flutuante de feedback para o iEscolar
 */
export function showIescolarToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const existing = document.getElementById('ps-iescolar-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'ps-iescolar-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 99999999;
    padding: 12px 20px;
    border-radius: 8px;
    background: ${type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#0284c7'};
    color: #ffffff;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    transition: opacity 0.3s ease;
    max-width: 420px;
    line-height: 1.4;
  `;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Injeta o widget flutuante persistente na tela do iEscolar
 */
export function injectIescolarFloatingWidget() {
  if (document.getElementById('ps-iescolar-widget')) return;

  const widgetBtn = document.createElement('div');
  widgetBtn.id = 'ps-iescolar-widget';
  widgetBtn.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 15px;">🎓</span>
      <span>iEscolar Sync</span>
    </div>
  `;

  widgetBtn.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999999;
    background: linear-gradient(135deg, #09090b 0%, #18181b 100%);
    color: #f4f4f5;
    padding: 10px 16px;
    border-radius: 30px;
    border: 1px solid rgba(56, 189, 248, 0.4);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(56, 189, 248, 0.2);
    cursor: pointer;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 700;
    transition: all 0.25s ease;
    user-select: none;
  `;

  widgetBtn.addEventListener('mouseenter', () => {
    widgetBtn.style.transform = 'translateY(-2px) scale(1.03)';
    widgetBtn.style.borderColor = '#38bdf8';
  });

  widgetBtn.addEventListener('mouseleave', () => {
    widgetBtn.style.transform = 'translateY(0) scale(1)';
    widgetBtn.style.borderColor = 'rgba(56, 189, 248, 0.4)';
  });

  widgetBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['savedSheets', 'savedPlan'], res => {
        const sheets: ParsedWorkbookSheet[] = res.savedSheets || [];
        if (sheets.length > 0) {
          showIescolarPreviewModal(sheets);
        } else if (res.savedPlan && res.savedPlan.length > 0) {
          showIescolarPreviewModal([{ sheetName: 'Plano Geral', lessons: res.savedPlan }]);
        } else {
          showIescolarToast('⚠️ Nenhuma planilha encontrada. Abra a extensão no navegador para carregar o seu arquivo Excel.', 'info');
        }
      });
    }
  });

  document.body.appendChild(widgetBtn);
}

