# Terminal-session send boundary audit, 2026-11-16

Reviewed source commit: `a7c38525bdf8978b34375b1f07ef18d986712f6d`.

## Finding and proposed fix

The shared `__send` only checked native state/player identity through `playing()`. Unlike the aim adapter, it did not reject a session marked ended or an observed non-open socket. `automationReady` checked socket writability but not terminal session flags; native chat uses this separate path.

Extracted, unchanged functions were evaluated in an isolated JavaScript fixture. With native state still playing and an ended session plus an open socket, readiness returned true and pickup reached the fake sender. With a closed socket, a direct send still reached the fake sender although readiness returned false. The patch rejects both cases and keeps an active writable control working.

This concerns stale-state sends after a terminal event, and direct interaction calls while a socket is non-open. It does **not** establish why a preceding server death happened. Native death handling normally updates native state synchronously; no frequency or real-world occurrence of that intermediate state has been measured.

Regression tests cover automation including native chat after death, and direct door interactions in connecting/closing/closed or terminal states. The preservation ledger records exact reversible hunks; no baseline digest was replaced.

## Existing kick evidence reviewed

- `docs/kick-aim-audit-2026-11-13.md`
- `docs/connection-report-2026-11-14.md`
- `verification/connection-report-2026-11-15/pickup-evidence.json`

The latest retained report records opcode 27 with prefix `1b 00 06`. The native result field is a kill counter, not a server enforcement reason. Locally predicted health 255 does not establish server health. Existing reports do not expose the server's rule or establish why Game Over occurred.

Repeated pickup requests (40 requests/second to one unchanged fixture drop) remain a measured behavior, not a proven server kick cause. No guessed server threshold is introduced here.

## Validation limits

The managed environment failed provisioning with `repository_access_denied`. Only the isolated extracted-function reproduction and reversal of every source preservation hunk were run in the available JavaScript tool runtime. The added integration tests, full npm suite, build, candidate checks and Firefox/Chromium gates have **not** been run by this session. Generated dist files were not rebuilt. This branch is an unvalidated proposal and is not a published client release.

No live disconnect was reproduced; no server rule was identified. Full-code coverage and elimination of all kick-related defects are not claimed.
