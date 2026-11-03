"""Build an offline handoff from clean tracked sources and the verified current release."""
import argparse
from datetime import datetime,timezone
import hashlib
import importlib.util
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PREFIX = 'Devast-io-Handoff/'

def digest(data): return hashlib.sha256(data).hexdigest()
def encode(value): return (json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode()
def git(*args): return subprocess.check_output(['git',*args],cwd=ROOT)

def build(output,history=None):
    if git('status','--porcelain').strip(): raise ValueError('Commit or preserve local changes before creating a named Git snapshot')
    spec=importlib.util.spec_from_file_location('publisher',ROOT/'tools/publish_update.py');publisher=importlib.util.module_from_spec(spec);spec.loader.exec_module(publisher)
    current=json.loads((ROOT/'dist/auto-update/current.json').read_text())
    entries={}; source_files=[]
    for raw in git('ls-files','-z').split(b'\0'):
        if not raw: continue
        name=raw.decode(); path=PurePosixPath(name)
        if name.startswith(('downloads/migration/','build/','node_modules/')): continue
        if path.is_absolute() or '..' in path.parts or (ROOT/name).is_symlink(): raise ValueError('Invalid source path: '+name)
        if any(part in {'.git','.aws','.codex','.npmrc','.env'} for part in path.parts) or path.suffix in {'.pem','.key'}:
            raise ValueError('Credential-like file must not be included: '+name)
        entries[name]=(ROOT/name).read_bytes();source_files.append(name)
    # Only one current auto-update release; old caches, failed candidates and private runtime data are excluded.
    directory=ROOT/'dist/auto-update/versions'/current['release']
    entries['dist/auto-update/current.json']=encode(current)
    for file in sorted(directory.iterdir()):
        if file.is_file() and file.suffix in {'.js','.json','.html'}:
            entries[str(file.relative_to(ROOT))]=file.read_bytes()
    public=publisher.artifacts(ROOT,ROOT/'dist/auto-update')
    for name in ['game.modded.js','current.json','verification.json','Devast-io-GitHub-Resource-Override.json']:
        entries['client/'+name]=public[name]
    offline=json.loads(public['Devast-io-GitHub-Resource-Override.json'])
    offline['data'][0]['rules'][0]['file']=public['game.modded.js'].decode()
    entries['client/Devast-io-Offline-Resource-Override.json']=encode(offline)
    entries['client/README-USE.txt']=('game.modded.js — точная проверенная сборка.\n'
      'Offline-Resource-Override.json содержит её целиком и не обращается к GitHub.\n'
      'GitHub-Resource-Override.json получает обновления со старого адреса; при переезде нужен новый JSON.\n'
      'Активно должно быть одно правило подмены основного JS. Не запускайте второй клиент поверх игры.\n'
      'Снимок работает с совместимой версией игры; новые версии требуют проверки/пересборки.\n').encode()
    loader=(ROOT/'resource-override/loader.js').read_text()
    repo=re.search(r'https://raw\.githubusercontent\.com/([^/]+/[^/]+)/updates/',loader).group(1)
    validation=json.loads((directory/'validation.json').read_text())
    commit=git('rev-parse','HEAD').decode().strip()
    manifest={'schema':1,'created_at':datetime.now(timezone.utc).isoformat(),'source_repository':repo,
      'source_commit':commit,'functional_source_commit':commit,'payload_file_count':len(entries),
      'tracked_source_files':source_files,'verified_release':current,'regression':validation['regression'],
      'required_browsers':validation['mod_contract']['required_browsers'],
      'integrity_compatibility':validation['integrity_compatibility'],
      'payload_files':[{'path':name,'sha256':digest(data),'bytes':len(data)} for name,data in sorted(entries.items())],
      'excluded':['.git configuration and credentials','node_modules','browser profiles and cookies','.updater and failed candidates','all old auto-update releases','full external ILM license/webhook/startup bundle'],
      'continuation':['CONTINUE-IN-NEW-CHAT.md','handoff/CURRENT-STATE.md','handoff/MIGRATE-TO-NEW-GITHUB.md','handoff/NEW-CHAT-PROMPT.txt']}
    if history is not None:
        manifest['optional_history_bundle']={'file':history.name,'sha256':digest(history.read_bytes()),'bytes':history.stat().st_size,
          'scope':'Full source-branch history reachable from the snapshot commit; updates history is not included',
          'refs':subprocess.check_output(['git','bundle','list-heads',str(history)],cwd=ROOT).decode().splitlines()}
    entries['MANIFEST.json']=encode(manifest)
    entries['SHA256SUMS.txt']=''.join(digest(data)+'  '+name+'\n' for name,data in sorted(entries.items())).encode()
    output.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=9,allowZip64=True) as archive:
        for name,data in sorted(entries.items()):
            info=zipfile.ZipInfo(PREFIX+name,(2026,11,3,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
            archive.writestr(info,data)
    with zipfile.ZipFile(output) as archive:
        if archive.testzip() is not None: raise ValueError('ZIP CRC check failed')
    return {'file':str(output),'bytes':output.stat().st_size,'sha256':digest(output.read_bytes()),'source_commit':commit,
            'client_sha256':current['output_sha256'],'payload_files':manifest['payload_file_count']}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=ROOT/'build/handoff/Devast-io-Handoff.zip')
    parser.add_argument('--history',type=Path)
    args=parser.parse_args();print(json.dumps(build(args.output.resolve(),args.history.resolve() if args.history else None),ensure_ascii=False))
