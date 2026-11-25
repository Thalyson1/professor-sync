import assert from 'assert';
import {
  getMarizopolisCurrentDate,
  parseDateToMidnight,
  buildIescolarPreview,
  findMatchingSheetForIescolar,
  detectIescolarDiaryInfo,
  extractRomanNumeral,
  normalizeText,
} from '../extension/utils/iescolar-driver.ts';

console.log('--- INICIANDO TESTES DO DRIVER IESCOLAR (DADOS FICTÍCIOS) ---');

// 1. Teste de Data de Marizópolis
const todayMarizopolis = getMarizopolisCurrentDate();
console.log(`[TEST 1] Data atual calculada para Marizópolis (UTC-3): ${todayMarizopolis.toLocaleDateString('pt-BR')}`);
assert(todayMarizopolis instanceof Date && !isNaN(todayMarizopolis.getTime()), 'Data de Marizópolis deve ser um Date válido');

// 2. Teste de Parser de Data
const d1 = parseDateToMidnight('10/02/2026');
assert.strictEqual(d1?.getDate(), 10);
assert.strictEqual(d1?.getMonth(), 1); // Fevereiro = 1
assert.strictEqual(d1?.getFullYear(), 2026);
console.log('✅ [TEST 2] Parser de datas DD/MM/AAAA e YYYY-MM-DD validado com sucesso.');

// 3. Teste de Filtro de Hoje e Datas Futuras + Duas Aulas na Mesma Data (Aulas Geminadas) + Data Já Registrada
const mockDiaryInfo = {
  escola: 'Escola Batista',
  turma: '6º Ano A',
  turno: 'Manhã',
  disciplina: 'Pensamento Computacional',
  label: 'Escola Batista • 6º Ano A • Pensamento Computacional',
};

// Gerar datas: uma passada, duas na mesma data passada (geminadas), uma futura
const pastDateStr = '10/02/2026';
const geminadaDateStr = '17/02/2026';
const futureDateStr = '20/12/2026'; // Claramente no futuro relativo a Nov 2026
const registeredDateStr = '24/02/2026'; // Aula já gravada no diário

const mockSheetLessons = [
  {
    number: 1,
    date: pastDateStr,
    topic: 'Introdução ao Pensamento Computacional',
    methodology: 'Aula expositiva dialogada',
  },
  // Geminadas na mesma data
  {
    number: 2,
    date: geminadaDateStr,
    topic: 'Algoritmos no cotidiano - Parte 1',
    methodology: 'Prática orientada',
  },
  {
    number: 3,
    date: geminadaDateStr,
    topic: 'Algoritmos no cotidiano - Parte 2: fluxogramas',
    methodology: 'Trabalho em duplas',
  },
  // Data já registrada no diário
  {
    number: 4,
    date: registeredDateStr,
    topic: 'Estruturas condicionais SE e SENÃO',
    methodology: 'Resolução de problemas',
  },
  // Data futura
  {
    number: 5,
    date: futureDateStr,
    topic: 'Apresentação final de projetos',
    methodology: 'Seminário',
  },
];

const mockRegisteredData = {
  dates: new Set([registeredDateStr]),
  uncertainDates: new Set(),
};

const preview = buildIescolarPreview(mockSheetLessons, mockDiaryInfo, mockRegisteredData);

console.log(`[TEST 3] Total de datas agrupadas na prévia: ${preview.length}`);

// 3.1 Conferir corte de datas futuras
const hasFuture = preview.some(g => g.date === futureDateStr);
assert.strictEqual(hasFuture, false, 'Datas futuras devem ser excluídas da prévia de preenchimento');
console.log('✅ [TEST 3.1] Datas futuras excluídas da prévia (mantidas na planilha para próximo ciclo).');

// 3.2 Conferir agrupamento de aulas geminadas
const geminadaGroup = preview.find(g => g.date === geminadaDateStr);
assert(geminadaGroup, 'Grupo da data geminada deve existir');
assert.strictEqual(geminadaGroup.quantity, 2, 'Quantidade deve ser 2 para aulas geminadas');
assert(geminadaGroup.combinedTopic.includes('Aula 2:') && geminadaGroup.combinedTopic.includes('Aula 3:'), 'Conteúdos devem ser unificados com identificação');
assert.strictEqual(geminadaGroup.status, 'pronta', 'Status deve ser pronta');
console.log(`✅ [TEST 3.2] Aulas geminadas agrupadas com quantidade 2 e conteúdos unificados: "${geminadaGroup.combinedTopic.replace(/\n/g, ' | ')}"`);

