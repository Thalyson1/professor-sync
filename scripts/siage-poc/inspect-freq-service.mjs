import https from 'node:https';
import fs from 'node:fs';

const url = 'https://professor.see.pb.gov.br/default-src_app_core_services_diario-classe-frequencia_service_ts-src_app_shared_components_g-3f5ccc-es2015.js';

https.get(url, (res) => {
  let chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    const data = Buffer.concat(chunks).toString('utf8');
    console.log('Chunk length:', data.length);
    fs.writeFileSync('scripts/siage-poc/frequencia-service-chunk.js', data);

    // Search for methods inside DiarioClasseFrequenciaService
    const serviceMatch = data.match(/class [A-Za-z0-9_]*DiarioClasseFrequenciaService[^{]*\{([\s\S]*?)\}/) 
      || data.match(/class DiarioClasseFrequenciaService[^{]*\{([\s\S]*?)\}/)
      || data.match(/DiarioClasseFrequenciaService = [^\{]*\{([\s\S]*?)\}/);

    // Let's also look for all HTTP calls: this.http.get, post, put, delete
    const httpCalls = [...data.matchAll(/this\.http\.(get|post|put|delete)\(([^)]+)\)/g)].map(m => `${m[1].toUpperCase()}: ${m[2]}`);
    console.log('HTTP calls found:', httpCalls);

    // Look for any string containing url_diario_classe_frequencia or DiarioClasseFrequencia
    const endpoints = [...data.matchAll(/[`'"][^`'"]*DiarioClasseFrequencia[^`'"]*[`'"]/g)].map(m => m[0]);
    console.log('Endpoints referenced:', Array.from(new Set(endpoints)));

    // Look for delete occurrences
    const deleteOccurrences = [...data.matchAll(/delete[^a-zA-Z0-9][^\n;]+/gi)].map(m => m[0]);
    console.log('Delete occurrences:', deleteOccurrences);
  });
});
