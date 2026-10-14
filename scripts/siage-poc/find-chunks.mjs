import https from 'node:https';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  const runtime = await fetchUrl('https://professor.see.pb.gov.br/runtime-es2015.js');
  // Look for chunk mappings: e.g., { 0: "0-es2015.js", ... } or similar
  const matches = [...runtime.matchAll(/([0-9a-zA-Z\-_]+\-es2015\.js)/g)].map(m => m[1]);
  console.log('Chunk matches in runtime:', Array.from(new Set(matches)));

  const main = await fetchUrl('https://professor.see.pb.gov.br/main-es2015.js');
  // Search for lazy routes containing frequencia or diario
  const routeMatches = [...main.matchAll(/["']([0-9a-zA-Z\-_]*frequencia[0-9a-zA-Z\-_]*)["']/gi)].map(m => m[1]);
  console.log('Route matches:', Array.from(new Set(routeMatches)));

  // Also let's find chunk id mappings in runtime
  const chunkMapMatch = runtime.match(/\{([0-9]+:[^}]+)\}/);
  if (chunkMapMatch) {
    console.log('Chunk map:', chunkMapMatch[0].slice(0, 300));
  }
}

main().catch(console.error);
