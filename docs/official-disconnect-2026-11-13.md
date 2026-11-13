# Disconnect investigation, 13 November 2026

The user reports a disconnect on official servers with the modified client,
followed by unsuccessful clean-client joins on the same IP, while community
servers remain accessible. This is user-observed correlation, not a confirmed
server ban reason. No official-server anti-cheat internals or IP restriction
were established from the client code. Fresh connection events are required.

Current main already contains the adaptive predictor (929f542). Its background
direction path has a 50 ms admission interval and duplicate suppression.
Preserve it. A reproducible excess remains in the selectable source predictor:
each moving entity invokes a refresh and previously forced an angle send,
including an identical direction for the same selected player.

In a deterministic scene (locked target 2, AimSmooth 1, no Jitter or auto fire,
40 received updates over two seconds), the source predictor sends:

| Nearby players | Before | Identical repeats | After |
| --- | ---: | ---: | ---: |
| 1 | 40 | 0 | 40 |
| 12 | 480 | 440 | 40 |
| 24 | 960 | 920 | 40 |

The fix uses the existing exact-angle send cache for background directions
in both predictors. It adds no new delay, angle rounding, or assumed server
threshold. Changed directions retain their existing path. Manual and automatic
shot alignment remains forced. When native input takes ownership, invalidate
the cache so reacquisition reasserts even an equal old angle.

Six dense scenes exercise 1/12/24 players in both predictors. Separate checks
cover forced shot alignment and equal-angle reacquisition after native cursor
movement. Browser publication gates require these checks in Firefox and
Chromium, alongside all existing ballistic and Jitter tests. The independent
source comparison retains calculation/state checks and explicitly folds only
unchanged background angle commands in its expected transport.

Connection reports now record AdaptiveAimEnabled, JitterEnabled and AntiAimbot
both in the current settings and at disconnect events/settings transitions.
They continue to omit account values and arbitrary server packet contents.

These results establish a redundant client traffic bug. They do not establish
the reason for this user's disconnect, prove detection immunity, or remove
an existing server-side restriction. If adaptive mode was active throughout,
the demonstrated legacy duplication alone does not explain the incident.
