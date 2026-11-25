"""Build Rust from the verified JS updater candidate; select/publish only after checks."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

import update_client as updater
import publish_update as publisher

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'dist/rust-auto-update'


def inputs(root=ROOT):
    files = [root / 'rust-mod/Cargo.toml', root / 'rust-mod/Cargo.lock',
             root / 'rust-mod/bridge.js', root / 'rust-mod/function-manifest.json']
    files += list((root / 'rust-mod/src').glob('*.rs'))
    files += [root / 'tools' / name for name in ('build_rust.cjs', 'build_rust_client.cjs',
              'rust_auto_loader.cjs', 'update_rust.py')]
    return updater.digest(b''.join(str(p.relative_to(root)).encode() + b'\0' +
                                  hashlib.sha256(p.read_bytes()).digest() for p in sorted(files)))


def browser_proof(report, sha):
    if (report.get('status') != 'passed' or report.get('output_sha256') != sha
            or report.get('owned_backend') != 'Rust/WebAssembly' or report.get('page_errors') != []):
        raise ValueError('Rust browser proof is missing or belongs to another client')


def verified_files(directory, current):
    body = (directory / 'client.js').read_bytes()
    if updater.digest(body) != current['output_sha256']:
        raise ValueError('Rust client checksum mismatch')
    proof = updater.read_json(directory / 'verification.json')
    if (proof.get('status') != 'passed' or proof.get('rust_inputs_sha256') != current['rust_inputs_sha256']
            or proof.get('output_sha256') != current['output_sha256']):
        raise ValueError('Rust release proof mismatch')
    for browser in ('chromium', 'firefox'):
        browser_proof(proof.get('browsers', {}).get(browser, {}), current['output_sha256'])
    for name in ('canonical_tests', 'native_tests', 'focused_tests'):
        if proof.get(name) != 'passed':
            raise ValueError('Rust test proof missing: ' + name)
    return body, proof


def run(args, work, name, env=None):
    updater.run(args, ROOT, work / (name + '.log'), timeout=900, env=env)


def once(output=OUTPUT, publish=False):
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    with updater.locked(ROOT / '.updater/rust'):
        # Existing JS publisher enforces both browser proofs, regression tests,
        # current TS/module hashes and the feature contract before Rust adapts it.
        publisher.artifacts(ROOT, ROOT / 'dist/auto-update')
        js = updater.read_json(ROOT / 'dist/auto-update/current.json')
        candidate = ROOT / 'dist/auto-update' / Path(js['script']).parent
        source_hash = inputs()
        release = updater.digest((js['release'] + ':' + source_hash).encode())
        directory = output / 'versions' / release
        if not directory.exists():
            with tempfile.TemporaryDirectory(prefix='rust-release-', dir=ROOT / '.updater') as temp:
                work = Path(temp)
                native = work / 'candidate'
                shutil.copytree(candidate, native)
                built = work / 'output'
                run(['node', 'tools/build_rust.cjs'], work, 'canonical-build')
                run(['node', 'tools/test_rust.cjs'], work, 'canonical-tests')
                run(['node', '--test', 'tests/rust-bridge.test.cjs', 'tests/rust-target-parity.test.cjs',
                     'tests/rust-motion-parity.test.cjs', 'tests/rust-tracking-parity.test.cjs',
                     'tests/rust-roster-cache.test.cjs'], work, 'focused-tests')
                command = 'console.log(JSON.stringify(require("./tools/build_rust_client.cjs").packageClient({candidateDir:process.argv[1],outputDir:process.argv[2]})))'
                run(['node', '-e', command, str(native), str(built)], work, 'native-build')
                build = updater.read_json(built / 'build.json')
                env = dict(os.environ, DEVAST_TEST_CANDIDATE=str(native))
                run(['node', 'tools/test_rust.cjs', 'rust-mod/native'], work, 'native-tests', env)
                browsers = {}
                for browser in ('chromium', 'firefox'):
                    env = dict(os.environ, DEVAST_BROWSER=browser,
                               DEVAST_RUST_RUNTIME=str(ROOT / 'rust-mod/native/owned-runtime.js'))
                    run(['node', 'tools/validate_update.cjs', str(native)], work, browser, env)
                    report = updater.read_json(native / 'validation.json')
                    browser_proof(report, build['output_sha256'])
                    browsers[browser] = report
                if inputs() != source_hash:
                    raise ValueError('Rust inputs changed while building')
                proof = dict(status='passed', output_sha256=build['output_sha256'],
                             rust_inputs_sha256=source_hash, js_release=js['release'],
                             canonical_tests='passed', native_tests='passed', focused_tests='passed',
                             browsers=browsers, live_server='not_tested',
                             performance='Previously documented dense-scene FPS limitations remain')
                updater.atomic_json(built / 'verification.json', proof)
                for log in work.glob('*.log'):
                    shutil.copy2(log, built / log.name)
                meta = dict(schema=1, release=release, js_release=js['release'],
                            source_url=js['source_url'], raw_sha256=js['raw_sha256'],
                            rust_inputs_sha256=source_hash, output_sha256=build['output_sha256'],
                            wasm_sha256=build['wasm_sha256'], backend='Rust/WebAssembly',
                            script='versions/' + release + '/client.js', validation='passed',
                            activated_at=updater.now(), publication='local_only')
                updater.atomic_json(built / 'release.json', meta)
                verified_files(built, meta)
                directory.parent.mkdir(parents=True, exist_ok=True)
                os.replace(built, directory)
        meta = updater.read_json(directory / 'release.json')
        body, proof = verified_files(directory, meta)
        publisher.check_publication_source(ROOT, js)
        if inputs() != source_hash:
            raise ValueError('Rust inputs changed before activation')
        updater.atomic_json(output / 'current.json', meta)
        if publish:
            encode = lambda v: (json.dumps(v, ensure_ascii=False, indent=2) + '\n').encode()
            public = dict(meta, publication='github')
            entries = {'rust/client.js': body, 'rust/current.json': encode(public),
                       'rust/verification.json': encode(proof),
                       'rust/versions/' + release + '/client.js': body,
                       'Devast-io-Rust-Auto-Update.json': (ROOT / 'resource-override/Devast-io-Rust-Auto-Update.json').read_bytes()}
            def check():
                publisher.check_publication_source(ROOT, js)
                if inputs() != source_hash:
                    raise ValueError('Rust inputs changed before publication')
                verified_files(directory, meta)
            commit = publisher.publish(ROOT, entries, before_push=check)
            return dict(public, commit=commit)
        return meta


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--publish', action='store_true')
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    print(json.dumps(once(args.output, args.publish), ensure_ascii=False, indent=2))
