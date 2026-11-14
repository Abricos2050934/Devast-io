# Follow-up connection report

The uploaded report matches published release
`6258d1c6fa318453768ace12830745f9a32341a82ec60df1236eded32a9f40f0`.
Its complete mod command ledger agrees with the lifetime totals. The uploaded
file is not published; derived bounded evidence is in
`verification/connection-report-2026-11-14/analysis.json`.

## Two different termination paths

The first socket ended after 41.497 seconds with native error 1024, without
entering the death observer. Static inspection of the matching decoded client
binds this path to binary dispatch opcode 26: its handler calls a native
method which sets state 1024 and invokes the error notification. The handler
does not parse a reason field. The report does not retain that incoming
packet's body, so no anti-cheat rule or reason is established. The user later
confirmed that this event followed opening a new tab. It is excluded from
the unexplained-kick evidence.

This first socket recorded 261 native send calls and nine mod pickup commands.
The later observed traffic peak cannot explain this earlier termination by
chronology.

The second socket ran for 928.274 seconds before opcode 27, with the three-byte
prefix `1b 00 03`, followed by native error 128 and clean close code 1005. The
native death handler stores the two-byte number as a displayed statistic;
the code does not identify it as an anti-cheat rule. At death, the client
health snapshot was 255, the outgoing queue was empty, the last incoming
message was 1 ms old and the animation-frame gap was 12 ms. A client health
snapshot does not establish the server's damage or enforcement reason.

Gun aim, Jitter, Strafe, hidden angle and autoFire were off at this death.
Spear aim was still enabled, but no mod combat commands occurred in the last
two seconds, and the last direction-command bucket was at 839000 ms. Fast
loot had been disabled 11.424 seconds before death. The retained native
traffic does not show a contemporaneous queued-send flood.

## Demonstrated transport defect

Earlier on socket 2, the native send peak was 237 calls in a one-second bucket;
the corresponding mod bucket contains 221 pickup commands. This is evidence
of a real burst, not proof of a server rate threshold or the kick cause.

A controlled reproduction found that fast loot checked backpressure only
before a burst. When the first request filled the socket queue, it still sent
the remaining seven requests. The fix rechecks writability immediately before
each pickup and retains the cursor position of an unsent drop. It resumes
after the queue drains, with no catch-up burst. The existing scan interval,
maximum writable burst, filter, targeting and item coverage are retained.
No guessed anti-cheat threshold or additional evasion is introduced.

## Diagnostic corrections

`firstConnectionEnd` now preserves the first observed active connection end,
including a native rejection such as 1024, separately from `firstServerDeath`.
An earlier non-death termination must not disappear when later deaths fill
the short event ring.

The report also contains one extra native send call after the close and a
closed-socket buffered amount of 8 bytes. A WebSocket send call can return
without throwing while closing/closed; that is not proof of delivery. The
traffic scope text now states this limitation explicitly. This late call
does not establish the cause of the preceding death.

The specific reason for the user's reported kick or IP restriction remains
unproven. The changes fix a reproduced backpressure defect and diagnostic
omissions; aim calculations, Jitter and incoming-death handling are unchanged.

Validation passed 260 Node tests, 74 Python tests, all candidate-function
checks, Firefox and Chromium. Both browsers reproduced the mid-burst queue
condition and verified that the unsent drop is retried after the queue drains.
The release and check summary is retained in
`verification/connection-report-2026-11-14/checks.json`.

## Follow-up after the tab clarification

The native state-1024 method invokes the native error notifier, which clears
the rejection state to 0 before calling the application. The socket-close handler then
sets state 64. The mod checked only the current state's rejection bits;
after that native transition, it could automatically restore the old tab
when its selected server was still available. A controlled reproduction
produced one automatic refresh and one automatic join without Play. The
report does not identify whether the user's second join was automatic or
manual, and this behavior is not established as the cause of the later
opcode-27 death.

The recovery adapter now latches the existing non-retryable rejection mask
(8, 16, 512, 1024), disarms automatic recovery and waits for explicit Play.
Native error and close handling are preserved, as are stored identity and
the existing bounded recovery for ordinary transport loss. This prevents
an old tab from automatically reclaiming a connection after a native
server-directed end; it does not suppress the server end message.

The health diagnostic was also traced to its actual native implementation.
The reported `value` is locally predicted between server gauge updates;
the native gauge tick changes it using elapsed time and configured gain/loss
rates. The HUD has a separate interpolated field. Both the prediction tick
and server-health setter match the original client. A local value of 255
therefore does not establish server-authoritative health at death. Static
comparison evidence is in `health-code-review.json` beside the derived report.

The rejection-recovery fix passed 265 Node tests, 75 Python tests and both
browser gates. The isolated browser test uses the real native state-1024
method, error notifier and close handler, with a no-op application UI callback
and a local counter for server-list refreshes. It verifies zero automatic
retries, an available manual Play and unchanged saved identity. Ordinary
transport loss is covered separately. Evidence is in `rejection-recovery.json`;
no live two-tab session or cause of the later death was reproduced.

## Independent connection marker channel

