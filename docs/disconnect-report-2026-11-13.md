# Current connection report

The received report matches the published client build exactly. Its native SHA
is the decoded client SHA, not the raw-download SHA; comparing those different
hashes initially suggested a version mismatch, which was not confirmed.

The report retains four character terminations. In the last session, the socket
had been open for 20.403 seconds, the client health snapshot was 255, incoming
data was current, the send queue was empty, and the frame gap was 3 ms. No
mod-generated commands were recorded for that entire socket. Aim was enabled
late in this session but emitted no commands. The preceding 63.219-second
session also recorded no mod commands with automation disabled. Jitter is off
in the report's retained events and setting history.

The retained per-second traffic sums match all 779 angle and 163 loot commands
recorded by the mod. The one-second mod maximum was 35 commands in an earlier
session. Native manual movement/fire traffic is outside these counters. The
health value is a client snapshot, not an authoritative server death reason.

Each retained termination entered the native server-death handler, then the
generic native error 128 and WebSocket close 1005 followed. There was no
recorded local-close request. These codes do not specify a server anti-cheat
rule. The known client integrity flag was 0; this does not establish the outcome
of any independent server checks. No server enforcement cause or explanation
for the reported IP restriction is established.

## Demonstrated diagnostic defect

The report only copied death prefixes when byte 0 was the historical opcode 5.
The current reviewed dispatcher invokes its death handler for opcode 27. The
native browser fixture had called that handler directly with a synthetic 5,
so it failed to expose the mismatch. No missing packet content can be recovered
from the uploaded report retrospectively.

The updater now verifies the unique death-handler call, its switch branch, the
same packet's byte-0 discriminant and a literal byte opcode. It passes that
mapped opcode to the existing bounded three-byte diagnostic capture. Dynamic,
ambiguous or mismatched dispatch contracts stop generation. Both browser gates
exercise the real mapped opcode, and publication requires their opcode evidence.

Only diagnostic capture and its tests/build bridge changed. Character-death
handling, aim, Jitter, movement, outgoing commands, retry timing and persistent
identity are unchanged. The exact diagnostic exception is included in the
preserved-baseline comparison. The derived analysis contains no credentials or
arbitrary packet contents; the uploaded report itself is not published.

Validation passed: 252 Node tests, 71 Python tests and native Chromium/Firefox
checks. Both browsers observed opcode 27 with the correct three-byte prefix;
legacy opcode 5 remains covered by unit fixtures. No aim module, ballistic
model, source aim lifecycle or outgoing transport file changed.

## Follow-up: incoming death call chain

Static inspection of the decoded native source and the published release
`c50b9e9281026c12fc37d3fb2d7cec00c01b8b62c6dadb4998ceace078924222`
confirms this path:

1. The native socket `onmessage` passes binary `event.data` to `ρ̵ܘ`.
2. `ρ̵ܘ` constructs a Uint8Array and dispatches byte 0. Its branch 27
   calls `ᅟߍᄆ`; this is the unique statically bound call to that handler.
3. `ᅟߍᄆ` removes the local player entity, stores the two-byte statistic
   in `ᅟᴄⲅ`, and calls the native network method `іᴘܒ`.
4. `іᴘܒ` sets the death state and invokes the native error notification.
   The report observes code 128 after entry to the death handler.

The dispatcher `ρ̵ܘ` and native method `іᴘܒ` are byte-for-byte identical
between the decoded native client and generated client. The death-handler
difference is the observer call `__responsiveMod.observeDeath(packet,27)`
and surrounding whitespace. The observer records the event and clears local
automation/rejoin state; it does not manufacture an incoming packet. The
reviewed mod sources contain no synthetic MessageEvent, onmessage replacement
or direct call to the native death handler.

This establishes the local processing path, not the server's decision rule.
An outgoing client action could still cause a server-side decision; absence
of a local death injection does not exclude that possibility. The report has
no server enforcement reason or retained death payload. Blocking the incoming
handler would not reverse a server-side removal or reopen a closed socket.
No functional change or publication was made in this follow-up.

## Follow-up: checks for modified browser functions

The decoded native client includes an integrity-check function held in
`ⲟނށ`. Static inspection confirms checks of Function.prototype.toString
and its native-code representation, function properties, WebSocket methods,
and probes of browser API behavior involving DOM, Canvas and WebGL. The block
also uses a frame's contentWindow. It can set the shared native integrity flag
`ⲅ༢４`; the three reviewed signature owners read this flag in the original
native source. The existing generated client changes those three reads, as
documented by the updater; that is not evidence that every possible integrity
or server-side check has been identified.

No complete-file hash check was established by this inspection of the known
check block. Disabling automation does not restore an unmodified client, so
the user's all-features-off observation alone does not rule out integrity
detection. Conversely, the uploaded report records flag 0 at its retained
snapshots, and provides no evidence tying these checks to the death decision.
This is confirmation that detection mechanisms exist, not confirmation of
the cause of this user's disconnect. No check was disabled or modified during
this inspection.

## Reproduced additional detector: known menu element IDs

