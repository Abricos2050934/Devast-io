# Восстановление без старого GitHub

Главного ZIP достаточно. Новый чат не обязан иметь доступ к старому аккаунту.
До переноса проверить архив и сохранить его исходную копию.

## 1. Распаковка и проверка

Распаковать Devast-io-Handoff.zip. На Windows можно использовать «Извлечь всё»,
а технические команды поручить новому чату в его облачной среде/Linux.
В каталоге Devast-io-Handoff:

```sh
python3 handoff/verify_archive.py
```

При расхождении SHA256 не продолжать публикацию до выяснения причины.
Для восстановления с историей проверить SHA bundle из MANIFEST.json, затем:

```sh
git clone /путь/Devast-io-main-history.bundle Devast-io-restored
cd Devast-io-restored
git branch -M main
```

В bundle есть HEAD и ветка исходников; clone не обращается к старому GitHub.
После клонирования можно перенести из распакованного ZIP MANIFEST.json,
SHA256SUMS.txt, client/ и dist/auto-update/ для офлайн-снимка и его проверки.
Не заменять .git и не копировать .git/config из чужой среды. Исходники ZIP и
bundle должны иметь один source_commit; если версии различаются — сначала сравнить.
Git-история не обязательна: без bundle создать новую историю на шаге 4.

## 2. Выбор нового адреса и авторизация

Нужен новый OWNER/REPO, например NewOwner/Devast-io. Создать пустой ПУБЛИЧНЫЙ
репозиторий без автоматически добавленного README/license/.gitignore. Публичность
нужна для анонимной загрузки JS браузером; не вставлять GitHub PAT в игровой JS.
Войти в новый аккаунт/подключить GitHub к новому чату штатным способом.
Архив не переносит авторизацию. Пароли и PAT не отправлять обычным сообщением.

Если доступен gh с уже подключённым новым аккаунтом, чат может создать репозиторий
через gh repo create NEW_OWNER/NEW_REPO --public. Не создавать случайный адрес,
если пользователь ещё не указал владельца и имя.

## 3. Перепривязка ссылок

```sh
python3 handoff/retarget_repository.py NEW_OWNER/NEW_REPO --dry-run
python3 handoff/retarget_repository.py NEW_OWNER/NEW_REPO
```

Помощник не создаёт репозиторий и не отправляет файлы. Он меняет:

- resource-override/loader.js и генерируемый JSON;
- tools/validate_update.cjs — URL перехвата новой сборки в обоих браузерах;
- tools/check_resource_override.cjs и tests/resource-override.test.cjs;
- текущие ссылки в README, AUTO-UPDATE и инструкции Resource Override.

Операция идемпотентна, результат записан в handoff/MIGRATION-STATE.json.
Не делать глобальный replace в baselines/, recovery/, истории Git и старых
verification/: это испортит исходники и привязку исторических хешей.
Официальный URL игры в auto-update.json не заменять GitHub-адресом.

## 4. Зависимости, Git и проверки

```sh
npm ci --ignore-scripts
npx playwright-core install --with-deps chromium firefox
npm run build
npm test
npm run update:once
```

update:once проверяет и Chromium, и Firefox, а также 3 подписи. Во время него
не менять исходники: защита входных хешей отменит выбор кандидата.
При недоступности игры/неизвестном контракте сохранить диагностику и исправлять
причину; не отключать проверки и не публиковать старый dist как новую сборку.

Если .git отсутствует:

```sh
git init -b main
git add .
git commit -m "Restore Devast-io project from verified backup"
git remote add origin https://github.com/NEW_OWNER/NEW_REPO.git
```

Если Git восстановлен из bundle:

```sh
git branch -M main
git remote set-url origin https://github.com/NEW_OWNER/NEW_REPO.git
git add .
git commit -m "Point client and validation at the new repository"
```

Если remote origin ещё нет — использовать remote add вместо set-url.
При необходимости задать локальные user.name/user.email для Git. Не помещать
учётные данные в remote URL. Не использовать force push поверх чужих данных.
Игнорируемые MANIFEST.json, SHA256SUMS.txt и client/ — резервные копии, не исходники
нового main. Генерируемый dist/auto-update тоже не коммитится в main.

## 5. Публикация и работа автоматики

```sh
git push -u origin main
python3 tools/publish_update.py
```

Publisher сам создаст/обновит updates, сохранив проверки и ZIP. Если готовая
версия не соответствует текущему моду/JSON/контракту/двум браузерам/трём подписям,
он обязан отказать. После смены loader URL нужна новая проверенная сборка,
даже если сам JS мода остался побайтово прежним.

Убедиться, что main — ветка по умолчанию и Actions разрешены. При необходимости
включить workflow, затем запустить и проверить:

```sh
gh workflow enable auto-update.yml --repo NEW_OWNER/NEW_REPO
gh workflow run auto-update.yml --repo NEW_OWNER/NEW_REPO --ref main
gh run list --repo NEW_OWNER/NEW_REPO --workflow auto-update.yml --limit 5
```

Расписание задано каждые 15 минут, но GitHub может задерживать запуск.
Успешный workflow должен завершить также Publish the verified client.
Сверить публичные current.json, verification.json и SHA256 game.modded.js;
в обоих браузерах должны быть status=passed и integrity_compatibility с predicates=3.

Новые ссылки:

- https://raw.githubusercontent.com/NEW_OWNER/NEW_REPO/updates/game.modded.js
- https://raw.githubusercontent.com/NEW_OWNER/NEW_REPO/updates/current.json
- https://raw.githubusercontent.com/NEW_OWNER/NEW_REPO/updates/verification.json
- https://raw.githubusercontent.com/NEW_OWNER/NEW_REPO/updates/Devast-io-GitHub-Resource-Override.json

## 6. Переключение браузера пользователя

Скачать JSON из нового updates, импортировать в Resource Override, отключить
старую подмену, перезагрузить Firefox через Ctrl+Shift+R. При смене репозитория
переимпорт нужен ОДИН раз: старое правило не узнает новый адрес само.
Следующие совместимые обновления нового репозитория загружаются при перезагрузке.
Cookies, token/tokenId/userId и localStorage игры не очищать.

Пока новое хранилище не готово, client/Devast-io-Offline-Resource-Override.json
позволяет использовать закреплённый клиент без GitHub, если версия игры совместима.
Отключить остальные правила подмены. Это не постоянное автообновление.
