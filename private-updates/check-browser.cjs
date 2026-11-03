// Real browser/CORS test with routed service responses; no live game login.
const {chromium} = require('playwright-core');
const fs = require('node:fs'), assert = require('node:assert/strict');
async function main() {
 const {createHandler, sha256} = await import('./worker.mjs');
 const key = 'dvu_' + 'a'.repeat(43), release = 'b'.repeat(64), commit = 'c'.repeat(40);
 const body = 'function __installDevastMod(){} function __createIlmAim(){};window.__devastClientLoaded=true;window.__devastMod={ready:true};';
 const keyHash = await sha256(new TextEncoder().encode(key));
 const env = {GITHUB_REPOSITORY: 'TestOwner/TestRepo', GITHUB_TOKEN: 'test-upstream-only', ACCESS_KEYS_JSON: JSON.stringify({[keyHash]: {enabled: true}})};
 const meta = {release, output_sha256: await sha256(new TextEncoder().encode(body)), validation: 'passed', script: 'versions/' + release + '/game.modded.js'};
 let upstreamCalls = 0;
 const handle = createHandler(async url => {
  upstreamCalls++;
  if (url.endsWith('/git/ref/heads/updates')) return Response.json({object: {sha: commit}});
  return url.includes('/current.json?') ? Response.json(meta) : new Response(body);
 });
 const template = fs.readFileSync('private-updates/loader-template.js', 'utf8')
  .replace('__ENDPOINT__', JSON.stringify('https://private-updates.example')).replace('__ACCESS_KEY__', JSON.stringify(key));
 const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true,
  proxy: process.env.HTTPS_PROXY ? {server: process.env.HTTPS_PROXY} : undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage']});
 const report = {mode: 'Real Chromium synchronous cross-origin XHR with Authorization; service and private GitHub responses are fixtures', checks: []};
 try {
  for (const enabled of [true, false]) {
   env.ACCESS_KEYS_JSON = JSON.stringify({[keyHash]: {enabled}});
   const before = upstreamCalls, page = await browser.newPage();
   await page.route('https://devast.io/', route => route.fulfill({status: 200, contentType: 'text/html', body: '<html><body></body></html>'}));
   const requests = [];
   await page.route('https://private-updates.example/**', async route => {
    const request = route.request(), headers = await request.allHeaders();requests.push(request.method());
    const response = await handle(new Request(request.url(), {method: request.method(), headers}), env);
    await route.fulfill({status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.from(await response.arrayBuffer())});
   });
   await page.goto('https://devast.io/');await page.evaluate(template);
   const result = await page.evaluate(() => ({state: window.__devastRemoteLoader.state, loaded: !!window.__devastMod?.ready}));
   assert.equal(result.state, enabled ? 'loaded' : 'failed');assert.equal(result.loaded, enabled);
   assert.ok(requests.includes('GET'));if (!enabled) assert.equal(upstreamCalls, before);
   report.checks.push({enabled, ...result, request_methods: requests});await page.close();
  }
  report.status = 'passed';
 } finally {await browser.close();}
 fs.mkdirSync('build/private-updates', {recursive: true});fs.writeFileSync('build/private-updates/browser.json', JSON.stringify(report, null, 2) + '\n');
 console.log(JSON.stringify(report));
}
main().catch(error => {console.error(error.message);process.exitCode = 1;});
