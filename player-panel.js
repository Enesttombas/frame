// Isolated content script. All page-derived text is rendered with textContent.
(function (scope) {
  'use strict';
  function mount({ root, panel, learning, send, snapshot, seek, apply, notice }) {
    let preferences = FramePreferences.normalize(), saveTimer, pageSize = 100, dirty = false;
    const fields = new Map(), panes = new Map(), tabs = [];
    const style = document.createElement('style');
    // A single neutral control surface; subtitle colors remain a user preference.
    style.textContent = `
      :host{color-scheme:dark;color:#f3f3f6;font-family:Segoe UI,Arial,sans-serif;--muted:#b1b1c0;--accent:#bba9ff;--line:#ffffff12}
      *{box-sizing:border-box}button,input,select,textarea{font:inherit}button{cursor:pointer;touch-action:manipulation}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:3px}button:disabled{opacity:.45;cursor:default}
      .panel{width:380px;max-width:100%;background:#202024;border:0;border-radius:14px;box-shadow:0 12px 38px #0008;overflow:hidden;font-size:13px;line-height:1.5}
      .head{display:flex;align-items:center;gap:10px;padding:13px 16px;height:56px}.logo{display:flex;align-items:center;gap:9px;font:650 17px/1.2 Segoe UI,Arial,sans-serif;color:#f3f3f6;letter-spacing:-.02em}.brand-mark{display:grid;place-items:center;background:#7551db;color:white;width:28px;height:28px;border-radius:8px;font:700 24px Georgia,serif}.status{font-size:11px;color:var(--muted);margin-left:auto}.min{display:grid;place-items:center;width:30px;height:30px;padding:0;background:transparent;color:var(--muted);border-radius:7px}.min:hover{background:#ffffff12;color:white}
      svg{width:18px;height:18px;flex:none;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}
      .tabs{display:flex;gap:4px;padding:0 12px 10px;border-bottom:1px solid var(--line)}.tabs button{display:flex;align-items:center;justify-content:center;gap:6px;flex:1;min-width:0;padding:8px 4px;border:0;border-radius:7px;color:var(--muted);background:transparent;font-size:12px;font-weight:600;min-height:36px}.tabs button:hover{background:#ffffff0a;color:white}.tabs button[aria-selected=true]{background:#bba9ff1c;color:#d2c5ff}.tabs svg{width:16px;height:16px}
      .body{padding:16px;max-height:min(470px,var(--frame-panel-body-height,470px));overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#55545f transparent}.body[hidden],[hidden]{display:none!important}.language-pair{display:flex;align-items:center;gap:10px;padding-bottom:14px;color:#f3f3f6;font-size:14px;font-weight:600}.language-pair svg{color:var(--muted)}.language-pair small{margin-left:auto;font-size:11px;color:var(--muted);font-weight:400}
      .mode-label{display:block;font-size:12px;color:var(--muted);margin-bottom:8px}.mode-options{display:flex;gap:3px;background:#151518;padding:4px;border-radius:8px;margin-bottom:16px}.mode-options button{flex:1;padding:7px 3px;min-height:34px;background:transparent;color:var(--muted);border-radius:5px;font-size:12px;font-weight:600}.mode-options button[aria-checked=true]{background:#45404f;color:white}.mode-options button:hover{color:white}
      .settings-group{margin:0;padding:0;border:0;min-width:0}.settings-group legend{font-size:12px;font-weight:600;color:var(--muted);margin:0 0 5px;padding:0}.setting{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:42px;font-size:13px;color:#e8e8ef}.setting-control{display:flex;align-items:center;gap:9px}.setting input[type=range]{width:115px;height:4px;accent-color:var(--accent);cursor:pointer}.setting input[type=checkbox]{appearance:none;width:32px;height:19px;border-radius:12px;background:#595964;position:relative;cursor:pointer;margin:0}.setting input[type=checkbox]:before{content:'';position:absolute;top:3px;left:3px;width:13px;height:13px;border-radius:50%;background:white}.setting input[type=checkbox]:checked{background:#8c6be5}.setting input[type=checkbox]:checked:before{left:16px}.setting output{min-width:43px;text-align:right;font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}
      .setting select,.transcript-search,.ai-question{background:#151518;color:#ededf3;border:1px solid #4c4c57;border-radius:7px;padding:7px 9px;max-width:158px}.setting select{font-size:12px;min-height:34px}.settings-detail{border-top:1px solid var(--line);margin-top:12px;padding-top:1px}.settings-detail summary{display:flex;align-items:center;gap:9px;cursor:pointer;list-style:none;min-height:46px;font-size:13px;font-weight:500}.settings-detail summary::-webkit-details-marker{display:none}.settings-detail summary:after{content:'';width:6px;height:6px;border-right:1.5px solid var(--muted);border-bottom:1.5px solid var(--muted);transform:rotate(-45deg);margin-left:auto;margin-right:4px}.settings-detail[open] summary:after{transform:rotate(45deg)}.settings-detail .settings-group{padding:0 0 6px}.settings-detail legend{display:none}
      .panel-note{color:var(--muted);font-size:12px;line-height:1.6;margin:0 0 12px}.save-status{font-size:11px;color:var(--muted);margin:4px 0 0;min-height:17px}.pane-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 0}.pane-actions button,.transcript-more{padding:8px 11px;min-height:34px;background:#37373f;color:#ededf3;border-radius:7px;font-size:12px;border:0}.pane-actions button:hover,.transcript-more:hover{background:#474650}.settings-footer{border-top:1px solid var(--line);padding-top:10px;margin-top:10px;display:flex;align-items:center;justify-content:space-between}.settings-footer button{background:none;padding:4px 0;color:var(--muted);font-size:11px;min-height:28px}.settings-footer button:hover{color:white}.settings-footer .save-status{margin:0}
      .hint{font-size:12px;color:var(--muted);margin:0 0 12px}.sentence{font-size:19px;line-height:1.7;margin:0 0 12px;font-weight:500;color:#f5f5fa}.sentence button{padding:1px 2px;background:transparent;border-radius:4px;color:inherit;font:inherit}.sentence button:hover,.sentence button.chosen{background:#bba9ff2a;color:#d7cbff}.translation{font-size:14px;line-height:1.65;color:#c3b3f2;margin:0 0 16px}.tools{display:flex;flex-wrap:wrap;gap:7px}.tools button{display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 10px;min-height:36px;border-radius:7px;background:#35353d;color:#ededf3;font-size:12px;border:0}.tools button:hover{background:#46454f}.tools .save{background:#9471ef;color:#100a21;font-weight:650;flex:1}.tools .save:hover{background:#b79aff}.tools button.on{background:#bba9ff;color:#211735}.transport{display:flex;align-items:center;gap:6px;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:14px}.transport button{display:flex;align-items:center;justify-content:center;gap:7px;padding:8px 10px;background:transparent;color:#d1d1de;border-radius:7px;min-height:36px;font-size:12px}.transport button:hover{background:#ffffff10}.transport .repeat{margin-left:auto}.transport .on{background:#bba9ff26;color:#cfbeff}.enable{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted);padding:4px 0;background:none;border:0}.enable:hover{color:white}.answer{font-size:13px;color:#e0e0eb;line-height:1.7;white-space:pre-wrap;max-height:180px;overflow:auto;margin-top:14px}.answer:empty,.message:empty{display:none}.message{font-size:12px;line-height:1.65;color:#ccc0eb;margin:12px 0 0;padding-top:10px;border-top:1px solid var(--line)}.bottom{display:flex;align-items:center;justify-content:space-between;gap:7px;margin-top:14px}.bottom button{font-size:11px;background:none;color:var(--muted);text-decoration:none;padding:5px 0}.bottom button:hover{color:white}.time{font-size:11px;font-variant-numeric:tabular-nums;color:var(--muted)}
      .transcript-search{width:100%;max-width:none;min-height:38px;margin-bottom:10px;padding-left:12px}.transcript-search::placeholder,.ai-question::placeholder{color:#a8a8b8}.transcript-row{display:grid;grid-template-columns:40px 1fr;gap:3px 9px;width:100%;padding:12px 4px;border:0;border-bottom:1px solid var(--line);text-align:left;background:transparent;color:#ededf3;font-size:13px;line-height:1.6}.transcript-row:hover{background:#ffffff09}.transcript-row.active{background:#bba9ff14}.transcript-row small{grid-row:1/3;color:#b6a0f1;font-size:11px;padding-top:2px;font-variant-numeric:tabular-nums}.transcript-row span{grid-column:2;color:var(--muted);font-size:12px}.export-menu{margin-bottom:10px}.export-menu summary{font-size:12px;color:#c3b3f2;cursor:pointer;padding:6px 0}.export-menu .pane-actions{margin:4px 0 8px}.transcript-more{width:100%;margin-top:12px}
      .ai-actions{display:flex;flex-direction:column;gap:0;margin:0 0 16px}.ai-actions button{display:flex;align-items:center;gap:11px;text-align:left;border:0;border-bottom:1px solid var(--line);border-radius:0;background:transparent;color:#ededf3;padding:13px 2px;min-height:58px;font-size:13px}.ai-actions button:hover{background:#ffffff08}.ai-actions svg{color:#bca5f9}.action-copy{display:flex;flex-direction:column;gap:2px}.action-copy small{font-size:11px;color:var(--muted);font-weight:400}.ai-status{padding:10px 12px;background:#bba9ff0c;border-radius:8px;margin:0 0 8px;font-size:12px;color:#c7bfdb;line-height:1.6}.ai-question{width:100%;max-width:none;min-height:70px;resize:vertical;font-size:13px;caret-color:var(--accent)}.ai-output{white-space:pre-wrap;line-height:1.7;font-size:13px;color:#ededf3;margin-top:14px}.ai-output:empty{display:none}.question-label{display:block;font-size:13px;font-weight:600;margin-bottom:8px}::selection{background:#bba9ff;color:#201831}
      @media(prefers-reduced-motion:no-preference){.setting input[type=checkbox]:before{transition:left .15s ease-out}}
      @media(max-width:550px){.panel{width:380px}.body{padding:14px}.sentence{font-size:18px}}
    `;
    root.append(style);
    const make = (tag, text, className) => { const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node; };
    const paths = { subtitles: 'M4 5h16v14H4z M7 10h4 M7 14h3 M14 10h3 M13 14h4', learn: 'M12 6C9 4 5 4 3 5v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-2-1-6-1-9 1z M12 6v14', transcript: 'M8 5h12 M8 10h12 M8 15h8 M4 5h.01 M4 10h.01 M4 15h.01', ai: 'M12 3l2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6z', chevron: 'M9 5l7 7-7 7', close: 'M6 6l12 12 M18 6L6 18', appearance: 'M12 3a9 9 0 1 0 9 9c0-2-2-3-4-3h-2c-2 0-3-1-3-3z M7 9h.01 M7 14h.01 M12 17h.01', play: 'M8 4l12 8-12 8z' };
    function icon(name) { const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); const path = document.createElementNS(svg.namespaceURI, 'path'); path.setAttribute('d', paths[name] || paths.chevron); svg.append(path); return svg; }
    const brand = panel.querySelector('.logo'); brand.prepend(make('span', 'f.', 'brand-mark')); panel.querySelector('.status').textContent = 'YouTube'; panel.querySelector('.min').replaceChildren(icon('close'));
    const reload = learning.querySelector('.enable'); reload.setAttribute('aria-label', 'Altyazıları yeniden yükle'); reload.title = 'Altyazıları yeniden yükle';
    const reloadIcon = icon('chevron'); reloadIcon.querySelector('path').setAttribute('d', 'M20 7v5h-5 M20 12a8 8 0 1 0-2 5 M20 12a8 8 0 0 0-2-5'); reload.replaceChildren(reloadIcon);
    const action = (parent, label, handler) => { const node = make('button', label); node.type = 'button'; node.onclick = handler; parent.append(node); return node; };
    const nav = make('div', '', 'tabs'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Frame araçları');
    panel.insertBefore(nav, learning);
    function show(id) {
      for (const [key, node] of panes) node.hidden = key !== id;
      for (const tab of tabs) { const selected = tab.dataset.pane === id; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; }
      if (id === 'transcript') renderTranscript();
    }
    for (const [id, title] of [['subtitles', 'Altyazı'], ['learn', 'Öğren'], ['transcript', 'Metin'], ['ai', 'AI']]) {
      const pane = id === 'learn' ? learning : make('div', '', 'body'); pane.id = 'frame-pane-' + id; pane.setAttribute('role', 'tabpanel'); pane.setAttribute('aria-labelledby', 'frame-tab-' + id); panes.set(id, pane);
      if (id !== 'learn') panel.append(pane);
      const tab = action(nav, title, () => show(id)); tab.prepend(icon(id)); tab.id = 'frame-tab-' + id; tab.dataset.pane = id; tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', pane.id); tabs.push(tab);
      tab.onkeydown = event => { const index = tabs.indexOf(tab); let next; if (event.key === 'ArrowRight') next = (index + 1) % tabs.length; if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length; if (event.key === 'Home') next = 0; if (event.key === 'End') next = tabs.length - 1; if (next !== undefined) { event.preventDefault(); show(tabs[next].dataset.pane); tabs[next].focus(); } };
    }
    const settingsPane = panes.get('subtitles');
    const pair = make('div', '', 'language-pair'); pair.append(make('span', 'İngilizce'), icon('chevron'), make('span', 'Türkçe'), make('small', 'EN / TR')); settingsPane.append(pair);
    const saved = make('p', 'Otomatik kaydedilir', 'save-status'); saved.setAttribute('role', 'status');
    const modeOptions = make('div', '', 'mode-options'); modeOptions.setAttribute('role', 'radiogroup'); modeOptions.setAttribute('aria-label', 'Altyazı görünümü'); settingsPane.append(make('span', 'Altyazı görünümü', 'mode-label'), modeOptions);
    const modes = [];
    for (const [value, label] of [['dual', 'Çift dil'], ['en', 'İngilizce'], ['tr', 'Türkçe'], ['off', 'Kapalı']]) { const btn = action(modeOptions, label, () => update({ ...preferences, display: value })); btn.setAttribute('role', 'radio'); btn.dataset.value = value; modes.push(btn); btn.onkeydown = event => { const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0; if (!step) return; event.preventDefault(); const next = modes[(modes.indexOf(btn) + step + modes.length) % modes.length]; next.click(); next.focus(); }; }
    function update(next, persist = true) {
      preferences = FramePreferences.normalize(next); apply(preferences);
      for (const btn of modes) { const checked = btn.dataset.value === preferences.display; btn.setAttribute('aria-checked', String(checked)); btn.tabIndex = checked ? 0 : -1; }
      for (const [key, { input, output, unit }] of fields) { if (input.type === 'checkbox') input.checked = preferences[key]; else input.value = String(preferences[key]); if (output) output.textContent = preferences[key] + unit; }
      if (persist) { dirty = true; clearTimeout(saveTimer); saved.textContent = 'Kaydediliyor…'; saveTimer = setTimeout(() => send('SET_PREFERENCES', { preferences }).then(() => { saved.textContent = 'Kaydedildi'; }, error => { saved.textContent = error.message; }), 250); }
    }
    function group(title, disclosure = false, symbol = 'appearance') { const fieldset = make('fieldset', '', 'settings-group'); fieldset.append(make('legend', title)); if (disclosure) { const detail = make('details', '', 'settings-detail'), summary = make('summary', title); summary.prepend(icon(symbol)); detail.append(summary, fieldset); settingsPane.append(detail); } else settingsPane.append(fieldset); return fieldset; }
    function field(parent, key, title, spec) {
      const label = make('label', '', 'setting'); label.append(make('span', title));
      const control = make('span', '', 'setting-control'); let input, output;
      if (spec.options) { input = make('select'); for (const [value, name] of spec.options) { const option = make('option', name); option.value = value; input.append(option); } }
      else { input = make('input'); input.type = spec.type || 'range'; if (input.type === 'range') { input.min = spec.min; input.max = spec.max; input.step = spec.step || 1; output = make('output'); control.append(output); } }
      input.setAttribute('aria-label', title); control.prepend(input); label.append(control); parent.append(label); fields.set(key, { input, output, unit: spec.unit || '' });
      input.oninput = () => update({ ...preferences, [key]: input.type === 'checkbox' ? input.checked : spec.options ? input.value : Number(input.value) });
    }
    const appearance = group('Yazı boyutu');
    field(appearance, 'englishSize', 'İngilizce yazı', { min: 14, max: 44, unit: ' px' });
    field(appearance, 'turkishSize', 'Türkçe yazı', { min: 12, max: 40, unit: ' px' });
    const layout = group('Konum ve görünüm', true);
    field(layout, 'theme', 'Renk teması', { options: [['forest', 'Orman'], ['night', 'Gece'], ['paper', 'Açık kâğıt']] });
    field(layout, 'order', 'Üstteki dil', { options: [['en-first', 'İngilizce'], ['tr-first', 'Türkçe']] });
    field(layout, 'bottom', 'Alttan uzaklık', { min: 12, max: 180, unit: ' px' });
    field(layout, 'opacity', 'Arka plan koyuluğu', { min: 0, max: 100, unit: '%' });
    const practice = group('İzleme davranışı', true, 'play');
    field(practice, 'hoverPause', 'Altyazıya gelince duraklat', { type: 'checkbox' });
    field(practice, 'autoPause', 'Her cümle sonunda duraklat', { type: 'checkbox' });
    field(practice, 'speed', 'Oynatma hızı', { options: [['0.5', '0,5×'], ['0.75', '0,75×'], ['1', '1×'], ['1.25', '1,25×'], ['1.5', '1,5×'], ['2', '2×']] });
    field(practice, 'delay', 'Altyazı gecikmesi', { min: -5, max: 5, step: .1, unit: ' sn' });
    // Numeric select values use the same range validation as sliders.
    fields.get('speed').input.oninput = event => update({ ...preferences, speed: Number(event.target.value) });
    const settingsActions = make('div', '', 'settings-footer'); settingsPane.append(settingsActions);
    action(settingsActions, 'Ayarları sıfırla', () => update(FramePreferences.defaults)); settingsActions.append(saved);
    const transcript = panes.get('transcript'), search = make('input', '', 'transcript-search'); search.type = 'search'; search.placeholder = 'İngilizce veya Türkçe ara'; search.setAttribute('aria-label', 'Transkriptte ara');
    const count = make('p', '', 'panel-note'), rows = make('div'), exports = make('div', '', 'pane-actions');
    const exportMenu = make('details', '', 'export-menu'); exportMenu.append(make('summary', 'Altyazıyı indir'), exports); transcript.append(search, count, exportMenu, rows); search.oninput = () => { pageSize = 100; renderTranscript(); };
    function download(bilingual) {
      const data = snapshot(); if (!data.en.length) { notice('Dışa aktarmak için önce altyazı yüklenmeli.'); count.textContent = 'Önce altyazı yüklenmeli.'; return; }
      const link = make('a'); const url = URL.createObjectURL(new Blob([FramePreferences.srt(data.en, data.tr, bilingual)], { type: 'application/x-subrip;charset=utf-8' }));
      link.href = url; link.download = `frame-${data.id}-${bilingual ? 'en-tr' : 'en'}.srt`; transcript.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    action(exports, 'EN SRT indir', () => download(false)); action(exports, 'EN + TR SRT indir', () => download(true));
    function renderTranscript() {
      const data = snapshot(), query = search.value.trim().toLocaleLowerCase('tr-TR'); rows.replaceChildren();
      const filtered = data.en.map(cue => ({ ...cue, translation: FrameCaptions.at(data.tr, cue.start + .01)?.text || '' })).filter(cue => !query || (cue.text + ' ' + cue.translation).toLocaleLowerCase('tr-TR').includes(query));
      count.textContent = data.en.length ? `${filtered.length} cümle · tıklayarak videoya git` : 'Altyazı yüklendiğinde metin burada görünür.';
      for (const cue of filtered.slice(0, pageSize)) { const row = action(rows, '', () => { seek(cue.start); for (const child of rows.children) child.classList.remove('active'); row.classList.add('active'); }); row.className = 'transcript-row'; row.append(make('small', Math.floor(cue.start / 60) + ':' + String(Math.floor(cue.start % 60)).padStart(2, '0')), document.createTextNode(cue.text)); if (cue.translation) row.append(make('span', cue.translation)); }
      if (filtered.length > pageSize) { const more = action(rows, 'Sonraki 100 cümleyi göster', () => { pageSize += 100; renderTranscript(); }); more.className = 'transcript-more'; }
    }
    const ai = panes.get('ai'), aiStatus = make('p', 'Yerel AI bağlantısı kontrol ediliyor…', 'ai-status'), aiActions = make('div', '', 'ai-actions'), output = make('div', '', 'ai-output'); output.setAttribute('role', 'status');
    ai.append(aiStatus, aiActions);
    let aiBusy = false;
    async function run(type, question = '') {
      if (aiBusy) return; const data = snapshot(); if (!data.en.length) { output.textContent = 'Önce videonun altyazısı yüklenmeli.'; return; }
      const current = data.current; if (type === 'GRAMMAR' && !current) { output.textContent = 'Dilbilgisi için konuşma içeren bir ana git.'; return; }
      let text = current?.text || '';
      if (type !== 'GRAMMAR') text = data.en.map(cue => `[${Math.floor(cue.start)}s] ${cue.text}`).join('\n');
      const clipped = text.length > 24000; text = text.slice(0, 24000);
      aiBusy = true; for (const button of aiActions.children) button.disabled = true; output.textContent = 'Yerel model çalışıyor…';
      try { const result = await send(type, { text, question: question.slice(0, 1000) }); output.textContent = (clipped ? 'Not: İlk 24.000 karakter üzerinden üretildi; videonun tamamını kapsamaz.\n\n' : '') + result.answer; }
      catch (error) { output.textContent = error.message; }
      finally { aiBusy = false; for (const button of aiActions.children) button.disabled = false; }
    }
    for (const [type, title, description, symbol] of [['GRAMMAR', 'Cümleyi çözümle', 'İzlediğin cümlenin dilbilgisi ve yapısı', 'learn'], ['SUMMARIZE', 'Videoyu özetle', 'Transkriptteki ana fikirleri çıkar', 'transcript'], ['EXERCISE', 'Alıştırma üret', 'Bu videoyla öğrendiklerini sına', 'ai']]) { const btn = action(aiActions, '', () => run(type)), copy = make('span', '', 'action-copy'); copy.append(make('span', title), make('small', description)); btn.append(icon(symbol), copy); }
    const question = make('textarea', '', 'ai-question'); question.placeholder = 'Bu video hakkında ne öğrenmek istiyorsun?'; question.maxLength = 1000; question.id = 'frame-ai-question'; question.setAttribute('aria-label', 'Videoya sor'); const questionLabel = make('label', 'Videoya sor', 'question-label'); questionLabel.htmlFor = question.id; ai.append(questionLabel, question);
    const askActions = make('div', '', 'pane-actions'); ai.append(askActions, output);
    const ask = action(askActions, 'Transkripte sor', async () => { if (!question.value.trim()) { output.textContent = 'Önce sorunu yaz.'; return; } ask.disabled = true; await run('ASK_VIDEO', question.value); ask.disabled = false; });
    action(askActions, 'Yerel modeli bağla', () => send('OPEN_SETTINGS').catch(error => { output.textContent = error.message; }));
    send('AI_STATUS').then(result => { aiStatus.textContent = result.model ? `Yerel model: ${result.model} · bağlantı, ilk istekte sınanır.` : 'AI modeli bağlı değil. Altyazı, ayarlar ve transkript modeli gerektirmez.'; }, error => { aiStatus.textContent = error.message; });
    update(preferences, false); send('GET_PREFERENCES').then(result => { if (!dirty) update(result.preferences, false); }, error => { saved.textContent = error.message; });
    show('subtitles');
    return { refresh: () => { if (!panes.get('transcript').hidden) renderTranscript(); } };
  }
  scope.FramePanel = { mount };
})(globalThis);
