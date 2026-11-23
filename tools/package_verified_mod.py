"""Export the checked TypeScript modules and their pinned native-JS build."""
import json
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def package(target="verified-mod"):
    if target not in {"verified-mod", "video-aim-release"}:
        raise ValueError("Unsupported source snapshot")
    video = target == "video-aim-release"
    hud = video and json.loads((ROOT / target / "reference.json").read_text()).get("variant") == "hud"
    build = "tools/build_video_aim.cjs" if video else "tools/build_verified_mod.cjs"
    subprocess.run(["node", build], cwd=ROOT, check=True)
    dependencies = {"acorn": "8.15.0", "typescript": "5.9.3"}
    project = {
        "name": "devast-verified-typescript-mod",
        "version": "1.0.0",
        "private": True,
        "scripts": {
            "build": "node " + build,
            "build:verified-mod": "node " + build,
            **({"build:video-aim": "node tools/build_video_aim.cjs"} if video else {}),
            "build:mod": "node tools/compile_mod.cjs",
            "typecheck": "node tools/compile_mod.cjs --check",
            "check:generated": "node tools/compile_mod.cjs --verify",
            "test": "node --test tests/typescript.test.cjs" + (" tests/video-prediction.test.cjs" if video else "") + (" tests/video-aim-hud.test.cjs" if hud else ""),
        },
        "devDependencies": dependencies,
    }
    original_lock = json.loads((ROOT / "package-lock.json").read_text())
    lock = {
        "name": project["name"], "version": project["version"],
        "lockfileVersion": 3, "requires": True,
        "packages": {
            "": {"name": project["name"], "version": project["version"],
                   "devDependencies": dependencies},
            **{f"node_modules/{name}": original_lock["packages"][f"node_modules/{name}"]
               for name in dependencies},
        },
    }
    files = list((ROOT / "mod").glob("*.ts")) + list((ROOT / "mod").glob("*.js"))
    files += list((ROOT / target).iterdir())
    files += [ROOT / file for file in [
        "mod/contract.json", "mod/README.md", "tsconfig.mod.json",
        "resource-override/loader.ts", "resource-override/loader.js",
        "resource-override/Devast-io-GitHub-Resource-Override.json",
        "vendor/dat.gui.recovered.js", "tools/build_verified_mod.cjs",
        "tools/build_client.cjs", "tools/compile_mod.cjs", "tools/parser.cjs",
        "tools/translate_payload.cjs", "tests/typescript.test.cjs",
        "tests/types/mod-contracts.ts",
    ]]
    if video:
        files += [ROOT / file for file in ["tools/build_video_aim.cjs", "tools/verify_video_prediction.cjs", "tests/video-prediction.test.cjs", "tests/mod-fixture.cjs", "tests/dom-fixture.cjs", "docs/video-prediction-2026-11-23.md"]]
    if hud:
        files.append(ROOT / "tests/video-aim-hud.test.cjs")
    output = ROOT / ("artifacts/video-aim-hud-2026-11-23" if hud else "artifacts/video-aim-2026-11-23" if video else "artifacts/verified-typescript-2026-11-22")
    archive_file = output / ("Devast-io-Video-Aim-HUD-source.zip" if hud else "Devast-io-Video-Aim-source.zip" if video else "Devast-io-TypeScript-Verified-source.zip")
    with zipfile.ZipFile(archive_file, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for file in sorted(set(files)):
            archive.write(file, file.relative_to(ROOT))
        archive.writestr("package.json", json.dumps(project, indent=2) + "\n")
        archive.writestr("package-lock.json", json.dumps(lock, indent=2) + "\n")
        archive.write(ROOT / target / "README.md", "README.md")
        for file in [output / "verification.json", output / "validation-chromium.json",
                     output / "validation-firefox.json"]:
            if file.exists():
                archive.write(file, "reports/" + file.name)
    print(archive_file)


if __name__ == "__main__":
    package()
