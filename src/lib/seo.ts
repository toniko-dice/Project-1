/**
 * SEO правилата за категориите (`task-seo-tehnichesko.md`, т. 3–5) — на
 * едно място за страницата, страницата „Аксесоари за …", картата на сайта и
 * `npm run seo:check`. Без заявки: вход е каталогът (`getCatalog`).
 */
import type { Category } from '@/payload-types'

import type { Catalog, CatalogEntry } from './catalog'
import { DESCRIPTION_LIMIT } from './title'

const номер = (v: unknown): number | null =>
  typeof v === 'number' ? v : ((v as { id?: number } | null)?.id ?? null)

/** Публикуваните продукти на цялото разклонение — в реда от админа. */
export const productsInBranch = (catalog: Catalog, id: number): CatalogEntry[] => {
  const надолу = catalog.branch(id)
  return catalog.entries.filter((e) => e.categories.some((c) => надолу.has(c)))
}

/**
 * Празна категория — без нито един публикуван продукт, и в подкатегориите.
 * Получава `noindex, follow` и не влиза в sitemap; щом получи продукт, се
 * връща сама. Без отметка в админа — иначе някой забравя да я махне.
 */
export const isEmptyCategory = (catalog: Catalog, id: number): boolean =>
  productsInBranch(catalog, id).length === 0

/** Да не се индексира: отметката от админа ИЛИ празна. */
export const categoryNoindex = (catalog: Catalog, category: Pick<Category, 'id' | 'noindex'>) =>
  Boolean(category.noindex) || isEmptyCategory(catalog, category.id)

/**
 * Мета заглавието на категорията — попълненото в админа, иначе името.
 * Две категории с еднакво име (двете „Комплекти") получават и родителя:
 * „Комплекти — Портативни електроцентрали". Само при повторение.
 */
export const categoryMetaTitle = (catalog: Catalog, category: Category): string => {
  const own = category.metaTitle?.trim()
  if (own) return own
  const name = category.title.trim()
  const същото = catalog.tree.some(
    (c) => c.id !== category.id && c.title.trim().toLocaleLowerCase('bg') === name.toLocaleLowerCase('bg'),
  )
  if (!същото) return name
  const parentId = номер(category.parent)
  const parent = parentId !== null ? catalog.categoryById.get(parentId) : undefined
  return parent ? `${name} — ${parent.title.trim()}` : name
}

/**
 * Описанието, когато полето в админа е празно (т. 5):
 * „{Име} EcoFlow — {N} продукта: {до 3 имена}. Цени и наличност от
 * официалния дистрибутор за България." — до 155 знака; ако не се събира,
 * имената отпадат едно по едно.
 *
 * „EcoFlow" не се повтаря: ако го има в името на категорията, отпада след
 * него, а от имената на продуктите се маха водещото „EcoFlow ".
 */
export const autoCategoryDescription = (title: string, entries: { title: string }[]): string => {
  const име = title.trim()
  const марка = /ecoflow/i.test(име) ? име : `${име} EcoFlow`
  const n = entries.length
  const брой = `${n} ${n === 1 ? 'продукт' : 'продукта'}`
  const край = 'Цени и наличност от официалния дистрибутор за България.'
  const имена = entries.map((e) => e.title.replace(/^EcoFlow\s+/i, '').trim())

  for (let k = Math.min(3, n); k >= 0; k -= 1) {
    const списък = k ? `: ${имена.slice(0, k).join(', ')}` : ''
    const текст = `${марка} — ${брой}${списък}. ${край}`
    if (текст.length <= DESCRIPTION_LIMIT || k === 0) return текст
  }
  return `${марка} — ${брой}. ${край}`
}

/** Описанието на категорията — попълненото в админа има предимство. */
export const categoryMetaDescription = (catalog: Catalog, category: Category): string =>
  category.metaDescription?.trim() ||
  autoCategoryDescription(category.title, productsInBranch(catalog, category.id))
