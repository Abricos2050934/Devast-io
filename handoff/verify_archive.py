"""Verify a handoff snapshot offline. Never runs the client or reads browser data."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath

def digest(data): return hashlib.sha256(data).hexdigest()

def verify(root, history=None):
    root = root.resolve(); manifest_file = root / 'MANIFEST.json'; sums = root / 'SHA256SUMS.txt'
    if not manifest_file.is_file() or not sums.is_file():
        raise ValueError('Extract the complete Devast-io-Handoff.zip and run from its project directory')
    seen = set()
    for line in sums.read_text().splitlines():
        expected, name = line.split('  ', 1); relative = PurePosixPath(name)
        if relative.is_absolute() or '..' in relative.parts or name in seen:
            raise ValueError('Invalid or duplicate archive path: ' + name)
        target = root.joinpath(*relative.parts)
        if not target.is_file() or root not in target.resolve().parents:
            raise ValueError('Missing or invalid file: ' + name)
        if digest(target.read_bytes()) != expected: raise ValueError('SHA256 mismatch: ' + name)
        seen.add(name)
    m = json.loads(manifest_file.read_text())
    if m.get('schema') != 1 or len(seen) != m['payload_file_count'] + 1:
        raise ValueError('Manifest count/schema mismatch')
    release = m['verified_release']; directory = root / 'dist/auto-update/versions' / release['release']
    body = (root / 'dist/auto-update' / release['script']).read_bytes()
    if digest(body) != release['output_sha256']: raise ValueError('Verified client checksum mismatch')
    validation = json.loads((directory / 'validation.json').read_text())
    contract = json.loads((root / 'mod/contract.json').read_text())
    if validation['mod_contract'] != contract or validation.get('integrity_compatibility') != {'status':'passed','predicates':3}:
        raise ValueError('Current feature/signature contract does not match the release')
    for name in contract['required_browsers']:
        report = validation['browsers'][name]
        if report['status'] != 'passed' or report['output_sha256'] != release['output_sha256'] or report.get('integrity_compatibility') != {'status':'passed','predicates':3}:
            raise ValueError('Browser/signature verification missing: ' + name)
    for name, sha in validation['module_sha256'].items():
        if digest((root/name).read_bytes()) != sha: raise ValueError('Module does not match verified release: ' + name)
    offline = json.loads((root / 'client/Devast-io-Offline-Resource-Override.json').read_text())
    if offline['data'][0]['rules'][0]['file'].encode() != body:
        raise ValueError('Offline Resource Override does not contain the verified client')
    if history is not None:
        if digest(history.read_bytes()) != m['optional_history_bundle']['sha256']:
            raise ValueError('History bundle checksum mismatch')
    return {'status':'verified','checked_files':len(seen),'source_commit':m['source_commit'],
            'client_sha256':release['output_sha256'],'browsers':contract['required_browsers'],
            'signatures_per_browser':3,'history_checked':history is not None}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--history', type=Path)
    args = parser.parse_args()
    try: print(json.dumps(verify(args.root,args.history),ensure_ascii=False))
    except (ValueError,KeyError,OSError) as e: raise SystemExit(str(e))
