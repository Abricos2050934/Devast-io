# BestScript 1.6 — neon home

Import BestScript-1.6-Auto-Update-Resource-Override.json to fetch game.bestscript.js on page reload. Disable older duplicate Devast JS overrides first.

The new static CSS/SVG home panel reuses the native nickname field, server selector and mode/Play/editor actions. Native menu artwork is suppressed only while the custom panel is visible. No additional animation or polling loop is installed.

Fixes: duplicate keepalive timers, overlapping fire timers and nickname hotkeys. Previous bounded loot work and automation limits are retained. Chromium and Firefox reports are listed in release-manifest.json; live-server gameplay has not been tested.
