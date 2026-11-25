import importlib.util
import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
import update_rust


class RustProofTests(unittest.TestCase):
    def test_browser_proof_rejects_stale_failed_and_non_rust_clients(self):
        good = dict(status='passed', output_sha256='expected', owned_backend='Rust/WebAssembly', page_errors=[])
        update_rust.browser_proof(good, 'expected')
        for patch in [dict(status='failed'), dict(output_sha256='old'), dict(owned_backend='JavaScript'), dict(page_errors=['exception'])]:
            with self.subTest(patch=patch), self.assertRaises(ValueError):
                update_rust.browser_proof(dict(good, **patch), 'expected')

    def test_rust_fingerprint_tracks_sources_and_not_compiler_outputs(self):
        self.assertEqual(len(update_rust.inputs()), 64)
        self.assertEqual(update_rust.inputs(), update_rust.inputs())
