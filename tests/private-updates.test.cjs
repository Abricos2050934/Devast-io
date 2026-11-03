const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), vm = require('node:vm');
const {issue, revoke} = require('../private-updates/issue-key.cjs');
const key = 'dvu_' + 'a'.repeat(43), commit = 'b'.repeat(40), release = 'c'.repeat(64);
const body = 'function __installDevastMod(){} function __createIlmAim(){};window.__devastClientLoaded=true;window.__devastMod={ready:true};';
async function fixture(options = {}) {
 const {createHandler, sha256} = await import('../private-updates/worker.mjs');
 const keyHash = await sha256(new TextEncoder().encode(key)), calls = [];
 const env = {GITHUB_REPOSITORY: 'TestOwner/TestRepo', GITHUB_TOKEN: 'upstream-secret-only', ACCESS_KEYS_JSON: JSON.stringify({[keyHash]: {enabled: true}})};
 const meta = {release, output_sha256: await sha256(new TextEncoder().encode(body)), validation: 'passed', script: 'versions/' + release + '/game.modded.js'};
 const handle = createHandler(async (url, init) => {
  calls.push({url, init});
  assert.equal(init.headers.Authorization, 'Bearer ' + env.GITHUB_TOKEN);
  assert.equal(init.redirect, 'error');
  if (options.upstreamError) return new Response('private secret: ' + env.GITHUB_TOKEN, {status: 403});
  if (url.endsWith('/git/ref/heads/updates')) return Response.json({object: {sha: commit}});
  assert.ok(url.endsWith('?ref=' + commit), 'All files must use the same pinned commit');
  if (url.includes('/current.json?')) return Response.json(options.invalidManifest ? {...meta, validation: 'failed'} : meta);
  if (url.includes('/versions/' + release + '/game.modded.js?')) return new Response(options.tamper ? body + 'tampered' : body);
  throw Error('Unexpected upstream request');
 });
 const request = (extra = {}) => new Request('https://private.example/client.js', {headers: {Origin: 'https://devast.io', Authorization: 'Bearer ' + key, ...extra}});
 return {handle, env, calls, meta, keyHash, request};
}
test('anonymous and query-string keys cannot fetch private files or reach GitHub', async () => {
 const f = await fixture();
 for (const url of ['https://private.example/client.js', 'https://private.example/current.json?key=' + key]) {
  const response = await f.handle(new Request(url), f.env);assert.equal(response.status, 401);
 }
 assert.equal(f.calls.length, 0);
});
test('revoked, expired, malformed-expiry and unknown keys are rejected before any upstream call', async () => {
 for (const record of [{enabled: false}, {enabled: true, expiresAt: '2000-01-01T00:00:00Z'}, {enabled: true, expiresAt: 'invalid'}, null]) {
  const f = await fixture(); f.env.ACCESS_KEYS_JSON = JSON.stringify(record ? {[f.keyHash]: record} : {});
  assert.equal((await f.handle(f.request(), f.env)).status, 401);assert.equal(f.calls.length, 0);
 }
});
test('valid key gets the exact verified client; secrets stay upstream and responses cannot be cached publicly', async () => {
 const f = await fixture(), response = await f.handle(f.request(), f.env);
 assert.equal(response.status, 200);assert.equal(await response.text(), body);
 assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
 assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://devast.io');
 assert.equal(f.calls.length, 3);assert.ok(!JSON.stringify([...response.headers]).includes(f.env.GITHUB_TOKEN));
 assert.equal(f.calls[0].init.headers.Accept, 'application/vnd.github+json');
 assert.equal(f.calls[1].init.headers.Accept, 'application/vnd.github.raw+json');
});
test('CORS preflight enables the private Authorization header but never downloads code', async () => {
 const f = await fixture(), response = await f.handle(new Request('https://private.example/client.js', {method: 'OPTIONS', headers: {Origin: 'https://devast.io'}}), f.env);
 assert.equal(response.status, 204);assert.equal(response.headers.get('Access-Control-Allow-Headers'), 'Authorization');assert.equal(f.calls.length, 0);
 assert.equal((await f.handle(f.request({Origin: 'https://unrelated.example'}), f.env)).status, 403);
});
test('tampered, unverified and unavailable upstream updates fail closed without leaking upstream errors', async () => {
 for (const options of [{tamper: true}, {invalidManifest: true}, {upstreamError: true}]) {
  const f = await fixture(options), response = await f.handle(f.request(), f.env);
  assert.equal(response.status, 502);assert.ok(!(await response.text()).includes(f.env.GITHUB_TOKEN));
 }
});
test('private manifest exposes only the client release and checksum, with no repository URLs', async () => {
 const f = await fixture();const response = await f.handle(new Request('https://private.example/current.json', {headers: {Authorization: 'Bearer ' + key}}), f.env);
 assert.deepEqual(await response.json(), {release, output_sha256: f.meta.output_sha256, script: '/client.js'});assert.equal(f.calls.length, 2);
});
test('issued imports get different keys, store only their hashes on the server, and can be revoked individually', async () => {
 const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'private-update-test-'));
 try {
  const a = issue({endpoint: 'https://private.example', name: 'first', directory}), b = issue({endpoint: 'https://private.example', name: 'second', directory});
  const rawA = fs.readFileSync(a.file, 'utf8'), rawB = fs.readFileSync(b.file, 'utf8');
  const extract = raw => JSON.parse(raw).data[0].rules[0].file.match(/dvu_[A-Za-z0-9_-]{43}/)[0];
  const keyA = extract(rawA), keyB = extract(rawB);assert.notEqual(keyA, keyB);
  const manifest = fs.readFileSync(a.licenses, 'utf8');assert.ok(!manifest.includes(keyA) && !manifest.includes(keyB));
  assert.equal(fs.statSync(a.file).mode & 0o777, 0o600);
  assert.throws(() => issue({endpoint: 'https://private.example', name: 'first', directory}), /already has/);
  revoke({name: 'first', directory});const records = JSON.parse(fs.readFileSync(a.licenses));
  assert.equal(Object.values(records).find(r => r.label === 'first').enabled, false);
  assert.equal(Object.values(records).find(r => r.label === 'second').enabled, true);
  assert.throws(() => issue({endpoint: 'http://private.example', name: 'unsafe', directory}), /HTTPS/);
 } finally {fs.rmSync(directory, {recursive: true, force: true});}
});
test('private loader sends a per-recipient key, executes authorized code and never falls back to a public URL', () => {
 const template = fs.readFileSync('private-updates/loader-template.js', 'utf8');
 for (const status of [200, 401, 403, 502]) {
  const requests = [], window = {}, context = vm.createContext({window, Date, console: {error() {}}, XMLHttpRequest: class {
   open(method, url, async) {requests.push({method, url, async, headers: {}});}
   setRequestHeader(name, value) {requests.at(-1).headers[name] = value;}
   send() {this.status = status;this.responseText = body;}
  }});
  const code = template.replace('__ENDPOINT__', JSON.stringify('https://private.example')).replace('__ACCESS_KEY__', JSON.stringify(key));
  vm.runInContext(code, context);
  assert.equal(requests.length, 1);assert.ok(requests[0].url.startsWith('https://private.example/client.js?t='));
  assert.equal(requests[0].headers.Authorization, 'Bearer ' + key);
  assert.equal(window.__devastRemoteLoader.state, status === 200 ? 'loaded' : 'failed');
  assert.equal(!!window.__devastMod, status === 200);assert.ok(!JSON.stringify(window.__devastRemoteLoader).includes(key));
  if (status === 200) {vm.runInContext(code, context);assert.equal(requests.length, 1);}
 }
});
