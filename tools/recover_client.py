"""Lossless recovery of one supplied client; does not remap a new game version."""
import argparse
import gzip
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_SHA256 = "9c4448cfd9029816dd0def23cb5df3cf242c0569812dcbc14fd70b35c8b03a70"
START = b"function __installDevastMod(B) {"
END = b"\nvar __responsiveView = {x:0,y:0,scale:1,ctx:"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def split_client(data):
    if digest(data) != EXPECTED_SHA256:
        raise ValueError("Supplied client checksum mismatch; recovery stopped")
    if data.count(START) != 1 or data.count(END) != 1:
        raise ValueError("Recovery boundaries must each occur exactly once")
    start, end = data.index(START), data.index(END)
    if start >= end:
        raise ValueError("Invalid recovery boundary order")
    return data[:start], data[start:end], data[end:]


def original():
    data = gzip.decompress((ROOT / "recovery/game.modded.ilm.js.gz").read_bytes())
    split_client(data)
    return data


def assemble(payload):
    prefix, _, suffix = split_client(original())
    return prefix + payload + suffix


def atomic_write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(dir=path.parent, prefix=".recovery-")
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(data)
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def build():
    data = assemble((ROOT / "mod/responsive.js").read_bytes())
    # Validate the assembled file before replacing any existing build.
    target = ROOT / "dist/game.modded.js"
    with tempfile.TemporaryDirectory() as directory:
        candidate = Path(directory) / "client.js"
        candidate.write_bytes(data)
        subprocess.run(["node", "--check", str(candidate)], check=True)
    atomic_write(target, data)
    status = {
        "status": "restored_unverified",
        "source": "user-upload:game.modded.ilm.js",
        "source_sha256": EXPECTED_SHA256,
        "output_sha256": digest(data),
        "output_bytes": len(data),
        "identical_to_upload": digest(data) == EXPECTED_SHA256,
        "current_game_compatibility": "not_verified",
        "publication": "not_verified",
    }
    atomic_write(ROOT / "dist/update-status.json",
                 (json.dumps(status, indent=2) + "\n").encode())
    print(json.dumps(status, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["build"])
    parser.parse_args()
    build()


if __name__ == "__main__":
    main()
