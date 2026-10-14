import fs from 'node:fs';
import https from 'node:https';
import crypto from 'node:crypto';

const s = JSON.parse(fs.readFileSync('scripts/siage-poc/session/siage-session.json', 'utf8'));
const tokenEnc = s.origins[0].localStorage.find(x => x.name === 'seectpb.token').value;
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
  return JSON.parse(dec);
}

const token = decrypt(tokenEnc);

function apiGet(path) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.esaber-professor.see.pb.gov.br${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(b) });
        } catch {
          resolve({ status: res.statusCode, raw: b });
        }
      });
    }).on('error', reject);
  });
}

async function test() {
  const turmaId = '5495f10a-e789-41d5-9452-b7c51c32b833';
  const compId = 'a5aad79d-cecd-4b43-8c2a-89fe92a778e2';
  const matId = '76161dc2-dfa5-4cd7-8e6e-d83aa1d86832';
  const anoId = 'd8ee446b-80fc-4dbd-8b0d-b4b66dfaaeb4';

  console.log('1. Testing student roster...');
  const students = await apiGet(`/api/formacao-turma-aluno/professor/turmas/${turmaId}/alunos?componenteCurricularId=${compId}&profissionalMatriculaId=${matId}&page=1&size=50`);
  console.log('Students status:', students.status);
  const studentList = students.data?.data?.items || students.data?.items || students.data?.data || [];
  console.log('Students count:', studentList.length);
  if (studentList.length > 0) {
    console.log('Sample student:', studentList[0].nome, studentList[0].formacaoTurmaAlunoId);
  }

  console.log('\n2. Testing attendance history...');
  const history = await apiGet(`/api/DiarioClasseFrequencia/listagem-frequencia?anoLetivoId=${anoId}&formacaoTurmaId=${turmaId}&componenteCurricularId=${compId}&curriculoComponenteCurricularId=${compId}&matriculaId=${matId}&profissionalMatriculaId=${matId}&page=1&size=20`);
  console.log('History status:', history.status);
  const histList = history.data?.data?.items || history.data?.items || [];
  console.log('Attendance records count:', histList.length);
  if (histList.length > 0) {
    console.log('Latest record:', histList[0].data, histList[0].id, histList[0].presenca);
  }
}

test().catch(console.error);
