# Reviewed native reference: 2026-11-05

The live page changed its main client to `/js/PjY9pborH9i8VaNn.js`.
Its raw SHA-256 is
`c69bfd5b520049277867b9238b0d88693715ee1ebfeb2a2cc205139cdb85f1ab`.
The immutable source is `baselines/native-2026-11-05.js.gz`; the previous
baseline and patch recipes remain unchanged.

The new string table maps 256 private-use characters (U+E000–U+E0FF) to
bytes, instead of the historical 16 variation selectors mapping to nibbles.
The decoder accepts both reviewed formats and checks the permutation and
four-byte key. It decodes data without running downloaded decoder functions.

Several native functions also changed their protected bodies or expression
spelling. `patches/native-2026-11-05.json` records the new native text and
only the existing mod hooks. In particular:

- The native preflight and server-list implementation remain current.
- The XHR function keeps its new body; the existing callback guard is inserted
  at entry.
- The token-init edit only removes version-dependent token replacement.
- The invalid user-ID comparison becomes `!Number.isFinite(id)`.
- Camera, packet, renderer, direction, socket, player lifecycle, visibility,
  label and Play hooks preserve the new native statements around each edit.
- The three signature compatibility operations still replace only the three
  reviewed predicates. Their remaining native bodies stay current.

`patches/bindings-2026-11-05.json` supplies the new namespace, field and
browser fixture names. The shared flag is `а̡ѕ`; its three reviewed owners
are `οᴘⲥ`, `ࡀᚆࡄ`, and `а᠋︃`. The port still requires identical normalized
signer bodies against the selected reference, one shared mutable flag binding,
and exactly the reviewed three reads. A changed contract stops publication.

`tools/updater/references.cjs` selects the historical reference for its known
hash, the new reference for its known hash, and the latest reviewed reference
for subsequent rotations. Selecting a reference does not approve a candidate:
the usual network, patch, signature, browser and regression gates still run.
For byte-identical decoded sources, repeated local names have proven identity;
for other candidates, correspondence must be structurally unambiguous. The two
otherwise identical direction handlers must retain their distinct read-only
150 ms and 60 ms native timer bindings.

Browser fixture discovery now resolves immutable aliases for the placement
opcode and accepts `limit < now - activity` as the same strict idle condition
as `now - activity > limit`. Reversed inequality direction and non-strict
comparisons remain excluded.

No mod module, aimbot formula, setting, key binding, or Resource Override URL
changes with this update. The separate Message15 experimental export is not
included. The normal `npm run update:once` pipeline remains the release gate;
`tools/publish_update.py` publishes only its fully verified result. Browser
fixtures verify native behavior and preserved local identity; they do not
prove a successful live multiplayer session or absence of server kicks.
