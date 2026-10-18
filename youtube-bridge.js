// MAIN world: reads this video's caption metadata and the player's own caption session.
(() => {
  'use strict';
  const api = globalThis.FrameCaptions;
  let lastRequest = 0;
  const nativeCaptions = new Map(); // At most six parsed tracks, in this page's memory only.
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const currentVideo = () => new URL(location.href).searchParams.get('v');
  function trackKey(url) {
    return ['v', 'lang', 'kind', 'tlang'].map(key => url.searchParams.get(key) || '').join('|');
  }
  function captureResponse(address, text) {
    try {
      const url = timedTextUrl(address, currentVideo());
      if (typeof text !== 'string' || !text.trim() || text.length > 2500000) return;
      const cues = api.parseJson3(JSON.parse(text)); if (!cues.length) return;
      for (const key of nativeCaptions.keys()) if (!key.startsWith(currentVideo() + '|')) nativeCaptions.delete(key);
      const key = trackKey(url); nativeCaptions.delete(key); nativeCaptions.set(key, cues);
      if (nativeCaptions.size > 6) nativeCaptions.delete(nativeCaptions.keys().next().value);
    } catch { /* Unrelated, empty, oversized and malformed responses are never cached. */ }
  }
  // Install at document_start: keep the player's successful body rather than replaying a signed URL.
  const xhr = globalThis.XMLHttpRequest?.prototype;
  if (xhr) {
    const open = xhr.open;
    xhr.open = function (method, address, ...rest) {
      let caption = false;
      try { timedTextUrl(new URL(address, location.origin).href, currentVideo()); caption = true; } catch { /* Other request. */ }
      if (caption) this.addEventListener('load', function () {
        try {
          const text = this.responseType === 'json' ? JSON.stringify(this.response) : !this.responseType || this.responseType === 'text' ? this.responseText : '';
          captureResponse(this.responseURL, text);
        } catch { /* A response body can be inaccessible. */ }
      }, { once: true });
      return open.call(this, method, address, ...rest);
    };
  }
  const originalFetch = globalThis.fetch;
  if (originalFetch) globalThis.fetch = function (...args) {
    const result = originalFetch.apply(this, args);
    // Observe a clone; the original response, rejection and caller's body remain untouched.
    result.then(response => {
      try {
        const address = response.url || (typeof args[0] === 'string' ? args[0] : args[0]?.url);
        timedTextUrl(address, currentVideo());
        response.clone().text().then(text => captureResponse(address, text), () => {});
      } catch { /* Non-caption request. */ }
    }, () => {});
    return result;
  };
  async function nativeCues(player, track, translate, id) {
    const url = new URL(captionUrl(track, translate)); const key = trackKey(url);
    if (nativeCaptions.has(key)) return nativeCaptions.get(key);
    if (typeof player?.setOption !== 'function') return null;
    if (ccEnabled(player) === false) player.toggleSubtitles?.();
    const list = player.getOption?.('captions', 'tracklist') || [];
    const source = list.find(item => (item.vss_id || item.vssId) === track.vssId && track.vssId) || list.find(item => item.languageCode === track.languageCode && (item.kind || '') === (track.kind || '')) || track;
    const target = { ...source }; delete target.translationLanguage;
    if (translate) target.translationLanguage = { languageCode: translate };
    player.setOption('captions', 'track', target);
    const start = Date.now(); let nudged = false;
    do {
      if (currentVideo() !== id) throw new Error('Video değişti; altyazı isteği iptal edildi.');
      if (nativeCaptions.has(key)) return nativeCaptions.get(key);
      if (!nudged && Date.now() - start > 1600) {
        nudged = true;
        const other = list.find(item => item.languageCode !== target.languageCode || (item.kind || '') !== (target.kind || ''));
        if (other) player.setOption('captions', 'track', other);
        else { player.toggleSubtitles?.(); await sleep(100); player.toggleSubtitles?.(); }
        if (currentVideo() !== id) throw new Error('Video değişti; altyazı isteği iptal edildi.');
        player.setOption('captions', 'track', target);
      }
      await sleep(100);
    } while (Date.now() - start < 4500);
    return null;
  }
  function timedTextUrl(value, id) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['www.youtube.com', 'youtube.com'].includes(url.hostname) || url.pathname !== '/api/timedtext' || url.searchParams.get('v') !== id) throw new Error('Altyazı kaynağı geçersiz.');
    return url;
  }
  function observedSession(id) {
    const entries = globalThis.performance?.getEntriesByType('resource') || [];
    for (let index = entries.length - 1; index >= 0; index--) {
      try {
        const url = timedTextUrl(entries[index].name, id);
        const expires = Number(url.searchParams.get('expire'));
        if (url.searchParams.get('pot') && (!expires || expires > Date.now() / 1000)) return url;
      } catch { /* Other resources and other videos are not caption sessions. */ }
    }
    return null;
  }
  function ccEnabled(player) {
    const value = player?.querySelector?.('.ytp-subtitles-button')?.getAttribute('aria-pressed');
    return value === 'true' ? true : value === 'false' ? false : null;
  }
  async function prepareSession(player, id) {
    const existing = observedSession(id); if (existing) return existing;
    const wasEnabled = ccEnabled(player);
    if (wasEnabled === null || typeof player?.toggleSubtitles !== 'function') return null;
    try {
      // Metadata URLs omit the session proof. Let YouTube issue its own request.
      if (wasEnabled) player.toggleSubtitles();
      player.toggleSubtitles();
      const deadline = Date.now() + 3500;
      do {
        if (new URL(location.href).searchParams.get('v') !== id) throw new Error('Video değişti; altyazı isteği iptal edildi.');
        const session = observedSession(id); if (session) return session;
        await new Promise(resolve => setTimeout(resolve, 100));
      } while (Date.now() < deadline);
      return null;
    } finally {
      if (new URL(location.href).searchParams.get('v') === id && ccEnabled(player) !== wasEnabled && ccEnabled(player) !== null) player.toggleSubtitles();
    }
  }
  function captionUrl(track, translate, session) {
    const url = timedTextUrl(track.baseUrl, new URL(location.href).searchParams.get('v'));
    if (session) for (const key of ['pot', 'potc', 'c', 'cver', 'cbr', 'cbrver', 'cplayer', 'cos', 'cosver', 'cplatform', 'xorb', 'xobt', 'xovt']) {
      if (session.searchParams.has(key)) url.searchParams.set(key, session.searchParams.get(key));
    }
    url.searchParams.set('fmt', 'json3');
    url.searchParams.delete('tlang');
    if (translate) url.searchParams.set('tlang', translate);
    return url.href;
  }
  async function fetchCues(track, translate, session) {
    const response = await fetch(captionUrl(track, translate, session), { credentials: 'same-origin', signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('YouTube altyazı kaynağına erişilemedi (' + response.status + ').');
    const text = await response.text();
    if (!text.trim()) throw new Error('YouTube boş altyazı yanıtı döndürdü. Oynatıcı altyazı oturumu alınamadı; Frame panelinden yeniden dene.');
    if (text.length > 2500000) throw new Error('YouTube altyazı yanıtı 2,5 MB sınırından büyük.');
    let data;
    try { data = JSON.parse(text); } catch { throw new Error('YouTube JSON3 yerine okunamayan bir altyazı yanıtı döndürdü.'); }
    const cues = api.parseJson3(data);
    if (!cues.length) throw new Error('Bu parçada zamanlı altyazı bulunamadı.');
    return cues;
  }
  window.addEventListener('message', async event => {
    const request = event.data;
    if (event.source !== window || event.origin !== location.origin || request?.channel !== 'frame-captions-request' || typeof request.token !== 'string' || request.token.length > 100) return;
    if (Date.now() - lastRequest < 800) return; lastRequest = Date.now();
    const id = new URL(location.href).searchParams.get('v');
    if (!id || request.videoId !== id || location.pathname !== '/watch') return;
    const reply = { channel: 'frame-captions-response', token: request.token, videoId: id };
    try {
      const player = document.getElementById('movie_player');
      const response = player?.getPlayerResponse?.() || window.ytInitialPlayerResponse;
      if (response?.videoDetails?.videoId !== id) throw new Error('Video bilgisi henüz hazır değil; yeniden yükle.');
      const tracks = response.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      const english = tracks.find(track => /^en(?:-|$)/.test(track.languageCode) && track.kind !== 'asr') || tracks.find(track => /^en(?:-|$)/.test(track.languageCode));
      const turkish = tracks.find(track => /^tr(?:-|$)/.test(track.languageCode) && track.kind !== 'asr') || tracks.find(track => /^tr(?:-|$)/.test(track.languageCode));
      if (!english && !turkish) throw new Error('İngilizce veya Türkçe altyazı kaynağı bulunamadı. Ses dökümü henüz eklenmedi.');
      if (!english && !turkish.isTranslatable) throw new Error('Türkçe altyazı var, ancak YouTube İngilizce çeviriye izin vermiyor.');
      for (const track of [english, turkish].filter(Boolean)) captionUrl(track);
      const wasEnabled = ccEnabled(player);
      const previousTrack = player?.getOption?.('captions', 'track');
      let results;
      try {
        const session = await prepareSession(player, id);
        const acquire = async (track, translate) => {
          const native = await nativeCues(player, track, translate, id);
          return native || fetchCues(track, translate, observedSession(id) || session);
        };
        // The native player has one selected track. Acquire sequentially to avoid racing languages.
        const settle = async task => { try { return { status: 'fulfilled', value: await task() }; } catch (reason) { return { status: 'rejected', reason }; } };
        results = [await settle(() => english ? acquire(english, null) : acquire(turkish, 'en'))];
        results.push(await settle(() => turkish ? acquire(turkish, null) : english.isTranslatable ? acquire(english, 'tr') : Promise.reject(new Error('Türkçe parçası veya YouTube çevirisi yok.'))));
      } finally {
        if (currentVideo() === id) {
          if (previousTrack && typeof player?.setOption === 'function') player.setOption('captions', 'track', previousTrack);
          const enabled = ccEnabled(player);
          if (wasEnabled !== null && enabled !== null && enabled !== wasEnabled) player.toggleSubtitles?.();
        }
      }
      if (results[0].status !== 'fulfilled') throw results[0].reason;
      reply.en = results[0].value;
      reply.tr = results[1].status === 'fulfilled' ? results[1].value : [];
      reply.translationError = results[1].status === 'rejected' ? String(results[1].reason?.message || 'Türkçe altyazı alınamadı.') : '';
      reply.translationSource = !english ? 'Türkçe kaynak + YouTube İngilizce çeviri' : turkish ? 'Türkçe altyazı' : 'YouTube otomatik çeviri';
      reply.ok = true;
    } catch (error) { reply.ok = false; reply.error = String(error.message || 'Altyazı alınamadı.').slice(0, 400); }
    window.postMessage(reply, location.origin);
  });
})();
