import CryptoJS from 'crypto-js';

export interface SiageFetchedClass {
  id: string;
  name: string;
  grade?: string;
  subjectName: string;
  studentCount?: number;
  room?: string;
  shift?: string;
  semester?: string;
  schoolName?: string;
}

export interface SiageFetchedStudent {
  id: string;
  name: string;
  enrollmentNumber?: string;
  formacaoTurmaAlunoId?: string;
  matriculaAvulsaId?: string;
}

export interface SiageAttendanceHistoryItem {
  id: string;
  data: string; // ISO date
  periodo: string;
  tempos: string[];
  presenca: string;
}

export interface SaveAttendancePayload {
  id?: string;
  formacaoTurmaId: string;
  componenteCurricularId: string;
  matrizItinerarioComponenteId?: string;
  dataAula: string; // "YYYY-MM-DD"
  periodo: string; // "PERIODO_4"
  tempos: string[]; // ["TEMPO_6", "TEMPO_7"]
  students: Array<{
    formacaoTurmaAlunoId: string;
    matriculaAvulsaId?: string;
    nomeAluno: string;
    matricula?: string;
    present: boolean;
  }>;
}

export const SIAGE_BASE = 'https://professor.see.pb.gov.br';
export const SIAGE_API_BASE = 'https://api.esaber-professor.see.pb.gov.br/api';
export const SIAGE_SECRET_KEY = '6SyX1qeZwFedfIFQQG4H+ADNLcUV5wfDlJSf0/0IGW4=';

export function decryptSiageStorage<T = string>(encryptedValue: string | null, convertToJson = false): T | null {
  if (!encryptedValue) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedValue, SIAGE_SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) return null;
    if (convertToJson) {
      return JSON.parse(decrypted) as T;
    }
    return decrypted.replace(/^"|"$/g, '') as unknown as T;
  } catch (err) {
    return null;
  }
}

export interface SiageSessionData {
  token: string;
  anoLetivoId: string;
  matriculaId: string;
  profissionalId: string;
  usuario?: any;
  dadosAlocacao?: any;
}

export function getSiageSessionFromStorage(): SiageSessionData | null {
  try {
    if (typeof localStorage === 'undefined') return null;

    const token = decryptSiageStorage<string>(localStorage.getItem('seectpb.token'));
    if (!token) return null;

    const anoLetivoId = decryptSiageStorage<string>(localStorage.getItem('seectpb.anoLetivoId')) || '';
    const matriculaId = decryptSiageStorage<string>(localStorage.getItem('seectpb.matriculaId')) || '';
    const usuario = decryptSiageStorage<any>(localStorage.getItem('seectpb.usuario'), true) || {};
    const dadosAlocacao = decryptSiageStorage<any>(localStorage.getItem('seectpb.dadosAlocacao'), true) || {};

    const profissionalId = dadosAlocacao.profissionalId || usuario.profissionalId || usuario.id || '';

    return {
      token,
      anoLetivoId,
      matriculaId: dadosAlocacao.professorMatriculaId || matriculaId,
      profissionalId,
      usuario,
      dadosAlocacao,
    };
  } catch (e) {
    return null;
  }
}

/**
  Chave única para evitar sobrescrever turmas distintas
 */
export function getClassKey(cls: SiageFetchedClass): string {
  const school = (cls.schoolName || '').trim().toLowerCase();
  const name = (cls.name || '').trim().toLowerCase();
  const subject = (cls.subjectName || '').trim().toLowerCase();
  const shift = (cls.shift || '').trim().toLowerCase();

  if (cls.id && !cls.id.includes('undefined') && !cls.id.includes('ui-btn') && cls.id.length > 5) {
    return cls.id.toLowerCase();
  }

  return `${school}_${name}_${subject}_${shift}`.replace(/\s+/g, '_');
}

/**
 * Clean cell text removing icon/button artifact strings
 */
function cleanCellText(el: Element | null): string {
  if (!el) return '';
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('button, .mat-icon, .ui-btn, .mat-sort-header-button, svg, script, style').forEach(b => b.remove());
  return (clone.textContent || '').replace(/\s+/g, ' ').trim();
}

/**
 * Puxa as turmas reais do professor acumulando todas as páginas da API e mesclando com o DOM sem apagar nada
 */
