# Bounded fast-loot scans

Fast loot previously scanned every drop again on every rendered frame whenever
no pickup request succeeded. The 25 ms interval now also covers unsuccessful
attempts and empty groups. Each attempt examines at most 256 slots, preserving
the rotating cursor, eight-request burst limit, per-request socket backpressure,
and pickup evidence. Large groups are visited over successive attempts rather
than monopolizing one frame. Changing saved settings resets the scan deadline
so loot filter changes apply immediately.

Regression coverage exercises 1,024 distant drops, cooldown on unsuccessful
scans, and eventual pickup from a later slot. This bounds additional loot work;
it does not establish a live FPS improvement or remove network/server latency.
The Resource Override URL and scheduled publication process are unchanged.
