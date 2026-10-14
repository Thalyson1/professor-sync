import fs from 'node:fs';
import https from 'node:https';
import crypto from 'node:crypto';

const s = JSON.parse(fs.readFileSync('scripts/siage-poc/session/siage-session.json', 'utf8'));
const SECRET_KEY = '6SyX1qeZwFedfIFQQG4H+ADNLcUV5wfDlJSf0/0IGW4=';

function decrypt(encBase64, keyStr = SECRET_KEY) {
  const buf = Buffer.from(encBase64, 'base64');
  if (buf.subarray(0, 8).toString() !== 'Salted__') return null;
  const salt = buf.subarray(8, 16);
  const ciphertext = buf.subarray(16);
  let hash = [];
  let total = Buffer.alloc(0);
  while (total.length < 48) {
    const d = Buffer.concat([hash[hash.length - 1] || Buffer.alloc(0), Buffer.from(keyStr, 'utf8'), salt]);
    const h = crypto.createHash('md5').update(d).digest();
    hash.push(h);
    total = Buffer.concat([total, h]);
  }
  const key = total.subarray(0, 32);
  const iv = total.subarray(32, 48);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let dec = decipher.update(ciphertext, undefined, 'utf8');
  dec += decipher.final('utf8');
  try { return JSON.parse(dec); } catch { return dec; }
}

const token = decrypt(s.origins[0].localStorage.find(x => x.name === 'seectpb.token').value);
const anoId = decrypt(s.origins[0].localStorage.find(x => x.name === 'seectpb.anoLetivoId').value);
const matId = decrypt(s.origins[0].localStorage.find(x => x.name === 'seectpb.matriculaId').value);
const dadosAlocacao = decrypt(s.origins[0].localStorage.find(x => x.name === 'seectpb.dadosAlocacao').value);

