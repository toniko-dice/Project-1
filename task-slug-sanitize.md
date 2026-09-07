# Задача: полето „URL адрес" да се почиства само

Засяга `src/collections/Products.ts`, `src/collections/Categories.ts` и
`src/collections/Pages.ts` — навсякъде, където има поле `slug`.

---

## Проблемът

Полето приема всичко. Проверено на живо:

- продукт със slug `products/delta-3-classic` — собственикът е написал
  пълния път, мислейки, че така трябва. Страницата се озова на
  `/products/products/delta-3-classic`, а линкът от менюто към
  `/products/delta-3-classic` дава 404
- продукт със slug `EcoFlow-wave-3-klimatik` — главни букви от seed
  скрипта. На Linux сървър `/products/ecoflow-wave-3-klimatik` и
  `/products/EcoFlow-wave-3-klimatik` са два различни адреса

Собственикът няма как да знае правилата. Полето трябва да ги налага само.

---

## Решението

Обща функция за почистване + `beforeValidate` hook на всяко поле `slug`.

### `src/lib/slug.ts`

Вече има транслитерация в `src/lib/anchors.ts` — `transliterate` и
`slugify`. **Не пиши нова.** Изнеси ги в `src/lib/slug.ts` и ги ползвай и
от двете места, за да има едно правило за кирилица → латиница.

Функцията за почистване на slug:
```ts
export const cleanSlug = (input: string): string =>
  slugify(input)            // кирилица → латиница, малки букви
    .replace(/\/+/g, '-')   // наклонени черти → тирета
    .replace(/-{2,}/g, '-') // двойни тирета → едно
    .replace(/^-+|-+$/g, '') // без тирета в краищата
```

Резултат:
- `products/delta-3-classic` → `products-delta-3-classic`
  (но виж по-долу за представката)
- `EcoFlow-wave-3-klimatik` → `ecoflow-wave-3-klimatik`
- `Серия DELTA` → `seriya-delta`
- `  delta 3 plus  ` → `delta-3-plus`

### Представки, които не бива да са там

Ако slug започва с `products/`, `products-`, `categories/` или
`categories-` — това е собственикът, написал пътя. Махни представката,
не я превръщай в тире:

```ts
const PREFIXES = /^(products|categories|pages)[\/-]/
export const cleanSlug = (input: string) =>
  slugifyClean(input.replace(PREFIXES, ''))
```

Иначе `products/delta-3-classic` става `products-delta-3-classic` и
пак не съвпада с линка.

### Hook на полето

Във всяко поле `slug`:
```ts
hooks: {
  beforeValidate: [({ value }) => (typeof value === 'string' ? cleanSlug(value) : value)],
}
```

`beforeValidate`, не `beforeChange` — за да мине почистването преди
проверката за уникалност. Иначе `Delta-3` и `delta-3` ще минат като
различни, а после ще се сблъскат.

### Описанието на полето

Смени го, за да казва какво става:
```
'Само малки латински букви, цифри и тирета. Кирилицата се транслитерира,
интервалите стават тирета, представки като „products/" се махат. Не е
нужно да пишете пътя — само името.'
```

---

## Съществуващите записи

Hook-ът действа при **следващ запис**, не назад. Двата грешни записа:

- `products/delta-3-classic` → собственикът ще го поправи ръчно, или
  скриптът по-долу
- `EcoFlow-wave-3-klimatik` → същото

Напиши еднократен скрипт `src/fix-slugs.ts`, който минава през
продукти, категории и страници, прилага `cleanSlug` и записва само
променените. Изпиши кои е променил. Пуска се с:
```
payload run src/fix-slugs.ts
```

**Не го пускай сам** — собственикът решава кога. Само го напиши.

---

## Правила

- Никакви нови зависимости
- `anchors.ts` да продължи да работи след изнасянето — котвите в
  продуктовата страница ползват същата транслитерация
- Няма миграция: hook не е промяна в схемата

---

## Как да разбереш, че е готово

- Запис на продукт със slug `Products/Тест 3` дава `test-3`
- Запис със slug `EcoFlow-wave-3` дава `ecoflow-wave-3`
- Опит за втори продукт със slug `delta-3-classic`, когато вече има
  такъв, дава грешка за уникалност — не се записва
- Котвите на продуктовата страница работят както преди
- `payload run src/fix-slugs.ts` изписва двата променени записа и
  нищо друго
