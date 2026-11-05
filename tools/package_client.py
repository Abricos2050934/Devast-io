"""Export the current fully verified auto-update release without publishing it."""
import json
from pathlib import Path
from publish_update import ROOT, artifacts, digest

files = artifacts(ROOT, ROOT / 'dist/auto-update')
out = Path('/workspace/exports')
out.mkdir(parents=True, exist_ok=True)
archive = out / 'Devast-io-client.zip'
if archive.exists():
    backup = out / ('Devast-io-client-' + digest(archive.read_bytes())[:12] + '.zip')
    if not backup.exists():
        backup.write_bytes(archive.read_bytes())
archive.write_bytes(files['Devast-io-client.zip'])
script = out / 'Devast-io-message15-main.js'
script.write_bytes(files['game.modded.js'])
print(json.dumps({'zip': str(archive), 'zip_sha256': digest(archive.read_bytes()),
    'js': str(script), 'js_sha256': digest(script.read_bytes())}))