function apiReq(method, path, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(`https://api.esaber-professor.see.pb.gov.br${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }
    }, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(b) }); } catch { resolve({ status: res.statusCode, data: b }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  const turmaId = dadosAlocacao.formacaoTurmaId;
  const compId = dadosAlocacao.componenteCurricularTabComponenteCurricularLocalId;
  
  // Test existing ID
  const existingId = 'fe905269-bc02-4950-8f92-d51059c8d777';
  const getRes = await apiReq('GET', `/api/DiarioClasseFrequencia/${existingId}`);
  console.log('getRes:', getRes.status, typeof getRes.data, getRes.data);
  const existingData = getRes.data?.data;
  if (!existingData) {
    console.log('existingData is null!');
    return;
  }
  console.log('GET existingData keys:', Object.keys(existingData));
  
  // Test putting the EXACT existingData back
  console.log('\n--- Test 1: PUT existingData directly ---');
  const putRes1 = await apiReq('PUT', `/api/DiarioClasseFrequencia`, existingData);
  console.log('PUT 1 Status:', putRes1.status, JSON.stringify(putRes1.data));

  // Test 3: With alunos property as required by C# DTO
  console.log('\n--- Test 3: With alunos array ---');
  // Look at DiarioClasseFrequenciaAlunoCreateDto:
  // x.formacaoTurmaAlunoId, tempo (integer or string? e.g. 6, 7 or TEMPO_6), presenca (boolean)
  const flatAlunos = [];
  for (const fa of existingData.frequenciaAlunos) {
    for (const f of fa.frequencias) {
      flatAlunos.push({
        formacaoTurmaAlunoId: fa.formacaoTurmaAlunoId,
        tempo: f.tempo, // e.g. 'TEMPO_6' or 6
        presenca: f.presenca
      });
    }
  }

  const dtoPayload = {
    id: existingId,
    formacaoTurmaId: turmaId,
    matriculaId: matId,
    anoLetivoId: anoId,
    componenteCurricularId: compId,
    matrizCurricularBnccComponenteId: null,
    matrizItinerarioComponenteId: dadosAlocacao.curriculoMatrizItinerarioComponenteCurricularId,
    dataAula: "2026-10-06T00:00:00",
    periodo: "PERIODO_4",
    tempo: ["TEMPO_6", "TEMPO_7"],
    alunos: flatAlunos
  };

  const putRes3 = await apiReq('PUT', `/api/DiarioClasseFrequencia`, dtoPayload);
  console.log('PUT 3 Status:', putRes3.status, JSON.stringify(putRes3.data));

  // Test 5: What causes "Atenção! O componente curricular informado não corresponde a uma lotação ativa..."?
  console.log('\n--- Test 5: Error reproduction ---');
  const postPayload = { ...dtoPayload };
  delete postPayload.id;
  postPayload.dataAula = "2026-10-13T00:00:00";

  const badPayload1 = { ...postPayload, matrizItinerarioComponenteId: null };
  const badRes1 = await apiReq('POST', `/api/DiarioClasseFrequencia`, badPayload1);
  console.log('Bad 1 (null itinerario) Status:', badRes1.status, JSON.stringify(badRes1.data));

  // Test what causes "Atenção! O componente curricular informado não corresponde a uma lotação ativa do professor nesta turma."
  console.log('\n--- Test 6: Finding the exact error ---');
  // Try sending componenteCurricularId = 'c08da697-379c-410f-bab0-24468d908ceb' WITH matrizItinerarioComponenteId = 'c08da697-379c-410f-bab0-24468d908ceb'
  const badPayload3 = { ...postPayload, componenteCurricularId: 'c08da697-379c-410f-bab0-24468d908ceb', matrizItinerarioComponenteId: 'c08da697-379c-410f-bab0-24468d908ceb' };
  const badRes3 = await apiReq('POST', `/api/DiarioClasseFrequencia`, badPayload3);
  console.log('Bad 3 Status:', badRes3.status, JSON.stringify(badRes3.data));

  // Try sending matrizCurricularBnccComponenteId = compId and matrizItinerarioComponenteId = null
  const badPayload4 = { ...postPayload, componenteCurricularId: compId, matrizCurricularBnccComponenteId: compId, matrizItinerarioComponenteId: null };
  const badRes4 = await apiReq('POST', `/api/DiarioClasseFrequencia`, badPayload4);
  console.log('Bad 4 Status:', badRes4.status, JSON.stringify(badRes4.data));

  // Test unified save function
  console.log('\n--- Test 8: Unified save function ---');
  async function saveAttendanceUnified(sessionData, payloadData) {
    const formTurmaId = payloadData.formacaoTurmaId || sessionData.dadosAlocacao?.formacaoTurmaId;
    const compCurricularId = sessionData.dadosAlocacao?.componenteCurricularTabComponenteCurricularLocalId || payloadData.componenteCurricularId;
    const matrizBncc = sessionData.dadosAlocacao?.curriculoMatrizCurricularBnccComponenteCurricularId || null;
    const matrizItin = sessionData.dadosAlocacao?.curriculoMatrizItinerarioComponenteCurricularId || null;

    const alunosList = [];
    for (const s of payloadData.students) {
      for (const t of payloadData.tempos) {
        alunosList.push({
          formacaoTurmaAlunoId: s.formacaoTurmaAlunoId,
          tempo: t,
          presenca: s.present,
        });
      }
    }

    const payloadBody = {
      formacaoTurmaId: formTurmaId,
      matriculaId: sessionData.matriculaId,
      anoLetivoId: sessionData.anoLetivoId,
      componenteCurricularId: compCurricularId,
      matrizCurricularBnccComponenteId: matrizBncc,
      matrizItinerarioComponenteId: matrizItin,
      dataAula: `${payloadData.dataAula}T00:00:00`,
      periodo: payloadData.periodo || 'PERIODO_4',
      tempo: payloadData.tempos,
      alunos: alunosList,
    };

    let targetId = payloadData.id;
    if (!targetId) {
      // Check if already exists in history
      const hist = await apiReq('GET', `/api/DiarioClasseFrequencia/listagem-frequencia?anoLetivoId=${sessionData.anoLetivoId}&formacaoTurmaId=${formTurmaId}&componenteCurricularId=${compCurricularId}&matriculaId=${sessionData.matriculaId}&page=1&size=20`);
      const found = hist?.data?.data?.data?.find(h => h.data?.startsWith(payloadData.dataAula));
      if (found) {
        targetId = found.id;
      }
    }

    if (targetId) {
      payloadBody.id = targetId;
      return apiReq('PUT', `/api/DiarioClasseFrequencia`, payloadBody);
    } else {
      return apiReq('POST', `/api/DiarioClasseFrequencia`, payloadBody);
    }
  }

  const sessionObj = { matriculaId: matId, anoLetivoId: anoId, dadosAlocacao };
  const mockPayload = {
    formacaoTurmaId: turmaId,
    dataAula: "2026-10-06",
    periodo: "PERIODO_4",
    tempos: ["TEMPO_6", "TEMPO_7"],
    students: existingData.frequenciaAlunos.map(fa => ({
      formacaoTurmaAlunoId: fa.formacaoTurmaAlunoId,
      present: fa.frequencias[0].presenca
    }))
  };

  const resUnified = await saveAttendanceUnified(sessionObj, mockPayload);
  console.log('Unified Save Result:', resUnified.status, JSON.stringify(resUnified.data));
}

run().catch(console.error);