A deeper read-only scan found an additional connection check in the original
native client, outside the shared integrity flag and the three existing signer
patches. Function `ѕ༡ܓ` (decoded offsets 1602847–1655989 in this source version)
contains an XOR-75 table naming five global objects/functions:
`__autoPortAimbotPacketTransport`, `GROK_MOD`, `__isMyAimbotPlayer`, `BabaConfig`,
and `GetAllTargets`. It also checks local storage keys `BestModMenuConfig` and
`grok_dev`, and whether the browser's `document.getElementById` string contains
`[native code]`.

Controlled Chromium and Firefox runs of the unchanged native check prefix
produced result 0 in an empty fixture and with an unrelated property, and 1
with each named global or either historical storage key. The current settings
key `DevastILM:settings:v3` produced 0. A second unchanged-prefix experiment,
continued to the input of the native encoder, used fake connection strings:
the clean result was `left-fixtureright-fixture`, whereas a historical marker
produced `right-fixtureleft-fixture`. Static data flow continues through the
native encoder into the URL passed to the WebSocket constructor. No game
server was contacted by either experiment. See
`connection-marker-mechanism.json` alongside the other derived evidence.

This establishes an independent client mechanism for reporting these markers;
a shared integrity flag of 0 does not exclude this separate channel. It does
not establish the server's decision, an IP restriction, or the cause of the
specific opcode-27 death in the uploaded report. That report did not retain
whether this historical storage key existed. The named source aim objects
are assigned to a private local `window` object in the current imported core,
so the name list alone is not evidence of an active global leak.

The host did leave `BestModMenuConfig` in physical local storage after reading
it into its new namespace. Its historical migration fixture explicitly
preserved that key across reloads. The migration now archives the exact three
owned historical settings values, verifies the archive and any newly written
current copies, and then retires the old keys before Play. Existing current
values take precedence; malformed data or a storage-write failure leaves the
original values available. Account tokens and cookies are outside this
operation. The backup remains local under
`DevastILM:settings:v3:legacy-backup:v1`; no values are added to diagnostics.
Unrelated storage such as `grok_dev` is not removed.

Each browser's publication fixture checks the actual initialized mod against
the extracted original check: result 0, exact settings archive retained,
no named aim objects in real browser globals, and result 1 when the historical
key is deliberately reintroduced as a positive control. The control is removed
and result 0 is checked again. The emitted native connection checker, encoder,
WebSocket URL builder, aim calculations, Jitter, and incoming death handling
are not changed by this fix. The report only adds a bounded migration status.

A follow-up fixture also ran the connection builder inside the fully initialized
client, retaining its actual native encoder and surrounding native state. It
supplied a synthetic server record and the fake strings `left-fixture` and
`right-fixture`. A fixture-only early return captured the computed URL immediately
before the WebSocket constructor. In both browsers the legacy key changed the
native encoded query, and removing it restored the exact previous query
(A → B → A, gate 0 → 1 → 0), with zero page errors and no socket construction.
This strengthens the client-side data-flow finding without establishing a live
server enforcement rule. Bounded results are under `full_native_context` in the
evidence JSON. The manual fixture is `full-context-audit.cjs` in the same directory;
it pins the reviewed native function hash and does not modify production files.

The final release passed 271 Node tests, 76 Python tests, 195 candidate-function
tests and both browser gates, including the new publication gate. The native
game source was fetched again on 2026-11-14 at 11:12:57 UTC and its bytes had
not changed. Release identifiers and bounded browser evidence are retained in
`connection-marker-mechanism.json`.

The fix was published to the existing `updates/game.modded.js` link. A fresh
public download matched the validated SHA-256, and the public verification
report retained the positive/negative marker controls for both browsers.
Publication commit and checksums are in the evidence JSON.

## Follow-up: the two-byte death value is the kill counter

The value in `1b 00 03` was traced beyond its generic numeric rendering.
The native death handler stores `(packet[1] * 256) + packet[2]` in
`о٠́.Іᴀߏ.ᅟᴄⲅ`. The join handler resets that field to zero. Its remaining reads
render the number in two result panels. The actual public panel images,
`img/scoreboardnew.png` and `img/scoreboard-br.png`, were fetched with the
normal game-page Referer and visually inspected. In both panels the number's
position is under **KILL**. Thus the observed payload means **3 kills**,
not an identified anti-cheat rule number. The current source's only call to
the native death-state method remains the incoming death handler.

The report schema was inspected again: it contains no server rule, handshake
marker result, or incoming damage history from which the missing reason could
be reconstructed. Its positive client health snapshot is predicted state and
cannot establish the server's health or enforcement decision.

A broader static scan of 2616 numeric byte arrays also resolved the separate
initial marker `_devastxInjected` in the same connection builder. Unchanged
native-prefix fixtures in Chromium and Firefox detect this property only when
its value is boolean `true`: absent, false, numeric 1 and an object all retain
result 0. No literal assignment to this marker was found in the current mod,
vendor or Resource Override sources, and the initialized current-mod fixture
already returned 0 for the full native prefix. This identifies another checked
name; it does not demonstrate an active fault in the current build. The scan
is limited to constant byte arrays and XOR keys, not every possible dynamically
constructed expression.

The user confirmed that the latest published settings-migration fix had **not
yet been tested**. There is therefore no observed post-fix recurrence to analyze.
These findings narrow the evidence and are retained in
`death-payload-followup.json`; they do not establish the server's hidden rule
or justify claiming that the prior death's cause is now proven. This follow-up
changes documentation/evidence only, with no additional client modification.
