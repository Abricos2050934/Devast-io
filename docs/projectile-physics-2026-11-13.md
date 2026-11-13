# Projectile physics and prediction audit

This audit covers the current client's projectile kinematics, weapon profiles,
packet coordinates, aim adapter and independent prediction tests. It does not
establish the server's private collision, damage or anti-cheat implementation.

## Native observations

The game source was `https://devast.io/js/hym7DtRA3RCGo21.js`, raw SHA256
`35fe5bd5c60dbb0497c80d15af896c1f889911647131c75df03a9f6286a58362`.

| Weapon | Client weapon ID | Speed, world units/s | Path, world units |
| --- | ---: | ---: | ---: |
| Spear | 5 | 500 | 600 |
| Bow | 6 | 750 | 800 |
| Shotgun | 7 | 1100 | 600 |
| 9 mm | 8 | 1200 | 800 |
| Desert Eagle | 9 | 1400 | 900 |
| AK-47 | 10 | 1400 | 900 |
| Sniper | 11 | 1500 | 1100 |
| MP5 | 20 | 1200 | 900 |
| Crossbow | 29 | 950 | 800 |
| Nail gun | 30 | 1000 | 500 |
| Shotgun variant | 31 | 1110 | 400 |
| Laser pistol | 34 | 1450 | 900 |
| Laser submachine gun | 37 | 1450 | 900 |
| Projectile weapon without a sound label | 38 | 400 | 380 |
| Laser sniper | 53 | 1500 | 1100 |

These are client weapon indices, not inventory item IDs. Sound anchors identify
the named weapons; unverified fields such as `reload` were not converted into a
claimed firing rate.

The native projectile receives speed `(state >> 8) / 100` in world units/ms.
Its motion step adds direction times speed times elapsed milliseconds, until
the endpoint/correction. Nine actual browser motion steps verified 140, 145
and 180 units of travel over 100 ms at 0, 45 and 180 degrees. Draw coordinates
lagged behind these motion coordinates because of interpolation. A stationary
600-unit shot nominally takes about 429 ms with an AK or 414 ms with the laser;
target movement, the launch origin and delays change the interception problem.
The camera's zoom does not change world-space speed.

The codec accepts fractional angle values. The server's effective precision
was not established. Tests conservatively floor to integer degrees. Muzzle
offsets, collision, spread and authoritative hit radius were not inferred from
weapon render offsets or a screenshot.

## Changes

The physical predictor previously required seven samples inside 400 ms. It
could not confirm circles at 80–100 ms update intervals, particularly with
arrival jitter. It now retains at most eight samples inside 600 ms and considers
recent five-to-eight-point windows, including well-observed arcs up to a half
circle. The old 1.2-radian cap also rejected tight fast circles. The minimum
radius check now uses the same position-error budget as the radial residual
check, so rounding a true radius of 50 slightly downward does not discard it. The existing stale-position timeout remains
350 ms and confirmation requires independent observations.

Spatial curvature must exceed position quantization noise. Orthogonal spread,
arc sagitta and time-fit residual checks reject false circles fitted to straight
diagonal movement. Packet timing variations are checked by their resulting
world-space fit error. Repeated observations in the same short packet batch no
longer advance circle confirmation.

The uploaded BBY engine, menu, defaults, Jitter, native transport, aim command
frequency and shot ordering remain unchanged. Changes affect Adaptive Aim.
The preserved baseline test reverses only the explicit reviewed model hunks.
Native browser gates now check the actual AK and laser profiles plus both
slow-cadence circles and straight motion; auto-publication requires both browsers.

## Accuracy and the requested 80%

`tools/benchmark_projectile_accuracy.cjs` uses five fixed seeds of 800 cases each.
The final two seeds provide additional validation of the same distribution.
Every trajectory contains 50 AK and 50 laser cases. Distance is 180–660 units;
packet intervals are 40/50/80/100 ms, arrival jitter 0–8 ms, position rounding
one world unit, and packet age 0/35/70 ms. Explicit compensation equals the
simulated RTT of 0/60/120 ms. No automatic latency discovery is claimed.

The simulator advances the real target and bullet independently of the
predictor's point and flight time. All opportunities, including no solution,
would remain in the denominator. The tolerance is 20 world units, not a claim
about the actual server hitbox. Obstacles and spread are absent.

| Suite | Before | After |
| --- | ---: | ---: |
| Development, 800 cases | 67.875% | 77.500% |
| Separate seed 1, 800 cases | 68.375% | 77.625% |
| Separate seed 2, 800 cases | 67.500% | 77.875% |
| Fresh validation 1, 800 cases | 69.250% | 77.500% |
| Fresh validation 2, 800 cases | 68.500% | 78.125% |
| All 4000 cases | 68.300% | 77.725% |

The three circular-motion groups achieved 1477/1500 (98.467%) within tolerance.
Wave motion and surprise reversals remain difficult; their misses are included
in the total. The requested 80% across the full test suite was **not achieved**.
An 80% live hit rate is **not verified** by these results.

The data, complete compressed case lists and native observations are in
`verification/projectile-physics-2026-11-13`. Reproduce the simulation with
`node tools/benchmark_projectile_accuracy.cjs`; after the matching current
release is activated, run the isolated browser audit with
`PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright DEVAST_BROWSER_HOME=/tmp/message27-browser-home node tools/audit_projectile_physics.cjs`.

The final release passed 247 Node tests, 70 Python tests, 171 candidate checks,
and Chromium/Firefox validation. The live game source matched again after the
checks. Release metadata and browser evidence are in `release-checks.json`.

Publication also integrates `72daa7c` from main: the coalescing interval is
measured from the start of each observation group, retaining history during
a continuous dense packet stream. All 4000 recorded outcomes remain identical.
