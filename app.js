'use strict';
const $ = id => document.getElementById(id);
const core = window.FrameCore, lesson = window.FRAME_LESSON, video = $('video');
const demoCues = lesson.cues.map((cue, i) => ({ ...cue, ...window.FRAME_TIMINGS[i] }));
const state = { cues: demoCues, source: lesson.title, demo: true, active: -1, selectedIndex: 0, word: 'overlook', cards: [], loopIndex: null, follow: true, reviewIndex: 0, view: 'learn', urls: [], completed: 0 };
let toastTimer, currentRendered = -2;
function svg(name) { const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); const use = document.createElementNS('http://www.w3.org/2000/svg', 'use'); use.setAttribute('href', `#i-${name}`); icon.append(use); return icon; }
function notify(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3400); }
function tokens(text, focus) {
  const result = []; let position = 0;
  if (focus) {
    const index = text.toLowerCase().indexOf(focus.toLowerCase());
    if (index >= 0) { result.push(...tokens(text.slice(0, index))); result.push({ text: text.slice(index, index + focus.length), word: focus, focus: true }); position = index + focus.length; }
  }
  const remainder = text.slice(position);
  for (const part of remainder.matchAll(/[A-Za-z]+(?:['’][A-Za-z]+)?|[^A-Za-z]+/g)) {
    result.push({ text: part[0], word: /^[A-Za-z]/.test(part[0]) ? part[0].toLowerCase() : null });
  }
  return result;
}
function appendWords(container, cue, index) {
  container.replaceChildren();
  for (const token of tokens(cue.en, cue.focus)) {
    if (!token.word) { container.append(document.createTextNode(token.text)); continue; }
    const button = document.createElement('button'); button.className = 'word'; button.textContent = token.text;
    button.dataset.word = token.word; button.dataset.cue = index;
    if (token.focus) button.classList.add('focus-word');
    if (token.word === state.word && index === state.selectedIndex) button.classList.add('selected');
    button.setAttribute('aria-label', `${token.text}: anlamını incele`);
    container.append(button);
  }
}
function renderTranscript() {
  const fragment = document.createDocumentFragment();
  state.cues.forEach((cue, index) => {
    const row = document.createElement('article'); row.className = 'cue-row'; row.dataset.index = index;
    const meta = document.createElement('div'); meta.className = 'cue-meta';
    const seek = document.createElement('button'); seek.className = 'cue-time'; seek.textContent = core.clock(cue.start); seek.dataset.seek = index; seek.setAttribute('aria-label', `${core.clock(cue.start)} zamanına git`);
    const number = document.createElement('span'); number.className = 'cue-number'; number.textContent = String(index + 1).padStart(2, '0');
    meta.append(seek, number);
    const english = document.createElement('p'); english.className = 'cue-english'; appendWords(english, cue, index);
    const turkish = document.createElement('p'); turkish.className = 'cue-translation'; turkish.textContent = cue.tr || 'Bu dosya için çeviri eklenmedi.'; turkish.hidden = !$('show-tr').checked;
    row.append(meta, english, turkish); fragment.append(row);
  });
  $('transcript').replaceChildren(fragment); $('cue-count').textContent = `${state.cues.length} cümle`;
  filterTranscript(); currentRendered = -2; sync();
}
function filterTranscript() {
  const query = $('search').value.trim().toLocaleLowerCase('tr');
  for (const row of $('transcript').children) row.hidden = !row.textContent.toLocaleLowerCase('tr').includes(query);
}
function updateSelection() {
  for (const element of document.querySelectorAll('[data-word]')) element.classList.toggle('selected', element.dataset.word === state.word && Number(element.dataset.cue) === state.selectedIndex);
  const entry = state.demo ? lesson.dictionary[state.word.toLowerCase()] : null;
  $('selected-word').textContent = state.word;
  $('word-phonetic').textContent = entry?.phonetic || '';
  $('word-type').textContent = entry?.type || 'kaynak cümleden';
  $('word-meaning').textContent = entry?.meaning || 'Bu kelime için açıklama henüz yok.';
  $('word-explanation').textContent = entry?.explanation || 'Örnek sözlükte altı çizili sekiz ifade var. Bu kelimeyi kaynak cümlesiyle kaydedebilirsin; serbest metin açıklaması için gerçek sözlük / AI bağlantısı sonraki aşamada.';
  $('word-example').textContent = entry?.example || state.cues[state.selectedIndex]?.en || '';
  $('word-example-tr').textContent = entry?.exampleTr || state.cues[state.selectedIndex]?.tr || '';
  $('word-family').textContent = entry?.family || 'Anlam uydurulmadı · kaynak bağlamı korunur';
  const cue = state.cues[state.selectedIndex];
  const saved = state.cards.some(card => card.id === `${state.source}|${cue.start}|${state.word.toLowerCase()}`);
  $('save-word').replaceChildren(svg(saved ? 'check' : 'plus'), document.createTextNode(saved ? 'Kartlarına eklendi' : 'Kartlarıma ekle')); $('save-word').disabled = saved;
}
function selectWord(word, index) {
  video.pause(); state.word = word; state.selectedIndex = index;
  if (state.active !== index) { if (state.loopIndex !== null) state.loopIndex = index; video.currentTime = state.cues[index].start + .01; sync(); }
  updateSelection(); $('context-heading').scrollIntoView({ block: 'center', behavior: 'smooth' });
}
function goTo(index, play = true) {
  index = Math.max(0, Math.min(state.cues.length - 1, index));
  if (!state.cues[index]) return;
  if (state.loopIndex !== null) state.loopIndex = index;
  video.currentTime = state.cues[index].start + 0.01; sync();
  if (play) video.play().catch(() => notify('Videoyu başlatmak için oynat düğmesine bas.'));
}
function sync() {
  const time = video.currentTime;
  if (state.loopIndex !== null) {
    const cue = state.cues[state.loopIndex];
    if (cue && (time >= cue.end - 0.06 || time < cue.start - 0.15)) { video.currentTime = cue.start + 0.01; return; }
  }
  state.active = core.activeCue(state.cues, time);
  $('time').textContent = `${core.clock(time)} / ${core.clock(video.duration)}`;
  $('seek').value = Number.isFinite(video.duration) && video.duration > 0 ? time / video.duration * 100 : 0;
  if (currentRendered === state.active) return;
  currentRendered = state.active;
  for (const row of $('transcript').children) {
    const active = Number(row.dataset.index) === state.active; row.classList.toggle('active', active);
    if (active && state.follow && !row.hidden) $('transcript').scrollTo({ top: row.offsetTop - $('transcript').firstElementChild.offsetTop - 100, behavior: 'smooth' });
  }
  const cue = state.cues[state.active];
  $('video-caption').hidden = !cue;
  if (cue) { appendWords($('caption-en'), cue, state.active); $('caption-tr').textContent = cue.tr; $('caption-tr').hidden = !$('show-tr').checked || !cue.tr; }
  $('current-cue-label').textContent = `${String(Math.max(0, state.active) + 1).padStart(2, '0')} / ${String(state.cues.length).padStart(2, '0')}`;
}
function setView(view) {
  state.view = view; $('workspace').hidden = view !== 'learn'; $('review-view').hidden = view !== 'review';
  $('learn-nav').classList.toggle('active', view === 'learn'); $('review-nav').classList.toggle('active', view === 'review');
  if (view === 'review') { video.pause(); renderReview(); }
}
function renderReview() {
  const cards = state.cards; $('nav-count').textContent = cards.length;
  $('review-empty').hidden = !!cards.length; $('review-content').hidden = !cards.length; $('export-cards').disabled = !cards.length;
  if (!cards.length) return;
  state.reviewIndex %= cards.length; const card = cards[state.reviewIndex];
  $('review-index').textContent = `${state.reviewIndex + 1} / ${cards.length}`;
  $('review-sentence').replaceChildren();
  const index = card.sentence.toLowerCase().indexOf(card.word.toLowerCase());
  if (index >= 0) {
    const blank = document.createElement('mark'); blank.textContent = '······';
    $('review-sentence').append(document.createTextNode(card.sentence.slice(0, index)), blank, document.createTextNode(card.sentence.slice(index + card.word.length)));
  } else $('review-sentence').textContent = card.sentence;
  $('answer-word').textContent = card.word; $('answer-meaning').textContent = card.meaning || 'Kayıtlı açıklama yok'; $('answer-translation').textContent = card.translation;
  $('review-answer').hidden = true; $('reveal-answer').hidden = false; $('grade-actions').hidden = true;
  $('saved-cards').replaceChildren();
  cards.forEach((saved, i) => {
    const row = document.createElement('button'); row.className = 'saved-row';
    const word = document.createElement('strong'); word.textContent = saved.word;
    const status = document.createElement('span'); status.textContent = ({ new: 'Yeni', again: 'Tekrar çalış', known: 'Hatırlandı' })[saved.status];
    row.append(word, status); row.onclick = () => { state.reviewIndex = i; renderReview(); }; $('saved-cards').append(row);
  });
}
document.addEventListener('click', event => {
  const word = event.target.closest('[data-word]'); if (word) selectWord(word.dataset.word, Number(word.dataset.cue));
  const seek = event.target.closest('[data-seek]'); if (seek) goTo(Number(seek.dataset.seek));
});
$('save-word').onclick = () => {
  const cue = state.cues[state.selectedIndex];
  if (core.addCard(state.cards, state.word, cue, state.source)) {
    const card = state.cards.at(-1); card.meaning = state.demo ? lesson.dictionary[state.word]?.meaning || '' : '';
    $('nav-count').textContent = state.cards.length; updateSelection(); persistCards(); notify(`“${state.word}” cümlesiyle birlikte kartlarına eklendi.`);
  }
};
function togglePlay() { if (video.paused) video.play().catch(() => notify('Video açılamadı. Başka bir video dosyası deneyebilirsin.')); else video.pause(); }
$('play').onclick = togglePlay; $('big-play').onclick = togglePlay;
video.addEventListener('play', () => { $('play').replaceChildren(svg('pause')); $('play').setAttribute('aria-label', 'Duraklat'); $('big-play').hidden = true; });
video.addEventListener('pause', () => { $('play').replaceChildren(svg('play')); $('play').setAttribute('aria-label', 'Oynat'); $('big-play').hidden = false; });
video.addEventListener('timeupdate', sync); video.addEventListener('loadedmetadata', sync);
video.addEventListener('ended', () => { if (state.loopIndex !== null) goTo(state.loopIndex); });
video.addEventListener('error', () => notify('Bu video oynatılamadı. Chrome ile uyumlu MP4 / WebM dosyası seç.'));
$('seek').oninput = () => { if (Number.isFinite(video.duration)) { state.loopIndex = null; renderLoop(); video.currentTime = Number($('seek').value) / 100 * video.duration; sync(); } };
$('speed').onchange = () => { video.playbackRate = Number($('speed').value); };
$('mute').onclick = () => { video.muted = !video.muted; $('mute').setAttribute('aria-pressed', String(video.muted)); $('mute').setAttribute('aria-label', video.muted ? 'Sesi aç' : 'Sesi kapat'); $('mute').style.opacity = video.muted ? '.4' : '1'; };
function renderLoop() { $('loop').setAttribute('aria-pressed', String(state.loopIndex !== null)); $('loop').replaceChildren(svg('repeat'), document.createTextNode(state.loopIndex !== null ? 'Cümle döngüde' : 'Cümleyi döngüle')); }
$('loop').onclick = () => { state.loopIndex = state.loopIndex === null ? (state.active >= 0 ? state.active : state.selectedIndex) : null; renderLoop(); if (state.loopIndex !== null) goTo(state.loopIndex); };
$('previous').onclick = () => goTo((state.active >= 0 ? state.active : 0) - 1);
$('next').onclick = () => goTo((state.active >= 0 ? state.active : 0) + 1);
$('show-tr').onchange = () => { for (const element of document.querySelectorAll('.cue-translation')) element.hidden = !$('show-tr').checked; currentRendered = -2; sync(); };
$('search').oninput = filterTranscript;
$('follow').onclick = () => { state.follow = !state.follow; $('follow').textContent = state.follow ? 'Takip açık' : 'Takip kapalı'; $('follow').setAttribute('aria-pressed', String(state.follow)); };
$('speak-word').onclick = () => {
  if (!('speechSynthesis' in window)) return notify('Tarayıcı seslendirmesi kullanılamıyor. Kaynak cümleyi dinleyebilirsin.');
  speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(state.word); utterance.lang = 'en-US'; utterance.rate = .85;
  const english = speechSynthesis.getVoices().find(voice => voice.lang.startsWith('en')); if (english) utterance.voice = english;
  utterance.onerror = () => notify('Seslendirme kullanılamadı. Kaynak cümleden dinleyebilirsin.'); speechSynthesis.speak(utterance);
};
$('learn-nav').onclick = () => setView('learn'); $('review-nav').onclick = () => setView('review'); $('return-lesson').onclick = () => setView('learn');
$('reveal-answer').onclick = () => { $('review-answer').hidden = false; $('reveal-answer').hidden = true; $('grade-actions').hidden = false; };
for (const button of document.querySelectorAll('[data-grade]')) button.onclick = () => { state.cards[state.reviewIndex].status = button.dataset.grade; persistCards(); state.reviewIndex = (state.reviewIndex + 1) % state.cards.length; renderReview(); notify(button.dataset.grade === 'known' ? 'Hatırlandı olarak işaretlendi.' : 'Tekrar çalışılacak olarak işaretlendi.'); };
$('back-to-scene').onclick = () => {
  const card = state.cards[state.reviewIndex];
  if (card.url && /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]+(?:&t=\d+s)?$/.test(card.url)) { window.open(card.url, '_blank', 'noopener'); return; }
  if (card.source !== state.source) return notify('Bu kart başka bir videodan. Kaynak videosunu yeniden açmalısın.');
  setView('learn'); state.loopIndex = null; renderLoop(); const index = state.cues.findIndex(cue => cue.start === card.start); if (index >= 0) goTo(index);
};
$('export-cards').onclick = () => {
  const blob = new Blob([JSON.stringify({ format: 'frame-prototype-v1', cards: state.cards }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'frame-kelimelerim.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1500);
};
$('import-open').onclick = () => { setView('learn'); $('import-panel').hidden = !$('import-panel').hidden; if (!$('import-panel').hidden) $('video-file').focus(); };
$('import-start').onclick = async () => {
  const file = $('video-file').files[0], subtitles = $('subtitle-file').files[0], translated = $('translation-file').files[0];
  $('import-message').textContent = '';
  try {
    if (!file || !subtitles) throw new Error('Video ve kaynak altyazısını birlikte seç.');
    if (subtitles.size > 2_000_000 || translated?.size > 2_000_000) throw new Error('Altyazı dosyası en fazla 2 MB olabilir.');
    const cues = core.parseSubtitles(await subtitles.text());
    if (translated) {
      const translations = core.parseSubtitles(await translated.text());
      for (const cue of cues) { const i = core.activeCue(translations, (cue.start + cue.end) / 2); cue.tr = i >= 0 ? translations[i].en : ''; }
    }
    video.pause(); for (const url of state.urls) URL.revokeObjectURL(url); state.urls = [];
    const url = URL.createObjectURL(file); state.urls.push(url); video.src = url; video.removeAttribute('poster');
    state.cues = cues; state.source = `${file.name}:${file.size}:${file.lastModified}`; state.demo = false; state.loopIndex = null; state.selectedIndex = 0; state.word = tokens(cues[0].en).find(token => token.word)?.word || cues[0].en;
    $('lesson-title').textContent = file.name; $('lesson-description').textContent = `Yerel video · ${cues.length} altyazı · ${translated ? 'Türkçe dosya eklendi' : 'Çeviri dosyası eklenmedi'}`;
    document.querySelector('.level-tag').textContent = 'Kendi içeriğin'; $('search').value = ''; renderLoop(); renderTranscript(); updateSelection(); $('import-panel').hidden = true; notify('Video cihazında açıldı. Dosya yüklenmedi.');
  } catch (error) { $('import-message').textContent = error.message; }
};
$('demo-reset').onclick = () => {
  video.pause(); for (const url of state.urls) URL.revokeObjectURL(url); state.urls = [];
  video.src = 'media/lesson.mp4'; video.poster = 'media/slide-0.png'; state.cues = demoCues; state.source = lesson.title; state.demo = true; state.loopIndex = null; state.selectedIndex = 0; state.word = 'overlook';
  $('lesson-title').textContent = lesson.title; $('lesson-description').textContent = 'Frame özgün dersi · İngilizce / Türkçe · Sentetik anlatım'; document.querySelector('.level-tag').textContent = 'B1–B2 örnek'; $('search').value = '';
  renderLoop(); renderTranscript(); updateSelection(); $('import-panel').hidden = true;
};
document.addEventListener('keydown', event => {
  if (event.target.closest('input,textarea,select,button,a') || event.altKey || event.ctrlKey || event.metaKey || state.view !== 'learn') return;
  if (event.code === 'Space') { event.preventDefault(); togglePlay(); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); $('previous').click(); }
  if (event.key === 'ArrowRight') { event.preventDefault(); $('next').click(); }
});
renderTranscript(); updateSelection();
const extensionMode = typeof chrome !== 'undefined' && !!chrome.runtime?.id;
async function persistCards() {
  try {
    if (extensionMode) {
      for (const card of state.cards) { const result = await chrome.runtime.sendMessage({ type: 'UPSERT_CARD', card }); if (!result?.ok) throw new Error(result?.error || 'Kayıt başarısız.'); }
    } else localStorage.setItem('frame-prototype-cards', JSON.stringify(state.cards));
  } catch (error) { notify(`Kart kaydedilemedi: ${error.message}. JSON yedeğini indir.`); }
}
async function restoreCards() {
  try {
    const records = extensionMode ? (await chrome.runtime.sendMessage({ type: 'GET_CARDS' })).cards : JSON.parse(localStorage.getItem('frame-prototype-cards') || '[]');
    if (Array.isArray(records)) state.cards = records.filter(card => card && typeof card.word === 'string' && typeof card.sentence === 'string' && typeof card.id === 'string');
    $('nav-count').textContent = state.cards.length; updateSelection(); if (state.view === 'review') renderReview();
  } catch { notify('Kayıtlı kartlar açılamadı. Bu oturumda çalışmaya devam edebilirsin.'); }
}
document.querySelector('.session-disclaimer').textContent = 'Kartların bu cihazda saklanır. JSON dışa aktarma ile yedekleyebilirsin. Aralıklı tekrar takvimi sonraki aşamada.';
if (extensionMode) {
  chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes.cards) restoreCards(); });
  const settingsLink = document.createElement('a'); settingsLink.href = 'settings.html'; settingsLink.className = 'button subtle'; settingsLink.textContent = 'YouTube / AI ayarları'; document.querySelector('.topbar').append(settingsLink);
  document.querySelector('.page-footer span:last-child').textContent = 'Frame masaüstü · YouTube eklentisi · Kartların cihazında';
  if (location.hash === '#cards') setView('review');
}
restoreCards();
