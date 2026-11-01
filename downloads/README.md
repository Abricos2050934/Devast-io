# Devast-io client: full ILM aim transplant

Current download: [Devast-io-client.zip](Devast-io-client.zip).

Replaces the prior aim implementation with all four original ILM classes and tick,
verified structurally and against the upload in 180 deterministic scenes.
Adds native nickname#ID to initial metadata and spawn updates for both leaderboard
and player head labels. Native self-angle interpolation is also connected.

39 automated tests passed. Native Chromium packet/label/angle fixtures passed.
Live server entry and no-kick behavior remain unverified: WebSocket HTTP 503.
Cookies and saved identity are retained by the previous rejoin fix.

JS SHA256: 16ad0b3c93cc7b4085cdf910036407a3ce2542bc940865d7ffb7336eda1a437d
ZIP SHA256: b8dd2fb7aef867e8326c1edd8ec0f0b62d938fe1c8cc9320c751aa1cbf1103ef

The archive contains the JS, readable aim module and verification report.
This branch distributes the downloadable archive; main is unchanged.
