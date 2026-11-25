import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from check_update_channels import reasons, watch


class ChannelFreshnessTests(unittest.TestCase):
    def test_current_channels_need_no_build(self):
        meta = dict(source_url='url', raw_sha256='raw', validation='passed', rust_inputs_sha256='rust')
        self.assertEqual(reasons('url', 'raw', meta, meta, 'rust'), [])

    def test_detects_same_url_game_change_and_independently_stale_rust(self):
        meta = dict(source_url='url', raw_sha256='raw', validation='passed', rust_inputs_sha256='rust')
        self.assertEqual(reasons('url', 'new', meta, meta, 'rust'), ['js-game-outdated', 'rust-game-outdated'])
        self.assertEqual(reasons('url', 'raw', meta, dict(meta, raw_sha256='old'), 'rust'), ['rust-game-outdated'])
        self.assertEqual(reasons('url', 'raw', meta, meta, 'changed'), ['rust-code-outdated'])

    def test_missing_or_failed_metadata_requires_an_update(self):
        meta = dict(source_url='url', raw_sha256='raw', validation='passed', rust_inputs_sha256='rust')
        self.assertIn('rust-game-outdated', reasons('url', 'raw', meta, {}, 'rust'))
        self.assertIn('js-game-outdated', reasons('url', 'raw', dict(meta, validation='failed'), meta, 'rust'))


class MonitorTests(unittest.TestCase):
    def test_checks_continue_after_a_transient_failure_and_session_is_bounded(self):
        now = [0]
        calls = []
        events = []
        def tick(dispatch):
            self.assertTrue(dispatch)
            calls.append(now[0])
            if len(calls) == 2:
                raise OSError('temporary network failure')
            return dict(state='current')
        result = watch(5, interval=2, dispatch=True, tick=tick, clock=lambda:now[0],
                       sleep=lambda seconds:now.__setitem__(0, now[0]+seconds), rotate=lambda:False, emit=events.append)
        self.assertEqual(calls, [0, 2, 4])
        self.assertEqual(now[0], 5)
        self.assertEqual(result, dict(state='handoff', reason='session-complete', checks=2, failures=1))
        self.assertEqual(events[1]['state'], 'check-failed')

    def test_a_new_main_revision_hands_off_before_using_stale_sources(self):
        now = [0]
        calls = []
        result = watch(10, interval=2, tick=lambda _:calls.append(now[0]) or {}, clock=lambda:now[0],
                       sleep=lambda seconds:now.__setitem__(0, now[0]+seconds), rotate=lambda:now[0]>=2, emit=lambda _:None)
        self.assertEqual(calls, [0])
        self.assertEqual(result['reason'], 'main-changed')

    def test_slow_checks_do_not_create_a_catchup_burst(self):
        now = [0]
        def tick(_):
            now[0] += 10
            return {}
        result = watch(5, interval=2, tick=tick, clock=lambda:now[0],
                       sleep=lambda _:self.fail('expired session must not sleep'), rotate=lambda:False, emit=lambda _:None)
        self.assertEqual(result['checks'], 1)

    def test_invalid_duration_cannot_create_an_immediate_handoff_loop(self):
        for duration in (0, -1, 1501):
            with self.assertRaises(ValueError):
                watch(duration)
