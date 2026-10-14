import fs from 'node:fs';

const data = fs.readFileSync('scripts/siage-poc/minhas-turmas-chunk.js', 'utf8');

// Find all alert messages or validations in RegistroAulaFrequencia
const alerts = [...data.matchAll(/SweetalertCustom\.[a-zA-Z0-9_]+\([^)]+\)/g)].map(m => m[0]);
console.log('Total Sweetalerts in chunk:', alerts.length);

const dateAlerts = alerts.filter(a => a.toLowerCase().includes('data') || a.toLowerCase().includes('periodo') || a.toLowerCase().includes('tempo'));
dateAlerts.forEach((a, i) => {
  console.log(`\n[Alert ${i+1}]:\n`, a);
});
