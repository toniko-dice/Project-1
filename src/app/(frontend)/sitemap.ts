import type { MetadataRoute } from 'next'

import { accessoriesForCategory, canHaveAccessoriesPage } from '@/lib/catalog'
import { getCatalog, getCategoryTree, getPayloadClient, getPublishedProducts } from '@/lib/payload'
import { levelOf } from '@/lib/tree'
import { accessoriesPath, categoryPath, productPath } from '@/lib/urls'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const абсолютен = (path: string) => new URL(path, SITE_URL).toString()

/**
 * Картата на сайта.
 *
 * Влизат: публикуваните продукти, категориите без отметка „Да не се
 * индексира" и публикуваните страници. НЕ влизат:
 *
 * - подсериите — те нямат собствена страница, а са раздели на серията
 *   (`?sub=`), и canonical им сочи серията;
 * - категориите с `noindex` — смисълът на отметката е точно този;
 * - черновите — те не се виждат и на сайта.
 *
 * Страниците „Аксесоари за …" влизат, когато имат поне един аксесоар;
 * `lastmod` им е най-новата промяна сред тези аксесоари. Адресите с
 * филтри не влизат никога — те са `noindex`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()

  const [tree, products, pages, catalog] = await Promise.all([
    getCategoryTree(),
    getPublishedProducts(),
    payload.find({
      collection: 'pages',
      where: { _status: { equals: 'published' } },
      pagination: false,
      depth: 0,
      select: { slug: true, updatedAt: true },
    }),
    getCatalog(),
  ])

  const начална = pages.docs.find((p) => p.slug === 'home')
  const записи: MetadataRoute.Sitemap = [
    {
      url: абсолютен('/'),
      lastModified: начална?.updatedAt ? new Date(начална.updatedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]

  for (const page of pages.docs) {
    if (page.slug === 'home') continue
    записи.push({
      url: абсолютен(`/${page.slug}`),
      lastModified: page.updatedAt ? new Date(page.updatedAt) : undefined,
      changeFrequency: 'monthly',
    })
  }

  for (const category of tree) {
    if (category.noindex) continue
    if (levelOf(tree, category) > 1) continue

    записи.push({
      url: абсолютен(categoryPath(category.slug)),
      lastModified: category.updatedAt ? new Date(category.updatedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  for (const category of tree) {
    if (category.noindex || !canHaveAccessoriesPage(catalog, category.id)) continue
    const аксесоари = accessoriesForCategory(catalog, category.id)
    if (!аксесоари.length) continue

    const последна = аксесоари.reduce<string | null>(
      (max, e) => (e.updatedAt && (!max || e.updatedAt > max) ? e.updatedAt : max),
      null,
    )
    записи.push({
      url: абсолютен(accessoriesPath(category.slug)),
      lastModified: последна ? new Date(последна) : undefined,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  for (const product of products) {
    записи.push({
      url: абсолютен(productPath(product)),
      lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 0.9,
    })
  }

  return записи
}
