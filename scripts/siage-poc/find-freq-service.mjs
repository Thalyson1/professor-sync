import fs from 'node:fs';
import https from 'node:https';

https.get('https://professor.see.pb.gov.br/main-es2015.js', (res) => {
  let chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    const data = Buffer.concat(chunks).toString('utf8');
    
    // Search for url_diario_classe_frequencia
    let idx = 0;
    const matches = [];
    const term = 'url_diario_classe_frequencia';
    while ((idx = data.indexOf(term, idx)) !== -1) {
      const snippet = data.slice(Math.max(0, idx - 100), Math.min(data.length, idx + 400));
      matches.push(snippet);
      idx += term.length;
    }
    console.log(`Found ${matches.length} references to ${term}`);
    matches.forEach((m, i) => {
      console.log(`\n=== Reference ${i+1} ===\n${m}`);
    });
  });
});
