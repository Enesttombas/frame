'use strict';
// Frame micro-benchmark: caption parsing and time lookup on a synthetic 1-hour video, plus shipped size.
// Usage: node bench/frame-bench.cjs [out.json]
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const captions = require('../captions.js');

const root = path.join(__dirname, '..');
const CUES = 1200; // ~1 hour, one cue every 3 s
const events = Array.from({ length: CUES }, (_, i) => ({
  tStartMs: i * 3000, dDurationMs: 2600, segs: [{ utf8: `Sentence number ${i} ` }, { utf8: 'with a few words.' }]
}));

function pct(values, p) { const s = [...values].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))]; }

const parseRuns = [];
let cues;
for (let i = 0; i < 30; i++) { const t = performance.now(); cues = captions.parseJson3({ events }); parseRuns.push(performance.now() - t); }

const lookups = [];
let seed = 7;
const rand = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
for (let i = 0; i < 20000; i++) { const at = rand() * CUES * 3; const t = performance.now(); captions.at(cues, at); lookups.push((performance.now() - t) * 1000); }

const shipped = ['manifest.json', 'worker.js', 'youtube.js', 'youtube-bridge.js', 'captions.js', 'core.js', 'player-panel.js', 'preferences.js', 'settings.html', 'settings.js']
  .filter(f => fs.existsSync(path.join(root, f)));
const extKb = shipped.reduce((n, f) => n + fs.statSync(path.join(root, f)).size, 0) / 1024;
const exeKb = fs.existsSync(path.join(root, 'Frame.exe')) ? fs.statSync(path.join(root, 'Frame.exe')).size / 1024 : null;

const result = {
  date: new Date().toISOString(), node: process.version, cues: cues.length,
  parse_ms: { p50: +pct(parseRuns, 50).toFixed(2), p95: +pct(parseRuns, 95).toFixed(2) },
  lookup_us: { p50: +pct(lookups, 50).toFixed(2), p95: +pct(lookups, 95).toFixed(2), runs: lookups.length },
  extension_kb: +extKb.toFixed(1), extension_files: shipped.length, tray_exe_kb: exeKb && +exeKb.toFixed(1)
};
const out = process.argv[2];
if (out) fs.writeFileSync(out, JSON.stringify(result, null, 1));
console.log(JSON.stringify(result));
