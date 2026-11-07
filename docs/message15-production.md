# Message15 in the main client

The main client now uses the aim engine from the previously delivered
`Devast-io-message15-aim-input-fix.js`. The immutable extracted reference is
`recovery/message15-aim-reference.json.gz`, from upload SHA-256
`bee8d9034627b24e8f5919617dff3ed23e946da253b35dcf1805056b5fa7e4a5`.

`mod/message15-aim.js` contains the five original classes and 24 methods,
all 15 extracted aim/menu/event/rendering blocks. The adapter retains refresh
on target updates and RAF, and replaces the imported 1 ms resend timer with
a 50 ms refresh of the current prediction. The old ILM
engine and curved predictor are stored under `recovery/retired-ilm` for history
and are excluded from the build. `tools/audit_message15.cjs` checks literal
source parity and all 23 source defaults. No source authentication service is
imported with the extracted aim functionality.

The main adapter supplies native target/team/projectile data without changing
the formulas. A missing locked target must prepare team data for the original
fallback search, including lock IDs 0 and 120. The existing transport snapshot
admits or drops an entire automatic direction/attack/release cycle together.
The formulas and histories continue while transmission is blocked; no replay
queue is introduced. Background cycles are admitted at most once per 50 ms;
identical normalized directions are coalesced. The source prediction and line
continue to update between sends. Missing targets and a lock on self cannot
forward stale directions. A native manual shot reasserts the latest prediction
before attack, independently of the background interval.

Ordinary queued bytes no longer suppress those directions. The aim admission
snapshot accepts an open socket below 4096 buffered bytes and pauses new cycles
at or above that boundary; attack/release still share the cycle's admission.
The previous any-nonzero-byte check could suppress every fresh direction during
ordinary traffic even though the imported predictor continued computing them.
Native Chromium/Firefox fixtures verify fresh directions at 1, 16, 128, 1024
and 4095 queued bytes, in addition to full-queue and closed-socket checks. They
also require stationary-direction coalescing, a 20 Hz moving-target bound and
manual-shot priority. These checks are required by the publisher. The 24-scene
and 96-scene comparisons retain exact source state/formulas while verifying
that forwarded commands form an ordered subset of the source output; wire
repetition is deliberately different from the upload.

`tools/updater/message15-contracts.cjs` adds native fire/release, movement,
handshake and session-start hooks. It handles a send nested inside a native
conditional/sequence expression, and checks unique packet/identity anchors and
reviewed owner functions. The previous sent-angle display override is removed;
the imported ShowRealAngles setting controls the original interpolation.
The existing three signature compatibility operations remain in every build.

Settings are stored in `DevastMessage15:aim:v1`, including values previously
saved by the standalone export. Other settings, account storage and cookies
retain their existing paths. Numeric input applies without Enter, accepts a
decimal comma, preserves the editing buffer, and clamps after GUI rounding.
Distance/offset affect the source prediction; the bullet coefficient affects
the source trigonometric mode and remains unused in linear mode as in the upload.

Z toggles aim, H opens the menu, and J retains the existing independent rotation.
Imported Jitter uses its own menu switch. Both Jitters keep their separate state.
The main Resource Override URL is unchanged. A comment preserves the signature
expected by already-installed legacy loaders; it does not define the old engine.

Release gates compare source states and commands in 24 scenes plus 96 boundary
scenes in each browser, exercise native DodgePlayer/movement and lifecycle hooks,
and type numbers and drag sliders in Chromium and Firefox. Other mod features
keep their regression and native browser checks. Historical ILM-specific tests
are archived; the current suite compares against the Message15 reference.
Browser fixtures do not establish live-server hit accuracy or absence of kicks.