export async function fetchTeacherClassesFromSiage(): Promise<SiageFetchedClass[]> {
  console.log('[Professor Sync] Buscando e acumulando todas as turmas do SIAGE...');
  let newClasses: SiageFetchedClass[] = [];

  // 1. Raspagem da página atual do DOM
  const domClasses = scrapeSiageTableFromDOM();
  if (domClasses.length > 0) {
    newClasses.push(...domClasses);
  }

  // 2. Tentar busca via API iterando por TODAS as páginas (1 a 5) com suporte a pageSize=50
  try {
    const session = getSiageSessionFromStorage();
    const tokenHeader = session?.token ? { Authorization: `Bearer ${session.token}` } : {};

    let enrollmentId = session?.matriculaId || '';
    if (!enrollmentId) {
      const enrollRes = await fetch(`${SIAGE_API_BASE}/profissional/minhas-matriculas`, {
        credentials: 'include',
        headers: { Accept: 'application/json', ...tokenHeader },
      }).catch(() => null);

      if (enrollRes && enrollRes.ok) {
        const enrollData = await enrollRes.json();
        const list = enrollData?.data?.profissionalMatriculaListDto || enrollData?.items || (Array.isArray(enrollData) ? enrollData : []);
        if (Array.isArray(list) && list.length > 0) {
          enrollmentId = list[0].id || list[0].profissionalMatriculaId || '';
        }
      }
    }

    let page = 1;
    let hasMorePages = true;

    while (hasMorePages && page <= 5) {
      const turmasUrl = enrollmentId
        ? `${SIAGE_API_BASE}/formacao-turma-aluno/curriculo-professor/turmas?profissionalMatriculaId=${enrollmentId}&page=${page}&size=50`
        : `${SIAGE_API_BASE}/formacao-turma-aluno/curriculo-professor/turmas?page=${page}&size=50`;

      const response = await fetch(turmasUrl, {
        credentials: 'include',
        headers: { Accept: 'application/json', ...tokenHeader },
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json();
        const rawItems = Array.isArray(data)
          ? data
          : data.items || data.dados || data.turmas?.data || data.turmas || data.content || data.data?.turmas?.data || data.data?.content || [];

        if (rawItems.length === 0) {
          hasMorePages = false;
        } else {
          for (const item of rawItems) {
            const header = item.header || item;
            const school = item.escola || item.nomeEscola || header.escola || header.nomeEscola || '';
            const turma = item.nomeTurma || item.turma || header.turmaEtapa || header.anoSerie || 'Turma SIAGE';
            const subject = item.componenteCurricular || header.componenteCurricular || item.disciplina || 'Disciplina';
            const shift = header.turno || item.turno || '';

            newClasses.push({
              id: item.formacaoTurmaId || item.id || item.turmaId || `${school}_${turma}_${subject}_${shift}`.replace(/\s+/g, '_'),
              name: turma,
              grade: header.anoSerie || item.serie || item.temporalidade || '',
              subjectName: subject,
              schoolName: school,
              studentCount: item.indicadores?.totalEstudantes || header.indicadores?.totalEstudantes || 25,
              room: header.sala || item.sala || '',
              shift: shift,
              semester: header.semestreDoComponente || item.semestre || '',
            });
          }

          if (rawItems.length < 10) {
            hasMorePages = false;
          } else {
            page++;
          }
        }
      } else {
        hasMorePages = false;
      }
    }
  } catch (err) {
    console.error('[SIAGE API] Erro ao buscar turmas nas páginas:', err);
  }

  // 3. Mesclar de forma acumulativa no Storage Local
  const mergedList = await mergeAndSaveClasses(newClasses);
  return mergedList;
}

/**
 * Filtra e higieniza turmas para garantir que linhas de diário ou tempo de aula não virem turmas
 */
export function filterValidClasses(classList: SiageFetchedClass[]): SiageFetchedClass[] {
  if (!Array.isArray(classList)) return [];
  return classList.filter(item => {
    if (!item || !item.name || !item.subjectName) return false;
    const n = item.name.toLowerCase();
    const s = item.subjectName.toLowerCase();
    const g = (item.grade || '').toLowerCase();

    // Rejeitar registros de aulas ou tempos inseridos como turma
    if (n.includes('tempo') || s.includes('tempo') || g.includes('tempo')) return false;
    if (n.includes('thalyson') || s.includes('thalyson')) return false;
    if (n.includes('registro') || s.includes('registro')) return false;
    if (n.includes('frequência') || s.includes('frequencia')) return false;
    if (n.includes('presença') || s.includes('presenca')) return false;
    if (n.includes('professor') || s.includes('professor')) return false;

    // Turmas legítimas costumam ter "Série", "Ano", "Turma", etc.
    return true;
  });
}

/**
 * Raspa a tabela de turmas oficial da tela /diario/minhas-turmas/listagem-turmas
 */
export function scrapeSiageTableFromDOM(): SiageFetchedClass[] {
  const classes: SiageFetchedClass[] = [];
  if (typeof document === 'undefined') return classes;

  // IMPORTANTE: Só raspar na listagem oficial de turmas!
  // Se estiver dentro de /turma/... (diário ou frequência), não raspar pois causará falsos positivos
  if (
    typeof window !== 'undefined' &&
    (window.location.pathname.includes('/turma/') || !window.location.pathname.includes('/minhas-turmas'))
  ) {
    return classes;
  }

  const rows = document.querySelectorAll('table tr, tr.mat-row, tbody tr');

  rows.forEach((row) => {
    if (row.querySelector('th')) return;

    const cells = row.querySelectorAll('td');

    if (cells.length >= 4) {
      const schoolName = cleanCellText(cells[0]);
      const grade = cleanCellText(cells[1]);
      const turmaName = cleanCellText(cells[2]);
      const shift = cleanCellText(cells[3]);
      const subjectName = cells.length >= 5 ? cleanCellText(cells[4]) : 'Componente Curricular';
      const studentCountStr = cells.length >= 7 ? cleanCellText(cells[6]) : '';
      const semester = cells.length >= 8 ? cleanCellText(cells[7]) : '';

      const countParsed = parseInt(studentCountStr.replace(/\D/g, ''), 10);
      const studentCount = !isNaN(countParsed) && countParsed > 0 ? countParsed : 25;

      const upperTurma = turmaName.toUpperCase();
      const upperSubject = subjectName.toUpperCase();

      if (
        turmaName &&
        subjectName &&
        !upperTurma.includes('TURMA/ETAPA') &&
        !upperSubject.includes('COMPONENTE CURRICULAR') &&
        !upperTurma.includes('TEMPO') &&
        !upperSubject.includes('TEMPO') &&
        !upperSubject.includes('THALYSON')
      ) {
        const uniqueId = `${schoolName}_${turmaName}_${subjectName}_${shift}`.replace(/\s+/g, '_');
        classes.push({
          id: uniqueId,
          name: turmaName,
          grade: grade,
          subjectName: subjectName,
          schoolName: schoolName,
          shift: shift,
          semester: semester,
          studentCount: studentCount,
        });
      }
    }
  });

  return filterValidClasses(classes);
}

/**
 * Salva no chrome.storage de forma ACUMULATIVA (merge por chave única e higienização)
 */
export async function mergeAndSaveClasses(newClasses: SiageFetchedClass[]): Promise<SiageFetchedClass[]> {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return filterValidClasses(newClasses);
  }

  return new Promise((resolve) => {
    chrome.storage.local.get(['siageClasses'], (result) => {
      const existing: SiageFetchedClass[] = filterValidClasses(result.siageClasses || []);
      const map = new Map<string, SiageFetchedClass>();

      for (const item of existing) {
        const key = getClassKey(item);
        if (key) map.set(key, item);
      }

      for (const item of filterValidClasses(newClasses)) {
        const key = getClassKey(item);
        if (key) map.set(key, item);
      }

      // Adiciona também a turma ativa da alocação se houver
      const session = getSiageSessionFromStorage();
      if (session?.dadosAlocacao?.turma) {
        const alloc = session.dadosAlocacao;
        const allocItem: SiageFetchedClass = {
          id: alloc.formacaoTurmaId || 'turma_alocada',
          name: alloc.turma || alloc.nomeTurma || 'Turma Ativa',
          grade: alloc.temporalidade || alloc.anoEtapaTurma || '',
          subjectName: alloc.componenteCurricular || 'Componente Curricular',
          schoolName: alloc.nomeEscola || '',
          shift: alloc.turno || '',
          studentCount: 21,
        };
        const allocKey = getClassKey(allocItem);
        if (allocKey) map.set(allocKey, allocItem);
      }

      const mergedList = filterValidClasses(Array.from(map.values()));
      chrome.storage.local.set(
        { siageClasses: mergedList, lastSyncedAt: new Date().toISOString() },
        () => resolve(mergedList)
      );
    });
  });
}

