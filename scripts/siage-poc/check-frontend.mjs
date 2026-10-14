import https from 'node:https';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function main() {
  const index = await fetchUrl('https://professor.see.pb.gov.br');
  console.log('Index status:', index.status);
  const matches = [...index.data.matchAll(/src=["']([^"']+\.js)["']/g)].map(m => m[1]);
  console.log('Scripts found:', matches);

  for (const src of matches) {
    const fullUrl = src.startsWith('http') ? src : `https://professor.see.pb.gov.br/${src.replace(/^\//, '')}`;
    console.log('Fetching', fullUrl);
    const js = await fetchUrl(fullUrl);
    console.log(src, 'length:', js.data.length);

    // Search for DiarioClasseFrequencia
    const regex = /DiarioClasseFrequencia[a-zA-Z0-9_\-\/]*/g;
    const found = new Set(js.data.match(regex) || []);
    if (found.size > 0) {
      console.log('Endpoints found in', src, ':', Array.from(found));
    }

    // Search for delete or excluir in connection with frequencia
    const deleteRegex = /["'][^"']*frequencia[^"']*["']/gi;
    const delMatches = js.data.match(deleteRegex) || [];
    console.log('Frequencia strings in', src, ':', delMatches.slice(0, 10));
  }
}

main().catch(console.error);
