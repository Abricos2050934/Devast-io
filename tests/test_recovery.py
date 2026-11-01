import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("recovery", ROOT / "tools/recover_client.py")
recovery = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(recovery)


class RecoveryTests(unittest.TestCase):
    def test_round_trip_is_byte_identical(self):
        source = recovery.original()
        payload = recovery.split_client(source)[1]
        self.assertEqual(recovery.assemble(payload), source)
        self.assertEqual(recovery.digest(source), recovery.EXPECTED_SHA256)

    def test_corrupted_source_is_rejected(self):
        source = recovery.original()
        with self.assertRaisesRegex(ValueError, "checksum mismatch"):
            recovery.split_client(source[:-1] + bytes([source[-1] ^ 1]))

    def test_original_archive_remains_available(self):
        self.assertEqual(recovery.digest(recovery.original()), recovery.EXPECTED_SHA256)


if __name__ == "__main__":
    unittest.main()