export async function clearSavedClasses(): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.remove(['siageClasses']);
  }
}

export async function fetchClassStudentsFromSiage(
  turmaId: string,
  componenteCurricularId?: string
): Promise<SiageFetchedStudent[]> {
  try {
    const session = getSiageSessionFromStorage();
    const tokenHeader = session?.token ? { Authorization: `Bearer ${session.token}` } : {};
    const compQuery = componenteCurricularId
      ? `?componenteCurricularId=${componenteCurricularId}&profissionalMatriculaId=${session?.matriculaId || ''}&page=1&size=50`
      : '';

    const response = await fetch(`${SIAGE_API_BASE}/formacao-turma-aluno/professor/turmas/${turmaId}/alunos${compQuery}`, {
      credentials: 'include',
      headers: { Accept: 'application/json', ...tokenHeader },
    }).catch(() => null);

    if (!response || !response.ok) return [];

    const json = await response.json();
    const rawStudents = json?.data?.alunos || json?.alunos || (Array.isArray(json?.data) ? json.data : json?.data?.items || json?.items || []);

    return rawStudents.map((s: any) => ({
      id: s.formacaoTurmaAlunoId || s.id || s.estudanteId,
      name: s.nome || s.nomeEstudante || s.nomeAluno || 'Estudante',
      enrollmentNumber: s.matricula || s.numeroMatricula || '',
      formacaoTurmaAlunoId: s.formacaoTurmaAlunoId || s.id,
      matriculaAvulsaId: s.matriculaAvulsaId || '',
    }));
  } catch (error) {
    console.error('[SIAGE API] Erro ao buscar alunos da turma:', error);
    return [];
  }
}

