const fs = require('fs');
const path = require('path');

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (file === 'node_modules' || file === '.git') return;
      walk(filepath, filelist);
    } else {
      filelist.push(filepath);
    }
  });
  return filelist;
}

function containsStringInFiles(rootDir, search) {
  const files = walk(rootDir);
  for (const f of files) {
    if (!f.endsWith('.js') && !f.endsWith('.ts') && !f.endsWith('.tsx')) continue;
    try {
      const content = fs.readFileSync(f, 'utf8');
      if (content.indexOf(search) !== -1) return true;
    } catch (e) {
      // ignore
    }
  }
  return false;
}

const requiredPatterns = [
  'PerformanceMonitoringService.recordTimeToInteractive',
  '[AppTiming]'
];

let missing = [];
for (const p of requiredPatterns) {
  if (!containsStringInFiles(process.cwd(), p)) missing.push(p);
}

if (missing.length > 0) {
  console.error('Missing required instrumentation patterns:', missing);
  process.exit(2);
} else {
  console.log('Instrumentation checks passed');
  process.exit(0);
}



