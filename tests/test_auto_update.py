import importlib.util
import json
from pathlib import Path
import tempfile
import threading
import unittest
import urllib.request

SPEC = importlib.util.spec_from_file_location('updater', Path(__file__).resolve().parents[1] / 'tools/update_client.py')
u = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(u)

class UpdaterTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'package-lock.json').write_text('{}')
        (self.root / 'mod').mkdir()
        (self.root / 'mod/aim.js').write_text('original ILM')
        self.config = {'schema': 1, 'page_url': 'https://devast.io/', 'allowed_hosts': ['devast.io'], 'state_dir': '.state', 'output_dir': 'dist/auto', 'max_html_bytes': 10000, 'max_script_bytes': 10000, 'max_candidates': 4}
        self.responses = {'https://devast.io/': b'<script src="/js/client.js?v=1"></script>', 'https://devast.io/js/client.js?v=1': b'function game(){return 1}'}
        self.calls = []
        self.fail = False
        def fetch(url, limit):
            result = self.responses[url]
            if isinstance(result, Exception): raise result
            return result
        def build(root, work, url):
            self.calls.append(url)
            if self.fail: raise u.UpdateError('incompatible native packet contract')
            raw = (work / 'raw.js').read_bytes()
            js = raw + (root / 'mod/aim.js').read_bytes()
            (work / 'game.modded.js').write_bytes(js)
            report = {'raw_sha256': u.digest(raw), 'output_sha256': u.digest(js)}
            (work / 'port-report.json').write_text(json.dumps(report))
            return {'status': 'passed', 'output_sha256': u.digest(js)}
        self.bot = u.Updater(self.root, self.config, fetch, build)
    def test_first_update_and_same_content_do_not_rebuild(self):
        self.assertEqual(self.bot.once()['state'], 'updated')
        first = self.bot.current()
        self.assertEqual(self.bot.once()['state'], 'unchanged')
        self.assertEqual(len(self.calls), 1)
        self.assertEqual(self.bot.current(), first)
    def test_same_url_new_bytes_builds_new_version_and_rolls_back(self):
        self.bot.once(); first = self.bot.current()
        self.responses['https://devast.io/js/client.js?v=1'] = b'function game(){return 2}'
        self.assertEqual(self.bot.once()['state'], 'updated')
        self.assertNotEqual(self.bot.current()['release'], first['release'])
        self.bot.rollback()
        self.assertEqual(self.bot.current()['output_sha256'], first['output_sha256'])
    def test_renamed_url_same_bytes_refreshes_pointer_without_rebuild(self):
        self.bot.once()
        raw = self.responses['https://devast.io/js/client.js?v=1']
        self.responses['https://devast.io/'] = b'<script src="/js/new.js?v=2"></script>'
        self.responses['https://devast.io/js/new.js?v=2'] = raw
        self.assertEqual(self.bot.once()['state'], 'unchanged')
        self.assertEqual(len(self.calls), 1)
        self.assertEqual(self.bot.current()['source_url'], 'https://devast.io/js/new.js?v=2')
    def test_failed_port_does_not_change_current_or_its_file(self):
        self.bot.once(); before = (self.bot.output / 'current.json').read_bytes(); meta = self.bot.current()
        js = (self.bot.output / meta['script']).read_bytes()
        self.responses['https://devast.io/js/client.js?v=1'] = b'changed protocol'
        self.fail = True
        with self.assertRaisesRegex(u.UpdateError, 'contract'): self.bot.once()
        self.assertEqual((self.bot.output / 'current.json').read_bytes(), before)
        self.assertEqual((self.bot.output / meta['script']).read_bytes(), js)
        self.assertEqual(u.read_json(self.bot.output / 'status.json')['state'], 'failed')
    def test_network_403_preserves_current(self):
        self.bot.once(); before = self.bot.current()
        self.responses['https://devast.io/'] = u.UpdateError('Source HTTP 403')
        with self.assertRaisesRegex(u.UpdateError, '403'): self.bot.once()
        self.assertEqual(self.bot.current(), before)
    def test_mod_change_rebuilds_same_native_js(self):
        self.bot.once(); before = self.bot.current()
        (self.root / 'mod/aim.js').write_text('changed local feature')
        self.assertEqual(self.bot.once()['state'], 'updated')
        self.assertNotEqual(self.bot.current()['output_sha256'], before['output_sha256'])
    def test_changed_build_inputs_before_activation_preserve_current(self):
        self.bot.once(); before = self.bot.current(); original = self.bot.build
        def changing(root, work, url):
            result = original(root, work, url)
            (root / 'mod/aim.js').write_text('changed during build')
            return result
        self.bot.build = changing
        self.responses['https://devast.io/js/client.js?v=1'] = b'new native'
        with self.assertRaisesRegex(u.UpdateError, 'inputs changed'): self.bot.once()
        self.assertEqual(self.bot.current(), before)
    def test_script_url_changed_during_build_is_not_activated(self):
        self.bot.once(); before = self.bot.current(); original = self.bot.build
        def changing(root, work, url):
            result = original(root, work, url)
            self.responses['https://devast.io/'] = b'<script src="/js/new.js"></script>'
            self.responses['https://devast.io/js/new.js'] = b'latest source'
            return result
        self.bot.build = changing
        self.responses['https://devast.io/js/client.js?v=1'] = b'new native before the build'
        with self.assertRaisesRegex(u.UpdateError, 'script list changed'): self.bot.once()
        self.assertEqual(self.bot.current(), before)

    def test_script_bytes_changed_during_build_are_not_activated(self):
        self.bot.once(); before = self.bot.current(); original = self.bot.build
        def changing(root, work, url):
            result = original(root, work, url)
            self.responses[url] = b'newer bytes after the build'
            return result
        self.bot.build = changing
        self.responses['https://devast.io/js/client.js?v=1'] = b'new native before the build'
        with self.assertRaisesRegex(u.UpdateError, 'script bytes changed'): self.bot.once()
        self.assertEqual(self.bot.current(), before)

    def test_failed_source_recheck_does_not_activate_a_validated_candidate(self):
        self.bot.once(); before = self.bot.current(); original = self.bot.build
        def changing(root, work, url):
            result = original(root, work, url)
            self.responses['https://devast.io/'] = u.UpdateError('freshness HTTP 503')
            return result
        self.bot.build = changing
        self.responses['https://devast.io/js/client.js?v=1'] = b'new native before the build'
        with self.assertRaisesRegex(u.UpdateError, 'freshness HTTP 503'): self.bot.once()
        self.assertEqual(self.bot.current(), before)

    def test_multiple_compatible_clients_are_rejected(self):
        self.bot.once(); before = self.bot.current()
        self.responses['https://devast.io/'] += b'<script src="/js/other.js"></script>'
        self.responses['https://devast.io/js/other.js'] = b'other native'
        with self.assertRaisesRegex(u.UpdateError, 'got 2'): self.bot.once()
        self.assertEqual(self.bot.current(), before)
    def test_validation_hash_mismatch_is_not_activated(self):
        original = self.bot.build
        def corrupt(root, work, url):
            result = original(root, work, url)
            (work / 'game.modded.js').write_text('corrupted after validation')
            return result
        self.bot.build = corrupt
        with self.assertRaisesRegex(u.UpdateError, 'mismatch'): self.bot.once()
        self.assertIsNone(self.bot.current())
    def test_concurrent_update_lock_has_no_stale_pid_problem(self):
        with u.locked(self.bot.state):
            with self.assertRaisesRegex(u.UpdateError, 'already running'): self.bot.once()
        self.assertEqual(self.bot.once()['state'], 'updated')
    def test_corrupted_active_release_is_not_called_unchanged(self):
        self.bot.once(); meta = self.bot.current()
        (self.bot.output / meta['script']).write_text('broken')
        with self.assertRaisesRegex(u.UpdateError, 'integrity'): self.bot.once()
    def test_script_selection_and_redirect_trust(self):
        urls = u.discover(b'<SCRIPT defer SRC="js/a.js?1&amp;x=2"></SCRIPT><script src="https://evil.test/js/a.js"></script><script src="//devast.io/js/a.js?1&amp;x=2"></script>', 'https://devast.io/', self.config)
        self.assertEqual(urls, ['https://devast.io/js/a.js?1&x=2'])
        for url in ['http://devast.io/js/a.js', 'https://devast.io.evil.test/js/a.js', 'https://user:pass@devast.io/js/a.js', 'https://devast.io:444/js/a.js']:
            with self.assertRaises(u.UpdateError): u.validate_url(url, self.config)
    def test_local_server_serves_current_etag_and_blocks_path_traversal(self):
        self.bot.once(); meta = self.bot.current()
        server = u.server(self.bot.output, 0)
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        self.addCleanup(server.server_close); self.addCleanup(server.shutdown)
        base = 'http://127.0.0.1:' + str(server.server_address[1])
        with urllib.request.urlopen(base + '/game.modded.js') as response:
            body, etag = response.read(), response.headers['ETag']
            self.assertEqual(u.digest(body), meta['output_sha256'])
        with self.assertRaises(urllib.error.HTTPError) as caught:
            urllib.request.urlopen(urllib.request.Request(base + '/game.modded.js', headers={'If-None-Match': etag}))
        self.assertEqual(caught.exception.code, 304)
        with self.assertRaises(urllib.error.HTTPError) as caught: urllib.request.urlopen(base + '/../package-lock.json')
        self.assertEqual(caught.exception.code, 404)


class DownloadTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.config = {'allowed_hosts': ['devast.io'], 'retries': 2, 'timeout_seconds': 1}
        self.fetch = u.Fetcher(self.config, Path(self.temp.name))
    def response(self, data=b'client', headers=None):
        class Response:
            url = 'https://devast.io/js/client.js'
            def __init__(self): self.headers = headers or {'ETag': 'version1'}
            def __enter__(self): return self
            def __exit__(self, *_): pass
            def read(self, size): return data[:size]
        return Response()
    def test_304_reuses_only_hash_verified_cache(self):
        from unittest.mock import Mock
        self.fetch.opener = Mock()
        self.fetch.opener.open.side_effect = [self.response(), urllib.error.HTTPError('https://devast.io/js/client.js', 304, '', {}, None)]
        self.assertEqual(self.fetch('https://devast.io/js/client.js', 50), b'client')
        self.assertEqual(self.fetch('https://devast.io/js/client.js', 50), b'client')
        request = self.fetch.opener.open.call_args.args[0]
        self.assertEqual(request.get_header('If-none-match'), 'version1')
    def test_html_is_unconditional_and_must_not_accept_an_unexpected_304(self):
        from unittest.mock import Mock
        url = 'https://devast.io/'
        self.config['page_url'] = url
        self.fetch.opener = Mock()
        self.fetch.opener.open.side_effect = [self.response(b'old html'), self.response(b'fresh html'), urllib.error.HTTPError(url, 304, '', {}, None)]
        self.assertEqual(self.fetch(url, 50), b'old html')
        self.assertEqual(self.fetch(url, 50), b'fresh html')
        request = self.fetch.opener.open.call_args.args[0]
        self.assertIsNone(request.get_header('If-none-match'))
        self.assertIsNone(request.get_header('If-modified-since'))
        self.assertEqual(request.get_header('Cache-control'), 'no-cache')
        with self.assertRaisesRegex(u.UpdateError, 'Unexpected 304'): self.fetch(url, 50)

    def test_corrupt_cache_body_cannot_be_accepted_on_304(self):
        from unittest.mock import Mock
        self.fetch.opener = Mock(); self.fetch.opener.open.return_value = self.response()
        self.fetch('https://devast.io/js/client.js', 50)
        next(self.fetch.cache.glob('*.body')).write_bytes(b'corrupted')
        self.fetch.opener.open.side_effect = urllib.error.HTTPError('https://devast.io/js/client.js', 304, '', {}, None)
        with self.assertRaisesRegex(u.UpdateError, '304 without'): self.fetch('https://devast.io/js/client.js', 50)
    def test_server_503_retries_are_bounded_and_403_is_not_retried(self):
        from unittest.mock import Mock, patch
        for code, count in [(503, 3), (403, 1)]:
            self.fetch.opener = Mock()
            self.fetch.opener.open.side_effect = urllib.error.HTTPError('https://devast.io/js/client.js', code, '', {}, None)
            with patch.object(u.time, 'sleep'):
                with self.assertRaisesRegex(u.UpdateError, str(code)): self.fetch('https://devast.io/js/client.js', 50)
            self.assertEqual(self.fetch.opener.open.call_count, count)
    def test_download_size_and_redirect_destination_are_checked(self):
        from unittest.mock import Mock
        self.fetch.opener = Mock(); self.fetch.opener.open.return_value = self.response(b'x'*51)
        with self.assertRaisesRegex(u.UpdateError, 'size limit'): self.fetch('https://devast.io/js/client.js', 50)
        redirects = u.Redirects(self.config)
        with self.assertRaises(u.UpdateError):
            redirects.redirect_request(urllib.request.Request('https://devast.io/'), None, 302, '', {}, 'https://evil.test/steal')

class PipelineBrowserTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name); self.work = self.root / 'work'; self.work.mkdir()
        (self.root / 'mod').mkdir()
        (self.root / 'mod/contract.json').write_text(json.dumps({'required_browsers': ['chromium', 'firefox'], 'candidate_tests': ['tests/feature.test.cjs']}))
        self.body = b'candidate'; self.calls = []; self.failed = None; self.stale = False; self.bad_integrity = False
        from unittest.mock import patch
        self.patch = patch.object(u, 'run', self.run_command); self.patch.start(); self.addCleanup(self.patch.stop)
    def run_command(self, command, root, log, timeout=600, env=None):
        self.calls.append((command, (env or {}).get('DEVAST_BROWSER')))
        if command[0] == 'node' and command[1] == 'tools/auto_port.cjs':
            (self.work / 'profile.json').write_text('{}'); (self.work / 'game.modded.js').write_bytes(self.body)
        elif command[0] == 'node' and command[1] == 'tools/validate_update.cjs':
            browser = env['DEVAST_BROWSER']
            if browser == self.failed: raise u.UpdateError('Browser failed: ' + browser)
            (self.work / 'validation.json').write_text(json.dumps({'status': 'passed', 'browser': browser, 'integrity_compatibility': {'status': 'passed', 'predicates': 2 if self.bad_integrity and browser == 'firefox' else 3}, 'output_sha256': '0'*64 if self.stale and browser == 'firefox' else u.digest(self.body)}))
        log.write_text('Ran 1 tests\n# tests 2\n')
    def test_both_browsers_are_required_for_the_same_candidate(self):
        report = u.pipeline(self.root, self.work, 'https://devast.io/js/new.js')
        self.assertEqual(set(report['browsers']), {'chromium', 'firefox'})
        self.assertTrue(all(r['status'] == 'passed' for r in report['browsers'].values()))
        self.assertEqual(report['regression']['status'], 'passed')
        self.assertTrue((self.work / 'validation-firefox.json').exists())
    def test_firefox_failure_stops_the_pipeline(self):
        self.failed = 'firefox'
        with self.assertRaisesRegex(u.UpdateError, 'firefox'): u.pipeline(self.root, self.work, 'https://devast.io/js/new.js')
        self.assertFalse(any(command[0] == 'npm' for command, _ in self.calls))
    def test_missing_one_signature_in_firefox_stops_the_pipeline(self):
        self.bad_integrity = True
        with self.assertRaisesRegex(u.UpdateError, 'Three native signature'): u.pipeline(self.root, self.work, 'https://devast.io/js/new.js')
    def test_stale_firefox_report_is_rejected(self):
        self.stale = True
        with self.assertRaisesRegex(u.UpdateError, 'does not match'): u.pipeline(self.root, self.work, 'https://devast.io/js/new.js')

if __name__ == '__main__': unittest.main()
