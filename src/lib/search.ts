import type { CollectionBeforeChangeHook, Where } from 'payload'

/**
 * ТЪРСЕНЕТО — на едно място.
 *
 * Търси се по име, кратка спецификация, адрес, каталожен номер и двата
 * баркода. Всичките шест се слепват в скритото поле `searchText` на
 * продукта (вижте `Products.ts`) и заявката гледа само него.
 *
 * ЗАЩО отделно поле, а не `or` по шестте колони:
 *
 * `LIKE` в SQLite е без значение на регистъра САМО за латиница. Проверено
 * върху базата: `tagline LIKE '%КАПАЦИТЕТ%'` намира 0 реда, `LIKE
 * '%капацитет%'` намира 13. Тоест „Капацитет" с главна буква нямаше да
 * намери нищо, а сайтът е на български. Слепеният текст се записва вече с
 * малки букви (от JavaScript, който знае кирилицата — `lower()` в SQLite
 * НЕ я знае) и заявката сваля и търсеното. Така регистърът отпада.
 *
 * Второто, което се печели: няколко думи трябва да се срещат ЗАЕДНО, но
 * всяка може да е в различно поле — „delta 3 max" е име, „70368 river" е
 * номер плюс име. С шест отделни колони това е декартово произведение от
 * условия; с една колона е просто „и".
 */

/** Полетата на продукта, които влизат в `searchText`. */
export const SEARCH_FIELDS = ['title', 'tagline', 'slug', 'sku', 'ean', 'ean2'] as const

type SearchSource = Partial<Record<(typeof SEARCH_FIELDS)[number], unknown>>

/**
 * Слепеният текст за търсене на един продукт.
 *
 * Винаги с малки букви и с единични интервали. Празните полета отпадат —
 * иначе между тях остават двойни интервали и `like` по цяла дума се
 * разминава.
 */
export const buildSearchText = (source: SearchSource): string =>
  SEARCH_FIELDS.map((name) => source[name])
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

/**
 * Търсеното, сведено до вида на `searchText`.
 *
 * `%` и `_` са шаблонни знаци на `LIKE`. Payload ги подава като стойност
 * без `ESCAPE`, тоест въведено „%" би съвпаднало с всичко. Затова стават
 * интервали, а не се махат — иначе „70368%70367" би станало един номер.
 */
export const normalizeQuery = (q: string): string =>
  q.replace(/[%_\\]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()

/** Думите на търсеното. Ограничени, за да не се строи заявка от абзац. */
export const searchWords = (q: string): string[] =>
  normalizeQuery(q)
    .split(' ')
    .filter(Boolean)
    .slice(0, 6)
    .map((w) => w.slice(0, 40))

/**
 * Условието: ВСЯКА дума трябва да се среща някъде в слепения текст.
 *
 * Думите се изброяват поотделно, а не се подава целият израз на един
 * `like`. Payload сам разделя стойността по интервали и прави същото, но
 * това е негова вътрешна подробност — по-добре е да се вижда тук.
 */
export const searchWhere = (words: string[]): Where => ({
  and: [
    { _status: { equals: 'published' } },
    ...words.map((word) => ({ searchText: { like: word } })),
  ],
})

/* ─────────── подредба на резултатите ─────────── */

/** Продуктът, колкото е нужен за подреждането. */
type Rankable = {
  title?: string | null
  sku?: string | null
  ean?: string | null
  ean2?: string | null
}

/** Започва ли текстът с търсеното — от началото или от начало на дума. */
const startsAtWord = (text: string, needle: string): boolean => {
  let at = text.indexOf(needle)
  while (at !== -1) {
    if (at === 0 || /[\s(\-/]/.test(text[at - 1]!)) return true
    at = text.indexOf(needle, at + 1)
  }
  return false
}

/**
 * Тежестта на един резултат: по-малкото излиза по-напред.
 *
 * 0 — търсеното е точно каталожен номер или баркод. Който търси „70368",
 *     търси точно този артикул и не иска нищо друго преди него.
 * 1 — името започва с търсеното (или с него започва дума в името).
 *     „delta 3 max" вдига „EcoFlow DELTA 3 Max" над продукт, който
 *     съвпада само по адрес или по кратката спецификация.
 * 2 — останалите.
 *
 * При равна тежест решава подредбата от заявката (`_order`, после името)
 * — затова сортирането по-долу трябва да е устойчиво. `Array.sort` в
 * JavaScript е устойчив по стандарт от ES2019.
 */
export const searchRank = (product: Rankable, query: string): number => {
  const q = normalizeQuery(query)
  if (!q) return 2

  const codes = [product.sku, product.ean, product.ean2]
    .map((v) => (typeof v === 'string' ? v.trim().toLowerCase() : ''))
    .filter(Boolean)
  if (codes.includes(q)) return 0

  const title = (product.title ?? '').toLowerCase()
  if (startsAtWord(title, q)) return 1

  return 2
}

/** Подрежда вече намереното, без да мени реда при равна тежест. */
export const rankSearchResults = <T extends Rankable>(products: T[], query: string): T[] => {
  const тежест = new Map<T, number>(products.map((p) => [p, searchRank(p, query)]))
  return [...products].sort((a, b) => тежест.get(a)! - тежест.get(b)!)
}

/* ─────────── попълване при запис ─────────── */

/**
 * Записва `searchText` при всяка промяна на продукт.
 *
 * Куката е на колекцията, не на полето: при частичен запис полето му
 * получава само своята стойност, а тук трябват шест чужди. За всяко се
 * гледа дали ИМА в данните — не дали е празно. Иначе изчистен баркод
 * (`null`) би се заменил със стария и търсенето щеше да го намира.
 *
 * Куката важи занапред. Вече съществуващите редове се попълват веднъж с
 * `npm run backfill:search` — той чете и пише направо в базата, без да
 * създава нови версии на продуктите.
 */
export const fillSearchText: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const запис = (data ?? {}) as Record<string, unknown>
  const преди = (originalDoc ?? {}) as Record<string, unknown>

  const source = Object.fromEntries(
    SEARCH_FIELDS.map((name) => [name, name in запис ? запис[name] : преди[name]]),
  ) as SearchSource

  return { ...запис, searchText: buildSearchText(source) }
}
