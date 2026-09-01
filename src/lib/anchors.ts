/**
 * Превръща надпис на секция в идентификатор за закачено меню.
 *
 * Заглавията са на кирилица, а `id` в адреса трябва да е латиница —
 * иначе линкът излиза кодиран и нечетим.
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

export const slugify = (input: string): string =>
  transliterate(input)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

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
