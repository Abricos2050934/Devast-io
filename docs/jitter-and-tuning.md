# Original Jitter restored; shot direction ownership

The uploaded JitterCon, both routineJitter loops, offset and Round modes have
been removed from the executable module. The original upload remains archived
as a comparison reference. Our earlier time-based rotation from f978ade is
restored: Jitter > Enabled and Speed (degrees/sec), 360 by default, 1–3600 range,
J binding. It works standing and moving without writing native movement/input.
RAF only draws rotation; a single 50 ms timer sends at most 20 directions/sec,
with socket backpressure and session/death guards.

Both native cursor direction send sites now yield while a valid gun/spear aim
or idle spin owns rotation. Previously the secondary cursor path could replace
the aim angle between attacks. Before manual attacks the current predictor
runs and its angle is sent before the native attack. Automatic attacks also
reassert their already calculated direction before attack. Target loss and
switching the mod off restore the real pointer before manual fire. Rotation
pauses while firing and resumes after release. If the angle cannot be sent due
to socket backlog, the native controlled attack is deferred by rejecting that
attempt; a later writable attempt aligns again before firing.

The gun predictor formulas, history, selection, smoothing and spear geometry
are retained. The source audit checks the precise removal of the uploaded
Jitter while comparing the remaining gun blocks. Raw attack ordering is
intentionally corrected, rather than claimed byte-identical to the upload.
Browser gates exercise repeated bursts while the cursor points backwards,
with rotation enabled and disabled, targetless shooting, backpressure,
release, configurable speed, native display and session death. Historical
calibration results below concern the gun formulas, which are unchanged.

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
