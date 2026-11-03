(function () {
  var endpoint = __ENDPOINT__;
  var accessKey = __ACCESS_KEY__;
  var previous = window.__devastRemoteLoader;
  if (window.__devastClientLoaded || (previous && (previous.state === 'loading' || previous.state === 'loaded'))) return;
  var state = window.__devastRemoteLoader = {state: 'loading', privateUpdates: true};
  try {
    var request = new XMLHttpRequest();
    request.open('GET', endpoint + '/client.js?t=' + Date.now(), false);
    request.setRequestHeader('Authorization', 'Bearer ' + accessKey);
    request.send(null);
    if (request.status === 401 || request.status === 403) throw new Error('Ключ доступа недействителен или отозван');
    if (request.status !== 200 || !request.responseText) throw new Error('Сервис обновлений недоступен: HTTP ' + request.status);
    var code = request.responseText;
    if (code.indexOf('function __installDevastMod') === -1 || code.indexOf('function __createIlmAim') === -1) throw new Error('Получен неверный файл клиента');
    (0, eval)(code);
    if (!window.__devastClientLoaded || !window.__devastMod) throw new Error('Клиент не завершил установку');
    state.state = 'loaded';
  } catch (error) {
    state.state = 'failed';
    state.error = String(error && error.message || error);
    console.error('[Devast private updates]', state.error);
  }
})();
