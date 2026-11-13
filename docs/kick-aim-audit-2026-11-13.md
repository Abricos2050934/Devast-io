# Follow-up after exact aim restoration

The user subsequently authorized fixing demonstrated aim defects. The restored
0484824 revision is the comparison point. The uploaded BBY engine, native
transport/control patches, menus, defaults, shot ordering and Jitter are unchanged.
Only the optional physical predictor's motion history and close-event diagnostics
are changed in this follow-up.

## Reproduced prediction defects

After a right-angle turn at 200 world units/second, the estimator correctly
reported (0, 200) on the first packet. On the next packet it regressed to
(60, 140), reintroducing samples before the turn. A reversal and resuming after
a stop had the same history-boundary defect. The fit now retains only the latest
uninterrupted leg, using the existing turn threshold and four-sample window.
No new smoothing, timing, speed defaults or settings were introduced.

A teleport arriving at the same timestamp as another position bypassed the
existing distance reset and produced an extreme velocity. The distance reset
now also applies to duplicate-timestamp packets.

The new motion tests fail on the saved baseline and pass after the fixes. They
check subsequent packets, not only the first observation of a turn, and verify
the resulting angle with an independent moving-target/projectile closest approach.

## Disconnect evidence

An entry timeout clears the active-socket pointer before calling close. The old
close listener consequently discarded the close event of this very socket. It
now follows the observed connection trace; a replaced/disposed socket remains
excluded. No native closing behavior or retry timing was changed.

Previously supplied death packets, WebSocket 1005 and historical client detector
flags do not identify a server enforcement rule. The fixed prediction errors
are not asserted to cause the user's kick or subsequent IP restriction. No
packet-rate or anti-cheat threshold is inferred from these tests.

The latest user clarification is that the kick also occurs with automation
disabled from entry; the user later identified the screen as Game Over. The
three-byte death payload is stored/rendered as a statistic, without branching
on it as a server enforcement reason. Two short anonymous Firefox observations were made through
the cloud proxy. The modified client entered Frankfurt with no mod-generated
commands and remained connected for approximately 24 seconds of observation.
The clean client also entered, then its connection closed after about 2.3 seconds.
They used different backend hosts. This is inconclusive about the user's issue;
neither normal character death nor server enforcement was established for the
clean-client closure. Initial certificate trust and advertisement delays were
resolved/accounted for before these observations. No accounts, secrets, socket
wrappers or native function replacements were added to the live probes.

`verification/kick-aim-audit-2026-11-13` contains the motion reproduction, full
check summary and bounded connection observations. All 236 Node tests, 69 Python
tests, 160 candidate checks and both required browser checks passed. The online
game source was rechecked after validation and matched the build input.

## Change boundary

`recovery/aim-pre-disconnect-reference.json` remains unchanged. The preservation
test reverses only the explicit hunks in
`recovery/aim-approved-fixes-2026-11-13.json`, then checks the original hashes.
This retains a check against unrelated changes to the restored aim rather than
silently replacing its baseline. Existing source, settings, browser and native
transport checks remain required by the updater.
