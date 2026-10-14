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
  const main = await fetchUrl('https://professor.see.pb.gov.br/main-es2015.js');
  
  // Search for routes containing 'frequencia'
  const routeRegex = /path:\s*['"]([^'"]*frequencia[^'"]*)['"][^}]+loadChildren:\s*\(\)\s*=>\s*([^}]+)/g;
  let match;
  while ((match = routeRegex.exec(main)) !== null) {
    console.log('Route match:', match[1], '->', match[2]);
  }

  // Also let's check all lazy chunk imports in main
  const lazyImports = [...main.matchAll(/import\((?:'|")([^'"]+)(?:'|")\)/g)].map(m => m[1]);
  console.log('Lazy imports count:', lazyImports.length);
  const freqImports = lazyImports.filter(x => x.toLowerCase().includes('frequencia') || x.toLowerCase().includes('diario'));
  console.log('Diario/Freq imports:', freqImports);
}

main().catch(console.error);
