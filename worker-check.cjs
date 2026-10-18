const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const stored = {}, listeners = {};
const id = fs.readFileSync('extension-id.txt', 'utf8').trim();
const sender = { id, url: `chrome-extension://${id}/index.html` };
const youtube = { id, url: 'https://www.youtube.com/watch?v=sample' };
const api = {
  runtime: { id, getURL: path => `chrome-extension://${id}/${path}`, openOptionsPage: async () => { listeners.optionsOpened = true; }, onInstalled: { addListener: cb => { listeners.install = cb; } }, onMessage: { addListener: cb => { listeners.message = cb; } } },
  storage: { local: { get: async key => structuredClone({ [key]: stored[key] }), set: async value => { await new Promise(resolve => setTimeout(resolve, 2)); Object.assign(stored, structuredClone(value)); }, setAccessLevel: async () => {} } },
  permissions: { contains: async () => false }, windows: { create: async () => {} }, action: { onClicked: { addListener: () => {} } }
};
let modelCalls = [], modelPermission = false;
api.permissions.contains = async () => modelPermission;
const context = { chrome: api, console, AbortSignal, fetch: async (url, options) => { if (url === 'http://127.0.0.1:11434/api/chat') { modelCalls.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ message: { content: 'Test model yanıtı.' } }) }; } return fetch(url, options); }, URL, Map, Date, Promise };
vm.createContext(context); context.importScripts = file => vm.runInContext(fs.readFileSync(file, 'utf8'), context); vm.runInContext(fs.readFileSync('worker.js', 'utf8'), context);
const send = (message, from = sender) => new Promise(resolve => listeners.message(message, from, resolve));
(async () => {
  const card = i => ({ id: `YouTube:sample|${i}|word`, word: 'word', sentence: 'A word in context.', source: 'YouTube:sample', start: i, url: 'https://www.youtube.com/watch?v=sample&t=0s' });
  const results = await Promise.all(Array.from({ length: 12 }, (_, i) => send({ type: 'UPSERT_CARD', card: card(i) }, youtube)));
  assert.ok(results.every(result => result.ok)); assert.equal(stored.cards.length, 12, 'parallel saves must not lose cards');
  await send({ type: 'UPSERT_CARD', card: { ...card(0), status: 'known' } }); assert.equal(stored.cards.length, 12); assert.equal(stored.cards[0].status, 'known');
  assert.equal((await send({ type: 'GET_CARDS' }, { id: 'outsider', url: 'https://evil.invalid/' })).ok, false);
  assert.equal((await send({ type: 'SET_SETTINGS', model: 'test' }, youtube)).ok, false);
  assert.equal((await send({ type: 'UPSERT_CARD', card: { ...card(20), url: 'javascript:alert(1)' } }, youtube)).ok, false);
  assert.equal((await send({ type: 'EXPLAIN', text: 'hello', word: 'hello' }, youtube)).ok, false, 'missing model must not fabricate an answer');
  assert.equal((await send({ type: 'GRAMMAR', text: 'Hello.' }, youtube)).ok, false);
  assert.equal((await send({ type: 'GET_PREFERENCES' }, youtube)).preferences.display, 'dual');
  const preferences = await send({ type: 'SET_PREFERENCES', preferences: { englishSize: 999, display: 'tr', model: 'injected', hoverPause: 'yes' } }, youtube);
  assert.equal(preferences.preferences.englishSize, 44); assert.equal(preferences.preferences.display, 'tr'); assert.equal(preferences.preferences.hoverPause, false); assert.equal(preferences.preferences.model, undefined); assert.equal(stored.settings, undefined);
  assert.equal((await send({ type: 'GET_PREFERENCES' }, youtube)).preferences.display, 'tr');
  assert.equal((await send({ type: 'SET_PREFERENCES', preferences: [] }, youtube)).ok, false);
  assert.equal((await send({ type: 'SET_PREFERENCES', preferences: {} }, { id: 'outsider' })).ok, false);
  assert.equal((await send({ type: 'OPEN_SETTINGS' }, youtube)).ok, true); assert.equal(listeners.optionsOpened, true);
  await send({ type: 'SET_SETTINGS', model: 'fixture:small' });
  assert.equal((await send({ type: 'GRAMMAR', text: 'Hello.' }, youtube)).ok, false, 'AI needs an explicit localhost permission');
  modelPermission = true;
  for (const type of ['GRAMMAR', 'SUMMARIZE', 'EXERCISE', 'ASK_VIDEO']) {
    const response = await send({ type, text: '[10s] Hello world.', question: 'Ne söylendi?' }, youtube); assert.equal(response.ok, true); assert.equal(response.answer, 'Test model yanıtı.');
  }
  assert.equal(modelCalls.length, 4); assert.ok(modelCalls.every(call => call.messages[0].content.includes('quoted data')));
  assert.match(modelCalls[1].messages[0].content, /timestamps/); assert.match(modelCalls[2].messages[0].content, /answer key/); assert.match(modelCalls[3].messages[1].content, /Ne söylendi/);
  await send({ type: 'ASK_VIDEO', text: '[10s] Hello world.', question: 'Ne söylendi?' }, youtube); assert.equal(modelCalls.length, 4, 'identical question should use cache');
  await send({ type: 'ASK_VIDEO', text: '[10s] Hello world.', question: 'Başka soru?' }, youtube); assert.equal(modelCalls.length, 5, 'different question must not reuse previous answer');
  assert.equal((await send({ type: 'SUMMARIZE', text: 'x'.repeat(24001) }, youtube)).ok, false);
  assert.equal((await send({ type: 'ASK_VIDEO', text: 'Hello.', question: '' }, youtube)).ok, false);
  const state = await send({ type: 'APP_STATE' }, youtube); assert.equal(state.connected, true); assert.equal(state.enabled, true);
  fs.writeFileSync('worker-check-result.json', JSON.stringify({ passed: true, concurrentCards: 12, duplicateUpdate: true, untrustedSenderRejected: true, invalidURLRejected: true, noFabricatedAI: true, trayConnected: state.connected }, null, 2));
  console.log('PASS: concurrent cards, sender isolation, sanitized persistent preferences, model settings boundary, four AI modes using stub transport, permission/length guards, question cache isolation, real tray connection.');
})().catch(error => { console.error(error); process.exitCode = 1; });
