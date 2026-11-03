"""Publish the verified current mod to an artifact-only branch, without checkout."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import zipfile
import io

ROOT = Path(__file__).resolve().parents[1]

def digest(data): return hashlib.sha256(data).hexdigest()
def read_json(path): return json.loads(Path(path).read_text())

def artifacts(root, output):
    meta = read_json(output / 'current.json')
    release = meta.get('release', '')
    if not re.fullmatch(r'[a-f0-9]{64}', release): raise ValueError('Invalid release ID')
    directory = output / 'versions' / release
    body = (directory / 'game.modded.js').read_bytes()
    validation = read_json(directory / 'validation.json')
    if digest(body) != meta['output_sha256'] or validation.get('output_sha256') != meta['output_sha256']:
        raise ValueError('Release checksum mismatch')
    if validation.get('status') != 'passed' or validation.get('regression', {}).get('status') != 'passed' or validation.get('candidate_function_tests', {}).get('status') != 'passed':
        raise ValueError('Full current-mod checks have not passed')
    if validation.get('integrity_compatibility') != {'status': 'passed', 'predicates': 3}:
        raise ValueError('Native integrity compatibility checks have not passed')
    contract = read_json(root / 'mod/contract.json')
    if validation.get('mod_contract') != contract:
        raise ValueError('Verified release belongs to another feature contract')
    if 'candidate_tests' in contract and validation['candidate_function_tests'].get('files') != contract['candidate_tests']:
        raise ValueError('Required current feature tests were not verified')
    for browser in contract.get('required_browsers', []):
        report = validation.get('browsers', {}).get(browser, {})
        if report.get('status') != 'passed' or report.get('output_sha256') != meta['output_sha256']:
            raise ValueError('Required browser validation missing or stale: ' + browser)
        if report.get('integrity_compatibility') != {'status': 'passed', 'predicates': 3}:
            raise ValueError('Native integrity compatibility was not verified in browser: ' + browser)
        if 'received-mines-and-wires-visibility' in contract.get('features', []) and report.get('world_visibility') != {'status': 'passed', 'native_renderers': 3}:
            raise ValueError('Native world visibility was not verified in browser: ' + browser)
        if 'right-click-hovered-door' in contract.get('features', []) and report.get('native', {}).get('right_click_hovered_door') is not True:
            raise ValueError('Native right-click door interaction was not verified in browser: ' + browser)
    modules = {file: digest((root / file).read_bytes()) for file in contract['modules']}
    if modules != validation['module_sha256']: raise ValueError('Verified release belongs to another mod revision')
    override_name='Devast-io-GitHub-Resource-Override.json'
    override_bytes=(root/'resource-override'/override_name).read_bytes()
    if validation.get('resource_override_sha256') != digest(override_bytes): raise ValueError('Resource Override was not verified')
    public = dict(meta, publication='github', mod_bundle_sha256=validation['mod_bundle_sha256'], resource_override_sha256=digest(override_bytes))
    encode = lambda value: (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()
    text = '''# Devast-io: автоматически обновляемый клиент

Файл game.modded.js — проверенная сборка нашего текущего мода.
Используйте URL этого файла для подмены основного JS до запуска игры.
Полный клиент нельзя выполнять поверх уже работающего оригинала.

Обновление: проверка сайта, расшифровка, перенос текущих модулей и браузерные тесты.
Новая версия публикуется только после проверок; неизвестные изменения блокируют замену.
Нижние дополнительные показатели и надпись AIM BOT удалены. Адаптер наведения оптимизирован.
Ники #ID, остальные функции и исправление повторного входа сохранены.

current.json содержит хеш готового файла и ссылку на закреплённую версию.
verification.json содержит проверенную ревизию мода и результаты тестов.
Работа на живом сервере и отсутствие киков этими тестами не подтверждены.
'''.encode()
    entries = {'game.modded.js': body, 'current.json': encode(public), 'verification.json': encode(validation),
        'README.md': text, 'versions/' + release + '/game.modded.js': body}
    entries[override_name]=override_bytes
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name in ['game.modded.js', 'current.json', 'verification.json', 'README.md', override_name]:
            info=zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0)); info.compress_type=zipfile.ZIP_DEFLATED; info.external_attr=0o100644 << 16
            archive.writestr(info, entries[name])
    entries['Devast-io-client.zip'] = buffer.getvalue()
    json_buffer=io.BytesIO()
    with zipfile.ZipFile(json_buffer, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        info=zipfile.ZipInfo(override_name, (1980, 1, 1, 0, 0, 0)); info.compress_type=zipfile.ZIP_DEFLATED; info.external_attr=0o100644 << 16
        archive.writestr(info, override_bytes)
    entries['Devast-io-Resource-Override.zip']=json_buffer.getvalue()
    return entries

def publish(root, entries, branch='updates', remote='origin'):
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9/_-]*', branch) or '..' in branch: raise ValueError('Invalid branch')
    ref = 'refs/heads/' + branch
    def git(*args, env=None, data=None):
        return subprocess.check_output(['git', *args], cwd=root, env=env, input=data).decode().strip()
    heads = git('ls-remote', '--heads', remote, ref)
    parent = None
    if heads:
        git('fetch', '--no-tags', remote, ref)
        parent = git('rev-parse', 'FETCH_HEAD')
    fd, index = tempfile.mkstemp(prefix='devast-publish-'); os.close(fd); os.unlink(index)
    env = dict(os.environ, GIT_INDEX_FILE=index)
    try:
        git('read-tree', parent, env=env) if parent else git('read-tree', '--empty', env=env)
        for name, data in sorted(entries.items()):
            blob = git('hash-object', '-w', '--stdin', data=data)
            git('update-index', '--add', '--cacheinfo', '100644', blob, name, env=env)
        tree = git('write-tree', env=env)
        if parent and tree == git('rev-parse', parent + '^{tree}'): return parent
        args = ['-c', 'user.name=Devast updater', '-c', 'user.email=updater@users.noreply.github.com', 'commit-tree', tree]
        if parent: args += ['-p', parent]
        commit = git(*args, data=b'Publish verified current mod update\n')
        # Fast-forward only; a concurrent publisher cannot overwrite a newer release.
        git('push', remote, commit + ':' + ref)
        return commit
    finally:
        Path(index).unlink(missing_ok=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'dist/auto-update')
    parser.add_argument('--branch', default='updates')
    parser.add_argument('--dry-run', type=Path)
    args = parser.parse_args()
    files = artifacts(ROOT, args.output)
    if args.dry_run:
        for name, data in files.items():
            target = args.dry_run / name; target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(data)
        print(json.dumps({'status': 'prepared', 'files': list(files)}))
    else:
        print(json.dumps({'status': 'published', 'commit': publish(ROOT, files, args.branch), 'branch': args.branch}))
