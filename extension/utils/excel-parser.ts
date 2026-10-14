import * as XLSX from 'xlsx';

export interface ParsedLessonRow {
  number?: number;
  date?: string;
  turma?: string;
  topic: string; // Objetos de Conhecimento
  methodology?: string;
  observations?: string;
}

export interface ParsedWorkbookSheet {
  sheetName: string;
  sheetTitle?: string;
  lessons: ParsedLessonRow[];
}

/**
 * Converte qualquer formato bruto de data (Date, número serial do Excel, ISO, PT-BR)
 * para a string estrita DD/MM/AAAA. Retorna undefined se não for uma data válida.
 */
export function formatParsedDate(raw: any): string | undefined {
  if (raw === null || raw === undefined) return undefined;

  // 1. Instância nativa de Date (quando XLSX lê com cellDates: true)
  if (raw instanceof Date || Object.prototype.toString.call(raw) === '[object Date]') {
    const d = raw as Date;
    if (isNaN(d.getTime())) return undefined;
    // Se a hora for 00:00:00 (típico de células Excel), usa UTC para não desviar fuso
    const isMidnight = d.getHours() === 0 && d.getMinutes() === 0;
    const day = isMidnight ? d.getUTCDate() : d.getDate();
    const month = (isMidnight ? d.getUTCMonth() : d.getMonth()) + 1;
    const year = isMidnight ? d.getUTCFullYear() : d.getFullYear();
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }

  // 2. Número serial de data do Excel (ex: 46050 a 46300 para o ano 2026)
  if (typeof raw === 'number' && !isNaN(raw)) {
    if (raw > 20000 && raw < 70000) {
      const d = new Date((raw - 25569) * 86400 * 1000);
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const yyyy = d.getUTCFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
  }

  const str = String(raw).trim();
  if (!str) return undefined;

  // 3. Formato ISO: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const dd = isoMatch[3].padStart(2, '0');
    const mm = isoMatch[2].padStart(2, '0');
    const yyyy = isoMatch[1];
    return `${dd}/${mm}/${yyyy}`;
  }

  // 4. Formato brasileiro: DD/MM/YYYY ou DD-MM-YYYY ou DD/MM/YY
  const brMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (brMatch) {
    let d = parseInt(brMatch[1], 10);
    let m = parseInt(brMatch[2], 10);
    let yyyy = brMatch[3];
    if (yyyy.length === 2) yyyy = '20' + yyyy;

    // Detecção e correção se a planilha tiver sido salva em formato americano MM/DD/YYYY
    if (d <= 12 && m > 12) {
      // Invertido: m é o dia (> 12) e d é o mês
      const temp = d;
      d = m;
      m = temp;
    }

    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${yyyy}`;
    }
  }

  // 5. Formato curto: DD/MM (assume 2026)
  const shortMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})$/);
  if (shortMatch) {
    const dd = shortMatch[1].padStart(2, '0');
    const mm = shortMatch[2].padStart(2, '0');
    return `${dd}/${mm}/2026`;
  }

  // 6. String no formato Date padrão JS (ex: "Wed Aug 05 2026...")
  const timestamp = Date.parse(str);
  if (!isNaN(timestamp)) {
    const parsedD = new Date(timestamp);
    if (parsedD.getFullYear() >= 2020 && parsedD.getFullYear() <= 2035) {
      const dd = String(parsedD.getDate()).padStart(2, '0');
      const mm = String(parsedD.getMonth() + 1).padStart(2, '0');
      const yyyy = parsedD.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
  }

  return undefined;
}

/**
 * Lê um arquivo Excel (.xlsx / .xls) contendo múltiplas abas (worksheets)
 */
export function parseXLSXBuffer(arrayBuffer: ArrayBuffer): ParsedWorkbookSheet[] {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    const result: ParsedWorkbookSheet[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, {
        header: 1,
        raw: false,
        dateNF: 'dd/mm/yyyy',
      });

      if (!rawRows || rawRows.length === 0) continue;

      // 1. Procurar a linha de cabeçalho nos primeiros 15 registros
      let headerIdx = -1;
      for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
        const row = rawRows[i];
        if (!Array.isArray(row)) continue;
        const rowStr = row.map(c => String(c || '').toLowerCase()).join(' ');
        if (
          (rowStr.includes('objeto') || rowStr.includes('conteúdo') || rowStr.includes('conteudo') || rowStr.includes('tema') || rowStr.includes('assunto')) &&
          !rowStr.includes('rascunho')
        ) {
          headerIdx = i;
          break;
        }
        if (
          (rowStr.includes('data') || rowStr.includes('dia')) &&
          (rowStr.includes('metodologia') || rowStr.includes('aula') || rowStr.includes('observa'))
        ) {
          headerIdx = i;
          break;
        }
      }

      if (headerIdx === -1) {
        // Fallback: tentar ler via CSV genérico da aba
        const csvText = XLSX.utils.sheet_to_csv(sheet, { FS: ';' });
        const fallbackLessons = parseCSVorTableText(csvText);
        if (fallbackLessons.length > 0) {
          result.push({ sheetName, lessons: fallbackLessons });
        }
        continue;
      }

      const header = rawRows[headerIdx];
      let dateIdx = -1;
      let topicRealIdx = -1;
      let topicPrevIdx = -1;
      let metRealIdx = -1;
      let metPrevIdx = -1;
      let obsIdx = -1;
      let aulaNumIdx = -1;

      header.forEach((c, idx) => {
        const s = String(c || '').toLowerCase().trim();
        if (
          s.includes('data') ||
          s === 'dia' ||
          s.startsWith('dia ') ||
          s.includes('dt_') ||
          s.includes('dt ') ||
          s.includes('cronograma')
        ) {
          dateIdx = idx;
        } else if (s.includes('aula') || s.includes('nº') || s.includes('número')) {
          aulaNumIdx = idx;
        } else if (s.includes('objeto') && (s.includes('ministrado') || s.includes('real'))) {
          topicRealIdx = idx;
        } else if (s.includes('objeto') && (s.includes('previsto') || s.includes('siage'))) {
          topicPrevIdx = idx;
        } else if (s.includes('objeto') || s.includes('conteúdo') || s.includes('conteudo') || s.includes('tema') || s.includes('assunto')) {
          if (topicPrevIdx === -1) topicPrevIdx = idx;
        } else if (s.includes('metodologia') && (s.includes('realizada') || s.includes('real'))) {
          metRealIdx = idx;
        } else if (s.includes('metodologia') && (s.includes('prevista') || s.includes('siage'))) {
          metPrevIdx = idx;
        } else if (s.includes('metodologia')) {
          if (metPrevIdx === -1) metPrevIdx = idx;
        } else if (s.includes('observa')) {
          obsIdx = idx;
        }
      });

      // Se a coluna de data não foi encontrada pelo nome do cabeçalho, auto-detecta por amostragem de dados
      if (dateIdx === -1 && rawRows.length > headerIdx + 1) {
        const sampleRows = rawRows.slice(headerIdx + 1, Math.min(rawRows.length, headerIdx + 12));
        const maxCols = Math.max(...sampleRows.map(r => (Array.isArray(r) ? r.length : 0)));
        for (let col = 0; col < maxCols; col++) {
          let dateMatchCount = 0;
          let sampleCount = 0;
          for (const row of sampleRows) {
            const cell = row[col];
            if (cell !== undefined && cell !== null && String(cell).trim() !== '') {
              sampleCount++;
              if (formatParsedDate(cell)) dateMatchCount++;
            }
          }
          if (sampleCount > 0 && dateMatchCount / sampleCount >= 0.5) {
            dateIdx = col;
            break;
          }
        }
      }

      // Se o tópico não foi encontrado pelo cabeçalho, pega a coluna de texto mais longo
      if (topicRealIdx === -1 && topicPrevIdx === -1 && rawRows.length > headerIdx + 1) {
        const sampleRows = rawRows.slice(headerIdx + 1, Math.min(rawRows.length, headerIdx + 12));
        const maxCols = Math.max(...sampleRows.map(r => (Array.isArray(r) ? r.length : 0)));
        let bestCol = -1;
        let maxLen = 0;
        for (let col = 0; col < maxCols; col++) {
          if (col === dateIdx || col === aulaNumIdx) continue;
          let totalLen = 0;
          let count = 0;
          for (const row of sampleRows) {
            const cell = String(row[col] || '').trim();
            if (cell) {
              totalLen += cell.length;
              count++;
            }
          }
          if (count > 0 && totalLen / count > maxLen) {
            maxLen = totalLen / count;
            bestCol = col;
          }
        }
        if (bestCol !== -1) {
          topicPrevIdx = bestCol;
        }
      }

      const titleRows = rawRows
        .slice(0, headerIdx)
        .flat()
        .filter(c => typeof c === 'string' && c.trim().length > 2)
        .map(c => String(c).trim());
      const sheetTitle = titleRows.length > 0 ? titleRows.join(' • ') : undefined;

      const lessons: ParsedLessonRow[] = [];
      for (let i = headerIdx + 1; i < rawRows.length; i++) {
        const r = rawRows[i];
        if (!Array.isArray(r) || r.length === 0) continue;

        const topic =
          (topicRealIdx !== -1 && r[topicRealIdx] ? String(r[topicRealIdx]).trim() : '') ||
          (topicPrevIdx !== -1 && r[topicPrevIdx] ? String(r[topicPrevIdx]).trim() : '');

        if (!topic) continue;

        const dateRaw = dateIdx !== -1 && r[dateIdx] ? r[dateIdx] : undefined;
        const dateFormatted = formatParsedDate(dateRaw);

        const met =
          (metRealIdx !== -1 && r[metRealIdx] ? String(r[metRealIdx]).trim() : '') ||
          (metPrevIdx !== -1 && r[metPrevIdx] ? String(r[metPrevIdx]).trim() : undefined);

        const obs = obsIdx !== -1 && r[obsIdx] ? String(r[obsIdx]).trim() : undefined;

        lessons.push({
          number: lessons.length + 1,
          date: dateFormatted,
          topic,
          methodology: met,
          observations: obs,
        });
      }

      if (lessons.length > 0) {
        result.push({ sheetName, sheetTitle, lessons });
      }
    }

    return result;
  } catch (err) {
    console.error('[Excel Parser] Erro ao analisar arquivo .xlsx:', err);
    return [];
  }
}

/**
 * Converte o texto da tabela exportada do Excel/CSV/Agente IA do ChatGPT em aulas estruturadas
 */
export function parseCSVorTableText(rawText: string): ParsedLessonRow[] {
  if (!rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  // 1. Procurar o cabeçalho nos primeiros 15 registros
  let headerLineIdx = -1;
  let dateIdx = -1;
  let turmaIdx = -1;
  let topicRealIdx = -1;
  let topicPrevIdx = -1;
  let metRealIdx = -1;
  let metPrevIdx = -1;
  let obsIdx = -1;

  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const lineLower = lines[i].toLowerCase();
    if (
      (lineLower.includes('objeto') || lineLower.includes('conteúdo') || lineLower.includes('conteudo') || lineLower.includes('tema') || lineLower.includes('assunto')) &&
      !lineLower.includes('rascunho')
    ) {
      headerLineIdx = i;
      const delimiter = lines[i].includes('\t') ? '\t' : lines[i].includes(';') ? ';' : ',';
      const cols = lines[i].split(delimiter).map(c => c.replace(/^["']|["']$/g, '').toLowerCase().trim());

      cols.forEach((col, idx) => {
        if (col.includes('data') || col === 'dia' || col.startsWith('dia ') || col.includes('dt_')) dateIdx = idx;
        else if (col.includes('turma')) turmaIdx = idx;
        else if (col.includes('objeto') && (col.includes('ministrado') || col.includes('real'))) topicRealIdx = idx;
        else if (col.includes('objeto') && (col.includes('previsto') || col.includes('siage'))) topicPrevIdx = idx;
        else if (col.includes('objeto') || col.includes('conteudo') || col.includes('conteúdo') || col.includes('tema') || col.includes('assunto')) {
          if (topicPrevIdx === -1) topicPrevIdx = idx;
        } else if (col.includes('metodologia') && (col.includes('realizada') || col.includes('real'))) metRealIdx = idx;
        else if (col.includes('metodologia') && (col.includes('prevista') || col.includes('siage'))) metPrevIdx = idx;
        else if (col.includes('metodologia')) {
          if (metPrevIdx === -1) metPrevIdx = idx;
        } else if (col.includes('observa')) obsIdx = idx;
      });
      break;
    }
  }

  const topicIdx = topicRealIdx !== -1 ? topicRealIdx : topicPrevIdx;
  const methodologyIdx = metRealIdx !== -1 ? metRealIdx : metPrevIdx;

  const startIndex = headerLineIdx !== -1 ? headerLineIdx + 1 : 0;
  const lessons: ParsedLessonRow[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
    const cells = line.split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());

    if (cells.length === 0 || !cells.some(Boolean)) continue;

    if (topicIdx !== -1) {
      const topicVal = (topicRealIdx !== -1 && cells[topicRealIdx]) || cells[topicIdx] || '';
      if (!topicVal) continue;

      lessons.push({
        number: lessons.length + 1,
        date: dateIdx !== -1 ? formatParsedDate(cells[dateIdx]) : undefined,
        turma: turmaIdx !== -1 ? cells[turmaIdx] : undefined,
        topic: topicVal,
        methodology: methodologyIdx !== -1 ? cells[methodologyIdx] : undefined,
        observations: obsIdx !== -1 ? cells[obsIdx] : undefined,
      });
    } else {
      // Fallback inteligente para colunas sem cabeçalho explícito
      const col0 = cells[0] || '';
      const col1 = cells[1] || '';
      const col2 = cells[2] || '';
      const col3 = cells[3] || '';

      const isCol0Date = /^\d{1,2}[/-]\d{1,2}/.test(col0) || /^\d{4}-\d{2}-\d{2}/.test(col0);
      const isCol0Num = /^\d+$/.test(col0);

      lessons.push({
        number: isCol0Num ? parseInt(col0, 10) : lessons.length + 1,
        date: isCol0Date ? formatParsedDate(col0) : undefined,
        topic: isCol0Date || isCol0Num ? col1 || col0 : col0,
        methodology: isCol0Date || isCol0Num ? col2 : col1,
        observations: isCol0Date || isCol0Num ? col3 : col2,
      });
    }
  }

  return lessons;
}

/**
 * Gera e realiza o download de uma planilha Excel (.xlsx) padronizada,
 * com abas separadas por disciplina e exemplos claros compatíveis com o SIAGE.
 */
export function downloadTemplateExcel(): void {
  const wb = XLSX.utils.book_new();

  // Aba 1: Práticas Integradoras II - 1C
  const ws1Data = [
    ['Aula', 'Data', 'Conteúdo (Objeto de Conhecimento)', 'Metodologia', 'Observações'],
    [1, '10/02/2026', 'Apresentação da disciplina e integração da turma', 'Aula expositiva dialogada e levantamento prévio de ideias', '1º Bimestre'],
    [2, '17/02/2026', 'Definição das equipes e temas do projeto integrador', 'Trabalho em grupo orientado e debate coletivo', ''],
    [3, '24/02/2026', 'Mapeamento de problemas e contextualização social', 'Estudo de caso e tempestade de ideias (Brainstorming)', ''],
    [4, '03/03/2026', 'Metodologia de pesquisa e estruturação de objetivos', 'Orientação prática com roteiro de trabalho em sala', ''],
    [5, '10/03/2026', 'Coleta de dados e pesquisa orientada de campo', 'Pesquisa orientada e registro de evidências empíricas', ''],
    [6, '17/03/2026', 'Análise preliminar dos dados e revisão em equipe', 'Debate em pequenos grupos e tutoria com o professor', ''],
    [7, '24/03/2026', 'Desenvolvimento da proposta prática / prototipagem', 'Oficina prática e acompanhamento do produto final', ''],
    [8, '31/03/2026', 'Apresentação parcial do projeto e autoavaliação', 'Apresentação oral com feedback coletivo', 'Avaliação do 1º Bimestre'],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
  ws1['!cols'] = [
    { wch: 8 },  // Aula
    { wch: 14 }, // Data
    { wch: 55 }, // Conteúdo
    { wch: 45 }, // Metodologia
    { wch: 25 }, // Observações
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Práticas Integ II - 1C');

  // Aba 2: Linguagem de Programação I - 1A
  const ws2Data = [
    ['Aula', 'Data', 'Conteúdo (Objeto de Conhecimento)', 'Metodologia', 'Observações'],
    [1, '11/02/2026', 'Introdução à Lógica de Programação e Computação', 'Aula dialogada e exemplos do cotidiano', '1º Bimestre'],
    [2, '18/02/2026', 'Algoritmos: conceito, instruções sequenciais e passos', 'Resolução de problemas práticos no quadro', ''],
    [3, '25/02/2026', 'Variáveis, tipos de dados primitivos e constantes', 'Exercícios práticos de fixação', ''],
    [4, '04/03/2026', 'Operadores aritméticos, relacionais e lógicos', 'Resolução de expressões e exercícios práticos', ''],
    [5, '11/03/2026', 'Estruturas de decisão condicional simples (SE / ENTÃO)', 'Construção de fluxogramas e pseudocódigo', ''],
    [6, '18/03/2026', 'Estruturas de decisão condicional composta (SE / SENÃO)', 'Prática de algoritmos com múltiplas condições', ''],
    [7, '25/03/2026', 'Estruturas de repetição: laço ENQUANTO (WHILE)', 'Implementação prática e depuração de código', ''],
    [8, '01/04/2026', 'Revisão prática e avaliação de fixação de algoritmos', 'Avaliação prática individual no laboratório', 'Avaliação do 1º Bimestre'],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
  ws2['!cols'] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 55 },
    { wch: 45 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Ling Programação I - 1A');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Modelo_Plano_de_Aulas_SIAGE.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
