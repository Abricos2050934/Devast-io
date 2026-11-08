"""Fetch -> decrypt -> port -> verify -> atomically select a version. No publication."""
import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import fcntl
import hashlib
from html.parser import HTMLParser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import shutil
import signal
import ssl
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = 1

def digest(data):
    return hashlib.sha256(data).hexdigest()

def now():
    return datetime.now(timezone.utc).isoformat()

def read_json(path):
    return json.loads(Path(path).read_text())

def atomic(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(dir=path.parent, prefix='.write-')
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(name, path)
    finally:
        Path(name).unlink(missing_ok=True)

def atomic_json(path, value):
    atomic(path, (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode())

class UpdateError(Exception):
    pass

def validate_url(url, config):
    parsed = urllib.parse.urlsplit(url)
    if (parsed.scheme != 'https' or parsed.hostname not in config['allowed_hosts']
            or parsed.username is not None or parsed.password is not None
            or parsed.port not in (None, 443)):
        raise UpdateError('Untrusted source URL: HTTPS on an allowed game host is required')
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, parsed.query, ''))

class Sources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'script' and attrs.get('src'):
            self.scripts.append(attrs['src'])

def discover(html, page_url, config):
    parser = Sources()
    parser.feed(html.decode('utf-8-sig', errors='replace'))
    urls = []
    for src in parser.scripts:
        url = urllib.parse.urljoin(page_url, src)
        try:
            url = validate_url(url, config)
        except UpdateError:
            continue
        parsed = urllib.parse.urlsplit(url)
        if not parsed.path.startswith('/js/') or not parsed.path.lower().endswith('.js'):
            continue
        if url not in urls:
            urls.append(url)
    if not urls:
        raise UpdateError('No same-site /js/*.js game script found in the current HTML')
    if len(urls) > config['max_candidates']:
        raise UpdateError('Too many possible game scripts; selection is ambiguous')
    return urls

class Redirects(urllib.request.HTTPRedirectHandler):
    max_redirections = 5
    def __init__(self, config):
        self.config = config
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        validate_url(urllib.parse.urljoin(req.full_url, newurl), self.config)
        return super().redirect_request(req, fp, code, msg, headers, newurl)

class Fetcher:
    def __init__(self, config, state):
        self.config, self.cache = config, state / 'http-cache'
        self.cache.mkdir(parents=True, exist_ok=True)
        # ProxyHandler uses the inherited proxy; verification uses system CA trust.
        self.opener = urllib.request.build_opener(urllib.request.ProxyHandler(),
            urllib.request.HTTPSHandler(context=ssl.create_default_context()), Redirects(config))
    def __call__(self, url, limit):
        validate_url(url, self.config)
        key = digest(url.encode())
        meta, body = self.cache / (key + '.json'), self.cache / (key + '.body')
        try: previous = read_json(meta) if meta.exists() else {}
        except (OSError, ValueError): previous = {}
        headers = {'User-Agent': 'Mozilla/5.0 DevastClientUpdater/1.0', 'Accept-Encoding': 'identity',
                   'Cache-Control': 'no-cache', 'Pragma': 'no-cache'}
        fresh_page = url == self.config.get('page_url')
        valid_cache = body.exists() and body.stat().st_size <= limit and digest(body.read_bytes()) == previous.get('sha256')
        if valid_cache and not fresh_page:
            if previous.get('etag'): headers['If-None-Match'] = previous['etag']
            if previous.get('last_modified'): headers['If-Modified-Since'] = previous['last_modified']
        for attempt in range(self.config['retries'] + 1):
            try:
                with self.opener.open(urllib.request.Request(url, headers=headers), timeout=self.config['timeout_seconds']) as response:
                    length = response.headers.get('Content-Length')
                    if length and int(length) > limit: raise UpdateError('Response exceeds the configured size limit')
                    data = response.read(limit + 1)
                    if len(data) > limit: raise UpdateError('Response exceeds the configured size limit')
                    final_url = validate_url(response.url, self.config)
                    atomic(body, data)
                    atomic_json(meta, {'url': final_url, 'sha256': digest(data), 'etag': response.headers.get('ETag'), 'last_modified': response.headers.get('Last-Modified')})
                    return data
            except urllib.error.HTTPError as error:
                if error.code == 304:
                    if fresh_page: raise UpdateError('Unexpected 304 for an unconditional page request') from error
                    if not valid_cache: raise UpdateError('304 without a verified cached body') from error
                    return body.read_bytes()
                if error.code not in (429, 500, 502, 503, 504) or attempt == self.config['retries']:
                    raise UpdateError('Source HTTP ' + str(error.code)) from error
            except (urllib.error.URLError, TimeoutError) as error:
                if attempt == self.config['retries']:
                    raise UpdateError('Source network failure: ' + str(error.reason if isinstance(error, urllib.error.URLError) else error)) from error
            time.sleep(min(2 ** attempt, 4))

