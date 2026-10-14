import fs from 'node:fs';

const data = fs.readFileSync('scripts/siage-poc/frequencia-service-chunk.js', 'utf8');

// Search for column definitions or table headers
const cols = [...data.matchAll(/matColumnDef="([^"]+)"/g)].map(m => m[1]);
console.log('matColumnDef:', Array.from(new Set(cols)));

// Search for listagem-frequencia references
let idx = 0;
while ((idx = data.indexOf('listagem-frequencia', idx)) !== -1) {
  console.log('\n--- snippet around listagem-frequencia ---');
  console.log(data.slice(Math.max(0, idx - 100), Math.min(data.length, idx + 400)));
  idx += 'listagem-frequencia'.length;
}
