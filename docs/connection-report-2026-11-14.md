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
