import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import { cache } from 'react'

import type { Category, Product, ProductsSelect } from '@/payload-types'
import type { Where } from 'payload'
import { Products } from '@/collections/Products'
import { rankSearchResults, searchWhere, searchWords } from './search'

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
 * стойности — затова `getProductsByIds` дава обект, не `Map`.
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

/**
 * Публикуваните продукти — за предварително построяване и за sitemap.
 *
 * `depth: 2` е нужен заради адреса: серията на продукта е категорията от
 * второ ниво, тоест трябват родителят и родителят на родителя.
 */
export type ProductForUrl = Pick<Product, 'id' | 'slug' | 'title' | 'category' | 'updatedAt'>

export const getPublishedProducts = cache(async (): Promise<ProductForUrl[]> => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    where: { _status: { equals: 'published' } },
    depth: 2,
    pagination: false,
    select: { slug: true, title: true, category: true, updatedAt: true },
  })
  return result.docs
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

/**
 * Всички категории, плоско, с родителите като номера.
 *
 * Дървото е малко (около трийсет реда) и се ползва навсякъде: трохи,
 * раздели, адреси, sitemap. Една заявка за всичко е по-евтина от
 * изкачване родител по родител.
 */
export const getCategoryTree = cache(async (): Promise<Category[]> =>
  timed('getCategoryTree', () =>
    cached(['category-tree'], ['category'], async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'categories',
        sort: '_order',
        pagination: false,
        depth: 0,
      })
      return result.docs
    }),
  ),
)

/**
 * Категориите за лентата с икони на началната страница.
 *
 * Изворът е отметката „Показване в лентата с икони" на самата категория,
 * а редът — `_order`, тоест подредбата с влачене в списъка с категории.
 * Няма друго условие: категория без икона излиза със заместител, а не
 * изчезва.
 *
 * Преди блокът държеше собствен списък с връзки и отметката не се четеше
 * никъде. Отметката се слагаше на шест категории, а на началната стояха
 * три — списъкът в блока още сочеше старите и нищо не го казваше.
 */
export const getStripCategories = cache(async (): Promise<Category[]> =>
  timed('getStripCategories', () =>
    cached(['strip-categories'], ['category'], async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'categories',
        where: { showInStrip: { equals: true } },
        sort: '_order',
        pagination: false,
        // Стига за иконата; адресът на лентата е само slug.
        depth: 1,
      })
      return result.docs
    }),
  ),
)

/**
 * Полетата на една карта — за списъците: категория, аксесоари, менюто.
 *
 * Пълният продукт носи всички секции и блокове. На 1 октомври 2026
 * продуктите на менюто (63, дълбочина 1) бяха 2,7 MB — над тавана на
 * `unstable_cache` от 2 MB („items over 2MB can not be cached"), тоест
 * хедърът, а с него ВСЯКА страница, ги четеше наново при всяко зареждане.
 * Списъкът на категория (дълбочина 2) — до 1,1 MB и 0,5–1,2 s. Картата
 * чете само тези полета: 0,05 MB и под 0,1 s.
 *
 * Основата е `defaultPopulate` — същите полета, които носи продукт, свързан
 * в друг документ. Нов обект при всяко извикване: `sanitizeSelect`
 * дописва в подадения обект (т. 22).
 */
const cardSelect = (extra: Record<string, true> = {}) =>
  ({
    ...(Products.defaultPopulate as Record<string, true>),
    _order: true,
    categories: true,
    ...extra,
  }) as ProductsSelect<true>

/** Номерата на категорията и на всичко под нея, на произволна дълбочина. */
export const categoryBranchIds = (tree: Category[], rootId: number): number[] => {
  const ids = [rootId]
  for (let i = 0; i < ids.length; i += 1) {
    for (const c of tree) {
      const parent = typeof c.parent === 'number' ? c.parent : c.parent?.id
      if (parent === ids[i]) ids.push(c.id)
    }
  }
  return ids
}

