# Покрытие каталога

Все 147 уникальных кода из официальной таблицы https://devast.io/commands включены в config.json с ценой покупки и продажи.
У 147 товаров также определён IID по текущему клиенту.

В текущем клиенте присутствуют дополнительные сущности/предметы, не перечисленные в этой официальной таблице. Их серверные коды выдачи не подтверждены, поэтому магазин не отправляет вымышленные команды для них. Некоторые относятся к временным событиям и улучшениям, которые сервер может обрабатывать иначе, чем обычный предмет.

| IID | Название клиента без документированного кода магазина |
| --- | --- |
| 114 | Ghoul Blood |
| 118 | Amanita |
| 119 | Boletus |
| 120 | Russula |
| 121 | Rotten Mushroom |
| 122 | Rotten Mushroom |
| 123 | Rotten Mushroom |
| 125 | LapaBot |
| 132 | Rare Flower |
| 136 | Laser Sniper |
| 137 | HAL Bot |
| 138 | Tesla Bot |
| 159 | Feeder |
| 160 | Gingerbread Wall |
| 161 | Gingerbread Door |
| 162 | Gingerbread Cable/Wall |
| 163 | Gingerbread Automat' Door |
| 164 | Christmas Hat |
| 165 | Rudolph Hat |
| 166 | Snowman Hat |
| 167 | Christmas Cake |
| 168 | Rotten Christmas Cake |
| 169 | The Little Gingerbread Man |
| 170 | The Old Gingerbread Man |
| 171 | Elf hat |
| 172 | Giant Sugar Can |
| 173 | Sugar Can |
| 176 | Builder 1 |
| 177 | Builder 2 |
| 178 | Inventory 1 |
| 179 | Inventory 2 |
| 180 | Inventory 3 |
| 181 | Inventory 4 |
| 182 | Inventory 5 |
| 183 | Light Weight |
| 184 | Turret Base |
| 185 | Rifle Turret |
| 186 | Laser Turret |
| 187 | Sniper Turret |
| 188 | Plasma Turret |
| 189 | Metal chest |
| 190 | Uranium Cable - Wall |
| 191 | Uranium Automatic Door |

Наличие названия в клиенте само по себе не подтверждает доступность выдачи командой !item-to. Для добавления нужно подтвердить серверный код/семантику и записать его в catalog с правильным iid и aliases. Не меняй player_reference и алиасы наугад для зависшего заказа.
