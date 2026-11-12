# Jitter repair and gun calibration

The original upload registers two independent 100 ms Jitter callbacks. The
host now replaces the first registration with the second, leaving one active
100 ms callback. The uploaded angle calculations and three modes are retained.
Both native pointer direction send sites retain their bookkeeping but yield
while Jitter owns rotation. Local rotation is displayed unless ShowRealAngles
is never. J still toggles Jitter.

A manual attack now prepares its target angle before the native attack send.
Automatic attacks use the same preparation. Jitter pauses during held manual
fire or automatic fire with a valid target; moving target updates continue to
send aimed angles. It resumes after release. Without a valid aim target, the
native pointer angle is restored before manual fire. StopJittersOnStop retains
its standing pause, and disabling it permits standing rotation. Death/session
and socket guards remain in force. A new browser publication gate exercises
the real direction send sites, local renderer and native fire handler in both
Firefox and Chromium. Isolated tests check a single timer and all modes.

The installed gun predictor was evaluated against 1,308 distinct parameter
combinations, using the native AK47 and laser SMG projectile speeds (1.4 and
1.45 world units/ms). Training scenarios use 250/600 distance parameters;
holdout scenarios use a separate 425 distance and phase. Trajectories include
crossing, diagonal motion, turning, and both players chasing around a circle.
Observation ages are 0, 40 and 80 ms. Selection maximizes samples within a
20-unit radius, with mean miss as a tie breaker, on training samples only.

The selected profile is DistanceCoefficient 60, OffsetCoefficient 1, LeadCap
200, AimSmooth 1. On the 96 held-out shots its mean closest approach is 22.90
world units, compared with 45.21 for the original defaults. This is synthetic
geometry, not a measured live hit rate. Collision, muzzle offsets, spread and
unknown server timing are not simulated. There is no universal optimum for
every weapon, connection and future turn.

Run `node tools/tune_message27_aim.cjs` to reproduce the full report in
`verification/message27-aim-tuning.json`. `docs/aim-tested-profile.json` gives
the four values to enter. Existing saved settings and original defaults are
preserved. Mouse FOV, lock/team/category selection, spear parameters, display,
key bindings, Jitter and Strafe are independently checked; their unrelated
controls are not claimed to improve the gun-only geometry score. The source
AntiAimCoefficient cancellation described in the menu explanation remains.
