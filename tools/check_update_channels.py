"""Lightweight scheduled freshness check; dispatch the verified builder on drift."""
import argparse
import json
import subprocess
import os
import time
import urllib.request
from pathlib import Path

import update_client as updater
import update_rust

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = 'https://raw.githubusercontent.com/Abricos2050934/Devast-io/updates/'


def reasons(url, raw_sha, js, rust, rust_sha):
    result = []
    for name, meta in [('js', js), ('rust', rust)]:
        if meta.get('source_url') != url or meta.get('raw_sha256') != raw_sha or meta.get('validation') != 'passed':
            result.append(name + '-game-outdated')
    if rust.get('rust_inputs_sha256') != rust_sha:
        result.append('rust-code-outdated')
    return result


def public_meta(name):
    request = urllib.request.Request(PUBLIC + name + '?check=' + updater.now(),
        headers={'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache'})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read(1024 * 1024))
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return {}
        raise


def check(dispatch=False):
    config = updater.load_config(ROOT / 'auto-update.json')
    fetch = updater.Fetcher(config, ROOT / '.updater')
    urls = updater.discover(fetch(config['page_url'], config['max_html_bytes']), config['page_url'], config)
    if len(urls) != 1:
        raise ValueError('Ambiguous current game script')
    try:
        raw_sha = updater.digest(fetch(urls[0], config['max_script_bytes']))
    except updater.UpdateError as error:
        cause = error.__cause__
        if isinstance(cause, urllib.error.HTTPError) and cause.code == 404:
            # During game deployment the HTML can advertise an asset before
            # that asset is available. Wait for it instead of building a 404.
            return dict(state='source-unavailable', source_url=urls[0], http_status=404,
                        retry_next_tick=True)
        raise
    drift = reasons(urls[0], raw_sha, public_meta('current.json'), public_meta('rust/current.json'), update_rust.inputs())
    result = dict(source_url=urls[0], raw_sha256=raw_sha, reasons=drift, state='current')
    if drift:
        result['state'] = 'update-needed'
        if dispatch:
            active = json.loads(subprocess.check_output(['gh', 'run', 'list', '--workflow', 'auto-update.yml',
                '--limit', '30', '--json', 'status'], cwd=ROOT))
            if any(run['status'] != 'completed' for run in active):
                result['state'] = 'builder-already-running'
            else:
                subprocess.run(['gh', 'workflow', 'run', 'auto-update.yml', '--ref', 'main'], cwd=ROOT, check=True)
                result['state'] = 'builder-dispatched'
    return result


def source_changed():
    repository = os.environ.get('GITHUB_REPOSITORY')
    revision = os.environ.get('GITHUB_SHA')
    if not repository or not revision:
        return False
    latest = subprocess.check_output(['gh', 'api', 'repos/' + repository + '/git/ref/heads/main',
        '--jq', '.object.sha'], cwd=ROOT, timeout=30).decode().strip()
    if len(latest) != 40 or any(char not in '0123456789abcdef' for char in latest):
        raise ValueError('GitHub returned an invalid main revision')
    return latest != revision


def watch(seconds, interval=300, dispatch=False, *, tick=check, clock=time.monotonic,
          sleep=time.sleep, rotate=source_changed, emit=None):
    if not 1 <= seconds <= 1500 or interval < 1:
        raise ValueError('Watch duration must be 1–1500 seconds with a positive interval')
    emit = emit or (lambda value: print(json.dumps(value, ensure_ascii=False), flush=True))
    end = clock() + seconds
    checks = failures = 0
    while clock() < end:
        try:
            if rotate():
                return dict(state='handoff', reason='main-changed', checks=checks, failures=failures)
        except Exception as error:
            emit(dict(state='source-check-failed', error=str(error)))
        try:
            result = tick(dispatch)
            checks += 1
            emit(result)
        except Exception as error:
            failures += 1
            emit(dict(state='check-failed', error=str(error)))
        remaining = end - clock()
        if remaining > 0:
            sleep(min(interval, remaining))
    return dict(state='handoff', reason='session-complete', checks=checks, failures=failures)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dispatch', action='store_true')
    parser.add_argument('--watch-minutes', type=int, choices=range(1, 26))
    args = parser.parse_args()
    result = watch(args.watch_minutes * 60, dispatch=args.dispatch) if args.watch_minutes else check(args.dispatch)
    print(json.dumps(result, ensure_ascii=False, indent=2), flush=True)
