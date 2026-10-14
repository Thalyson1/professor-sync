import fs from 'node:fs';

const data = fs.readFileSync('scripts/siage-poc/minhas-turmas-chunk.js', 'utf8');

// Find constants related to frequencia form
const idx = data.indexOf('MSG_VALIDACAO_DATA');
if (idx !== -1) {
  console.log(data.slice(idx - 200, idx + 600));
}

const fIdx = data.indexOf('MSG_REGISTRO_FREQUENCIA_SHOW_FALSE_TO_TRUE');
if (fIdx !== -1) {
  console.log(data.slice(fIdx - 200, fIdx + 600));
}

const aIdx = data.indexOf('Não existe mais tempos de aula pendente');
if (aIdx !== -1) {
  console.log(data.slice(aIdx - 100, aIdx + 400));
}
