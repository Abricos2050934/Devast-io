# Native rotation regression

`rotation-2026-11-06.js.gz` is the unmodified public client downloaded from
`https://devast.io/js/qYOh6D5MhvXhWnq.js` on 2026-11-06.

Uncompressed SHA256:
`74720aca77141a313015167051e60c2dfc566310202a5b41d4445258e4937f2e`.

It uses an invisible/non-BMP alphabet and a different string cipher from the
reviewed `M2GdjrJ6DI9pA.js` reference. It deliberately is not registered as a
baseline or accompanied by a version-specific patch profile. The regression
exercises automatic decoding and porting from the earlier reviewed source.
