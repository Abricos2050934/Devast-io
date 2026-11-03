# Devast-io — ILM mod и автообновление

Исходники нашего мода и система его переноса на текущий JS devast.io.
Алгоритм ILM сохранён; адаптер метаданных наведения оптимизирован, лучи рисуются
группами. Дополнительные нижние показатели и надпись AIM BOT над игроком удалены.
Ники #ID, остальные функции и повторный вход без удаления cookies сохранены.

После успешной проверки обновлятор публикует клиент в ветку `updates`:

- [Готовый game.modded.js](https://raw.githubusercontent.com/Abricos2050934/Devast-io/updates/game.modded.js)
- [ZIP](https://github.com/Abricos2050934/Devast-io/raw/refs/heads/updates/Devast-io-client.zip)
- [Версия и SHA256](https://raw.githubusercontent.com/Abricos2050934/Devast-io/updates/current.json)
- [Автоматические запуски](https://github.com/Abricos2050934/Devast-io/actions/workflows/auto-update.yml)

Для Resource Override: [скачать импортируемый JSON](https://github.com/Abricos2050934/Devast-io/raw/refs/heads/updates/Devast-io-GitHub-Resource-Override.json).
[Установка](resource-override/README.md): импортировать, отключить прежнюю подмену,
перезагрузить страницу. JSON загружает последний опубликованный JS по постоянной
ссылке; заново импортировать его после обновлений не нужно.

Полный файл заменяет основной игровой JS **до запуска игры**. Не выполняйте второй
клиент поверх уже загруженного оригинала. Публичная ссылка остаётся постоянной;
обновления попадают в неё только после проверок. Если изменился неизвестный контракт
игры, сохраняется предыдущая сборка. Интервал GitHub Actions — 15 минут; запуск по
расписанию может задерживаться на стороне GitHub.

```sh
npm ci --ignore-scripts
npm run build
npm test
npx playwright-core install --with-deps chromium firefox
npm run update:once
```

Нужны Python 3.12+, Node.js 24, Chromium и Firefox. `npm run update:watch` запускает локальную
проверку раз в 5 минут; `npm run update:serve` выдаёт проверенный файл локально.
Публикация вручную: `python3 tools/publish_update.py` после успешного update:once.

Обновляется именно текущий мод из mod/contract.json: сверяются хеши всех четырёх
модулей, целиком включённый установщик, bootstrap, GUI и ядро ILM. Проверяются
нативные обработчики в Chromium/Firefox и функции уже переведённой сборки; затем весь
пакет регрессионных тестов. Данные аккаунта для обновлятора не нужны.

Браузерные проверки используют подготовленные данные. Они не подтверждают вход
на живой сервер или отсутствие киков.

Подробности: [AUTO-UPDATE.md](AUTO-UPDATE.md), [ILM-PORT.md](ILM-PORT.md),
[AIM-SETTINGS.md](AIM-SETTINGS.md), [REJOIN-FIX.md](REJOIN-FIX.md).

## Перенос проекта в новый чат

Полная инструкция: [CONTINUE-IN-NEW-CHAT.md](CONTINUE-IN-NEW-CHAT.md).
Текст для вставки: [handoff/NEW-CHAT-PROMPT.txt](handoff/NEW-CHAT-PROMPT.txt).
Полный архив проекта: [Devast-io-Handoff.zip](https://github.com/Abricos2050934/Devast-io/releases/download/handoff-2026-11-03/Devast-io-Handoff.zip).

Для переезда без старого GitHub: [пошаговая инструкция](handoff/MIGRATE-TO-NEW-GITHUB.md).
В полном архиве есть автономный клиент и помощник смены ссылок; историю Git можно сохранить отдельно.
