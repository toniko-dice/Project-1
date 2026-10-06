import type { Page, Product } from '@/payload-types'
import { categoryBranchIds, getCategoryProducts, getCategoryTree } from './payload'
import { publishedRelation, resolvedRelations } from './relations'

type Layout = NonNullable<Page['layout']>
type Carousel = Extract<Layout[number], { blockType: 'productCarousel' }>

/**
 * Продуктите на карусела.
 *
 * С избрана „Продукти от категория" — всички публикувани от категорията и
 * подкатегориите ѝ, по реда им (`_order`, после заглавие): същата заявка
 * като на страницата на категорията, тоест нов продукт в серията излиза
 * и тук, без да се пипа блокът. Иначе — ръчният списък.
 */
export const carouselProducts = async (block: Carousel): Promise<Product[]> => {
  const cat = block.fromCategory
  if (!cat) return resolvedRelations<Product>(block.products, 'productCarousel.products')

  const tree = await getCategoryTree()
  const id = typeof cat === 'number' ? cat : cat.id
  const slug = tree.find((c) => c.id === id)?.slug
  if (!slug) return []
  return getCategoryProducts(slug, categoryBranchIds(tree, id))
}

/** Публикуваните продукти в колоните на таблица „Време за работа", с реда им. */
export const runtimeColumns = (block: Extract<Layout[number], { blockType: 'runtimeCompare' }>) =>
  (block.products ?? []).flatMap((col, index) => {
    const product = publishedRelation<Product>(col.product)
    return product ? [{ product, specLine: col.specLine, index }] : []
  })

/**
 * Продуктите, показани на страницата — за JSON-LD `ItemList`: колоните на
 * таблиците с времената и каруселите, в реда на страницата, без повторения.
 */
export const pageListProducts = async (layout: Page['layout']): Promise<Product[]> => {
  const seen = new Set<number>()
  const out: Product[] = []
  const add = (p: Product) => {
    if (seen.has(p.id)) return
    seen.add(p.id)
    out.push(p)
  }
  for (const block of layout ?? []) {
    if (block.hidden) continue
    if (block.blockType === 'runtimeCompare') runtimeColumns(block).forEach((c) => add(c.product))
    if (block.blockType === 'productCarousel') (await carouselProducts(block)).forEach(add)
  }
  return out
}
