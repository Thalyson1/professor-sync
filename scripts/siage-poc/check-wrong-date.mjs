import fs from 'node:fs';

const data = fs.readFileSync('scripts/siage-poc/minhas-turmas-chunk.js', 'utf8');

// Look for occurrences of diario-classe-registro-aula and delete
let i = 0;
const snippets = [];
while ((i = data.indexOf('diario-classe-registro-aula', i)) !== -1) {
  snippets.push(data.slice(Math.max(0, i - 100), Math.min(data.length, i + 300)));
  i += 'diario-classe-registro-aula'.length;
}

console.log('Occurrences of diario-classe-registro-aula:', snippets.length);
snippets.slice(0, 10).forEach((s, idx) => {
  console.log(`\n--- Snippet ${idx+1} ---`);
  console.log(s);
});