/**
 * Публикуваните продукти в категория И във всичко под нея.
 *
 * Страницата на серия показва продуктите от подсериите си, а главната —
 * от всички серии. Събира се с ЕДНА заявка по списък с номера, не с по
 * една заявка на ниво.
 *
 * Продуктът се вижда във ВСЯКА от „Категории" (не само в основната).
 * `in` върху връзката „много" — продукт с две категории от разклонението
 * излиза веднъж.
 */
export const getCategoryProducts = cache(async (slug: string, ids: number[]) =>
  timed(`getCategoryProducts(${slug})`, () =>
    cached(
      ['category-products-cards', slug, ids.join(',')],
      ['product', 'category', `category:${slug}`],
      async () => {
        if (!ids.length) return []
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'products',
          where: {
            and: [{ categories: { in: ids } }, { _status: { equals: 'published' } }],
          },
          sort: ['_order', 'title'],
          pagination: false,
          depth: 1,
          select: cardSelect(),
        })
        return result.docs
      },
    ),
  ),
)

/**
 * Аксесоарите, съвместими с дадени категории или модели.
 *
 * Аксесоарът стои в своята категория (Кабели, Адаптери) и сочи с
 * „Съвместим с" сериите и моделите, за които става. Оттук се пълнят
 * разделът „Аксесоари" на серията, „Свързани продукти" на модела и
 * секцията „Аксесоари" в панела на менюто — един списък, три места.
 */
export const getCompatibleAccessories = cache(
  async (categoryIds: number[], productIds: number[] = []) =>
    timed(`getCompatibleAccessories(${categoryIds.length}/${productIds.length})`, () =>
      cached(
        ['accessories-cards', categoryIds.join(','), productIds.join(',')],
        ['product', 'category'],
        async () => {
          if (!categoryIds.length && !productIds.length) return []
          const payload = await getPayloadClient()

          /*
            Връзката е полиморфна (категории И продукти), затова двете
            страни се търсят поотделно — Payload не приема смесен списък
            в едно `in`.
          */
          const or: Where[] = []
          if (categoryIds.length) or.push({ 'compatibleWith.value': { in: categoryIds } })
          if (productIds.length) or.push({ 'compatibleWith.value': { in: productIds } })

          const result = await payload.find({
            collection: 'products',
            where: { and: [{ _status: { equals: 'published' } }, { or }] },
            sort: ['_order', 'title'],
            pagination: false,
            depth: 1,
            select: cardSelect({ compatibleWith: true }),
          })

          /*
            Полиморфната връзка не различава „категория 9" от „продукт 9" в
            заявката — и двете са номер 9. Затова съвпадението се
            потвърждава тук, по вид и номер.
          */
          const cats = new Set(categoryIds)
          const prods = new Set(productIds)
          return result.docs.filter((doc) =>
            (doc.compatibleWith ?? []).some((rel) => {
              if (!rel || typeof rel !== 'object') return false
              const id = typeof rel.value === 'number' ? rel.value : rel.value?.id
              if (typeof id !== 'number') return false
              return rel.relationTo === 'categories' ? cats.has(id) : prods.has(id)
            }),
          )
        },
      ),
    ),
)

export type CompatibilityLinks = {
  id: number
  categories: number[]
  products: number[]
}

/**
 * Кой публикуван продукт с какво е съвместим — за раздела „Аксесоари" в
 * менюто.
 *
 * Само номерата: една лека заявка за целия каталог, не по една на панел.
 * Хедърът решава кои аксесоари са за кой панел и дотегля картите им с
 * `getProductsByIds`.
 */