def check_source(config, url, raw_sha, fetch, expected_urls=None):
    """Revalidate the source after expensive checks and before a remote write."""
    page_url = validate_url(config['page_url'], config)
    html = fetch(page_url, config['max_html_bytes'])
    urls = discover(html, page_url, config)
    if urls != (expected_urls if expected_urls is not None else [url]):
        raise UpdateError('Game script list changed during validation; release is stale')
    if digest(fetch(url, config['max_script_bytes'])) != raw_sha:
        raise UpdateError('Game script bytes changed during validation; release is stale')
    return {'checked_at': now(), 'page_sha256': digest(html), 'source_url': url, 'raw_sha256': raw_sha}

@contextmanager
def locked(state):
    state.mkdir(parents=True, exist_ok=True)
    with (state / 'update.lock').open('a+') as stream:
        try: fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as error: raise UpdateError('Another updater is already running') from error
        try: yield
        finally: fcntl.flock(stream, fcntl.LOCK_UN)

def fingerprint(root):
    files = [p for p in (root / 'package-lock.json', root / 'package.json') if p.exists()]
    for directory in ('mod', 'patches', 'vendor', 'tools', 'tests', 'recovery', 'baselines', 'resource-override'):
        files.extend(p for p in (root / directory).rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix in ('.js', '.cjs', '.py', '.json', '.gz'))
    sha = hashlib.sha256()
    for file in sorted(set(files)):
        sha.update(str(file.relative_to(root)).encode() + b'\0' + hashlib.sha256(file.read_bytes()).digest())
    return sha.hexdigest()

def run(command, root, log, timeout=600, env=None):
    try:
        result = subprocess.run(command, cwd=root, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=timeout, check=False, env=env)
    except subprocess.TimeoutExpired as error:
        raise UpdateError('Validation command timed out: ' + command[0]) from error
    atomic(log, result.stdout)
    if result.returncode:
        tail = result.stdout.decode(errors='replace')[-2000:]
        raise UpdateError('Command failed: ' + ' '.join(command[:2]) + '\n' + tail)

def pipeline(root, work, url):
    run(['node', 'tools/auto_port.cjs', str(work / 'raw.js'), str(work)], root, work / 'port.log')
    profile = read_json(work / 'profile.json')
    profile['source_url'] = url
    atomic_json(work / 'profile.json', profile)
    contract = read_json(root / 'mod/contract.json')
    required_browsers = contract['required_browsers']
    if not required_browsers or len(set(required_browsers)) != len(required_browsers):
        raise UpdateError('A nonempty list of distinct browser checks is required')
    browsers = {}
    validation = None
    for browser in required_browsers:
        browser_env = dict(os.environ, DEVAST_BROWSER=browser)
        run(['node', 'tools/validate_update.cjs', str(work)], root, work / ('validation-' + browser + '.log'), env=browser_env)
        report = read_json(work / 'validation.json')
        if (report.get('status') != 'passed' or report.get('browser') != browser or
                report.get('output_sha256') != digest((work / 'game.modded.js').read_bytes())):
            raise UpdateError('Browser validation does not match candidate: ' + browser)
        if report.get('integrity_compatibility') != {'status': 'passed', 'predicates': 3}:
            raise UpdateError('Three native signature checks are required in browser: ' + browser)
        atomic_json(work / ('validation-' + browser + '.json'), report)
        if validation is None:
            validation = dict(report)
        browsers[browser] = {key: report.get(key) for key in ('status', 'output_sha256', 'browser_version', 'native', 'page_errors', 'reload_identity', 'integrity_compatibility', 'world_visibility', 'physical_numeric')}
    validation['browsers'] = browsers
    candidate_env = dict(os.environ, DEVAST_TEST_CANDIDATE=str(work))
    run(['node', '--test', *contract['candidate_tests']], root, work / 'candidate-tests.log', env=candidate_env)
    run(['npm', 'test'], root, work / 'regression.log')
    regression = (work / 'regression.log').read_text(errors='replace')
    node = re.search(r'(?m)^.*?tests (\d+)\s*$', regression)
    python = re.search(r'Ran (\d+) tests', regression)
    validation['candidate_function_tests'] = {'status': 'passed', 'files': contract['candidate_tests']}
    validation['regression'] = {'status': 'passed', 'command': 'npm test',
        'node_tests': int(node.group(1)) if node else None,
        'python_tests': int(python.group(1)) if python else None}
    atomic_json(work / 'validation.json', validation)
    return validation

