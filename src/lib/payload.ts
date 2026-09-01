import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

export const getPayloadClient = cache(async () => getPayload({ config }))

/**
 * Зарежда страница по адрес заедно с всички вложени връзки в секциите.
 *
 * Връщат се САМО публикуваните страници. Черновите остават невидими за
 * посетителите — иначе всяка недовършена редакция излиза наживо веднага
 * след записване.
 */
export const getPage = cache(async (slug: string) => {
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
})

/**
 * Зарежда продукт по адрес.
 *
 * Връщат се САМО публикуваните. Колекцията е с чернови, защото продуктите
 * се внасят на едро от скрипт — недовършен внос не бива да излиза наживо.
 *
 * Последствие, което трябва да се помни: нов продукт не се вижда, докато
 * не бъде публикуван. Ако някой докладва „продуктът изчезна", първо
 * провери статуса му.
 */
export const getProduct = cache(async (slug: string) => {
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
})

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

type GlobalSlug = 'header' | 'footer' | 'site-settings' | 'design'

export const getGlobal = cache(async <T extends GlobalSlug>(slug: T) => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug, depth: 2 })
})
