/**
 * Едно правило за превръщане на текст в адрес.
 *
 * Ползва се на две места: от полетата „URL адрес" в колекциите и от
 * котвите в продуктовата страница (`anchors.ts`). Затова живее тук, а не
 * дублирано — иначе кирилицата ще се транслитерира различно на двете места.
 */

const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's',
  т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht',
  ъ: 'a', ь: 'y', ю: 'yu', я: 'ya',
}

export const transliterate = (input: string): string =>
  input
    .toLowerCase()
    .split('')
    .map((ch) => CYRILLIC[ch] ?? ch)
    .join('')

/** Кирилица → латиница, малки букви, всичко останало → тирета. */
export const slugify = (input: string): string =>
  transliterate(input)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/*
  Представки, които собственикът пише по навик.

  Записал „products/delta-3-classic", защото това е пътят на страницата.
  Без махане на представката адресът става /products/products-delta-3-classic
  и линковете от менюто дават 404.
*/
const PREFIXES = /^\s*(products|categories|pages)[/-]+/i

/**
 * Почиства въведеното в поле „URL адрес".
 *
 * Примери:
 *   „products/delta-3-classic" → „delta-3-classic"
 *   „EcoFlow-wave-3-klimatik"  → „ecoflow-wave-3-klimatik"
 *   „Серия DELTA"              → „seriya-delta"
 *   „  delta 3 plus  "         → „delta-3-plus"
 */
export const cleanSlug = (input: string): string => slugify(input.replace(PREFIXES, ''))
