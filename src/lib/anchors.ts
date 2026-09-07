/**
 * Идентификатори за закаченото меню на продуктовата страница.
 *
 * Транслитерацията е обща с полетата „URL адрес" и живее в `slug.ts` —
 * едно правило, за да не се разминават адресите и котвите.
 */
import { slugify } from './slug'

export { slugify, transliterate } from './slug'

/**
 * Прави идентификаторите уникални в рамките на една страница.
 * При съвпадение се добавя наставка: „specifications", „specifications-2".
 */
export const uniqueAnchor = (label: string, used: Set<string>): string => {
  const base = slugify(label) || 'section'
  let id = base
  let n = 2
  while (used.has(id)) {
    id = `${base}-${n}`
    n += 1
  }
  used.add(id)
  return id
}
