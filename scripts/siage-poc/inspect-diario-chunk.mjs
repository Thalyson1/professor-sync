import https from 'node:https';
import fs from 'node:fs';

const url = 'https://professor.see.pb.gov.br/src_app_modules_diario_diario_module_ts-es2015.js';

https.get(url, res => {
  let chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    const data = Buffer.concat(chunks).toString('utf8');
    console.log('Diario chunk length:', data.length);
    fs.writeFileSync('scripts/siage-poc/diario-module-chunk.js', data);

    // Find occurrences of frequencia and actions/buttons
    const actions = [...data.matchAll(/onDelete|excluir|remover|exclusao/gi)].map(m => m[0]);
    console.log('Action occurrences:', actions.slice(0, 20));

    // Look for occurrences of onDelete in connection with frequencia
    let idx = 0;
    while ((idx = data.indexOf('onDelete', idx)) !== -1) {
      console.log('\n--- onDelete context ---');
      console.log(data.slice(Math.max(0, idx - 150), Math.min(data.length, idx + 250)));
      idx += 'onDelete'.length;
    }
  });
});
