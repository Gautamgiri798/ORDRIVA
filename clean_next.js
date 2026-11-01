const fs = require('fs');
const path = require('path');

const target1 = path.join(__dirname, 'apps', 'web', 'node_modules');
const target2 = path.join(__dirname, 'apps', 'web', '.next');

try {
  if (fs.existsSync(target1)) {
    fs.rmSync(target1, { recursive: true, force: true });
    console.log('[ORDRIVA] Purged shadow apps/web/node_modules cleanly.');
  }
  if (fs.existsSync(target2)) {
    fs.rmSync(target2, { recursive: true, force: true });
    console.log('[ORDRIVA] Purged stale apps/web/.next cache.');
  }
} catch (e) {
  console.error('Error during cleanup:', e.message);
}