class Updater:
    def __init__(self, root, config, fetch=None, build=None):
        self.root, self.config = Path(root), config
        self.state = self.root / config['state_dir']
        self.output = self.root / config['output_dir']
        self.fetch = fetch or Fetcher(config, self.state)
        self.build = build or pipeline
    def current(self):
        file = self.output / 'current.json'
        return read_json(file) if file.exists() else None
    def once(self):
        with locked(self.state):
            started = now()
            attempt = {'schema': SCHEMA, 'started_at': started, 'state': 'checking', 'publication': 'local_only'}
            atomic_json(self.output / 'status.json', attempt)
            try:
                page_url = validate_url(self.config['page_url'], self.config)
                html = self.fetch(page_url, self.config['max_html_bytes'])
                urls = discover(html, page_url, self.config)
                inputs = fingerprint(self.root)
                existing = self.current()
                candidates = []
                failures = []
                # Inspect every same-site candidate; never silently pick the first script.
                for url in urls:
                    raw = self.fetch(url, self.config['max_script_bytes'])
                    if raw.lstrip().startswith((b'<', b'<!')):
                        failures.append('HTML returned instead of JS')
                        continue
                    raw_sha = digest(raw)
                    if existing and raw_sha == existing['raw_sha256'] and inputs == existing['inputs_sha256']:
                        file = self.output / existing['script']
                        if not file.exists() or digest(file.read_bytes()) != existing['output_sha256']:
                            raise UpdateError('Current release integrity check failed')
                        candidates.append(('unchanged', url, raw_sha, None))
                        continue
                    work = Path(tempfile.mkdtemp(prefix='candidate-', dir=self.state))
                    atomic(work / 'raw.js', raw)
                    atomic(work / 'index.html', html)
                    atomic_json(work / 'source.json', {'page_url': page_url, 'script_url': url, 'raw_sha256': raw_sha})
                    try:
                        validation = self.build(self.root, work, url)
                        port_report = read_json(work / 'port-report.json')
                        output_sha = digest((work / 'game.modded.js').read_bytes())
                        if (validation.get('status') != 'passed' or validation.get('output_sha256') != output_sha or port_report.get('raw_sha256') != raw_sha or port_report.get('output_sha256') != output_sha):
                            raise UpdateError('Candidate report/hash mismatch')
                        candidates.append(('updated', url, raw_sha, work))
                    except Exception as error:
                        failures.append(str(error)[-2500:])
                        # Keep one inspectable failed candidate, never expose it as current.
                        failed = self.state / 'failed-latest'
                        if failed.exists(): shutil.rmtree(failed)
                        atomic(work / 'failure.txt', str(error)[-5000:].encode())
                        shutil.move(str(work), str(failed))
                unique = {item[2]: item for item in candidates}
                if len(unique) != 1:
                    raise UpdateError('Expected exactly one compatible game script, got ' + str(len(unique)) + '; ' + '; '.join(failures))
                state, url, raw_sha, work = next(iter(unique.values()))
                if fingerprint(self.root) != inputs:
                    raise UpdateError('Build inputs changed during update; candidate was not activated')
                source_check = check_source(self.config, url, raw_sha, self.fetch, urls)
                if state == 'unchanged':
                    if url != existing['source_url'] or existing.get('source_candidates') != urls:
                        existing['source_url'] = url
                        existing['source_candidates'] = urls
                        atomic_json(self.output / 'current.json', existing)
                    selected = existing
                else:
                    release = digest((raw_sha + ':' + inputs).encode())
                    versions = self.output / 'versions'
                    versions.mkdir(parents=True, exist_ok=True)
                    temporary = versions / ('.candidate-' + release)
                    destination = versions / release
                    if temporary.exists(): shutil.rmtree(temporary)
                    shutil.copytree(work, temporary)
                    selected = {'schema': SCHEMA, 'release': release, 'raw_sha256': raw_sha, 'inputs_sha256': inputs,
                        'output_sha256': digest((temporary / 'game.modded.js').read_bytes()),
                        'script': 'versions/' + release + '/game.modded.js', 'source_url': url,
                        'source_candidates': urls,
                        'activated_at': now(), 'previous_release': existing['release'] if existing else None,
                        'validation': 'passed', 'live_server': 'not_tested', 'publication': 'local_only'}
                    atomic_json(temporary / 'release.json', selected)
                    if destination.exists():
                        if read_json(destination / 'release.json')['output_sha256'] != selected['output_sha256']:
                            raise UpdateError('Existing immutable release has a different hash')
                        shutil.rmtree(temporary)
                    else: os.replace(temporary, destination)
                    # Single commit point. All files in the pointed-to version already exist.
                    atomic_json(self.output / 'current.json', selected)
                attempt.update(state=state, finished_at=now(), release=selected['release'], output_sha256=selected['output_sha256'], source_check=source_check)
                atomic_json(self.output / 'status.json', attempt)
                return attempt
            except Exception as error:
                attempt.update(state='failed', finished_at=now(), error=str(error)[-5000:])
                atomic_json(self.output / 'status.json', attempt)
                raise
            finally:
                for _, _, _, work in locals().get('candidates', []):
                    if work: shutil.rmtree(work, ignore_errors=True)
    def rollback(self, release=None):
        with locked(self.state):
            current = self.current()
            release = release or (current or {}).get('previous_release')
            if not release or not re.fullmatch(r'[a-f0-9]{64}', release): raise UpdateError('No valid rollback release')
            meta = read_json(self.output / 'versions' / release / 'release.json')
            if digest((self.output / meta['script']).read_bytes()) != meta['output_sha256']: raise UpdateError('Rollback artifact hash mismatch')
            if meta.get('validation') != 'passed': raise UpdateError('Rollback release was not verified')
            atomic_json(self.output / 'current.json', meta)
            return meta

