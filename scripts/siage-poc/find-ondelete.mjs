import fs from 'node:fs';

const data = fs.readFileSync('scripts/siage-poc/minhas-turmas-chunk.js', 'utf8');

// Search for onDelete in RegistroAulaListComponent or TabRegistroAula
let idx = 0;
while ((idx = data.indexOf('onDelete', idx)) !== -1) {
  console.log('\n--- onDelete in minhas-turmas ---');
  console.log(data.slice(Math.max(0, idx - 100), Math.min(data.length, idx + 400)));
  idx += 'onDelete'.length;
}
