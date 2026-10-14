import crypto from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';

const s = JSON.parse(fs.readFileSync('scripts/siage-poc/session/siage-session.json', 'utf8'));
const tokenEnc = s.origins[0].localStorage.find(x => x.name === 'seectpb.token').value;
const SECRET_KEY = '6SyX1qeZwFedfIFQQG4H+ADNLcUV5wfDlJSf0/0IGW4=';

export function decrypt(encBase64, keyStr = SECRET_KEY) {
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
console.log('Decrypted token:', token.slice(0, 30) + '...');

const req = https.get('https://api.esaber-professor.see.pb.gov.br/api/profissional/minhas-matriculas', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/json',
  }
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Response body:', body.slice(0, 300));
  });
});
req.on('error', console.error);
