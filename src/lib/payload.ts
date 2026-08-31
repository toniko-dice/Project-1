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

type GlobalSlug = 'header' | 'footer' | 'site-settings' | 'design'

export const getGlobal = cache(async <T extends GlobalSlug>(slug: T) => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug, depth: 2 })
})
