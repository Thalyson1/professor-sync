import https from 'node:https';
import fs from 'node:fs';

const url = 'https://professor.see.pb.gov.br/src_app_modules_diario_pages_minhas-turmas_minhas-turmas_module_ts-es2015.js';

https.get(url, res => {
  let chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    const data = Buffer.concat(chunks).toString('utf8');
    console.log('Minhas turmas chunk length:', data.length);
    fs.writeFileSync('scripts/siage-poc/minhas-turmas-chunk.js', data);

    // Search for frequencia routes or submodules
    const routes = [...data.matchAll(/path:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
    console.log('Routes in minhas-turmas:', routes);

    // Search for chunks imported
    const chunkImports = [...data.matchAll(/__webpack_require__\.e\((?:'|")([^'"]+)(?:'|")\)/g)].map(m => m[1]);
    console.log('Sub-chunks imported:', Array.from(new Set(chunkImports)));
  });
});
