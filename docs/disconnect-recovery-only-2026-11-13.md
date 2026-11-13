# Connection-only investigation

Aim behavior is fixed to the version preceding the disconnect investigation:
929f542. The complete aim factory, ballistic model, generation recipe and native
aim transport/control patches match that version byte for byte. An additional
reference checks the host's aim adapter, resolver overrides, shot handling,
settings validation, keyboard/menu, drawing and public hooks. It deliberately
preserves that version's background angle scheduling and Jitter behavior.

Only connection recovery and diagnostic changes remain:

* Native preflight replies use the existing ownership guard, including disposal,
  generation changes and nested preflight stages.
* Missing-server, thrown-fetch and response-timeout failures stop after three
  consecutive server-list failures. Manual Play or a successful response resets
  that counter. Normal joins after restoration failures retain account data.
* The local report records the active aim/rotation switches and numeric native
  network error codes without arbitrary response contents or account values.

Reproducing these client recovery defects does not identify an official
server's reason for disconnecting this user. No server ban threshold is inferred.
No claim of resolving the reported IP restriction is made.

`recovery/aim-pre-disconnect-reference.json` and the preservation test pin the
unchanged aim components. Existing native ballistic, aim source and browser
checks remain required, together with the new connection-only candidate tests.
