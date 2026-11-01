(function () {
  var url = "https://raw.githubusercontent.com/Abricos2050934/Devast-io/updates/game.modded.js";
  var previous = window.__devastRemoteLoader;
  if (window.__devastClientLoaded || (previous && (previous.state === "loading" || previous.state === "loaded"))) return;
  var state = window.__devastRemoteLoader = { state: "loading", url: url };
  try {
    var x = new XMLHttpRequest();
    x.open("GET", url + "?t=" + Date.now(), false);
    x.send(null);
    if (x.status < 200 || x.status >= 300 || !x.responseText) {
      throw new Error("Не удалось загрузить клиент: HTTP " + x.status);
    }
    var code = x.responseText;
    if (code.indexOf("function __installDevastMod") === -1 || code.indexOf("function __createIlmAim") === -1) {
      throw new Error("По ссылке получен неверный файл клиента");
    }
    (0, eval)(code);
    if (!window.__devastClientLoaded || !window.__devastMod) {
      throw new Error("Клиент не завершил установку");
    }
    state.state = "loaded";
  } catch (e) {
    state.state = "failed";
    state.error = String(e && e.message || e);
    console.error("[Devast auto-update]", state.error, url);
  }
})();
