# Late preflight errors closing a newer session

A timed-out login could retain an asynchronous HTTP error callback. If another
login became connected before that old error arrived, the original native error
callback called the native global socket closer. It addressed the current socket,
so it could terminate the new connection even with all automation disabled.
The existing ownership guard covered success callbacks only.

An isolated fixture invoked the actual protected native preflight stage, held
its HTTP terminal callbacks, expired the first login through the existing timeout
path, started another attempt, and marked its fixture socket connected. Releasing
the first attempt's native failure callback then changed native state from 1 to
64 and called socket.close once in both Chromium and Firefox. The native callback
was not replaced with a synthetic closer. No game server was contacted by these
requests; the socket and HTTP terminal-response timing were fixtures.

Both terminal callbacks now capture the owning login generation. A late error
from an obsolete attempt is discarded before its native callback runs. An error
for the current attempt continues through the original native error handler.
The fix applies in all reviewed native profiles and in the updater's special
callbackGuard regeneration path. Updating only the profiles would be insufficient:
that generation path previously recreated a success-only guard independently.

The browser gate requires zero socket closes from the obsolete failure while
connected, one close from an actual current failure, a rejected-stale callback
counter, disabled automation, and unchanged saved identity. Unit tests also cover
nested requests issued from an accepted failure callback, disposal, failure-only
requests, and all reviewed guard fragments. The instrumented fixture is parsed
before browser startup so malformed fixture instrumentation fails immediately.

Aim, Jitter, command cadence and server-death packet processing are unchanged.
This is a proven cause of a client-side transport drop under the reproduced
sequence. The earlier uploaded report instead records an incoming opcode-27 death
before the close, with no corresponding client-close request. It therefore does
not establish that this race caused that particular server-directed death or
an IP restriction.

The user's new Untitled-1_mod_v4.js upload matches the archived source SHA-256
`40ad33f240b76b8770c7390bd5fc9c9ad79534c7b1a6585013f513c601ad3155`.
Its expected script filename is `qYOh6D5MhvXhWnq.js`; the current game's filename
is `hym7DtRA3RCGo21.js`. Twenty-eight protected blocks were decoded using the
bounded interpreter and the table snapshot paired with the same prior input
hash. Decoded programs were not executed in Node.

The old file also contains the same five checked global names, the boolean
`_devastxInjected` marker and the `BestModMenuConfig` / `grok_dev` storage checks.
Its aim module stores settings under `AimbotCfg_v7`. Chromium and Firefox tests
of its unchanged check prefix produce 0 for that key, 1 for BestModMenuConfig
and grok_dev, and 0 for the current DevastILM:settings:v3 key. This confirms the
storage difference already repaired in the current host; it does not make the
historical client a current live-server control without matching version,
profile and server conditions.

Bounded before/after evidence and release checks are retained in
`verification/connection-report-2026-11-14/native-preflight-errors.json`.
The historical-file comparison is in `untitled-control-comparison.json` alongside it.

Final validation passed 285 Node tests, 78 Python tests, 209 tests against the
assembled candidate, and the Chromium/Firefox gates. Each browser retained the
active session with zero closes from the obsolete failure and executed exactly
one close for the current failure. The current game source was rechecked at
2026-11-14 14:20:10 UTC and had not changed.

Published to the existing GitHub updates link. Fresh public downloads of the
script, current pointer and verification report matched the validated release
and SHA-256. Both public browser reports retain the stale-error and valid-error
controls. Publication commit and checksum are in the evidence JSON.
