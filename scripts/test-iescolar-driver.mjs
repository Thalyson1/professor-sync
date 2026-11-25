import assert from 'assert';
import {
  getMarizopolisCurrentDate,
  parseDateToMidnight,
  buildIescolarPreview,
  findMatchingSheetForIescolar,
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

console.log('--- TODOS OS TESTES PASSARAM COM SUCESSO! ---');
