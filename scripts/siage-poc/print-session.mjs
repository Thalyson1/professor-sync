import fs from 'node:fs';
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

for (const item of s.origins[0].localStorage) {
  if (['seectpb.dadosAlocacao', 'seectpb.anoLetivoId', 'seectpb.matriculaId', 'seectpb.tipoEstruturaComponente'].includes(item.name)) {
    console.log('===', item.name, '===');
    console.log(JSON.stringify(decrypt(item.value), null, 2));
  }
}
