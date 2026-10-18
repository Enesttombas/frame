(function (scope) {
  'use strict';
  function normalize(rows) {
    if (!Array.isArray(rows) || rows.length > 10000) throw new Error('Altyazı boyutu geçersiz.');
    return rows.filter(row => row && Number.isFinite(row.start) && Number.isFinite(row.end) && row.start >= 0 && row.end > row.start && typeof row.text === 'string')
      .map(row => ({ start: row.start, end: row.end, text: row.text.replace(/\s+/g, ' ').trim().slice(0, 4000) })).filter(row => row.text).sort((a, b) => a.start - b.start);
  }
  function parseJson3(data) {
    if (!Array.isArray(data?.events) || data.events.length > 20000) throw new Error('YouTube zamanlı altyazı yanıtı okunamadı.');
    const rows = data.events.filter(event => Array.isArray(event.segs)).map(event => ({
      start: Number(event.tStartMs) / 1000,
      end: (Number(event.tStartMs) + Number(event.dDurationMs || 0)) / 1000,
      text: event.segs.map(segment => typeof segment.utf8 === 'string' ? segment.utf8 : '').join('')
    }));
    return normalize(rows);
  }
  function at(rows, time) {
    // Prefer the latest active row for overlapping rolling captions; never retain a cue in a gap.
    let low = 0, high = rows.length - 1, index = -1;
    while (low <= high) { const middle = (low + high) >> 1; if (rows[middle].start <= time) { index = middle; low = middle + 1; } else high = middle - 1; }
    for (let i = index; i >= 0; i--) if (time < rows[i].end) return rows[i];
    return null;
  }
  const api = { normalize, parseJson3, at };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else scope.FrameCaptions = api;
})(globalThis);
