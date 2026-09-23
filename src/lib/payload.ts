import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import { cache } from 'react'

import type { Product } from '@/payload-types'

export const getPayloadClient = cache(async () => getPayload({ config }))

/**
 * Измерване на времето на четенията — само при `PAYLOAD_TIMING=1`.
 *
 * Пише в конзолата на сървъра колко отнема всяко четене. Служи за
 * намиране на бавното място, не за постоянна употреба. Пусни
 * `PAYLOAD_TIMING=1 npm run dev` и зареди страница.
 */
const TIMING = process.env.PAYLOAD_TIMING === '1'

const timed = async <T,>(label: string, work: () => Promise<T>): Promise<T> => {
  if (!TIMING) return work()
  const start = performance.now()
  try {
    return await work()
  } finally {
    console.log(`⏱ ${label}: ${(performance.now() - start).toFixed(0)} ms`)
  }
}

/**
 * ДВЕ НИВА НА КЕШ
 *
 * `cache()` от React слепва еднаквите четения в рамките на ЕДНА заявка —
 * хедърът и страницата искат „site-settings" и то се чете веднъж.
 *
 * `unstable_cache` от Next пази резултата МЕЖДУ заявките, с тагове. Без
 * него всяко зареждане в режим за разработка прави десетки заявки към
 * базата: продукт с 14 блока и връзки на две нива отнемаше 2,5–2,9 s,
 * хедърът с 38 панела — 2 s. С кеша същото е под 100 ms.
 *
 * В продукция страниците са статични и четенията стават само при
 * пресъздаване, но и там кешът спестява повторните.
 *
 * Таговете се изчистват от куките в `src/lib/revalidate.ts` при всяка
 * промяна в админа. Кешираните функции връщат само JSON-сериализуеми
 * стойности — затова `getMenuProducts` дава обект, не `Map`.
 */
const cached = <T,>(keys: string[], tags: string[], work: () => Promise<T>) =>
  unstable_cache(work, keys, { tags })()

/**
 * Зарежда страница по адрес заедно с всички вложени връзки в секциите.
 *
 * Връщат се САМО публикуваните страници. Черновите остават невидими за
 * посетителите — иначе всяка недовършена редакция излиза наживо веднага
 * след записване.
 */
export const getPage = cache(async (slug: string) =>
  timed(`getPage(${slug})`, () =>
    cached(['page', slug], ['page', `page:${slug}`], async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'pages',
        where: {
          and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }],
        },
        limit: 1,
        depth: 3,
      })
      return result.docs[0] ?? null
    }),
  ),
)

/**
 * Зарежда продукт по адрес.
 *
 * Връщат се САМО публикуваните. Колекцията е с чернови, защото продуктите
 * се внасят на едро от скрипт — недовършен внос не бива да излиза наживо.
 *
 * Последствие, което трябва да се помни: нов продукт не се вижда, докато
 * не бъде публикуван. Ако някой докладва „продуктът изчезна", първо
 * провери статуса му.
 *
 * `depth: 2` е нужен: сравнителната таблица сочи продукти, чиито снимки са
 * второ ниво. По-плитко ги оставя без снимка.
 */
export const getProduct = cache(async (slug: string) =>
  timed(`getProduct(${slug})`, () =>
    cached(['product', slug], ['product', `product:${slug}`], async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'products',
        where: {
          and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }],
        },
        limit: 1,
        depth: 2,
      })
      return result.docs[0] ?? null
    }),
  ),
)

/** Адресите на публикуваните продукти — за предварително построяване на страниците. */
export const getPublishedProductSlugs = cache(async (): Promise<string[]> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    where: { _status: { equals: 'published' } },
    depth: 0,
    pagination: false,
  })
  return result.docs.map((p) => p.slug)
})

/**
 * Зарежда категория по адрес.
 *
 * Категориите нямат чернови — показват се веднага след създаване. Затова
 * скриптът за дървото ги създава направо видими.
 */
export const getCategory = cache(async (slug: string) =>
  timed(`getCategory(${slug})`, () =>
    cached(['category', slug], ['category', `category:${slug}`], async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'categories',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 2,
      })
      return result.docs[0] ?? null
    }),
  ),
)