The separate native function `іܓᏧ` builds a list of 59 DOM element IDs from
encoded numeric arrays and searches for corresponding elements. Unlike the
intrinsic-function checker above, this mechanism can recognize known menu
elements without looking at whether combat automation is enabled.

An isolated offline browser reproduction used the unchanged function body,
with its resolved outer constants and the shared flag initialized to 0. No
game connection was opened. Chromium 154 and Firefox 153 both produced:

| Fixture | Native flag after check |
| --- | --- |
| Empty document | 0 |
| Unrelated element | 0 |
| The four literal element IDs assigned by the current mod | 0 |
| One element matching the native list | 1 |

The extracted list has no intersection with the literal IDs assigned in the
reviewed mod and GUI sources. This static comparison and the limited fixture
do not inventory all elements in the user's actual browser. They establish a
real additional detection mechanism, not the server rule behind this user's
death or IP restriction. Existing signature changes were not applied to the
isolated checker. No detection code, menu IDs, aim behavior or published build
was changed. Machine-readable evidence, source hashes and browser versions are
in `verification/dom-integrity-2026-11-13.json`.

## Extended checks and current-source verification

The same DOM function also searches by four ID prefixes, independently of
the exact 59-element list. The additional prefix cases reproduce detection
with IDs that are not in that list. Loading the actual recovered dat.GUI
library and constructing its menu leaves the native flag at 0 in both browsers.
This expands the earlier literal-ID fixture; it is not a full reproduction of
the user's page and extensions.

A separate startup guard inspects `document.currentScript.src` for the
expected game JS filename and stores a mismatch in `ιܜᚊ`. A later protected
branch transfers this mismatch into the shared integrity flag. Offline tests
using the unchanged startup condition produce 0 for the expected external
script URL and 1 for another URL or an inline script. Running the current
Resource Override loader with a minimal diagnostic payload retains 0 under
the expected original game URL, and detects the negative-control URL. This
does not test a complete live login or the user's actual extension setup.

Across both engines, 28 fixture cases passed. Static inspection confirms one
shared-flag read in each of the three original signature owners, and zero
such reads in the current generated versions of those owners. These known
flag-dependent calculations therefore do not provide evidence for another
change to the same three conditions. Other outgoing data and independent
server rules are outside that finding.

At 2026-11-13 22:17:45 UTC the public game page, source URL and raw JS hash
were rechecked and matched the active release inputs. No stale-source fault
was found. Function-text/property and storage-access inspection did not
establish an additional full-file hash check or a specific server kick rule;
dynamic expressions and unavailable server code limit completeness. The
server cause remains unresolved. No production behavior was changed or
published during this extended audit.

## Normal control traffic and remaining diagnostic gap

An additional offline comparison exercised the actual original and generated
movement, both direction, attack and release handlers with the real current
mod hooks and automation/hidden-angle settings disabled. Both Firefox and
Chromium matched all logical command sequences and native activity clocks
across 120 input steps at each of three queue sizes: 720 steps in total, with
318 commands per run. The raw encryption/send function was identical in the
release being investigated. The fixture substitutes the codec boundary to
capture logical commands; it does not compare live sessions or reproduce a
server-side enforcement decision. Evidence is in
`verification/manual-traffic-2026-11-13.json`.

The uploaded report still cannot show the total normal native traffic: its
command counters cover mod-generated commands only. It also omits independent
spear and hidden-angle settings. Those settings can affect control while the
main gun aim toggle is off, so treating that toggle as proof of completely
native input would overstate what the old report establishes.

The new diagnostic hook runs only after a successful send through the existing
native sender. It receives only byte length, retains two minutes of per-second
packet/byte totals and per-socket totals, and never retains packet contents or
changes the encoding, encryption, queue policy or retry timing. Diagnostic
errors cannot prevent or retry a native send. Unknown or ambiguous sender
contracts stop generation, and both browser publication gates must exercise
the actual native path. Reports now include the independent control settings.
These changes repair diagnostic omissions; they do not establish or fix the
cause of the user's kick. The aim core, calculations, settings and Jitter
behavior remain unchanged.

The report now also retains the first observed server-death event separately
from the existing twelve-event ring. In the uploaded report, earlier sockets'
termination events had already been evicted. Repeated joins after an initial
failure must not overwrite that initial evidence. The retained event contains
the same bounded metadata, counters and three-byte prefix; no additional
payload content is saved. Returned report objects cannot modify the retained
snapshot. Browser and unit checks cover repeated terminations and publication
requires first-event retention in both browsers. This does not recover missing
events from reports made by earlier builds.

Final validation passed 258 Node tests, 73 Python tests, 182 candidate-function
checks, Chromium and Firefox. A follow-up logical-command comparison varied
the direction-handler order and confirmed actual sends from both native
direction handlers while preserving command sequences and activity clocks;
its results are in `verification/manual-traffic-followup-2026-11-13.json`.
The native sender's only change is the bounded post-send metadata observer.
Release and browser-gate evidence is in
`verification/native-wire-diagnostics-2026-11-13.json`. These fixture results
do not establish the cause of the reported live disconnect.
