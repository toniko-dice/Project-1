# Задача: втори баркод + внос на RIVER 3 Max Plus (Wireless)

## 1. `products.ean2` — „Втори баркод“

Комплекти от две устройства (RIVER 3 Max Plus (Wireless) = станция +
RAPID батерия) идват от dice.bg с два баркода. Ново поле `ean2` (text,
по избор, до `ean`, описание „За комплекти с две устройства. По избор.“).
Вносът го подава като `ean2`. Показва се в Schema.org `gtin` само
първият. Няма миграция освен новата колона → `npm run migrate`.

## 2. Внос

`npm run import:product river-3-max-plus-wireless` — нов продукт,
чернова, категория `river-3-seriya` (под RIVER серия → адрес
`/kategorii/river-seriya/river-3-max-plus-wireless`). 5 снимки в
галерията, 21 в `sekcii`. Другите продукти не се пипат.

## 3. Git

Commit + push.
