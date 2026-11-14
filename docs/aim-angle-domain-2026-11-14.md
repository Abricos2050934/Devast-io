# Repeated-turn angle defect

The installed source gun engine retained an unwrapped smoothing angle. Its
shortest-turn formula uses JavaScript `%`, whose result can be negative. After
two complete turns, the retained value could exceed 540 degrees and the next
crossing could select the long arc. The host also admitted source directions
without reducing them modulo 360. These are demonstrated client defects;
no server rejection rule was inferred from them.

A controlled scene used one stationary local player and one target moving for
three full turns, smoothing 0.74, prediction offset zero, and no Jitter or
autoFire. It ran the actual installed host and imported core, first with the
previous host source and then with the fix.

| Measurement | Before | After |
| --- | ---: | ---: |
| Target samples | 1081 | 1081 |
| Direction commands | 1080 | 1080 |
| Sent angles outside `[0,360)` | 720 | 0 |
| Maximum circular error, degrees | 93.24865 | 0.35135 |

At target bearing 720 degrees the previous host sent approximately 453.24865
degrees, which points 93.24865 degrees away from bearing zero. With the fix,
the same step produces 359.64865 degrees, the expected small smoothing lag.
This is a controlled geometric example, not a measured live hit rate.

The host now rebases the original smoother's memory before its next step and
normalizes its result. The original uploaded declarations, target selection,
prediction formulas, settings and source loops remain in the imported module.
The outgoing boundary independently canonicalizes every finite source angle;
already valid fractional degrees are preserved exactly. Native cursor/Jitter
rounding, Jitter timing and attack/release order retain their previous behavior.
Incoming death messages are not modified or suppressed.

The independent upload oracle still compares every non-angle state and every
non-direction command exactly. Its two angle state fields and direction values
are compared as circular angles, with the admitted direction additionally
required to be canonical. It explicitly reports normalized equivalence rather
than claiming exact unwrapped numeric states. A separate oracle uses
`atan2(sin(delta), cos(delta))` and tests 6480 position updates across clockwise
and counterclockwise turns with smoothing 0.05, 0.74 and 1. It also exercises
hidden-angle sends, fractional precision and non-finite input rejection in
both browser fixtures. Publication requires both these results and the
independent upload comparison.

The uploaded report retained AdaptiveAimEnabled=true from its earliest retained
setting change at 267891 ms, with 24 older changes unavailable. That gun mode
uses a different resolver and already canonicalizes its result. Gun aim was
off at the recorded death, spear was enabled, and the last direction bucket
was 839000 ms versus death at 1002593 ms. Thus this demonstrated legacy-engine
fault is not established as the reason for that server death. The previously
fixed persistent-storage handshake marker remains a separate finding.

Before/after results, source hashes and final release evidence are recorded in
`verification/connection-report-2026-11-14/aim-angle-domain.json`.

Final validation passed 279 Node tests, 77 Python tests, 203 tests against the
assembled candidate, and the Chromium/Firefox gates. Both browsers verified
6480 independent orbit steps and 9720 source direction commands, with no
out-of-domain angles and maximum oracle disagreement below 1e-8 degrees.
The current native game source was rechecked at 2026-11-14 13:37:03 UTC and
remained unchanged.

Published to the existing GitHub updates link. A fresh public download of the
script and verification report matched the validated release and SHA-256; both
browsers retained the canonical-angle gate in the public report.
