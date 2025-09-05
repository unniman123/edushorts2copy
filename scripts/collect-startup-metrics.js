#!/usr/bin/env node
// Collect StartupMetric log lines from Android device via adb and compute median TTI
// Usage: node scripts/collect-startup-metrics.js --count 10

const { spawn } = require('child_process');

const args = process.argv.slice(2);
let targetCount = 10;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--count' && args[i + 1]) {
    targetCount = parseInt(args[i + 1], 10) || 10;
  }
}

console.log(`Collecting ${targetCount} StartupMetric samples from adb logcat...`);

// Clear existing logs to start fresh
try {
  spawn('adb', ['logcat', '-c']);
} catch (e) {
  console.warn('Failed to clear adb logcat (adb may not be available):', e.message);
}

const adb = spawn('adb', ['logcat', '-v', 'threadtime']);

const samples = [];

adb.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (!line) continue;
    if (line.includes('[StartupMetric]')) {
      // Attempt to extract JSON
      const idx = line.indexOf('[StartupMetric]');
      const part = line.substring(idx + '[StartupMetric]'.length).trim();
      try {
        const parsed = JSON.parse(part);
        samples.push(parsed);
        console.log('Captured sample:', parsed);
      } catch (e) {
        console.log('Captured raw StartupMetric text:', part);
      }
      if (samples.length >= targetCount) {
        finish();
      }
    }
  }
});

adb.stderr.on('data', (data) => {
  // ignore
});

adb.on('error', (err) => {
  console.error('adb process error (is adb in PATH and a device connected?):', err.message);
  process.exit(1);
});

function finish() {
  try {
    adb.kill();
  } catch (e) {}

  if (samples.length === 0) {
    console.log('No samples captured. Ensure device/emulator is connected and app is logging StartupMetric.');
    process.exit(1);
  }

  const ttis = samples.map(s => s.tti).filter(n => typeof n === 'number').sort((a,b) => a-b);
  const mid = Math.floor(ttis.length / 2);
  const median = ttis.length % 2 === 1 ? ttis[mid] : (ttis[mid-1] + ttis[mid]) / 2;
  const sum = ttis.reduce((a,b) => a+b, 0);
  const mean = sum / ttis.length;
  const variance = ttis.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / ttis.length;

  console.log('\n=== StartupMetric Summary ===');
  console.log('samples:', ttis.length);
  console.log('median (ms):', median);
  console.log('mean (ms):', Math.round(mean));
  console.log('variance:', Math.round(variance));
  console.log('all samples:', ttis);
  process.exit(0);
}




