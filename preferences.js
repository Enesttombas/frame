(function (scope) {
  'use strict';
  const defaults = Object.freeze({ display: 'dual', order: 'en-first', englishSize: 26, turkishSize: 21, bottom: 76, opacity: 85, delay: 0, theme: 'forest', hoverPause: false, autoPause: false, speed: 1 });
  const choices = { display: ['dual', 'en', 'tr', 'off'], order: ['en-first', 'tr-first'], theme: ['forest', 'night', 'paper'] };
  const ranges = { englishSize: [14, 44], turkishSize: [12, 40], bottom: [12, 180], opacity: [0, 100], delay: [-5, 5], speed: [.25, 2] };
  function normalize(input = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};
    const value = { ...defaults };
    for (const key of Object.keys(defaults)) {
      if (choices[key]) { if (choices[key].includes(input[key])) value[key] = input[key]; }
      else if (ranges[key]) { if (typeof input[key] === 'number' && Number.isFinite(input[key])) value[key] = Math.round(Math.min(ranges[key][1], Math.max(ranges[key][0], input[key])) * 100) / 100; }
      else if (typeof input[key] === 'boolean') value[key] = input[key];
    }
    return value;
  }
  function srt(rows, translations = [], bilingual = false) {
    const stamp = value => { const ms = Math.round(Math.max(0, value) * 1000); return [Math.floor(ms / 3600000), Math.floor(ms / 60000) % 60, Math.floor(ms / 1000) % 60].map(n => String(n).padStart(2, '0')).join(':') + ',' + String(ms % 1000).padStart(3, '0'); };
    return rows.map((row, index) => {
      const captions = scope.FrameCaptions || (typeof module === 'object' && module.exports ? require('./captions.js') : null);
      const other = bilingual ? captions.at(translations, row.start + .01)?.text : '';
      return `${index + 1}\n${stamp(row.start)} --> ${stamp(row.end)}\n${row.text}${other ? '\n' + other : ''}\n`;
    }).join('\n');
  }
  const api = { defaults, normalize, srt };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else scope.FramePreferences = api;
})(globalThis);
