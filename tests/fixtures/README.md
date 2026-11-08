# Native rotation regression

`rotation-2026-11-06.js.gz` is the unmodified public client downloaded from
`https://devast.io/js/qYOh6D5MhvXhWnq.js` on 2026-11-06.

Uncompressed SHA256:
`74720aca77141a313015167051e60c2dfc566310202a5b41d4445258e4937f2e`.

It uses an invisible/non-BMP alphabet and a different string cipher from the
reviewed `M2GdjrJ6DI9pA.js` reference. It deliberately is not registered as a
baseline or accompanied by a version-specific patch profile. The regression
exercises automatic decoding and porting from the earlier reviewed source.

`rotation-2026-11-08.js.gz` is the unmodified public client from
`https://devast.io/js/SkDtyOEyCkJMegCiLA.js` (2026-11-08), SHA256
`96dc71ca2e8db9da8e2530e2f2c494f18e63fa5dcbb505cf118f1d9602affa72`.
It reproduces conflicting structural votes for the native network namespace.
The namespace is independently identified by its matched exported functions,
then all eight native method contracts are still checked. This input is also
not registered as a baseline or given a version-specific patch profile.