// 3.3 Conferir data já registrada
const registeredGroup = preview.find(g => g.date === registeredDateStr);
assert(registeredGroup, 'Grupo da data já registrada deve constar na prévia informativa');
assert.strictEqual(registeredGroup.status, 'registrada', 'Status deve ser "registrada"');
console.log(`✅ [TEST 3.3] Data já registrada classificada como "${registeredGroup.status}" (${registeredGroup.statusReason}).`);

// 4. Teste de Troca de Disciplina entre Semestres (Informática vs Pensamento Computacional)
const mockSheets = [
  {
    sheetName: 'Informática - 6º A',
    sheetTitle: 'Escola Batista • 6º Ano A • Manhã',
    lessons: [{ number: 1, date: '10/02/2026', topic: 'Informática Básica' }],
  },
  {
    sheetName: 'Pensamento Computacional - 6º A',
    sheetTitle: 'Escola Batista • 6º Ano A • Manhã',
    lessons: [{ number: 1, date: '04/08/2026', topic: 'Pensamento Computacional no 2º Semestre' }],
  },
  {
    sheetName: 'Matemática - 6º A',
    sheetTitle: 'Escola Batista • 6º Ano A',
    lessons: [{ number: 1, date: '11/02/2026', topic: 'Números Naturais' }],
  },
];

// Diário do 2º semestre abre "Pensamento Computacional"
const diarySemestre2 = {
  escola: 'Escola Batista',
  turma: '6º Ano A',
  turno: 'Manhã',
  disciplina: 'Pensamento Computacional',
  label: 'Escola Batista • 6º Ano A • Pensamento Computacional',
};

const matchSemestre2 = findMatchingSheetForIescolar(mockSheets, diarySemestre2);
assert.strictEqual(matchSemestre2.sheet?.sheetName, 'Pensamento Computacional - 6º A', 'Deve casar com a aba de Pensamento Computacional no 2º semestre');
console.log(`✅ [TEST 4.1] Troca semestral: diário "Pensamento Computacional" casou perfeitamente com a aba "${matchSemestre2.sheet?.sheetName}"`);

// Diário de disciplina anual abre "Matemática"
const diaryMatematica = {
  escola: 'Escola Batista',
  turma: '6º Ano A',
  turno: 'Manhã',
  disciplina: 'Matemática',
  label: 'Escola Batista • 6º Ano A • Matemática',
};

const matchMatematica = findMatchingSheetForIescolar(mockSheets, diaryMatematica);
assert.strictEqual(matchMatematica.sheet?.sheetName, 'Matemática - 6º A', 'Deve casar com a mesma aba de Matemática ao longo do ano');
console.log(`✅ [TEST 4.2] Disciplina anual: diário "Matemática" casou com a aba "${matchMatematica.sheet?.sheetName}"`);

// 5. Teste de Extração do Diário Real (Caso Relatado no iEscolar Online pelo Professor)
const sampleDomText = 'Série:CICLO IV, Turma:UNICA, Turno:NOITE, Disciplinas:LINGUAGEM MATEMÁTICA.';
const extractedDiary = detectIescolarDiaryInfo(sampleDomText);

console.log(`[TEST 5] Diário detectado: Série="${extractedDiary.serie}", Turma="${extractedDiary.turma}", Turno="${extractedDiary.turno}", Disciplina="${extractedDiary.disciplina}", Ciclo="${extractedDiary.ciclo}"`);
assert.strictEqual(extractedDiary.serie, 'CICLO IV', 'Série deve ser CICLO IV');
assert.strictEqual(extractedDiary.ciclo, 'IV', 'Ciclo romano extraído deve ser IV');
assert.strictEqual(extractedDiary.turma, 'UNICA', 'Turma deve ser UNICA');
assert.strictEqual(extractedDiary.turno, 'NOITE', 'Turno deve ser NOITE');
assert.strictEqual(extractedDiary.disciplina, 'LINGUAGEM MATEMÁTICA', 'Disciplina deve ser LINGUAGEM MATEMÁTICA completa');
assert(extractedDiary.label.includes('LINGUAGEM MATEMÁTICA'), 'Label deve conter LINGUAGEM MATEMÁTICA');
assert(extractedDiary.label.includes('CICLO IV'), 'Label deve conter CICLO IV');
console.log(`✅ [TEST 5] Extração do diário real validada com sucesso: "${extractedDiary.label}"`);

// 6. Testes Bidirecionais: Diário III <-> Aba III e Diário IV <-> Aba IV (Ordem Normal e Inversa)
const sheetCiclo3 = {
  sheetName: 'Linguagem Matemática - III',
  sheetTitle: '',
  lessons: Array.from({ length: 50 }, (_, i) => ({ number: i + 1, date: '10/02/2026', topic: `Aula ${i + 1} Ciclo III` })),
};