export interface RegisteredLessonsResult {
  dates: Set<string>;
  counts: Map<string, number>;
  rawItems: any[];
}

/**
 * Busca todas as aulas já registradas na turma no SIAGE (suporta paginação se houver mais de 10)
 */
export async function fetchRegisteredLessons(
  session: SiageSessionData,
  formacaoTurmaId: string,
  curriculoComponenteCurricularId: string
): Promise<RegisteredLessonsResult> {
  const dates = new Set<string>();
  const counts = new Map<string, number>();
  const rawItems: any[] = [];

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 4) {
      const url = `${SIAGE_API_BASE}/diarioCurriculoRegistroDeAula?formacaoTurmaId=${formacaoTurmaId}&anoLetivoId=${session.anoLetivoId}&componenteCurricularId=${curriculoComponenteCurricularId}&curriculoComponenteCurricularId=${curriculoComponenteCurricularId}&matriculaId=${session.matriculaId}&profissionalMatriculaId=${session.matriculaId}&page=${page}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.token}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const json = await res.json();
        const items = json?.data?.data || [];
        rawItems.push(...items);

        for (const item of items) {
          if (item.data) {
            const isoDate = item.data.slice(0, 10); // "YYYY-MM-DD"
            dates.add(isoDate);
            counts.set(isoDate, (counts.get(isoDate) || 0) + 1);
          }
        }

        if (items.length < 10) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }
  } catch (err) {
    console.error('[SIAGE API] Erro ao buscar aulas já registradas:', err);
  }

  return { dates, counts, rawItems };
}

/**
 * Consulta o período letivo (e.g. PERIODO_4, PERIODO_3) para uma data específica
 */
export async function getPeriodoForDate(
  session: SiageSessionData,
  escolaId: string,
  dateIsoStr: string
): Promise<string> {
  try {
    const dateObj = new Date(`${dateIsoStr}T03:00:00.000Z`);
    const dateQuery = dateObj.toISOString();
    const url = `${SIAGE_API_BASE}/DiarioClasseFrequencia/get-nome-periodo?anoLetivoId=${session.anoLetivoId}&escolaId=${escolaId}&data=${encodeURIComponent(dateQuery)}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.token}`,
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const json = await res.json();
      if (json?.data?.periodo) {
        return json.data.periodo;
      }
    }
  } catch (err) {
    console.warn('[SIAGE API] Falha ao consultar período:', err);
  }
  return 'PERIODO_4';
}

/**
 * Valida a senha se o professor tiver configurado
 */
export async function validatePasswordIfProvided(
  session: SiageSessionData,
  password?: string
): Promise<boolean> {
  if (!password) return true;
  try {
    const res = await fetch(`${SIAGE_API_BASE}/usuario/validar-senha`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ password }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface InsertLessonPayload {
  date: string; // "YYYY-MM-DD"
  periodo: string; // "PERIODO_4"
  topic: string;
  methodology?: string;
  observations?: string;
  formacaoTurmaId: string;
  curriculoComponenteCurricularId: string;
}

interface MetodologiaItem {
  id: string;
  nome: string;
}

const SIAGE_METODOLOGIAS: Record<string, MetodologiaItem> = {
  dialogada: { id: '4bd4155c-4ca4-462b-a19b-0c9f2bc87023', nome: 'Aula dialogada' },
  pratica: { id: '203c72ab-7ff4-4c74-bdab-a293e3146e57', nome: 'Aula prática' },
  lab_info: { id: '73fc4589-c3a0-49d8-955d-ba1dcf0328e6', nome: 'Aula em laboratório educacional de informática' },
  contextualizada: { id: '1d7083b0-c282-494e-ab3d-3b77d7016045', nome: 'Aula contextualizada' },
  avaliacao: { id: 'e8d42aeb-7992-4da1-b883-4c24bd9aa15e', nome: 'Avaliação ' },
  trabalhos: { id: '675682dc-3a8e-44f0-b693-2c5ed395db17', nome: 'Apresentação de trabalhos pelos estudantes ' },
  outros: { id: '3314d353-bcce-4408-a7b8-18bfdafca33e', nome: 'Outros' },
};

/**
 * Mapeia inteligentemente o tema e descrição da metodologia aos checkboxes oficiais do SIAGE
 */
export function buildDynamicMetodologias(topic: string = '', methodology: string = ''): MetodologiaItem[] {
  const combined = `${topic} ${methodology}`.toLowerCase();
  const selected = new Map<string, MetodologiaItem>();

  // Sempre inclui aula dialogada como base pedagógica
  selected.set(SIAGE_METODOLOGIAS.dialogada.id, SIAGE_METODOLOGIAS.dialogada);

  if (
    combined.includes('laborat') ||
    combined.includes('computad') ||
    combined.includes('program') ||
    combined.includes('código') ||
    combined.includes('codigo') ||
    combined.includes('prática') ||
    combined.includes('pratica') ||
    combined.includes('exercício') ||
    combined.includes('exercicio') ||
    combined.includes('dupla') ||
    combined.includes('desenho')
  ) {
    selected.set(SIAGE_METODOLOGIAS.pratica.id, SIAGE_METODOLOGIAS.pratica);
  }

  if (combined.includes('laborat') || combined.includes('informát') || combined.includes('informat')) {
    selected.set(SIAGE_METODOLOGIAS.lab_info.id, SIAGE_METODOLOGIAS.lab_info);
  }

  if (combined.includes('cotidian') || combined.includes('context') || combined.includes('realidade')) {
    selected.set(SIAGE_METODOLOGIAS.contextualizada.id, SIAGE_METODOLOGIAS.contextualizada);
  }

  if (combined.includes('avalia') || combined.includes('diagnóst') || combined.includes('prova') || combined.includes('teste')) {
    selected.set(SIAGE_METODOLOGIAS.avaliacao.id, SIAGE_METODOLOGIAS.avaliacao);
  }

  if (combined.includes('apresenta') || combined.includes('trabalho') || combined.includes('seminár') || combined.includes('seminar')) {
    selected.set(SIAGE_METODOLOGIAS.trabalhos.id, SIAGE_METODOLOGIAS.trabalhos);
  }

  if (selected.size === 1) {
    selected.set(SIAGE_METODOLOGIAS.outros.id, SIAGE_METODOLOGIAS.outros);
  }

  return Array.from(selected.values());
}

/**
 * Insere diretamente um registro de aula no SIAGE via API oficial
 */
export async function insertLessonViaApi(
  session: SiageSessionData,
  lesson: InsertLessonPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const dateAula = `${lesson.date} 00:00:00`;

    // Prioriza Observações reais; se não houver, usa Metodologia prevista; se nenhuma, usa texto padrão
    const obsText = lesson.observations?.trim()
      ? `${lesson.observations.trim()}\n`
      : lesson.methodology?.trim()
      ? `${lesson.methodology.trim()}\n`
      : 'Aula ministrada conforme planejamento curricular.\n';

    const topicText = `${lesson.topic.trim()}\n`;

    // Mapeamento dinâmico das caixas de seleção de metodologia do SIAGE
    const dynamicMets = buildDynamicMetodologias(lesson.topic, lesson.methodology);
    const metodologiaData = dynamicMets.map(m => ({
      id: m.id,
      unidadeTematicaId: '00000000-0000-0000-0000-000000000000',
      nome: m.nome,
      descricao: '',
    }));
    const metodologias = dynamicMets.map(m => ({
      metodologiaId: m.id,
      unidadeTematicaId: '00000000-0000-0000-0000-000000000000',
    }));

    const body = {
      anoLetivoId: session.anoLetivoId,
      matriculaId: session.matriculaId,
      dataAula: dateAula,
      periodo: lesson.periodo,
      tempo: [],
      modoAula: 'AULA',
      tipoAula: 'AVULSO',
      profissionalId: session.profissionalId,
      componenteCurricularTabComponenteCurricularLocalId: '',
      formacaoTurmaId: lesson.formacaoTurmaId,
      observacoes: obsText,
      objetosConhecimento: topicText,
      metodologia: null,
      metodologiaData,
      metodologias,
      observacao: obsText,
      profissionalMatriculaId: session.matriculaId,
      curriculoComponenteCurricularId: lesson.curriculoComponenteCurricularId,
      objetoDoConhecimento: topicText,
    };

    const res = await fetch(`${SIAGE_API_BASE}/diarioCurriculoRegistroDeAula`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      return { success: true };
    }
    const errText = await res.text();
    return { success: false, error: errText || `HTTP ${res.status}` };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro de conexão' };
  }
}

/**
 * Normaliza qualquer valor de tempo (ex: "3º Tempo", 3, "TEMPO_3", "3") para o Enum C# "TEMPO_3"
 */
export function normalizeTempoEnum(raw: any): string | null {
  if (raw === undefined || raw === null) return null;
  const str = String(raw).trim();
  if (!str) return null;

  // Se já for TEMPO_X
  const exactEnumMatch = str.match(/^TEMPO_(\d{1,2})$/i);
  if (exactEnumMatch) {
    return `TEMPO_${exactEnumMatch[1]}`;
  }

  // Se tiver um número ordinal ou dígito (ex: "3º Tempo", "3º", "3", "tempo 3")
  const numMatch = str.match(/(\d{1,2})/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (num >= 1 && num <= 12) {
      return `TEMPO_${num}`;
    }
  }

  return null;
}

/**
 * Normaliza listas de tempos que podem vir como strings compostas (ex: "1º e 2º Tempo", ["TEMPO_3"], ["3º Tempo"])
 */
export function normalizeTemposList(rawList: any): string[] {
  if (!rawList) return ['TEMPO_3'];
  const items: any[] = Array.isArray(rawList) ? rawList : [rawList];
  const result: string[] = [];

  for (const item of items) {
    if (typeof item === 'string' && (item.includes(' e ') || item.includes('/') || item.includes('&') || item.includes(','))) {
      const matches = item.match(/\d{1,2}/g);
      if (matches) {
        for (const m of matches) {
          const norm = normalizeTempoEnum(m);
          if (norm && !result.includes(norm)) result.push(norm);
        }
      }
    } else {
      const norm = normalizeTempoEnum(item);
      if (norm && !result.includes(norm)) result.push(norm);
    }
  }

  return result.length > 0 ? result.sort((a, b) => {
    const numA = parseInt(a.replace('TEMPO_', ''), 10) || 0;
    const numB = parseInt(b.replace('TEMPO_', ''), 10) || 0;
    return numA - numB;
  }) : ['TEMPO_3'];
}

/**
 * Consulta o histórico de frequências registradas no SIAGE para a turma
 */
export async function fetchClassAttendanceHistory(
  session: SiageSessionData,
  formacaoTurmaId: string,
  componenteCurricularId: string
): Promise<SiageAttendanceHistoryItem[]> {
  try {
    const url = `${SIAGE_API_BASE}/DiarioClasseFrequencia/listagem-frequencia?anoLetivoId=${session.anoLetivoId}&formacaoTurmaId=${formacaoTurmaId}&componenteCurricularId=${componenteCurricularId}&curriculoComponenteCurricularId=${componenteCurricularId}&matriculaId=${session.matriculaId}&profissionalMatriculaId=${session.matriculaId}&page=1&size=50`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.token}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const items = json?.data?.data || json?.data?.items || json?.items || [];
    return items.map((i: any) => ({
      id: i.id,
      data: i.data,
      periodo: i.periodo,
      tempos: normalizeTemposList(i.tempos || (i.tempo ? (Array.isArray(i.tempo) ? i.tempo : [i.tempo]) : [])),
      presenca: i.presenca || '',
    }));
  } catch (e) {
    console.error('[SIAGE API] Erro ao buscar histórico de frequência:', e);
    return [];
  }
}

/**
 * Busca os detalhes de uma frequência existente (alunos e status)
 */
export async function fetchAttendanceDetailsById(
  session: SiageSessionData,
  id: string
): Promise<any | null> {
  try {
    const res = await fetch(`${SIAGE_API_BASE}/DiarioClasseFrequencia/${id}`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch (e) {
    return null;
  }
}

/**
 * Salva ou Atualiza (PUT/POST) a frequência escolar no SIAGE com validação e segurança
 */
export async function saveAttendanceViaApi(
  session: SiageSessionData,
  payload: SaveAttendancePayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const formacaoTurmaId = payload.formacaoTurmaId || session.dadosAlocacao?.formacaoTurmaId;
    const componenteCurricularId =
      session.dadosAlocacao?.componenteCurricularTabComponenteCurricularLocalId ||
      payload.componenteCurricularId ||
      'a5aad79d-cecd-4b43-8c2a-89fe92a778e2';
    const matrizCurricularBnccComponenteId =
      session.dadosAlocacao?.curriculoMatrizCurricularBnccComponenteCurricularId ??
      payload.matrizCurricularBnccComponenteId ??
      null;
    const matrizItinerarioComponenteId =
      session.dadosAlocacao?.curriculoMatrizItinerarioComponenteCurricularId ??
      payload.matrizItinerarioComponenteId ??
      null;

    // Resolução dinâmica do período letivo da data caso não venha preenchido
    let periodo = payload.periodo;
    if (!periodo || periodo === 'PERIODO_4') {
      const escolaId = session.dadosAlocacao?.escolaId || 'f1289131-068e-404f-a5bd-4c7510908e22';
      periodo = await getPeriodoForDate(session, escolaId, payload.dataAula);
    }

    // 1. Normalizar tempos estritamente para o Enum aceito pelo C# (ex: "TEMPO_3", "TEMPO_6")
    const cleanTempos = normalizeTemposList(payload.tempos);

    // O backend C# (UpdateDiarioClasseFrequenciaDto / CreateDiarioClasseFrequenciaDto)
    // espera estritamente a lista plana 'alunos' com: formacaoTurmaAlunoId, tempo, presenca
    const alunos: { formacaoTurmaAlunoId: string; tempo: string; presenca: boolean }[] = [];
    for (const s of payload.students) {
      for (const t of cleanTempos) {
        alunos.push({
          formacaoTurmaAlunoId: s.formacaoTurmaAlunoId,
          tempo: t,
          presenca: s.present,
        });
      }
    }

    // Mantemos frequenciaAlunos para compatibilidade caso algum endpoint auxiliar leia
    const frequenciaAlunos = payload.students.map(s => ({
      formacaoTurmaAlunoId: s.formacaoTurmaAlunoId,
      matriculaId: null,
      matriculaAvulsaId: s.matriculaAvulsaId || null,
      nomeAluno: s.nomeAluno,
      matricula: s.matricula || '',
      isRemanejado: false,
      dataRemanejamento: null,
      ausenciaJustificada: false,
      acao: payload.id ? 'EDIT' : 'ND',
      frequencias: cleanTempos.map(t => ({
        tempo: t,
        presenca: s.present,
      })),
    }));

    // Auto-detecção inteligente de ID existente se não foi enviado pelo popup
    let targetId = payload.id;
    if (!targetId) {
      try {
        const histRes = await fetchClassAttendanceHistory(session, formacaoTurmaId, componenteCurricularId);
        const match = histRes.find(h => h.data?.startsWith(payload.dataAula));
        if (match) {
          targetId = match.id;
        }
      } catch (e) {}
    }

    const body: any = {
      formacaoTurmaId,
      matriculaId: session.matriculaId,
      anoLetivoId: session.anoLetivoId,
      componenteCurricularId,
      matrizCurricularBnccComponenteId,
      matrizItinerarioComponenteId,
      dataAula: `${payload.dataAula}T00:00:00`,
      periodo,
      tempo: cleanTempos,
      alunos,
      frequenciaAlunos,
    };

    if (targetId) {
      body.id = targetId;
    }

    const method = targetId ? 'PUT' : 'POST';
    const res = await fetch(`${SIAGE_API_BASE}/DiarioClasseFrequencia`, {
      method,
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      return { success: true };
    }
    const errText = await res.text();
    return { success: false, error: errText || `HTTP ${res.status}` };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro de conexão' };
  }
}

/**
 * Retorna o dia da semana abreviado ou completo para uma data (YYYY-MM-DD ou DD/MM/YYYY)
 */
export function formatLessonDateWithWeekday(
  dateStr: string,
  style: 'short' | 'long' = 'short'
): string {
  if (!dateStr) return '';
  let y = 0, m = 0, d = 0;
  if (dateStr.includes('-')) {
    const parts = dateStr.slice(0, 10).split('-');
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10) - 1;
    d = parseInt(parts[2], 10);
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    d = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10) - 1;
    y = parseInt(parts[2], 10);
  } else {
    return dateStr;
  }

  // Cria data local ao meio-dia evitando offset de fuso horário UTC
  const dateObj = new Date(y, m, d, 12, 0, 0);
  const dayIndex = dateObj.getDay();

  const shortDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const longDays = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];

  const weekday = style === 'long' ? longDays[dayIndex] : shortDays[dayIndex];
  const dd = String(d).padStart(2, '0');
  const mm = String(m + 1).padStart(2, '0');
  return `${weekday}, ${dd}/${mm}/${y}`;
}

export function getWeekdayIndex(dateStr: string): number {
  if (!dateStr) return -1;
  let y = 0, m = 0, d = 0;
  if (dateStr.includes('-')) {
    const parts = dateStr.slice(0, 10).split('-');
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10) - 1;
    d = parseInt(parts[2], 10);
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    d = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10) - 1;
    y = parseInt(parts[2], 10);
  } else {
    return -1;
  }
  const dateObj = new Date(y, m, d, 12, 0, 0);
  return dateObj.getDay();
}

export const TEMPO_OPTIONS = [
  { id: 'TEMPO_1', label: '1º Tempo', short: '1º' },
  { id: 'TEMPO_2', label: '2º Tempo', short: '2º' },
  { id: 'TEMPO_3', label: '3º Tempo', short: '3º' },
  { id: 'TEMPO_4', label: '4º Tempo', short: '4º' },
  { id: 'TEMPO_5', label: '5º Tempo', short: '5º' },
  { id: 'TEMPO_6', label: '6º Tempo', short: '6º' },
  { id: 'TEMPO_7', label: '7º Tempo', short: '7º' },
  { id: 'TEMPO_8', label: '8º Tempo', short: '8º' },
  { id: 'TEMPO_9', label: '9º Tempo', short: '9º' },
];

export function formatTemposLabel(tempos: string[]): string {
  if (!tempos || tempos.length === 0) return 'Selecione os tempos';
  const clean = normalizeTemposList(tempos);
  const mapped = clean
    .map(t => {
      const match = TEMPO_OPTIONS.find(o => o.id === t);
      return match ? match.short : t;
    })
    .join(' e ');
  return `${mapped} Tempo${clean.length > 1 ? 's' : ''}`;
}


