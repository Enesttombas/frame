// Local DOM integration harness. Never included in manifest content_scripts.
history.replaceState(null, '', '/watch?v=frame-fixture');
let fixtureEnabled = true;
let fixtureNoCaptions = false;
document.querySelector('video').addEventListener('timeupdate', event => { const seconds = Math.floor(event.target.currentTime); document.querySelector('.ytp-time-display').textContent = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0') + ' / 0:39'; });
document.getElementById('fixture-seek').onclick = () => { document.querySelector('video').currentTime = 20.2; };
document.getElementById('fixture-gap').onclick = () => { document.querySelector('video').currentTime = 39.59; };
document.getElementById('fixture-no-captions').onclick = () => { fixtureNoCaptions = !fixtureNoCaptions; };
window.addEventListener('message', event => {
  if (event.source !== window || event.origin !== location.origin || event.data?.channel !== 'frame-captions-request') return;
  const rows = FRAME_LESSON.cues.map((cue, i) => ({ start: FRAME_TIMINGS[i].start, end: i === 7 ? 38 : FRAME_TIMINGS[i].end, text: cue.en }));
  const tr = FRAME_LESSON.cues.map((cue, i) => ({ ...rows[i], text: cue.tr }));
  window.postMessage({ channel: 'frame-captions-response', token: event.data.token, videoId: event.data.videoId, ok: !fixtureNoCaptions, en: rows, tr, translationSource: 'Yerel test Türkçe parçası', error: 'Test: Bu videoda erişilebilir İngilizce altyazı yok.' }, location.origin);
});
document.getElementById('fixture-app').onclick = event => { fixtureEnabled = !fixtureEnabled; event.currentTarget.textContent = fixtureEnabled ? 'Tepsi bağlantısını kapat' : 'Tepsi bağlantısını aç'; };
document.getElementById('fixture-play').onclick = () => { const playerVideo = document.querySelector('video'); if (playerVideo.paused) playerVideo.play(); else playerVideo.pause(); };
document.getElementById('fixture-fullscreen').onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.getElementById('movie_player').requestFullscreen();
document.getElementById('fixture-controls').onclick = event => { const controls = document.querySelector('.ytp-right-controls'); if (controls) { controls.remove(); event.currentTarget.disabled = true; } };
window.chrome = { runtime: { sendMessage: async message => {
  if (message.type === 'APP_STATE') return { ok: true, connected: true, enabled: fixtureEnabled };
  if (message.type === 'UPSERT_CARD') { document.getElementById('result').textContent = 'KAYDEDİLDİ: ' + JSON.stringify(message.card); return { ok: true }; }
  if (message.type === 'OPEN_APP') return { ok: true };
  if (message.type === 'OPEN_SETTINGS') { document.getElementById('result').textContent = 'Model ayarları: gerçek eklentide options_page açılır.'; return { ok: true }; }
  if (message.type === 'AI_STATUS') return { ok: true, model: '' };
  if (message.type === 'GET_PREFERENCES') return { ok: true, preferences: JSON.parse(localStorage.getItem('frame-fixture-preferences') || '{}') };
  if (message.type === 'SET_PREFERENCES') { localStorage.setItem('frame-fixture-preferences', JSON.stringify(message.preferences)); return { ok: true }; }
  return { ok: false, error: 'Test düzeneğinde AI kapalı.' };
} } };
