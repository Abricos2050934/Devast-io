# Aim line projection and settings

The imported renderer calculates logical camera coordinates. The host resets
the native canvas transform before drawing overlays, so its line also needs
the game's graphics/backing-pixel scale. Previously the player markers used
that scale while the aim line did not, moving the complete line away from its
player at ratios other than one. The drawing adapter now scales stroke points
and widths. Source prediction, history, mouse-to-world and camera calculations
remain unchanged. Tests compare the line origin with the player marker and
check its endpoint across camera offsets, zoom and graphics ratios. Both
browser gates require 18 actual canvas-coordinate cases.

Settings are loaded and validated by the host's versioned aim store. Calling
the old source BestModMenuConfig migration again changed deliberately saved
values: 100 to 80, .1 to .8, 140 to 240, .62 to .74, 220 to 280, and disabled
mouse FOV back to enabled. That redundant migration call is removed. Its
original declaration remains in the source reference; prediction formulas
are unchanged. Browser typing, dragging and reload checks include those exact
values and the disabled mouse FOV state.

An additional independent behavior check uses 16 actual gun GUI controllers and
observes the resulting angles, prediction points or target selections. It
covers prediction coefficients, lead cap, smoothing, stickiness, target hold,
mouse FOV and its switch, player lock, teammate targeting, target categories,
spear parameters. Restored Jitter speed and switching have separate tests. The same check runs in both browsers.

Conditional behavior from the source is retained: distance/offset change lead
when a target has velocity; smoothing changes transitions rather than an
already settled direction; mouseFov applies with mouseFovEnable; spear fields
apply to the enabled spear mode with weapon 5. The source maps nonpositive or
greater-than-1600 mouse FOV values to 900. Color/line visibility are visual
settings, and Strafe/Jitter settings are separate from gun prediction.
