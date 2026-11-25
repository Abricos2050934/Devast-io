"""Lightweight scheduled freshness check; dispatch the verified builder on drift."""
import argparse
import json
import subprocess
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
    raw_sha = updater.digest(fetch(urls[0], config['max_script_bytes']))
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


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dispatch', action='store_true')
    args = parser.parse_args()
    print(json.dumps(check(args.dispatch), ensure_ascii=False, indent=2))