export const getCompatibilityLinks = cache(
  async (): Promise<CompatibilityLinks[]> =>
    timed('getCompatibilityLinks', () =>
      cached(['compatibility-links'], ['menu', 'product'], async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'products',
          where: { _status: { equals: 'published' } },
          select: { compatibleWith: true },
          pagination: false,
          depth: 0,
        })
        return result.docs.flatMap((doc) => {
          const links: CompatibilityLinks = { id: doc.id, categories: [], products: [] }
          for (const rel of doc.compatibleWith ?? []) {
            const id = typeof rel.value === 'number' ? rel.value : rel.value?.id
            if (typeof id !== 'number') continue
            ;(rel.relationTo === 'categories' ? links.categories : links.products).push(id)
          }
          return links.categories.length || links.products.length ? [links] : []
        })
      }),
    ),
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
 * Продукти по номера — за секциите на панелите в менюто.
 *
 * Хедърът се чете с `depth: 2`: панел → секция → продукт. Снимката на
 * продукта е на трето ниво и идва само като номер. Вместо да се вдига
 * дълбочината на целия глобал (38 панела, всичко в тях), продуктите се
 * дотеглят с една заявка на дълбочина 1 — точно колкото за снимката.
 * Само публикуваните; чернова в менюто не бива да излиза.
 */
export const getProductsByIds = cache(
  async (ids: number[]): Promise<Record<number, Product>> =>
    timed(`getProductsByIds(${ids.length})`, () =>
      cached(['products-by-ids-cards', ids.join(',')], ['menu', 'product'], async () => {
        const byId: Record<number, Product> = {}
        if (!ids.length) return byId

        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'products',
          where: { and: [{ id: { in: ids } }, { _status: { equals: 'published' } }] },
          pagination: false,
          depth: 1,
          // Само картата: с всички секции 63 продукта бяха 2,7 MB и не се кешираха.
          select: cardSelect(),
        })
        for (const product of result.docs) byId[product.id] = product
        return byId
      }),
    ),
)

/* ─────────── търсене ─────────── */

/** Колко резултата най-много се вадят от базата за едно търсене. */
const SEARCH_LIMIT = 100

/**
 * Търсене на продукти по име, спецификация, адрес, SKU или баркод.
 *
 * Само публикуваните — чернова не бива да се намира, както не се вижда и
 * в менюто или в категорията.
 *
 * Резултатите се вадят в подредбата от админа (`_order`, после името) и
 * чак после се подреждат по точност (`rankSearchResults`). Затова се
 * взимат до сто наведнъж, а НЕ само шестте за падащия списък: точното
 * съвпадение по баркод може да е на трийсето място по `_order` и при
 * рязане преди подреждането изобщо не би стигнало до потребителя.
 *
 * Кешът е с тага `product` — вносът и всеки запис в админа го изчистват,
 * тоест нов продукт се намира веднага, без рестарт. Десетте секунди са
 * таван за случаите, когато нещо е променено извън Payload.
 */
export const searchProducts = cache(async (query: string): Promise<Product[]> => {
  const words = searchWords(query)
  if (!words.length) return []

  return timed(`searchProducts(${words.join(' ')})`, () =>
    unstable_cache(
      async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
          collection: 'products',
          where: searchWhere(words),
          sort: ['_order', 'title'],
          limit: SEARCH_LIMIT,
          // Стига за снимката на картата; адресът идва от виртуалните полета.
          depth: 1,
        })
        return rankSearchResults(result.docs, query)
      },
      ['search', words.join(' ')],
      { tags: ['product'], revalidate: 10 },
    )(),
  )
})

/**
 * Най-скоро добавените публикувани продукти.
 *
 * Ползва се от страницата с резултати, когато търсенето не е намерило
 * нищо — празна страница с едно изречение е задънена улица.
 */
export const getLatestProducts = cache(async (limit = 4): Promise<Product[]> =>
  cached(['latest-products', String(limit)], ['product'], async () => {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'products',
      where: { _status: { equals: 'published' } },
      sort: '-createdAt',
      limit,
      depth: 1,
    })
    return result.docs
  }),
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
