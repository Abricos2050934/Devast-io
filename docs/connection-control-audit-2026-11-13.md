# Continued client audit — 13 November 2026

This pass follows the duplicate-angle repair. It identifies client defects;
it does not identify an official server's ban reason or undo an IP restriction.

## Adaptive target switching

The background direction interval was conditional on the target object staying
the same. With AimStick/AimHoldMs both zero, valid intermediate target changes
inside dense entity batches bypassed it. A deterministic 24-player/two-second
scene produced 431 directions. The repaired global 50 ms interval produces 31
in that scene with 414 target switches. Mandatory direction alignment before
manual and automatic attacks remains immediate and outside the idle budget.
Both predictors, source calculations, native weapon profiles and Jitter remain.

## Releasing automatic movement

Strafe sent movement masks directly, but disabling it did not restore the last
native mask. Reproduced with native mask 5: the server-facing last command
remained [2,2] after disabling. It now receives [2,5], or [2,0] when standing.
Normal cleanup also releases movement without writing the native input object.
A blocked automatic queue defers restoration, sends it once when writable,
and yields if a newer native movement command has already taken over. New
sessions discard the old movement ownership. Dead sessions emit no cleanup
movement.

## Late native preflight responses

The network preflight wrapper rejected generation changes only while running;
after disposal it allowed the old callback. Its callback also lost ownership
for a second nested preflight. It now uses the shared generation/depth guard,
which rejects disposed/stale replies and carries ownership into chained native
preflights. Tests cover valid completion, timeout, a late second stage and
disposal, with stored account values unchanged.

## Unbounded server-list refresh failures

Fresh-session fallback bypassed the ordinary attempt cap. If the selected
server stayed absent from the returned list, it performed 30 list requests in
one minute and continued. A separate consecutive refresh-failure counter now
stops after three missing-server, thrown-fetch or response-timeout failures.
Manual Play, a successful matching list response or a connected session resets
that counter. The previous ability to make one normal join after earlier
restoration attempts is retained. Persistent identity is never cleared.

## Native controls after disposal

The compiled native attack hook still queries the disposed mod object. Its
beforeFire used to reject every native attack, and afterFire could register a
new mod timeout after cleanup. Disposed hooks now yield native fire/movement,
ignore lifecycle callbacks, and the core refuses new cycles/timers. A final
browser check disposes the current instance and exercises actual native
attack, release and both direction send sites, then checks that no mod timers
or commands restart. This does not turn the modified client into a clean game
client; testing without the mod still requires disabling Resource Override
and reloading the page.

## Verification

The browser control-lifecycle check exercises target switching, immediate
native shot alignment, movement restoration and one-time queue recovery in
Firefox and Chromium. Compiled candidate fixtures cover preflight lifetime,
chained callbacks, disposal, native-input precedence and all three refresh
failure cases. Publication requires those candidate tests plus both browser
reports. No server rejection threshold or anti-cheat implementation is assumed.
