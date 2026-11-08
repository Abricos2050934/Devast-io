> Историческое описание: 8 ноября 2026 года Message15 заменён на [Untitled v4](untitled-production.md).

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
queue is introduced. Changed directions are transmitted immediately after each
source update; identical normalized directions are coalesced. Only automatic
attack/release pairs are limited to one per 50 ms. The former shared 50 ms gate
could leave the transmitted angle behind the current prediction and was removed. Missing targets and a lock on self cannot
forward stale directions. A native manual shot reasserts the latest prediction
before attack, including between background callbacks.

Ordinary queued bytes no longer suppress those directions. The aim admission
snapshot accepts an open socket below 4096 buffered bytes and pauses new cycles
at or above that boundary; attack/release still share the cycle's admission.
The previous any-nonzero-byte check could suppress every fresh direction during
ordinary traffic even though the imported predictor continued computing them.
Native Chromium/Firefox fixtures verify fresh directions at 1, 16, 128, 1024
and 4095 queued bytes, in addition to full-queue and closed-socket checks. They
also compare the transmitted angle with the independent Message15 source after
each of 1000 updates spaced 10 ms apart. Stationary-direction coalescing,
automatic attack/release cadence and manual-shot priority are checked separately. These checks are required by the publisher. The 24-scene
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

Direction ownership is also checked through both native 150 ms / 60 ms handlers.
Yielding to native mouse input invalidates the cached server angle; reacquiring
the same aim angle reasserts it before the next shot. Imported Jitter retains
ownership without a target while enabled together with aim. The
`aim-pointer-ownership-resync` release gate checks these paths in both browsers.

Automated combat uses the reviewed native codec/binary-send bridge through
`B.aimSend`, preserving the native activity clock and its periodic idle packets.
The `native-aim-transport-preserves-idle` gate remains required in both browsers;
restoring immediate directions does not restore the JSON sender activity reset.

The adapter overrides only the nearest-target search with an equivalent direct
scan. It retains source traversal order, integer distance, strict FOV and ties;
a bounding square rejects candidates before square-root calculation. Clan data
is read only for competitive players when the local player belongs to a clan.
Ghoul search never reads player clan metadata. No target result is reused across
updates. The immutable declarations remain available for independent comparisons.
The `equivalent-efficient-aim-target-search` gate checks metadata access and
immediate clan changes in both browsers; 6300 differential queries cover FOV
boundaries, ties, removals and target types. Benchmarks and scope are recorded
in `verification/aim-performance-2026-11-07/README-ru.md`.
