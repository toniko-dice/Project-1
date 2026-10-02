import type { Metadata } from 'next'

/**
 * Заглавието в таба и в резултатите на търсачките.
 *
 * Името на сайта се добавя от `title.template` в layout-а („%s — EcoFlow
 * България"). Заглавие, което ВЕЧЕ го съдържа — ръчно написано мета
 * заглавие, началната страница — се връща като `absolute`, без шаблона.
 * Иначе излизаше „… | EcoFlow България — EcoFlow България": до 2 октомври
 * 2026 така бяха 112 продукта (наставката идваше от вноса) и началната.
 */
export const SITE_NAME = 'EcoFlow България'

export const TITLE_TEMPLATE = `%s — ${SITE_NAME}`

export const pageTitle = (title?: string | null): Metadata['title'] | undefined => {
  const t = title?.trim()
  if (!t) return undefined
  return t.toLocaleLowerCase('bg').includes(SITE_NAME.toLocaleLowerCase('bg')) ? { absolute: t } : t
}
