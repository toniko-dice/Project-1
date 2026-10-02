import type { Category } from '@/payload-types'

import { ancestry, parentId } from './tree'

/**
 * КОЙ АКСЕСОАР ЗА КОЕ УСТРОЙСТВО Е — правилото, на едно място.
 *
 * Ползват го страницата „Аксесоари за …", разделът „Аксесоари" в менюто и
 * на страницата на серията, блокът „Съвместими аксесоари" на устройството и
 * филтрите „Съвместимост" и „Модел". Едно правило — иначе менюто показва
 * едни аксесоари, а страницата зад „Всички аксесоари" — други.
 *
 * Тук няма заявки: вход е леко копие на каталога (`getCatalogIndex`) и
 * дървото на категориите.
 */

/** Продукт от каталога — само номерата, без карта. */
export type CatalogEntry = {
  id: number
  slug: string
  title: string
  categories: number[]
  compatCategories: number[]
  compatProducts: number[]
  attributes: { attribute: number; value: string }[]
  price: number | null
  availability: string | null
  order: string
  updatedAt: string | null
}

export type Catalog = {
  tree: Category[]
  entries: CatalogEntry[]
  byId: Map<number, CatalogEntry>
  categoryById: Map<number, Category>
  /** Категорията и всичко под нея, на произволна дълбочина. */
  branch: (id: number) => Set<number>
  /** Категорията и всичко над нея. */
  upward: (id: number) => Set<number>
}

export const makeCatalog = (tree: Category[], entries: CatalogEntry[]): Catalog => {
  const categoryById = new Map(tree.map((c) => [c.id, c]))
  const деца = new Map<number, number[]>()
  for (const c of tree) {
    const p = parentId(c)
    if (p !== null) деца.set(p, [...(деца.get(p) ?? []), c.id])
  }

  const клони = new Map<number, Set<number>>()
  const branch = (id: number) => {
    let set = клони.get(id)
    if (!set) {
      set = new Set([id])
      for (const x of set) for (const d of деца.get(x) ?? []) set.add(d)
      клони.set(id, set)
    }
    return set
  }

  const нагоре = new Map<number, Set<number>>()
  const upward = (id: number) => {
    let set = нагоре.get(id)
    if (!set) {
      const c = categoryById.get(id)
      set = new Set(c ? ancestry(tree, c).map((a) => a.id) : [id])
      нагоре.set(id, set)
    }
    return set
  }

  return {
    tree,
    entries,
    byId: new Map(entries.map((e) => [e.id, e])),
    categoryById,
    branch,
    upward,
  }
}

/* ─────────── кои категории са „аксесоари" ─────────── */

/**
 * Главната „Аксесоари". Подкатегориите ѝ са опциите на филтъра
 * „Категория" и мястото, към което сочат менютата без своя категория.
 * Slug-ове не се сменят (SEO), затова е безопасно да се търси по него.
 */
export const ACCESSORIES_ROOT_SLUG = 'aksesoari'

/**
 * Категорията или някоя над нея е с отметка „Филтри отстрани" — тоест е
 * категория с аксесоари (Кабели, Монтаж и кабели за панели).
 */
export const isAccessoryCategory = (catalog: Catalog, id: number): boolean =>
  [...catalog.upward(id)].some((x) => Boolean(catalog.categoryById.get(x)?.filters))

/** Нивото: 0 — главна, 1 — серия, 2 — подсерия. */
const level = (catalog: Catalog, id: number) => catalog.upward(id).size - 1

/**
 * Има ли категорията страница „Аксесоари за …": главните и сериите извън
 * категориите с аксесоари. Подсерията няма собствена страница изобщо —
 * нейният адрес води към серията.
 */
export const canHaveAccessoriesPage = (catalog: Catalog, id: number): boolean =>
  level(catalog, id) <= 1 && !isAccessoryCategory(catalog, id)

/**
 * „Сериите" за филтъра „Съвместимост" — категориите от второ ниво с
 * устройства (DELTA серия, Wave климатици, Сгъваеми панели), в подредбата
 * от админа.
 */
