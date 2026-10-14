import https from 'node:https';

https.get('https://professor.see.pb.gov.br/main-es2015.js', res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const chunks = [...d.matchAll(/__webpack_require__\.e\((?:'|")([^'"]+)(?:'|")\)/g)].map(m => m[1]);
    console.log('Chunks requested in main:', Array.from(new Set(chunks)));
  });
});
