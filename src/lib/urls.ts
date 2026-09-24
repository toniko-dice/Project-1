import type { Category, Product } from '@/payload-types'

/**
 * АДРЕСИТЕ НА САЙТА — единственото място, където се сглобяват.
 *
 * Правилото:
 *
 * | какво              | адрес                                  |
 * |--------------------|----------------------------------------|
 * | категория          | `/kategorii/<slug>`                    |
 * | подсерия           | няма свой адрес — раздел на серията:   |
 * |                    | `/kategorii/<серия>?sub=<slug>`        |
 * | продукт            | `/kategorii/<серия>/<slug>`            |
 *
 * Серията е категорията от ВТОРО ниво над продукта. Подсерия и продукт не
 * могат да делят една позиция в адреса — затова подсериите са раздели.
 *
 * Никъде другаде в кода не се пише `/kategorii/...` на ръка. Иначе първото
 * преименуване на категория оставя мъртви линкове на места, за които никой
 * не се сеща — точно това се случи с адресите от първия seed
 * (`/categories/delta-seriya`, `/power-stations`), които даваха 404.
 */

export const CATEGORY_BASE = '/kategorii'

type CategoryLike = number | Category | null | undefined

/** Адресът на категория по адрес (slug). */
export const categoryPath = (slug: string): string => `${CATEGORY_BASE}/${slug}`

/** Категорията като обект, ако е заредена; иначе `null`. */
const doc = (value: CategoryLike): Category | null =>
  value && typeof value !== 'number' ? value : null

/**
 * Адресът на категория.
 *
 * Подсерията (трето ниво) няма собствена страница — връща се страницата на
 * серията ѝ с избран раздел. Затова тук трябва категорията да е заредена с
 * `depth` поне 2, за да се види родителят на родителя.
 */
export const categoryUrl = (value: CategoryLike): string | null => {
  const c = doc(value)
  if (!c?.slug) return null

  const parent = doc(c.parent)
  const grandparent = doc(parent?.parent)

  // Има баба → това е трето ниво, тоест раздел на страницата на родителя.
  if (parent && grandparent) return `${categoryPath(parent.slug)}?sub=${c.slug}`
  return categoryPath(c.slug)
}

/**
 * Серията (второ ниво) над дадена категория — частта от адреса на продукта.
 *
 * За продукт в „DELTA 3 серия" това е „DELTA серия"; за продукт направо в
 * „DELTA серия" — самата тя; за продукт в главна категория — главната.
 */
export const seriesSlug = (value: CategoryLike): string | null => {
  const c = doc(value)
  if (!c?.slug) return null

  const parent = doc(c.parent)
  if (!parent) return c.slug // категорията е главна

  const grandparent = doc(parent.parent)
  if (!grandparent) return c.slug // категорията е серия под главна

  return parent.slug // категорията е подсерия — серията е родителят
}

/** Резервният път, когато серията на продукта не може да се определи. */
export const PRODUCT_FALLBACK_SERIES = 'produkt'

/**
 * Достатъчното от продукта, за да се сглоби адресът му.
 *
 * Трите слъга са виртуални полета (виж `Products.ts`) — Payload ги
 * попълва при всяко четене, независимо от дълбочината. `category` е
 * резервният път за местата, където продуктът е сглобен на ръка.
 */
export type ProductLike = Pick<Product, 'slug'> & {
  category?: Product['category']
  categorySlug?: string | null
  categoryParentSlug?: string | null
  categoryGrandparentSlug?: string | null
}

export const productPath = (product: ProductLike): string => {
  /*
    Има ли баба, категорията е подсерия и серията е родителят ѝ; иначе
    серията е самата категория. Виртуалните полета дават отговора без
    оглед на дълбочината на четенето.
  */
  const series =
    (product.categoryGrandparentSlug ? product.categoryParentSlug : product.categorySlug) ??
    seriesSlug(product.category as CategoryLike)

  if (!series) {
    /*
      Продукт без категория. Страницата продължава да работи на резервен
      адрес, който я пренасочва към истинската — вместо линкът да изчезне.
    */
    console.warn(`productPath: „${product.slug}" е без категория — резервен адрес`)
    return `${CATEGORY_BASE}/${PRODUCT_FALLBACK_SERIES}/${product.slug}`
  }

  return `${CATEGORY_BASE}/${series}/${product.slug}`
}

/** Адресът на продукт; `null`, ако продуктът не е зареден. */
export const productUrl = (value: number | Product | null | undefined): string | null =>
  value && typeof value !== 'number' ? productPath(value) : null
