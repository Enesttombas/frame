'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const captions = require('./captions.js');
const parsed = captions.parseJson3({ events: [{ tStartMs: 1000, dDurationMs: 2000, segs: [{ utf8: 'Hello ' }, { utf8: 'world.' }] }, { tStartMs: 4000, dDurationMs: 1000, segs: [{ utf8: 'Next.' }] }] });
assert.equal(parsed[0].text, 'Hello world.'); assert.equal(captions.at(parsed, 1).text, 'Hello world.');
assert.equal(captions.at(parsed, 3), null); assert.equal(captions.at(parsed, 4).text, 'Next.'); assert.equal(captions.at(parsed, .9), null);
assert.equal(captions.at(parsed, 5), null); assert.equal(captions.at(parsed, 1.5).text, 'Hello world.');
assert.equal(captions.at([{ start: 0, end: 10, text: 'long' }, { start: 2, end: 3, text: 'short' }], 4).text, 'long');
assert.equal(captions.normalize([{ start: NaN, end: 3, text: 'bad' }, { start: 5, end: 2, text: 'bad' }]).length, 0);
assert.throws(() => captions.parseJson3({})); assert.throws(() => captions.normalize(new Array(10001)));
const script = fs.readFileSync('youtube-bridge.js', 'utf8');
async function bridgeTest({ turkish = true, translatable = true, english = true, url = 'https://www.youtube.com/api/timedtext?v=abc&lang=en', failTurkish = false, wrongVideo = false, empty = false, foreign = false, needsSession = false, ccOn = false, observed = [], oversized = false, nativeOnly = false, nativeTransport = 'xhr', nativeDelay = 0 } = {}) {
  const requests = []; const replies = []; const toggles = []; let handler; let context; let selected = { languageCode: 'tr', vss_id: '.tr-original' }; const originalTrack = selected; const selections = [];
  class FakeXHR { open(method, address) { this.responseURL = address; } addEventListener(name, callback) { this.listener = callback; } send() { this.listener?.call(this); } }
  const tracks = english ? [{ languageCode: 'en', baseUrl: url, isTranslatable: translatable }] : [];
  if (turkish) tracks.push({ languageCode: 'tr', baseUrl: 'https://www.youtube.com/api/timedtext?v=abc&lang=tr', isTranslatable: translatable });
  const window = { addEventListener: (name, callback) => { handler = callback; }, postMessage: value => replies.push(value) };
  const player = { getPlayerResponse: () => ({ videoDetails: { videoId: wrongVideo ? 'stale' : 'abc' }, captions: { playerCaptionsTracklistRenderer: { captionTracks: tracks } } }),
    querySelector: () => ({ getAttribute: () => String(ccOn) }),
    toggleSubtitles: () => { ccOn = !ccOn; toggles.push(ccOn); if (ccOn) observed.push({ name: 'https://www.youtube.com/api/timedtext?v=abc&lang=tr&pot=test-session&c=WEB&fmt=json3' }); }
  };
  if (nativeOnly) Object.assign(player, {
    getOption: (module, option) => option === 'track' ? selected : tracks.map(track => ({ ...track, vss_id: '.' + track.languageCode })),
    setOption: (module, option, track) => {
      selected = track; selections.push(track); if (!track.languageCode) return;
      const address = new URL(track.baseUrl || 'https://www.youtube.com/api/timedtext?v=abc&lang=' + track.languageCode);
      address.searchParams.set('fmt', 'json3'); address.searchParams.set('native', '1');
      if (track.translationLanguage) address.searchParams.set('tlang', track.translationLanguage.languageCode);
      const payload = JSON.stringify({ events: [{ tStartMs: 0, dDurationMs: 2000, segs: [{ utf8: (track.translationLanguage?.languageCode || track.languageCode) === 'tr' ? 'Merhaba.' : 'Hello.' }] }] });
      if (track === originalTrack) return;
      const emit = () => { if (nativeTransport === 'fetch') context.fetch(address.href); else { const xhr = new FakeXHR(); xhr.open('GET', address.href); xhr.responseType = ''; xhr.responseText = payload; xhr.send(); } };
      nativeDelay ? setTimeout(emit, nativeDelay) : emit();
    }
  });
  context = { window, XMLHttpRequest: FakeXHR, FrameCaptions: captions, URL, Date, AbortSignal, setTimeout, performance: { getEntriesByType: () => observed }, location: { href: 'https://www.youtube.com/watch?v=abc', origin: 'https://www.youtube.com', pathname: '/watch' },
    document: { getElementById: () => player },
    fetch: async address => { requests.push(address); const params = new URL(address).searchParams; const isTr = (params.get('tlang') || params.get('lang')) === 'tr'; return { ok: !(failTurkish && isTr), status: 503, clone() { return this; }, text: async () => empty || (nativeOnly && params.get('native') !== '1') || (needsSession && params.get('pot') !== 'test-session') ? '' : oversized ? 'x'.repeat(2500001) : JSON.stringify({ events: [{ tStartMs: 0, dDurationMs: 2000, segs: [{ utf8: isTr ? 'Merhaba.' : 'Hello.' }] }] }) }; }
  };
  vm.createContext(context); vm.runInContext(script, context);
  await handler({ source: foreign ? {} : window, origin: 'https://www.youtube.com', data: { channel: 'frame-captions-request', token: 'test-nonce', videoId: 'abc' } });
  return { requests, reply: replies[0], toggles, ccOn, selected, originalTrack, selections };
}
(async () => {
  let result = await bridgeTest(); assert.equal(result.reply.en[0].text, 'Hello.'); assert.equal(result.reply.tr[0].text, 'Merhaba.'); assert.equal(result.requests.length, 2);
  assert.ok(result.requests.every(url => new URL(url).searchParams.get('fmt') === 'json3'));
  result = await bridgeTest({ turkish: false }); assert.equal(result.reply.tr[0].text, 'Merhaba.'); assert.ok(result.requests.some(url => new URL(url).searchParams.get('tlang') === 'tr'));
  result = await bridgeTest({ failTurkish: true }); assert.equal(result.reply.ok, true); assert.equal(result.reply.tr.length, 0); assert.ok(result.reply.translationError);
  result = await bridgeTest({ english: false }); assert.equal(result.reply.ok, true); assert.equal(result.reply.en[0].text, 'Hello.'); assert.equal(result.reply.tr[0].text, 'Merhaba.'); assert.ok(result.requests.some(url => new URL(url).searchParams.get('tlang') === 'en'));
  result = await bridgeTest({ english: false, translatable: false }); assert.equal(result.reply.ok, false); assert.equal(result.requests.length, 0);
  result = await bridgeTest({ english: false, turkish: false }); assert.equal(result.reply.ok, false); assert.equal(result.requests.length, 0);
  result = await bridgeTest({ wrongVideo: true }); assert.equal(result.reply.ok, false); assert.equal(result.requests.length, 0);
  result = await bridgeTest({ url: 'https://evil.example/api/timedtext', turkish: false, translatable: false }); assert.equal(result.reply.ok, false); assert.equal(result.requests.length, 0);
  result = await bridgeTest({ needsSession: true, english: false }); assert.equal(result.reply.ok, true); assert.equal(result.reply.en[0].text, 'Hello.'); assert.equal(result.reply.tr[0].text, 'Merhaba.'); assert.equal(result.ccOn, false); assert.deepEqual(result.toggles, [true, false]);
  assert.ok(result.requests.every(address => new URL(address).searchParams.get('c') === 'WEB'));
  result = await bridgeTest({ needsSession: true, ccOn: true }); assert.equal(result.reply.ok, true); assert.equal(result.ccOn, true);
  result = await bridgeTest({ needsSession: true, observed: [{ name: 'https://www.youtube.com/api/timedtext?v=stale&pot=old' }, { name: 'https://evil.example/api/timedtext?v=abc&pot=foreign' }] }); assert.equal(result.reply.ok, true); assert.ok(result.requests.every(address => new URL(address).searchParams.get('pot') === 'test-session'));
  result = await bridgeTest({ needsSession: true, observed: [{ name: 'https://www.youtube.com/api/timedtext?v=abc&pot=test-session&c=WEB' }] }); assert.equal(result.reply.ok, true); assert.equal(result.toggles.length, 0);
  result = await bridgeTest({ empty: true }); assert.equal(result.reply.ok, false); assert.match(result.reply.error, /boş/); assert.doesNotMatch(result.reply.error, /büyük/);
  result = await bridgeTest({ oversized: true }); assert.equal(result.reply.ok, false); assert.match(result.reply.error, /büyük/); assert.doesNotMatch(result.reply.error, /boş/);
  result = await bridgeTest({ foreign: true }); assert.equal(result.reply, undefined); assert.equal(result.requests.length, 0);
  result = await bridgeTest({ nativeOnly: true, english: false, nativeDelay: 10 }); assert.equal(result.reply.ok, true, result.reply.error); assert.equal(result.reply.en[0].text, 'Hello.'); assert.equal(result.reply.tr[0].text, 'Merhaba.'); assert.equal(result.ccOn, false); assert.equal(result.selected, result.originalTrack); assert.equal(result.requests.length, 0, 'native response must work when replay fetch is empty');
  result = await bridgeTest({ nativeOnly: true, nativeTransport: 'fetch', ccOn: true }); assert.equal(result.reply.ok, true, result.reply.error); assert.equal(result.ccOn, true); assert.equal(result.selected, result.originalTrack);
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  assert.ok(manifest.content_scripts.some(item => item.world === 'MAIN' && item.run_at === 'document_start' && item.js.includes('youtube-bridge.js')));
  assert.ok(manifest.content_scripts.some(item => item.js.join(',') === 'captions.js,preferences.js,player-panel.js,youtube.js'));
  for (const file of ['captions.js', 'preferences.js', 'player-panel.js', 'youtube-bridge.js', 'youtube.js', 'fixture.js', 'worker.js']) new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
  console.log('PASS: timed cues, EN/TR and Turkish-only translation, native caption session proof, CC on/off restoration, foreign/stale session rejection, separate empty/oversized errors, partial failures, URL/sender bounds, manifest and syntax.');
})().catch(error => { console.error(error); process.exitCode = 1; });
