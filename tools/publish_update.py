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
import importlib.util

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
        if 'right-click-door-independent-of-native-prompt' in contract.get('features', []) and not all(report.get('native', {}).get(key) is True for key in ('right_click_without_native_prompt', 'right_click_real_mouse')):
            raise ValueError('Door request without the E prompt and real mouse input were not verified in browser: ' + browser)
        if 'independent-door-control-and-server-state-feedback' in contract.get('features', []) and not all(report.get('native', {}).get(key) is True for key in ('independent_door_control', 'door_server_state_feedback')):
            raise ValueError('Independent door control and state feedback were not verified in browser: ' + browser)
        if 'automation-socket-backpressure' in contract.get('features', []) and report.get('native', {}).get('automation_socket_backpressure') is not True:
            raise ValueError('Automation socket backpressure was not verified in browser: ' + browser)
        for feature, evidence in [('bounded-fast-loot', 'bounded_fast_loot'), ('session-mod-traffic-history', 'session_mod_traffic_history'), ('bounded-auto-build', 'bounded_auto_build'), ('aim-session-history-reset', 'aim_session_history_reset')]:
            if feature in contract.get('features', []) and report.get('native', {}).get(evidence) is not True:
                raise ValueError('Required traffic behavior was not verified: ' + feature + ' in ' + browser)
        if 'aim-cycle-socket-backpressure' in contract.get('features', []) and report.get('native', {}).get('aim_cycle_socket_backpressure') is not True:
            raise ValueError('Aim cycle socket backpressure was not verified in browser: ' + browser)
        if 'native-weapon-ballistic-interception' in contract.get('features', []):
            adaptive = report.get('native', {}).get('adaptive_aim', {})
            keys = ('native_weapon_speed_and_range', 'native_projectile_speed', 'native_speed_equality',
                    'packet_server_positions', 'shooter_and_target_velocity', 'fresh_angle_before_native_attack',
                    'jitter_priority', 'line_matches_shot', 'stale_target_releases_input')
            if adaptive.get('status') != 'passed' or not all(adaptive.get(key) is True for key in keys):
                raise ValueError('Adaptive ballistic aim was not verified in browser: ' + browser)
        if 'packet-rate-aware-curved-prediction' in contract.get('features', []):
            adaptive = report.get('native', {}).get('adaptive_aim', {})
            if not all(adaptive.get(key) is True for key in ('cadence_aware_curved_prediction', 'straight_quantization_rejected', 'ak_and_laser_native_profiles')):
                raise ValueError('Cadence-aware projectile prediction was not verified in browser: ' + browser)
        if 'valid-live-aim-targets' in contract.get('features', []) and not all(report.get('native', {}).get(key) is True for key in ('valid_live_aim_targets', 'server_death_sends_no_commands')):
            raise ValueError('Live aim targets and server death send behavior were not verified in browser: ' + browser)
        if 'connection-close-origin-diagnostics' in contract.get('features', []) and report.get('native', {}).get('connection_close_origin_diagnostics') is not True:
            raise ValueError('Connection close origin diagnostics not verified in browser: ' + browser)
        if 'coalesced-aim-directions' in contract.get('features', []) and report.get('native', {}).get('coalesced_aim_directions_and_native_idle') is not True:
            raise ValueError('Coalesced aim directions and native idle ping were not verified in browser: ' + browser)
        if 'curved-target-and-chaser-interception' in contract.get('features', []) and report.get('native', {}).get('curved_target_and_chaser_interception') is not True:
            raise ValueError('Curved chasing interception was not verified in browser: ' + browser)
        if 'native-shot-direction-and-render-sync' in contract.get('features', []) and report.get('native', {}).get('native_shot_direction_and_render_sync') is not True:
            raise ValueError('Native shot direction and render sync were not verified in browser: ' + browser)
        if 'verbatim-message15-aim' in contract.get('features', []):
            native = report.get('native', {})
            comparison, extra = native.get('message15_comparison', {}), native.get('message15_extra', {})
            if (comparison.get('status') != 'passed' or comparison.get('comparison_points', 0) < 1400
                    or extra.get('status') != 'passed' or extra.get('comparison_points', 0) < 5800):
                raise ValueError('Message15 source comparison was not verified in browser: ' + browser)
        if 'message15-native-lifecycle' in contract.get('features', []) and report.get('native', {}).get('message15_transport', {}).get('status') != 'passed':
            raise ValueError('Message15 native lifecycle was not verified in browser: ' + browser)
        if 'aim-small-queue-admission' in contract.get('features', []) and report.get('native', {}).get('message15_transport', {}).get('small_queue_admission') is not True:
            raise ValueError('Message15 small-queue admission was not verified in browser: ' + browser)
        if 'immediate-message15-directions-and-bounded-auto-fire' in contract.get('features', []) and report.get('native', {}).get('message15_transport', {}).get('immediate_directions', {}).get('status') != 'passed':
            raise ValueError('Immediate Message15 directions and automatic fire cadence were not verified in browser: ' + browser)
        if 'aim-pointer-ownership-resync' in contract.get('features', []) and report.get('native', {}).get('aim_ownership', {}).get('status') != 'passed':
            raise ValueError('Aim pointer ownership resync was not verified in browser: ' + browser)
        if 'equivalent-efficient-aim-target-search' in contract.get('features', []) and report.get('native', {}).get('efficient_aim_search', {}).get('status') != 'passed':
            raise ValueError('Efficient aim target search was not verified in browser: ' + browser)
        if 'verbatim-untitled-v4-aim' in contract.get('features', []):
            aim = report.get('native', {}).get('untitled_aim', {})
            if (aim.get('status') != 'passed' or aim.get('comparison_points', 0) < 1000
                    or aim.get('native_direction_transforms') is not True or aim.get('native_movement_hooks') is not True
                    or aim.get('whole_auto_fire_cycle') is not True or aim.get('server_death_sends_no_commands') is not True):
                raise ValueError('Uploaded Untitled aim source comparison was not verified in browser: ' + browser)
        if 'verbatim-original-ilm-aim' in contract.get('features', []):
            aim = report.get('native', {}).get('ilm_aim', {})
            if (aim.get('status') != 'passed' or aim.get('comparison_points', 0) < 1000
                    or aim.get('native_direction_ownership') is not True or aim.get('whole_auto_fire_cycle') is not True
                    or aim.get('server_death_sends_no_commands') is not True):
                raise ValueError('Original ILM source comparison was not verified in browser: ' + browser)
        if 'ilm-native-mouse-and-server-angle-parity' in contract.get('features', []):
            native = report.get('native', {})
            mouse, angle = native.get('ilm_mouse', {}), native.get('ilm_server_angle', {})
            if (mouse.get('status') != 'passed' or mouse.get('cases', 0) < 18
                    or mouse.get('exact_target_and_sent_angle') is not True
                    or angle.get('status') != 'passed' or angle.get('cases', 0) < 72
                    or angle.get('actual_server_packet_angle') is not True
                    or angle.get('zero_position_sentinels_ignored') is not True
                    or angle.get('manual_fire_keeps_source_direction') is not True):
                raise ValueError('Original ILM mouse and native server-angle pipeline was not verified in browser: ' + browser)
        if 'ilm-original-menu-layout' in contract.get('features', []):
            menu = report.get('native', {}).get('ilm_menu', {})
            if menu.get('status') != 'passed' or not all(menu.get(key) is True for key in ('exact_order_labels_ranges_steps_options', 'no_extra_aim_controls', 'source_line_color')):
                raise ValueError('Original ILM menu layout was not verified in browser: ' + browser)
        if 'ilm-pointer-ownership-between-ticks' in contract.get('features', []) and report.get('native', {}).get('ilm_aim', {}).get('source_pointer_ownership_on_target_loss') is not True:
            raise ValueError('Original ILM pointer ownership during target loss was not verified in browser: ' + browser)
        if 'native-aim-transport-preserves-idle' in contract.get('features', []) and report.get('native', {}).get('native_aim_transport', {}).get('status') != 'passed':
            raise ValueError('Native aim transport and periodic idle packets were not verified in browser: ' + browser)
        if 'immediate-aim-numeric-settings' in contract.get('features', []) and report.get('physical_numeric', {}).get('status') != 'passed':
            raise ValueError('Physical aim numeric entry was not verified in browser: ' + browser)
        if 'verbatim-message27-aim' in contract.get('features', []):
            aim = report.get('native', {}).get('message27_aim', {})
            if (aim.get('status') != 'passed' or aim.get('upload_sha256') != 'f3001e45554d86505e89532faaa2aff5be69dec90b713e7966428273d2b1abd0'
                    or aim.get('comparison_points', 0) < 2000 or not all(aim.get(key) is True for key in
                    (('exact_states', 'corrected_attack_order', 'source_timing', 'spear', 'uploaded_jitter_removed', 'strafe', 'valid_target_admission', 'session_target_reset', 'server_death_sends_no_commands') if 'restored-original-jitter' in contract.get('features', []) else ('exact_states', 'exact_raw_packets', 'source_timing', 'spear', 'jitter', 'strafe', 'valid_target_admission', 'session_target_reset', 'server_death_sends_no_commands')))):
                raise ValueError('Uploaded message27 source comparison was not verified in browser: ' + browser)
        if 'message27-native-pipeline' in contract.get('features', []):
            aim = report.get('native', {}).get('message27_aim', {})
            if aim.get('native_angles') is not True or aim.get('mouse_cases', 0) < 18:
                raise ValueError('Uploaded message27 native angles were not verified in browser: ' + browser)
        if 'message27-original-menu-layout' in contract.get('features', []):
            menu = report.get('native', {}).get('message27_menu', {})
            if (menu.get('status') != 'passed' or menu.get('controls') != 32 or menu.get('exact_order_labels_ranges_steps_options') is not True
                    or menu.get('keyboard') is not True or menu.get('default_bindings') != {'menu': 'KeyM', 'hide': 'KeyH'}):
                raise ValueError('Uploaded message27 menu was not verified in browser: ' + browser)
        if 'restored-original-jitter' in contract.get('features', []):
            menu = report.get('native', {}).get('message27_menu', {})
            if menu.get('status') != 'passed' or menu.get('controls') != 28 or menu.get('original_jitter_controls') is not True:
                raise ValueError('Restored Jitter menu was not verified in browser: ' + browser)
        if 'aim-line-native-projection' in contract.get('features', []) and report.get('native', {}).get('message27_aim', {}).get('pixel_projection_cases', 0) < 18:
            raise ValueError('Native aim line projection was not verified in browser: ' + browser)
        if 'live-aim-setting-effects' in contract.get('features', []):
            settings = report.get('native', {}).get('message27_settings', {})
            if settings.get('status') != 'passed' or settings.get('gui_controls_live') is not True or settings.get('checked', 0) < (16 if 'restored-original-jitter' in contract.get('features', []) else 17):
                raise ValueError('Live aim setting effects were not verified in browser: ' + browser)
        if 'versioned-aim-settings-preserved' in contract.get('features', []) and report.get('physical_numeric', {}).get('explicit_saved_values') is not True:
            raise ValueError('Explicit saved aim values were not verified in browser: ' + browser)
        if 'jitter-shot-priority' in contract.get('features', []):
            jitter = report.get('native', {}).get('jitter', {})
            if jitter.get('status') != 'passed' or not all(jitter.get(key) is True for key in (('original_rotation', 'configurable_speed', 'imported_jitter_removed', 'manual_angle_before_attack', 'automatic_angle_before_attack', 'held_fire_tracks_target', 'cursor_cannot_overwrite', 'non_jitter_cursor_cannot_overwrite', 'repeated_bursts_aligned', 'resumes_on_release', 'standing_rotation', 'targetless_manual_alignment', 'blocked_attack_rejected', 'local_rotation', 'death_stops_packets') if 'restored-original-jitter' in contract.get('features', []) else ('manual_angle_before_attack', 'automatic_angle_before_attack', 'held_fire_tracks_target', 'cursor_cannot_overwrite', 'resumes_on_release', 'standing_and_stop_option', 'local_rotation', 'death_stops_packets'))):
                raise ValueError('Jitter shot priority was not verified in browser: ' + browser)
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
Аимбот полностью перенесён из действующего блока __BBY файла message (27).txt.
Z — аимбот, J — наше вращение Jitter, M — меню, H — скрытие угла.
Настройки — в Aim Bot, Aimbot Spear, Anti-Aim / Strafe и Aim Line.
Jitter: Enabled и Speed (degrees/sec); Jitter исходника удалён.
Упреждение, выбор и удержание цели, сглаживание, копьё и автострельба сохранены.
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

def check_publication_source(root, meta):
    spec = importlib.util.spec_from_file_location('publication_updater', Path(__file__).with_name('update_client.py'))
    updater = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(updater)
    config = updater.load_config(Path(root) / 'auto-update.json')
    receipt = updater.check_source(config, meta['source_url'], meta['raw_sha256'],
        updater.Fetcher(config, Path(root) / config['state_dir']), meta.get('source_candidates'))
    if updater.fingerprint(Path(root)) != meta['inputs_sha256']:
        raise ValueError('Build inputs changed before publication')
    return receipt

def publish(root, entries, branch='updates', remote='origin', before_push=None):
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
        if before_push is not None: before_push()
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
        source_check = {}
        def check(): source_check.update(check_publication_source(ROOT, json.loads(files['current.json'])))
        print(json.dumps({'status': 'published', 'commit': publish(ROOT, files, args.branch, before_push=check), 'branch': args.branch, 'source_check': source_check}))
