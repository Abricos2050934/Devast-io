# Devast-io — оригинальный ILM 1.0 и автообновление

Текущий аимбот полностью восстановлен из 25INVITES-ILM1.0.json:
четыре исходных класса, история, расчёт, меню и цикл50мс.
Untitled, Message15 и Curved не входят в сборку.
Space — включение, H — меню; клавиша переназначается в Keyboard.
[Описание](docs/ilm-production.md), [сверка исходника](verification/ilm-return-2026-11-08/README-ru.md).
Остальные функции мода и сохранение входа остаются прежними.

Автолут ограничен проходом раз в 25 мс и восемью предметами за проход; остаток обходится по очереди. Connection → «Копировать отчёт входа» содержит историю команд мода за 30 минут и переключений функций. [Сравнение и границы диагностики кика](verification/traffic-and-kick-2026-11-08/README-ru.md).

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
Полный архив проекта: [Devast-io-Handoff.zip](https://github.com/Abricos2050934/Devast-io/raw/refs/heads/updates/Devast-io-Handoff.zip?download=1).

Для переезда без старого GitHub: [пошаговая инструкция](handoff/MIGRATE-TO-NEW-GITHUB.md).
В полном архиве есть автономный клиент и помощник смены ссылок; историю Git можно сохранить отдельно.