const sheetCiclo4 = {
  sheetName: 'Linguagem Matemática - IV',
  sheetTitle: '',
  lessons: Array.from({ length: 50 }, (_, i) => ({ number: i + 1, date: '10/02/2026', topic: `Aula ${i + 1} Ciclo IV` })),
};

const sheetsOrderNormal = [sheetCiclo3, sheetCiclo4]; // [III, IV]
const sheetsOrderReversed = [sheetCiclo4, sheetCiclo3]; // [IV, III]

const diaryCiclo3 = {
  serie: 'CICLO III',
  ciclo: 'III',
  turma: 'UNICA',
  turno: 'NOITE',
  disciplina: 'LINGUAGEM MATEMÁTICA',
  label: 'LINGUAGEM MATEMÁTICA • CICLO III • Turma Única • NOITE',
};

const diaryCiclo4 = {
  serie: 'CICLO IV',
  ciclo: 'IV',
  turma: 'UNICA',
  turno: 'NOITE',
  disciplina: 'LINGUAGEM MATEMÁTICA',
  label: 'LINGUAGEM MATEMÁTICA • CICLO IV • Turma Única • NOITE',
};

// 6.1: Diário IV com abas [III, IV]
const match4Normal = findMatchingSheetForIescolar(sheetsOrderNormal, diaryCiclo4);
assert.strictEqual(match4Normal.sheet?.sheetName, 'Linguagem Matemática - IV', 'Diário IV deve casar com Aba IV');
assert.strictEqual(match4Normal.requiresSelection, false, 'Diário IV não deve exigir seleção quando aba IV existe');
console.log(`✅ [TEST 6.1] Ordem [III, IV] + Diário IV -> Casou com "${match4Normal.sheet?.sheetName}" (Score: ${match4Normal.score})`);

// 6.2: Diário IV com abas [IV, III] (ordem inversa)
const match4Reversed = findMatchingSheetForIescolar(sheetsOrderReversed, diaryCiclo4);
assert.strictEqual(match4Reversed.sheet?.sheetName, 'Linguagem Matemática - IV', 'Diário IV deve casar com Aba IV na ordem inversa');
assert.strictEqual(match4Reversed.requiresSelection, false, 'Diário IV não deve exigir seleção na ordem inversa');
console.log(`✅ [TEST 6.2] Ordem [IV, III] + Diário IV -> Casou com "${match4Reversed.sheet?.sheetName}" (Score: ${match4Reversed.score})`);

// 6.3: Diário III com abas [III, IV]
const match3Normal = findMatchingSheetForIescolar(sheetsOrderNormal, diaryCiclo3);
assert.strictEqual(match3Normal.sheet?.sheetName, 'Linguagem Matemática - III', 'Diário III deve casar com Aba III');
assert.strictEqual(match3Normal.requiresSelection, false, 'Diário III não deve exigir seleção quando aba III existe');
console.log(`✅ [TEST 6.3] Ordem [III, IV] + Diário III -> Casou com "${match3Normal.sheet?.sheetName}" (Score: ${match3Normal.score})`);

// 6.4: Diário III com abas [IV, III] (ordem inversa)
const match3Reversed = findMatchingSheetForIescolar(sheetsOrderReversed, diaryCiclo3);
assert.strictEqual(match3Reversed.sheet?.sheetName, 'Linguagem Matemática - III', 'Diário III deve casar com Aba III na ordem inversa');
assert.strictEqual(match3Reversed.requiresSelection, false, 'Diário III não deve exigir seleção na ordem inversa');
console.log(`✅ [TEST 6.4] Ordem [IV, III] + Diário III -> Casou com "${match3Reversed.sheet?.sheetName}" (Score: ${match3Reversed.score})`);

// 7. Teste de Ausência de Série no Diário (Exige Seleção Obrigatória do Professor)
const diaryNoSerie = {
  serie: '',
  ciclo: undefined,
  turma: 'UNICA',
  turno: 'NOITE',
  disciplina: 'LINGUAGEM MATEMÁTICA',
  label: 'LINGUAGEM MATEMÁTICA • Turma Única • NOITE',
};

const matchNoSerie = findMatchingSheetForIescolar(sheetsOrderNormal, diaryNoSerie);
assert.strictEqual(matchNoSerie.requiresSelection, true, 'Sem Série identificada, deve exigir seleção obrigatória do professor');
assert.strictEqual(matchNoSerie.isAmbiguous, true, 'Sem Série identificada, deve sinalizar ambiguidade');
console.log(`✅ [TEST 7] Diário sem Série com abas [III, IV] -> requiresSelection=${matchNoSerie.requiresSelection} ("${matchNoSerie.reason}")`);

console.log('--- TODOS OS TESTES PASSARAM COM SUCESSO! ---');
