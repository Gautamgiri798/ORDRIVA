const fs = require('fs');

const filesToPatch = [
  'node_modules/next/dist/build/webpack/plugins/next-trace-entrypoints-plugin.js',
  'node_modules/next/dist/build/collect-build-traces.js',
  'node_modules/next/dist/esm/build/webpack/plugins/next-trace-entrypoints-plugin.js',
  'node_modules/next/dist/esm/build/collect-build-traces.js',
  'node_modules/next/dist/compiled/@vercel/nft/index.js'
];

filesToPatch.forEach(f => {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    c = c.replaceAll("e.code === 'UNKNOWN'", "e.code === 'UNKNOWN' || e.code === 'EISDIR'");
    fs.writeFileSync(f, c);
    console.log('Patched:', f);
  }
});
