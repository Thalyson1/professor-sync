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

function apiGet(path) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.esaber-professor.see.pb.gov.br${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      }
    }, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try { resolve(JSON.parse(b)); } catch { resolve(b); }
      });
    }).on('error', reject);
  });
}

async function run() {
  const turmaId = dadosAlocacao.formacaoTurmaId;
  const compId = dadosAlocacao.componenteCurricularTabComponenteCurricularLocalId;
  console.log('Consultando listagem de frequência...');
  const listUrl = `/api/DiarioClasseFrequencia/listagem-frequencia?anoLetivoId=${anoId}&formacaoTurmaId=${turmaId}&componenteCurricularId=${compId}&curriculoComponenteCurricularId=${compId}&matriculaId=${matId}&profissionalMatriculaId=${matId}&page=1&size=5`;
  const list = await apiGet(listUrl);
  console.log('Listagem:', JSON.stringify(list, null, 2));

  const firstItem = list?.data?.data?.[0];
  if (firstItem?.id) {
    console.log('\n--- Consultando Detalhes do ID:', firstItem.id, '---');
    const details = await apiGet(`/api/DiarioClasseFrequencia/${firstItem.id}`);
    const { frequenciaAlunos, estudantes, ...meta } = details?.data || {};
    console.log('Metadados do Registro Existente:', JSON.stringify(meta, null, 2));
  }
}

run().catch(console.error);
