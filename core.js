(function (root) {
  'use strict';
  function clock(value) {
    const seconds = Math.max(0, Math.floor(Number(value) || 0));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function timestamp(value) {
    const parts = value.replace(',', '.').split(':').map(Number);
    if (parts.length < 2 || parts.length > 3 || parts.some(n => !Number.isFinite(n) || n < 0)) return NaN;
    return parts.reduce((sum, n) => sum * 60 + n, 0);
  }
  function parseSubtitles(input) {
    if (input.length > 2_000_000) throw new Error('Altyazı 2 MB sınırını aşıyor. Daha küçük bir dosya seç.');
    const clean = input.replace(/^\uFEFF/, '').replace(/\r/g, '').trim();
    const cues = [];
    for (const block of clean.split(/\n\s*\n/)) {
      const lines = block.split('\n');
      const timing = lines.findIndex(line => line.includes('-->'));
      if (timing < 0) continue;
      const pair = lines[timing].split('-->').map(s => s.trim().split(/\s/)[0]);
      const start = timestamp(pair[0]), end = timestamp(pair[1]);
      const text = lines.slice(timing + 1).join(' ').replace(/<[^>]*>/g, '').trim();
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || !text) throw new Error('Altyazı zamanları veya metni geçersiz. SRT / VTT dosyanı kontrol et.');
      cues.push({ start, end, en: text, tr: '' });
    }
    if (!cues.length) throw new Error('Zamanlı altyazı bulunamadı. SRT veya VTT seç.');
    if (cues.length > 10000) throw new Error('Bu prototip en fazla 10.000 altyazı satırı açıyor.');
    return cues.sort((a, b) => a.start - b.start);
  }
  function activeCue(cues, time) {
    // Overlapping cues choose the most recently started visible cue.
    let lo = 0, hi = cues.length - 1, index = -1;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (cues[mid].start <= time) { index = mid; lo = mid + 1; } else hi = mid - 1; }
    for (let i = index; i >= 0; i--) if (cues[i].start <= time && time < cues[i].end) return i;
    return -1;
  }
  function addCard(cards, word, cue, source) {
    const id = `${source}|${cue.start}|${word.toLowerCase()}`;
    if (cards.some(card => card.id === id)) return false;
    cards.push({ id, word, sentence: cue.en, translation: cue.tr, start: cue.start, source, status: 'new' });
    return true;
  }
  const api = { clock, timestamp, parseSubtitles, activeCue, addCard };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FrameCore = api;
})(typeof window === 'undefined' ? globalThis : window);