export const deviceSeries = (catalog: Catalog): Category[] =>
  catalog.tree.filter((c) => level(catalog, c.id) === 1 && !isAccessoryCategory(catalog, c.id))

/* ─────────── правилото ─────────── */

/**
 * Съвместим ли е продуктът с категория K.
 *
 * Да, ако „Съвместим с" сочи:
 * - K или категория ПОД нея — кабел за „DELTA 3 серия" е и за „DELTA серия";
 * - продукт от K или от категория под нея (по която и да е от „Категории");
 * - категория НАД K — стойка за „Соларни панели" е и за „Сгъваеми панели".
 */
export const compatibleWithCategory = (catalog: Catalog, entry: CatalogEntry, k: number) => {
  const надолу = catalog.branch(k)
  const нагоре = catalog.upward(k)
  if (entry.compatCategories.some((c) => надолу.has(c) || нагоре.has(c))) return true
  return entry.compatProducts.some((p) =>
    (catalog.byId.get(p)?.categories ?? []).some((c) => надолу.has(c)),
  )
}

/**
 * Съвместим ли е продуктът с модел M — НАГОРЕ от модела: самият M, някоя от
 * категориите му или категория над тях. Кабел за „DELTA серия" става за
 * всеки DELTA. Същото правило като „Свързани продукти" на модела.
 */
export const compatibleWithProduct = (catalog: Catalog, entry: CatalogEntry, m: number) => {
  if (entry.id === m) return false
  if (entry.compatProducts.includes(m)) return true
  const model = catalog.byId.get(m)
  if (!model) return false
  const нагоре = new Set(model.categories.flatMap((c) => [...catalog.upward(c)]))
  return entry.compatCategories.some((c) => нагоре.has(c))
}

/** Наличните първо, после `_order` (редът от админа), после заглавие. */
export const byAvailabilityThenOrder = (
  a: { availability?: string | null; _order?: string | null; order?: string; title: string },
  b: { availability?: string | null; _order?: string | null; order?: string; title: string },
) => {
  const наличен = (p: typeof a) => (p.availability === 'in-stock' ? 0 : 1)
  if (наличен(a) !== наличен(b)) return наличен(a) - наличен(b)
  // `_order` е дробен ключ — сравнява се като низ, не по азбуката на езика.
  const ka = a._order ?? a.order ?? ''
  const kb = b._order ?? b.order ?? ''
  if (ka !== kb) return ka < kb ? -1 : 1
  return a.title.localeCompare(b.title, 'bg')
}

/** Аксесоарите на категория K — подредени, без повторения. */
export const accessoriesForCategory = (catalog: Catalog, k: number): CatalogEntry[] =>
  catalog.entries
    .filter((e) => compatibleWithCategory(catalog, e, k))
    .sort(byAvailabilityThenOrder)

/** Аксесоарите на модел M — подредени, без повторения. */
export const accessoriesForProduct = (catalog: Catalog, m: number): CatalogEntry[] =>
  catalog.entries
    .filter((e) => compatibleWithProduct(catalog, e, m))
    .sort(byAvailabilityThenOrder)

/**
 * Устройствата на категория K — за филтъра „Модел": продуктите от
 * разклонението ѝ, които не са аксесоари.
 */
export const devicesInCategory = (catalog: Catalog, k: number): CatalogEntry[] => {
  const надолу = catalog.branch(k)
  return catalog.entries
    .filter(
      (e) =>
        e.categories.some((c) => надолу.has(c)) &&
        !e.categories.every((c) => isAccessoryCategory(catalog, c)),
    )
    .sort((a, b) => (a.order === b.order ? a.title.localeCompare(b.title, 'bg') : a.order < b.order ? -1 : 1))
}

/**
 * Пълните подстановки на текстовете на страница „Аксесоари за …":
 * „{име}" → името на категорията, „{брой}" → броя аксесоари.
 */
export const fillTemplate = (text: string, name: string, count: number) =>
  text.replaceAll('{име}', name).replaceAll('{брой}', String(count))
