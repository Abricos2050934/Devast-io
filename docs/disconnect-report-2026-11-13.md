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
