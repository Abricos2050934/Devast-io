# November 11 updater compatibility

The scheduled workflow was active, but `update:once` stopped before publication
with `Unknown string table cipher`. The published `updates/current.json` still
selected the November 8 `FMLOkE3crmd2HAmjWPDL.js` client.

The public replacement is `https://devast.io/js/hym7DtRA3RCGo21.js`, SHA256
`35fe5bd5c60dbb0497c80d15af896c1f889911647131c75df03a9f6286a58362`.
It remains an unregistered regression input; no candidate-specific baseline or
patch profile was added.

The updater now distinguishes alphabet packing from the byte cipher. When the
legacy four-byte key is absent or ambiguous, the existing isolated interpreter
decodes the actual table construction and immutable dependencies. `new Array`
uses only its bounded local allocator; other constructors and host capabilities
remain unavailable. Protected-block instruction budgets scale with input size,
from 40 million to a hard maximum of 80 million. The first current block needs
41,099,051 steps, exceeding the previous fixed budget.

The native player rejoin handler now calls an exported animation reset. Its
implementation, player table, namespace clock and complete remaining handler
must match before mapping the nickname patch. The player constructor adds six
new scalar fields; their initializers are preserved and all previous statements
must match. Changed packet indices, altered reset behavior, duplicated fields
and ambiguous handlers fail these adaptations.

The current client ports all 36 patches, 79 required bindings and eight network
method contracts. Mod modules, ILM aim source, settings, key bindings and Resource
Override addresses are unchanged. Browser fixtures validate local behavior;
they do not establish live-server availability or gameplay results.

Regression coverage includes the compressed unmodified client, isolated cipher
and constructor checks, and positive/negative player lifecycle checks. Existing
source rechecks before activation/publication, both required browsers, candidate
feature checks and publication gates remain enabled. The workflow continues to
run on main pushes and at minutes 7, 22, 37 and 52 of every hour.