/** Подкатегориите на дадена категория, в подредбата от админа. */
export const getSubcategories = cache(async (parentId: number) =>
  cached(['subcategories', String(parentId)], ['category'], async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'categories',
      where: { parent: { equals: parentId } },
      sort: '_order',
      pagination: false,
      depth: 1,
    })
    return result.docs
  }),
)

/** Публикуваните продукти в категория. Черновите не се показват. */
export const getProductsInCategory = cache(async (categoryId: number) =>
  cached(['products-in-category', String(categoryId)], ['product', 'category'], async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'products',
      where: {
        and: [{ category: { equals: categoryId } }, { _status: { equals: 'published' } }],
      },
      sort: '_order',
      pagination: false,
      depth: 1,
    })
    return result.docs
  }),
)

/** Адресите на всички категории — за предварително построяване на страниците. */
export const getCategorySlugs = cache(async (): Promise<string[]> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'categories',
    depth: 0,
    pagination: false,
  })
  return result.docs.map((c) => c.slug)
})

/**
 * Продуктите за автоматичните панели в менюто, групирани по категория.
 *
 * ЕДНА заявка за всички категории наведнъж, не по една на панел — менюто е
 * на всяка страница и панелите са двайсетина. Взимат се само публикуваните,
 * подредени както в админа (`_order`), после по дата.
 *
 * Резултатът е обикновен обект с ключ номера на категорията — `Map` не
 * минава през кеша (не е JSON).
 */
export const getMenuProducts = cache(
  async (categoryIds: number[], perCategory = 7): Promise<Record<number, Product[]>> =>
    timed(`getMenuProducts(${categoryIds.length})`, () =>
      cached(
        ['menu-products', categoryIds.join(','), String(perCategory)],
        ['menu', 'product'],
        async () => {
          const grouped: Record<number, Product[]> = {}
          if (!categoryIds.length) return grouped

          const payload = await getPayloadClient()
          const result = await payload.find({
            collection: 'products',
            where: {
              and: [{ category: { in: categoryIds } }, { _status: { equals: 'published' } }],
            },
            sort: ['_order', '-createdAt'],
            pagination: false,
            depth: 1,
          })

          for (const product of result.docs) {
            const id =
              typeof product.category === 'number' ? product.category : product.category?.id
            if (typeof id !== 'number') continue
            const list = grouped[id] ?? []
            if (list.length < perCategory) list.push(product)
            grouped[id] = list
          }

          return grouped
        },
      ),
    ),
)

/**
 * Продукти по номера — за ръчните карти в менюто, които сочат продукт.
 *
 * Хедърът се чете с `depth: 2`: панел → карта → продукт. Снимката на
 * продукта е на трето ниво и идва само като номер. Вместо да се вдига
 * дълбочината на целия глобал (38 панела, всичко в тях), продуктите се
 * дотеглят с една заявка на дълбочина 1 — точно колкото за снимката.
 * Само публикуваните; чернова в менюто не бива да излиза.
 */
export const getProductsByIds = cache(
  async (ids: number[]): Promise<Record<number, Product>> =>
    timed(`getProductsByIds(${ids.length})`, () =>
      cached(['products-by-ids', ids.join(',')], ['menu', 'product'], async () => {
        const byId: Record<number, Product> = {}
        if (!ids.length) return byId

        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'products',
          where: { and: [{ id: { in: ids } }, { _status: { equals: 'published' } }] },
          pagination: false,
          depth: 1,
        })
        for (const product of result.docs) byId[product.id] = product
        return byId
      }),
    ),
)

type GlobalSlug = 'header' | 'footer' | 'site-settings' | 'design'

export const getGlobal = cache(async <T extends GlobalSlug>(slug: T) =>
  timed(`getGlobal(${slug})`, () =>
    cached(['global', slug], ['global', `global:${slug}`], async () => {
      const payload = await getPayloadClient()
      return payload.findGlobal({ slug, depth: 2 })
    }),
  ),
)
