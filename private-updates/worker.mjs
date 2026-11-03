// GitHub credentials stay in Worker secrets. Browsers receive only the client.
const MAX_CLIENT_BYTES = 32 * 1024 * 1024;
const HASH = /^[a-f0-9]{64}$/;
const ORIGINS = new Set(['https://devast.io', 'https://www.devast.io']);

export async function sha256(bytes) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
}

export function createHandler(fetchUpstream = fetch) {
  return async function handle(request, env) {
    const origin = request.headers.get('Origin');
    const headers = {'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Origin'};
    if (origin && !ORIGINS.has(origin)) return new Response('Origin not allowed', {status: 403, headers});
    if (origin) headers['Access-Control-Allow-Origin'] = origin;
    const reply = (message, status) => new Response(message, {status, headers});
    const pathname = new URL(request.url).pathname;
    if (!['/client.js', '/current.json'].includes(pathname)) return reply('Not found', 404);
    if (request.method === 'OPTIONS') {
      return new Response(null, {status: 204, headers: {...headers,
        'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization',
        'Access-Control-Max-Age': '600'}});
    }
    if (request.method !== 'GET') return reply('Method not allowed', 405);

    try {
      if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(env.GITHUB_REPOSITORY || '') || !env.GITHUB_TOKEN) {
        return reply('Update service is not configured', 503);
      }
      const authorization = request.headers.get('Authorization') || '';
      const token = /^Bearer (dvu_[A-Za-z0-9_-]{43})$/.exec(authorization)?.[1];
      if (!token) return reply('Access denied', 401);
      const keyHash = await sha256(new TextEncoder().encode(token));
      const keys = JSON.parse(env.ACCESS_KEYS_JSON || '{}');
      const license = Object.hasOwn(keys, keyHash) ? keys[keyHash] : null;
      if (!license || license.enabled !== true) return reply('Access denied', 401);
      if (license.expiresAt && (!Number.isFinite(Date.parse(license.expiresAt)) || Date.parse(license.expiresAt) <= Date.now())) {
        return reply('Access denied', 401);
      }

      const api = 'https://api.github.com/repos/' + env.GITHUB_REPOSITORY;
      const githubHeaders = {Authorization: 'Bearer ' + env.GITHUB_TOKEN,
        Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Devast-Private-Updates'};
      async function github(path, limit) {
        const headers = path.startsWith('/contents/') ? {...githubHeaders, Accept: 'application/vnd.github.raw+json'} : githubHeaders;
        const response = await fetchUpstream(api + path, {headers, redirect: 'error'});
        if (!response.ok) throw new Error('Upstream unavailable');
        const length = response.headers.get('Content-Length');
        if (length && Number(length) > limit) throw new Error('Response too large');
        const reader = response.body.getReader(), chunks = []; let total = 0;
        for (;;) {
          const {value, done} = await reader.read(); if (done) break;
          total += value.byteLength;
          if (total > limit) {await reader.cancel(); throw new Error('Response too large');}
          chunks.push(value);
        }
        const bytes = new Uint8Array(total); let offset = 0;
        for (const chunk of chunks) {bytes.set(chunk, offset); offset += chunk.byteLength;}
        return bytes;
      }
      const decodeJSON = bytes => JSON.parse(new TextDecoder().decode(bytes));
      // Pin both files to one commit so a concurrent publication cannot mix them.
      const ref = decodeJSON(await github('/git/ref/heads/updates', 65536));
      const commit = ref.object?.sha;
      if (!/^[a-f0-9]{40}$/.test(commit || '')) throw new Error('Invalid revision');
      const meta = decodeJSON(await github('/contents/current.json?ref=' + commit, 65536));
      if (!HASH.test(meta.release || '') || !HASH.test(meta.output_sha256 || '') || meta.validation !== 'passed' ||
          meta.script !== 'versions/' + meta.release + '/game.modded.js') throw new Error('Unverified update');
      if (pathname === '/current.json') {
        return new Response(JSON.stringify({release: meta.release, output_sha256: meta.output_sha256, script: '/client.js'}),
          {headers: {...headers, 'Content-Type': 'application/json; charset=utf-8'}});
      }
      const bytes = await github('/contents/' + meta.script + '?ref=' + commit, MAX_CLIENT_BYTES);
      if (await sha256(bytes) !== meta.output_sha256) throw new Error('Update checksum mismatch');
      return new Response(bytes, {headers: {...headers, 'Content-Type': 'application/javascript; charset=utf-8'}});
    } catch (_) {
      // Never return upstream response bodies, private repository URLs or tokens.
      return reply('Update service unavailable', 502);
    }
  };
}

export default {fetch: createHandler()};
