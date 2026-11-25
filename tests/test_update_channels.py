import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from check_update_channels import reasons


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
