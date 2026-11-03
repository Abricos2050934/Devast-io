"""Retarget active GitHub links locally. Does not create repositories or push."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import re

ACTIVE = ['resource-override/loader.js', 'tools/validate_update.cjs',
          'tools/check_resource_override.cjs', 'tests/resource-override.test.cjs']
DOCS = ['README.md', 'AUTO-UPDATE.md', 'resource-override/README.md']

def prepare(root, repository):
    if not re.fullmatch(r'[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?/[A-Za-z0-9_.-]{1,100}', repository) or repository.split('/')[-1] in {'.', '..'}:
        raise ValueError('Use OWNER/REPOSITORY, without a URL or credentials')
    loader = (root / ACTIVE[0]).read_text()
    matches = re.findall(r'https://raw\.githubusercontent\.com/([^/]+/[^/]+)/updates/game\.modded\.js', loader)
    if len(matches) != 1:
        raise ValueError('Expected one stable GitHub loader URL; inspect the loader before migrating')
    previous = matches[0]
    if previous == repository:
        return previous, {}
    updates = {}
    for name in ACTIVE:
        text = (root / name).read_text()
        if previous not in text:
            raise ValueError('Active reference was not found: ' + name)
        updates[name] = text.replace(previous, repository).encode()
    for name in DOCS:
        path = root / name
        if path.exists() and previous in path.read_text():
            updates[name] = path.read_text().replace(previous, repository).encode()
    spec = importlib.util.spec_from_file_location('override_maker', root / 'tools/make_resource_override.py')
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    config = module.configuration(root)
    config['data'][0]['rules'][0]['file'] = updates[ACTIVE[0]].decode().replace('\r\n', '\n').replace('\n', '\r\n')
    updates['resource-override/' + module.NAME] = (json.dumps(config, ensure_ascii=False, indent=2) + '\n').encode()
    return previous, updates

def retarget(root, repository, dry_run=False):
    previous, updates = prepare(root, repository)
    result = {'from': previous, 'to': repository, 'dry_run': dry_run, 'files': sorted(updates),
              'client_url': 'https://raw.githubusercontent.com/' + repository + '/updates/game.modded.js',
              'next': 'Rebuild and validate with both browsers, push main, then publish updates; reimport the new loader JSON.'}
    if not dry_run and updates:
        for name, data in updates.items():
            target = root / name; temporary = target.with_name(target.name + '.retarget-tmp')
            temporary.write_bytes(data); os.replace(temporary, target)
        (root / 'handoff/MIGRATION-STATE.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('repository', help='NEW_OWNER/NEW_REPOSITORY')
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    print(json.dumps(retarget(args.root.resolve(), args.repository, args.dry_run), ensure_ascii=False, indent=2))