def server(output, port):
    output = Path(output)
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            route = urllib.parse.urlsplit(self.path).path
            try:
                if route == '/game.modded.js':
                    meta = read_json(output / 'current.json')
                    file = output / 'versions' / meta['release'] / 'game.modded.js'
                    if not re.fullmatch(r'[a-f0-9]{64}', meta['release']): raise UpdateError('Invalid release')
                    data = file.read_bytes()
                    if digest(data) != meta['output_sha256']: raise UpdateError('Artifact integrity failure')
                    content_type, cache = 'text/javascript; charset=utf-8', 'no-cache'
                elif route in ('/current.json', '/status.json'):
                    data = (output / route[1:]).read_bytes()
                    content_type, cache = 'application/json', 'no-cache'
                elif re.fullmatch(r'/versions/[a-f0-9]{64}/game\.modded\.js', route):
                    data = (output / route[1:]).read_bytes()
                    release = route.split('/')[2]
                    if digest(data) != read_json(output / 'versions' / release / 'release.json')['output_sha256']:
                        raise UpdateError('Artifact integrity failure')
                    content_type, cache = 'text/javascript; charset=utf-8', 'public, max-age=31536000, immutable'
                else:
                    self.send_error(404)
                    return
                etag = '"' + digest(data) + '"'
                if self.headers.get('If-None-Match') == etag:
                    self.send_response(304)
                    self.send_header('ETag', etag)
                    self.end_headers()
                    return
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(len(data)))
                self.send_header('Cache-Control', cache)
                self.send_header('ETag', etag)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data)
            except FileNotFoundError: self.send_error(503, 'No verified release yet')
            except (ValueError, KeyError, UpdateError): self.send_error(503, 'Release integrity failure')
        def log_message(self, *_):
            pass
    return ThreadingHTTPServer(('127.0.0.1', port), Handler)

def load_config(path):
    config = read_json(path)
    if config.get('schema') != SCHEMA: raise UpdateError('Unsupported updater config')
    for key in ('poll_seconds', 'timeout_seconds', 'max_html_bytes', 'max_script_bytes', 'max_candidates'):
        if not isinstance(config.get(key), int) or config[key] <= 0: raise UpdateError('Invalid config field ' + key)
    if config['poll_seconds'] < 5 or not 0 <= config.get('retries', -1) <= 5: raise UpdateError('Invalid polling/retry limits')
    for key in ('state_dir', 'output_dir'):
        if Path(config[key]).is_absolute() or '..' in Path(config[key]).parts: raise UpdateError('Output paths must stay within the repository')
    validate_url(config['page_url'], config)
    return config

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['once', 'watch', 'serve', 'status', 'rollback'])
    parser.add_argument('--config', type=Path, default=ROOT / 'auto-update.json')
    parser.add_argument('--port', type=int, default=8787)
    parser.add_argument('--release')
    args = parser.parse_args()
    config = load_config(args.config)
    updater = Updater(ROOT, config)
    if args.command == 'once': print(json.dumps(updater.once(), ensure_ascii=False))
    elif args.command == 'status': print(json.dumps({'current': updater.current(), 'last_attempt': read_json(updater.output / 'status.json') if (updater.output / 'status.json').exists() else None}, ensure_ascii=False, indent=2))
    elif args.command == 'rollback': print(json.dumps(updater.rollback(args.release), ensure_ascii=False))
    elif args.command == 'serve': server(updater.output, args.port).serve_forever()
    else:
        stop = threading.Event()
        signal.signal(signal.SIGTERM, lambda *_: stop.set())
        signal.signal(signal.SIGINT, lambda *_: stop.set())
        while not stop.is_set():
            try: print(json.dumps(updater.once(), ensure_ascii=False), flush=True)
            except Exception as error: print(json.dumps({'state': 'failed', 'error': str(error)[-5000:]}, ensure_ascii=False), file=sys.stderr, flush=True)
            stop.wait(config['poll_seconds'])

if __name__ == '__main__':
    try: main()
    except Exception as error:
        print(json.dumps({'state': 'failed', 'error': str(error)[-5000:]}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
