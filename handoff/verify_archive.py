"""Verify a restored handoff snapshot; does not execute game code or use the network."""
import hashlib
import json
from pathlib import Path, PurePosixPath

root = Path(__file__).resolve().parents[1]
manifest_file = root / 'MANIFEST.json'
checksums_file = root / 'SHA256SUMS.txt'
if not manifest_file.is_file() or not checksums_file.is_file():
    raise SystemExit('Run this inside the extracted full Devast-io-Handoff archive (MANIFEST.json and SHA256SUMS.txt required).')

seen = set()
for line in checksums_file.read_text().splitlines():
    expected, name = line.split('  ', 1)
    relative = PurePosixPath(name)
    if relative.is_absolute() or '..' in relative.parts or name in seen:
        raise SystemExit('Invalid or duplicate archive path: ' + name)
    target = root.joinpath(*relative.parts)
    if not target.is_file() or root not in target.resolve().parents:
        raise SystemExit('Missing or invalid file: ' + name)
    actual = hashlib.sha256(target.read_bytes()).hexdigest()
    if actual != expected:
        raise SystemExit('SHA256 mismatch: ' + name)
    seen.add(name)
manifest = json.loads(manifest_file.read_text())
if manifest.get('schema') != 1 or len(seen) != manifest['payload_file_count'] + 1:
    raise SystemExit('Manifest file count/schema mismatch')
release = manifest['verified_release']
client = root / 'dist/auto-update' / release['script']
if hashlib.sha256(client.read_bytes()).hexdigest() != release['output_sha256']:
    raise SystemExit('Verified client checksum mismatch')
print(json.dumps({'status':'verified','checked_files':len(seen),'client_sha256':release['output_sha256'],'functional_source_commit':manifest['functional_source_commit']}, ensure_ascii=False))
