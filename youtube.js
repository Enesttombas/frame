(() => {
  'use strict';
  if (document.getElementById('frame-learning-host')) return;
  let video = null, currentId = '', current = null, selected = null, loop = null, attached = false, panelOpen = false, lastText = '', appEnabled = false, requestVersion = 0;
  const trail = [];
  let englishCues = [], turkishCues = [], captionVersion = 0, captionState = 'loading', captionError = '', translationError = '', translationSource = '', modelFailed = false, modelBusy = false;
  const modelTranslations = new Map(), pendingCaptions = new Map();
  let preferences = FramePreferences.normalize(), panelControls = null, previousTime = null, hoverResume = false;
  const captions = document.createElement('div'); captions.id = 'frame-dual-captions';
  captions.style.cssText = 'position:absolute;left:6%;right:6%;bottom:76px;z-index:59;pointer-events:none;text-align:center;';
  const captionRoot = captions.attachShadow({ mode: 'open' });
  const captionStyle = document.createElement('style'); captionStyle.textContent = ':host{color-scheme:dark}.lines{display:inline-flex;flex-direction:column;gap:4px;max-width:100%;padding:9px 15px;border-radius:8px;background:#0c1715d9;box-shadow:0 2px 14px #0005;font-family:Segoe UI,Arial,sans-serif;line-height:1.4;text-shadow:0 1px 3px #000}.en,.tr{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.en{color:#fff;font-size:clamp(16px,2.1vw,29px);font-weight:600}.tr{color:#d4e3aa;font-size:clamp(14px,1.7vw,24px)}.notice{font-size:13px;font-weight:400}.lines[hidden]{display:none}@media(max-width:650px){.lines{padding:6px 9px}.en{font-size:16px}.tr{font-size:14px}}';
  const captionLines = document.createElement('div'); captionLines.className = 'lines';
  const englishLine = document.createElement('p'); englishLine.className = 'en'; englishLine.lang = 'en';
  const turkishLine = document.createElement('p'); turkishLine.className = 'tr'; turkishLine.lang = 'tr';
  captionLines.append(englishLine, turkishLine); captionRoot.append(captionStyle, captionLines);
  const nativeCaptionStyle = document.createElement('style'); nativeCaptionStyle.textContent = '#movie_player.frame-own-captions .ytp-caption-window-container{visibility:hidden!important}';
  window.addEventListener('message', event => {
    const data = event.data;
    if (event.source !== window || event.origin !== location.origin || data?.channel !== 'frame-captions-response') return;
    const pending = pendingCaptions.get(data.token); if (!pending || data.videoId !== pending.id) return;
    clearTimeout(pending.timer); pendingCaptions.delete(data.token); pending.resolve(data);
  });
  function requestCaptions(id) {
    const token = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pendingCaptions.delete(token); reject(new Error('Altyazı kaynağı yanıt vermedi. Panelden yeniden yükle.')); }, 30000);
      pendingCaptions.set(token, { id, resolve, timer });
      window.postMessage({ channel: 'frame-captions-request', token, videoId: id }, location.origin);
    });
  }
  async function loadCaptions() {
    const version = ++captionVersion; const id = currentId;
    captionState = 'loading'; captionError = ''; englishCues = []; turkishCues = []; modelTranslations.clear(); modelFailed = false; current = null; lastText = ''; trail.length = 0;
    selected = null; loop = null; requestVersion++; answer.textContent = ''; translation.hidden = true;
    sentence.textContent = 'Frame altyazıları hazırlanıyor…'; time.textContent = 'Altyazı bekleniyor'; repeat.classList.remove('on'); repeat.textContent = 'Cümleyi döngüle';
    updateCaption();
    try {
      const data = await requestCaptions(id); if (version !== captionVersion || id !== currentId) return;
      if (!data.ok) throw new Error(data.error || 'Altyazı alınamadı.');
      englishCues = FrameCaptions.normalize(data.en); turkishCues = FrameCaptions.normalize(data.tr);
      if (!englishCues.length) throw new Error('İngilizce altyazı bulunamadı.');
      translationError = String(data.translationError || '').slice(0, 400); translationSource = String(data.translationSource || '').slice(0, 80);
      captionState = 'ready'; tell(turkishCues.length ? '' : 'Türkçe parçası yok; bağlı yerel modelle çevrilecek.');
    } catch (error) { if (version !== captionVersion) return; captionState = 'error'; captionError = error.message; sentence.textContent = 'Bu video için altyazı alınamadı.'; tell(captionError); }
    updateCaption(); panelControls?.refresh();
  }
  async function pretranslate(cue) {
    if (!cue || modelBusy || modelFailed || modelTranslations.has(cue.text)) return;
    const version = captionVersion; modelBusy = true;
    try { const result = await send('TRANSLATE', { text: cue.text }); if (version === captionVersion) modelTranslations.set(cue.text, result.answer); }
    catch (error) { if (version === captionVersion) { modelFailed = true; translationError = error.message; } }
    finally { modelBusy = false; }
  }
  function removeIntegration() {
    host.parentElement?.classList.remove('frame-own-captions');
    host.remove(); launcher.remove(); captions.remove(); nativeCaptionStyle.remove(); attached = false;
  }
  const host = document.createElement('div'); host.id = 'frame-learning-host'; host.hidden = true; host.style.cssText = 'position:absolute;bottom:64px;right:14px;z-index:60;max-width:calc(100% - 28px);font-size:14px;line-height:1.5;';
  const root = host.attachShadow({ mode: 'open' });
  const launcher = document.createElement('button'); launcher.id = 'frame-player-button'; launcher.type = 'button'; launcher.className = 'ytp-button';
  launcher.setAttribute('aria-controls', host.id); launcher.setAttribute('aria-expanded', 'false');
  const launcherIcon = document.createElement('span'); launcherIcon.textContent = 'f.';
  launcherIcon.style.cssText = 'display:inline-flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:8px;background:#7551db;color:#ffffff;font:700 26px/1 Georgia,serif;pointer-events:none;';
  launcher.append(launcherIcon);
  function setPanelOpen(open) {
    panelOpen = open; host.hidden = !open; launcher.setAttribute('aria-expanded', String(open));
    const label = open ? 'Frame öğrenme araçlarını kapat' : 'Frame öğrenme araçlarını aç'; launcher.setAttribute('aria-label', label); launcher.title = label;
    launcherIcon.style.background = open ? '#bba9ff' : '#7551db'; launcherIcon.style.color = open ? '#211735' : '#ffffff';
    host.style.display = open ? 'block' : 'none'; layoutPanel();
  }
  setPanelOpen(false);
  launcher.onclick = event => { event.stopPropagation(); setPanelOpen(!panelOpen); if (panelOpen) root.querySelector('[role=tab][aria-selected=true]')?.focus({ preventScroll: true }); };
  for (const name of ['click', 'dblclick', 'keydown', 'keyup']) { host.addEventListener(name, event => event.stopPropagation()); launcher.addEventListener(name, event => event.stopPropagation()); }
  root.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); setPanelOpen(false); launcher.focus({ preventScroll: true }); } });
  const style = document.createElement('style'); style.textContent = '*{box-sizing:border-box}button{font:inherit;cursor:pointer;border:0}';
  const panel = document.createElement('section'); panel.className = 'panel'; panel.setAttribute('aria-label', 'Frame video öğrenme');
  const head = document.createElement('div'); head.className = 'head';
  const logo = document.createElement('span'); logo.className = 'logo'; logo.textContent = 'frame';
  const status = document.createElement('span'); status.className = 'status'; status.textContent = 'YouTube · bağlı';
  const minimize = document.createElement('button'); minimize.className = 'min'; minimize.textContent = '×'; minimize.setAttribute('aria-label', 'Frame panelini kapat');
  head.append(logo, status, minimize);
  const body = document.createElement('div'); body.className = 'body';
  const hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = 'Kelimeye dokun, cümlesiyle öğren.';
  const sentence = document.createElement('div'); sentence.className = 'sentence'; sentence.textContent = 'Frame altyazıları hazırlanıyor…';
  const translation = document.createElement('p'); translation.className = 'translation'; translation.hidden = true;
  const tools = document.createElement('div'); tools.className = 'tools';
  function button(label, action, className) { const element = document.createElement('button'); element.textContent = label; element.onclick = action; if (className) element.className = className; return element; }
  const message = document.createElement('p'); message.className = 'message'; message.setAttribute('role', 'status');
  const answer = document.createElement('div'); answer.className = 'answer';
  async function send(type, payload = {}) { const result = await chrome.runtime.sendMessage({ type, ...payload }); if (!result?.ok) throw new Error(result?.error || 'Frame bağlantısı kesildi. Eklentiyi yenilediysen sayfayı yenile.'); return result; }
  function tell(text) { message.textContent = text; }
  const cc = button('Altyazıları yeniden yükle', () => { selected = null; requestVersion++; translation.hidden = true; answer.textContent = ''; loadCaptions(); }); cc.className = 'enable';
  const repeat = button('Cümleyi döngüle', () => {
    const target = selected || current; if (!target || !video) return tell('Önce bir altyazı cümlesi yakalanmalı.');
    if (loop) { loop = null; repeat.classList.remove('on'); repeat.textContent = 'Cümleyi döngüle'; return; }
    const next = trail.find(item => item.start > target.start + .2);
    loop = { start: Math.max(0, target.start + preferences.delay), end: (target.end || next?.start || target.start + 1.4) + preferences.delay };
    video.currentTime = loop.start; video.play().catch(() => tell('Videoyu oynat düğmesiyle başlat.')); repeat.classList.add('on'); repeat.textContent = 'Döngüyü kapat';
    if (!target.end && !next) tell('Canlı altyazının bitişi henüz kesin değil; döngü yaklaşık sınıra dayanır.');
  });
  const explain = button('Bağlamı açıkla', async () => {
    if (!selected?.word) return tell('Önce cümledeki bir kelimeyi seç.');
    const version = ++requestVersion; explain.disabled = true; tell('Yerel model açıklıyor…');
    try { const response = await send('EXPLAIN', { text: selected.text, word: selected.word }); if (version === requestVersion) { answer.textContent = response.answer; tell('Yerel AI açıklaması · doğruluğunu bağlamla kontrol et.'); } }
    catch (error) { tell(error.message); } finally { explain.disabled = false; }
  });
  const translate = button('Türkçesini göster', async () => {
    const target = selected || current; if (!target) return tell('Önce altyazı cümlesini yakala.');
    const version = ++requestVersion; translate.disabled = true; tell('Yerel model çeviriyor…');
    try { const response = await send('TRANSLATE', { text: target.text }); if (version === requestVersion) { translation.textContent = response.answer; translation.hidden = false; target.translation = response.answer; tell('Çeviri bu cümle için üretildi.'); } }
    catch (error) { tell(error.message); } finally { translate.disabled = false; }
  });
  const save = button('Kelimeyi kaydet', async () => {
    const target = selected; if (!target?.word) return tell('Önce cümledeki bir kelimeye dokun.');
    const source = 'YouTube:' + currentId; const start = Math.floor(target.start);
    const card = { id: source + '|' + start + '|' + target.word.toLowerCase(), word: target.word, sentence: target.text, translation: target.translation || '', meaning: answer.textContent, source, start: target.start, url: 'https://www.youtube.com/watch?v=' + currentId + '&t=' + start + 's', status: 'new' };
    save.disabled = true; try { await send('UPSERT_CARD', { card }); tell('Kaydedildi. Frame kütüphanesinde seni bekliyor.'); } catch (error) { tell(error.message); } finally { save.disabled = false; }
  }, 'save');
  tools.append(repeat, explain, translate, save);
  const bottom = document.createElement('div'); bottom.className = 'bottom';
  const time = document.createElement('span'); time.className = 'time'; time.textContent = 'Altyazı bekleniyor';
  const library = button('Kartlarımı aç', () => send('OPEN_APP').catch(error => tell(error.message)));
  const resume = button('Canlıya dön', () => { selected = null; answer.textContent = ''; translation.hidden = true; requestVersion++; renderSentence(); tell('Canlı altyazı takip ediliyor.'); });
  bottom.append(time, resume, library); body.append(hint, cc, sentence, translation, tools, answer, message, bottom); panel.append(head, body); root.append(style, panel);
  function applyPreferences(value) {
    preferences = value;
    const bounds = video?.getBoundingClientRect(), scale = Math.min(1, (bounds?.width || 700) / 700);
    captions.style.bottom = Math.min(value.bottom, bounds ? Math.max(12, bounds.height * .25) : value.bottom) + 'px';
    englishLine.style.fontSize = Math.max(12, value.englishSize * scale) + 'px'; turkishLine.style.fontSize = Math.max(11, value.turkishSize * scale) + 'px';
    englishLine.hidden = value.display === 'tr'; turkishLine.hidden = value.display === 'en';
    englishLine.style.order = value.order === 'tr-first' ? '2' : '0';
    const colors = { forest: ['12,23,21', '#ffffff', '#d4e3aa'], night: ['10,12,18', '#ffffff', '#b7d6ff'], paper: ['249,246,235', '#17291e', '#365f43'] }[value.theme];
    captionLines.style.background = `rgba(${colors[0]},${value.opacity / 100})`;
    captionLines.style.textShadow = value.theme === 'paper' ? 'none' : '0 1px 3px #000';
    englishLine.style.color = colors[1]; turkishLine.style.color = colors[2];
    captionLines.style.pointerEvents = value.hoverPause ? 'auto' : 'none';
    if (video) video.playbackRate = value.speed;
    updateCaption();
  }
  captionLines.addEventListener('mouseenter', () => { if (preferences.hoverPause && video && !video.paused) { hoverResume = true; video.pause(); } });
  captionLines.addEventListener('mouseleave', () => { if (hoverResume) { hoverResume = false; if (preferences.hoverPause && video) video.play().catch(() => {}); } });
  panelControls = FramePanel.mount({ root, panel, learning: body, send, notice: tell, apply: applyPreferences,
    snapshot: () => ({ en: englishCues, tr: turkishCues, current: selected || current, id: currentId }),
    seek: start => { if (!video) return; selected = null; loop = null; repeat.classList.remove('on'); repeat.textContent = 'Cümleyi döngüle'; video.currentTime = Math.max(0, start + preferences.delay + .01); previousTime = null; updateCaption(); }
  });
  function adjacent(direction) {
    if (!video || !englishCues.length) return tell('Önce altyazı yüklenmeli.');
    const target = selected || current; const index = target ? englishCues.findIndex(cue => cue.start === target.start) : englishCues.findIndex(cue => cue.start >= video.currentTime - preferences.delay);
    const cue = englishCues[Math.max(0, Math.min(englishCues.length - 1, index + direction))];
    selected = null; previousTime = null; video.currentTime = Math.max(0, cue.start + preferences.delay + .01); updateCaption();
  }
  const transport = document.createElement('div'); transport.className = 'transport';
  const previous = button('Önceki', () => adjacent(-1)), next = button('Sonraki', () => adjacent(1));
  previous.setAttribute('aria-label', 'Önceki cümle'); next.setAttribute('aria-label', 'Sonraki cümle');
  repeat.classList.add('repeat'); transport.append(previous, next, repeat); body.insertBefore(transport, sentence);
  cc.remove(); bottom.append(cc);

  minimize.onclick = () => { setPanelOpen(false); launcher.focus({ preventScroll: true }); };
  function renderSentence() {
    const target = selected || current; if (!target) return;
    sentence.replaceChildren();
    for (const token of target.text.matchAll(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)?|[^\p{L}\p{M}]+/gu)) {
      const value = token[0];
      if (!/\p{L}/u.test(value)) { sentence.append(document.createTextNode(value)); continue; }
      const word = button(value, () => { video?.pause(); selected = { ...target, word: value }; requestVersion++; answer.textContent = ''; translation.hidden = true; tell('Seçili kelime: ' + value); renderSentence(); });
      if (selected?.word === value) word.className = 'chosen'; sentence.append(word);
    }
    time.textContent = Math.floor(target.start / 60) + ':' + String(Math.floor(target.start % 60)).padStart(2, '0');
    translation.textContent = target.translation || ''; translation.hidden = !target.translation;
  }
  function updateCaption() {
    if (!attached || !video || !appEnabled) return;
    const player = video.closest('#movie_player');
    const isAd = player?.classList.contains('ad-showing'); captions.hidden = !!isAd || preferences.display === 'off';
    player?.classList.toggle('frame-own-captions', !isAd && preferences.display !== 'off' && captionState === 'ready');
    if (isAd) return;
    if (loop && (video.currentTime >= loop.end || video.currentTime < loop.start - .2)) { video.currentTime = loop.start; return; }
    if (captionState !== 'ready') {
      captionLines.hidden = false; englishLine.classList.add('notice'); englishLine.textContent = captionState === 'loading' ? 'Frame · çift altyazı hazırlanıyor…' : 'Frame · altyazı alınamadı';
      turkishLine.classList.add('notice'); turkishLine.textContent = captionError || 'YouTube altyazı düğmesini açman gerekmiyor.'; return;
    }
    englishLine.classList.remove('notice'); turkishLine.classList.remove('notice');
    const at = video.currentTime - preferences.delay;
    const advanced = previousTime !== null && at > previousTime && at - previousTime < 1;
    previousTime = at;
    if (preferences.autoPause && !video.paused && !loop && advanced && current && at >= current.end) video.pause();
    const cue = FrameCaptions.at(englishCues, at);
    captionLines.hidden = !cue;
    if (!cue) { current = null; lastText = ''; englishLine.textContent = ''; turkishLine.textContent = ''; if (!selected) { sentence.textContent = 'Bu aralıkta konuşma altyazısı yok.'; translation.hidden = true; } return; }
    const tr = FrameCaptions.at(turkishCues, at)?.text || modelTranslations.get(cue.text) || '';
    englishLine.textContent = cue.text; turkishLine.textContent = tr || (modelFailed ? 'Türkçe çeviri kullanılamıyor · Frame ayarlarından yerel modeli bağla.' : 'Türkçe çeviri hazırlanıyor…');
    if (!tr) pretranslate(cue);
    if (!turkishCues.length && tr) pretranslate(englishCues[englishCues.indexOf(cue) + 1]);
    if (current?.start === cue.start && lastText === cue.text) { current.translation = tr; if (!selected) { translation.textContent = tr; translation.hidden = !tr; } return; }
    current = { text: cue.text, start: cue.start, end: cue.end, translation: tr }; trail.push(current); if (trail.length > 80) trail.shift(); lastText = cue.text;
    if (!selected) { answer.textContent = ''; requestVersion++; renderSentence(); }
  }
  function attach() {
    const id = new URL(location.href).searchParams.get('v'); const player = document.querySelector('#movie_player'); const nextVideo = player?.querySelector('video');
    if (!appEnabled || location.pathname !== '/watch' || !id || !player || !nextVideo) { removeIntegration(); return; }
    let changed = false;
    if (currentId !== id || video !== nextVideo) {
      removeIntegration(); changed = true;
      video?.removeEventListener('timeupdate', updateCaption); video = nextVideo; currentId = id; current = null; selected = null; loop = null; lastText = ''; trail.length = 0; requestVersion++; answer.textContent = ''; translation.hidden = true; repeat.classList.remove('on'); repeat.textContent = 'Cümleyi döngüle';
      sentence.textContent = 'Frame altyazıları hazırlanıyor…'; tell(''); previousTime = null; hoverResume = false; video.playbackRate = preferences.speed; video.addEventListener('timeupdate', updateCaption);
      panelSize.disconnect(); panelSize.observe(player);
    }
    const controls = player.querySelector('.ytp-right-controls');
    if (controls) {
      launcher.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;vertical-align:top;width:40px;height:100%;padding:0;border:0;background:transparent;cursor:pointer;';
      if (launcher.parentNode !== controls) controls.append(launcher);
    } else {
      launcher.style.cssText = 'position:absolute;right:14px;bottom:12px;z-index:61;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;border:0;background:transparent;cursor:pointer;';
      if (launcher.parentNode !== player) player.append(launcher);
    }
    if (host.parentNode !== player) player.append(host);
    if (captions.parentNode !== player) player.append(captions, nativeCaptionStyle);
    attached = true; if (changed) loadCaptions(); else updateCaption();
  }
  async function checkApp() { try { const result = await send('APP_STATE'); appEnabled = result.connected && result.enabled; attach(); } catch { appEnabled = false; removeIntegration(); } }
  function layoutPanel() {
    const player = host.parentElement;
    if (!player || !video) return;
    const bounds = player.getBoundingClientRect();
    const compact = bounds.height < 380 || bounds.width < 640;
    host.style.position = compact ? 'fixed' : 'absolute';
    host.style.right = compact ? '12px' : '16px'; host.style.bottom = compact ? '12px' : '64px';
    host.style.maxWidth = compact ? 'calc(100vw - 24px)' : 'calc(100% - 32px)';
    host.style.setProperty('--frame-panel-body-height', Math.max(140, Math.min(470, (compact ? window.innerHeight - 128 : bounds.height - 176))) + 'px');
    // Keep the live pair readable beside the menu on a wide player.
    captions.style.right = panelOpen && !compact && bounds.width > 820 ? '420px' : '6%';
    captions.style.left = panelOpen && !compact && bounds.width > 820 ? '3%' : '6%';
  }
  const panelSize = new ResizeObserver(() => { layoutPanel(); applyPreferences(preferences); });
  window.addEventListener('resize', layoutPanel);
  document.addEventListener('yt-navigate-finish', attach);
  setInterval(checkApp, 2500); setInterval(updateCaption, 100); checkApp();
})();
