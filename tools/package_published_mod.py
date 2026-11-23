"""Package only the published mod's TypeScript sources and reproducible build."""
import json
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def package():
    subprocess.run(["node", "tools/build_published_mod.cjs"], cwd=ROOT, check=True)
    dependencies = {"acorn": "8.15.0", "typescript": "5.9.3"}
    project = {
        "name": "devast-published-mod-typescript",
        "version": "1.0.0",
        "private": True,
        "scripts": {
            "build": "node tools/build_published_mod.cjs",
            "build:published-mod": "node tools/build_published_mod.cjs",
            "check:published-mod": "node tools/build_published_mod.cjs --check",
            "test": "node --test tests/published-typescript.test.cjs",
        },
        "devDependencies": dependencies,
    }
    original_lock = json.loads((ROOT / "package-lock.json").read_text())
    lock = {
        "name": project["name"],
        "version": project["version"],
        "lockfileVersion": 3,
        "requires": True,
        "packages": {
            "": {
                "name": project["name"],
                "version": project["version"],
                "devDependencies": dependencies,
            },
            **{
                f"node_modules/{name}": original_lock["packages"][f"node_modules/{name}"]
                for name in dependencies
            },
        },
    }
    files = list((ROOT / "published-mod").iterdir()) + [
        ROOT / "resource-override/loader.ts",
        ROOT / "resource-override/loader.js",
        ROOT / "tools/build_published_mod.cjs",
        ROOT / "tools/compile_mod.cjs",
        ROOT / "tools/parser.cjs",
        ROOT / "tsconfig.published-mod.json",
        ROOT / "tests/published-typescript.test.cjs",
    ]
    target = ROOT / "artifacts/published-typescript-2026-11-22/Devast-io-TypeScript-source.zip"
    with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for file in files:
            archive.write(file, file.relative_to(ROOT))
        archive.writestr("package.json", json.dumps(project, indent=2) + "\n")
        archive.writestr("package-lock.json", json.dumps(lock, indent=2) + "\n")
        archive.write(ROOT / "published-mod/README.md", "README.md")
    print(target)


if __name__ == "__main__":
    package()
