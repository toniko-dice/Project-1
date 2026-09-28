# Задача: лентата с категории на началната показва 3 от 6

След `task-home-regression.md` каруселът и редовете с продукти са
обратно. Остава лентата с кръглите икони (`categoryStrip`): в базата 6
категории са с `showInStrip` (portativni-elektrocentrali,
domashni-sistemi, solarni-paneli, umni-ustroystva, aksesoari,
komplekti), на екрана са само Портативни електроцентрали, Соларни
панели, Аксесоари. Не е заради иконата — само първата има `icon`, а
другите две без икона се показват.

Намери филтъра, който маха domashni-sistemi, umni-ustroystva и
komplekti (брой продукти? `layout`? нещо в `getCategories`?). Правило:
лентата показва **всички** категории с `showInStrip`, подредени по
`_order`, без други условия — собственикът решава от админа кое е в
лентата. Без икона → плочка със заместител, както сега.

Проверка: `/` показва 6 плочки в реда от `content/kategorii.md`.

Git: commit + push.
