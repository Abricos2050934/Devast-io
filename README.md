# BestScript 1.6 — native menu geometry

The purple menu uses the actual native logo sprite coordinates and scale. Native layout calls update its geometry; there is no independent centering formula or resize polling.

The custom UI is injected only by BestScript. A clean page without the override keeps the original menu. The optional window.__bestScriptHome.setEnabled(false) helper restores the original nickname/server DOM locations, removes the custom stylesheet and resumes native artwork; setEnabled(true) reapplies the custom panel.

Import BestScript-1.6-Auto-Update-Resource-Override.json; existing loader addresses remain unchanged. Disable duplicate overrides and reload the page after changing extension rules.

Chromium tests compared actual native logo draw bounds with the custom panel at three viewport sizes and DPR 1/2. UI controls also passed in Chromium and Firefox. Reports and hashes are in release-manifest.json. Live gameplay has not been tested.
