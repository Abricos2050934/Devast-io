# Aim import from message (27).txt

Upload SHA256: `f3001e45554d86505e89532faaa2aff5be69dec90b713e7966428273d2b1abd0`.

The file declares a first predictor, then replaces its live instances and
refresh function with `__BBY.G`, `__BBY.A`, `__BBY.J` and `__BBY.R`. The import
uses this final active override and the subsequent integrations. Importing the
earlier duplicate would select the wrong live engine.

`recovery/message27-aim-reference.json.gz` contains 19 exact source blocks and
their hashes, together with the 38 aim defaults. They include five classes,
position/velocity history, both resolver branches, interception, smoothing,
target hold and stickiness, spear calculations, Jitter, Strafe, fire/release,
rendering, mouse/touch input, configuration helpers and aim GUI definitions.
`tools/import_message27_aim.cjs` reproduces this reference from the original
uploaded file without executing that client. `tools/message27_runtime.cjs`
inserts its source blocks without changing their formulas or constants.

The host adapter binds native player IDs, position/weapon packets, raw clan
indices and membership IDs, the current camera, codec and input lifecycle.
Position changes call the source refresh immediately. Repeated coordinates
retain the source's unchanged history/timestamps. Direction packets retain
their original fractional values through the codec boundary. The primary
native direction handler delegates to the source `packetAngle`; the secondary
handler remains native, as in the upload. Both source Jitter timers and the
50 ms Strafe / 50-or-200 ms aim-loop cadence are retained.

The upload calls `__gk` without declaring it. Imported aim integration passes
plain numbers and booleans through a local identity binding; this introduces
no prediction formula. Source configuration calls are bound to the existing
validated settings store and a new `DevastMessage27:aim:v1` namespace, preserving
unrelated settings and account identity. Source key capture uses the existing
conflict-swap behavior and cleans up document listeners. M opens the menu and H toggles hidden aim angle, as in the upload and
as selected by the user. Source mouse/touch and native fire handlers
remain connected. Other mod features and their controls remain in place.

The path `mod/ilm-aim.js` and the forwarding entrypoint `__createIlmAim` are kept
for installed Resource Override loaders. They contain no former ILM predictor;
that name forwards to `__createMessage27Core`. No Resource Override reimport is
required. The stable publication URL remains unchanged.

The native adapter retains socket-backpressure, valid live-target admission,
session-history reset, death handling and the existing idle-ping transport.
These host protections do not rewrite the imported calculations.

`tools/audit_ilm_port.cjs` now audits this upload, checks every source block and
rejects retired predictor declarations. The independent comparison executes
the stored source declarations separately from the installed adapter and
compares complete states and raw packets in 32 scenarios, including circular
chasing, timing gaps, removals, clan membership, locks, all target kinds,
spear, smoothing, lead caps, hold, Jitter and Strafe. Native browser fixtures
also compare screen-to-world/camera values in 18 cases and both native
direction paths. Real GUI typing and dragging verify numerical effects and
persistence. Both Firefox and Chromium are required for publication, along
with all existing non-aim feature and lifecycle checks. These fixtures do not
establish live-server gameplay accuracy or absence of server kicks.
