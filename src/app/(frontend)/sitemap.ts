import type { MetadataRoute } from 'next'

import { getCategoryTree, getPayloadClient, getPublishedProducts } from '@/lib/payload'
import { levelOf } from '@/lib/tree'
import { categoryPath, productPath } from '@/lib/urls'

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
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()

  const [tree, products, pages] = await Promise.all([
    getCategoryTree(),
    getPublishedProducts(),
    payload.find({
      collection: 'pages',
      where: { _status: { equals: 'published' } },
      pagination: false,
      depth: 0,
      select: { slug: true, updatedAt: true },
    }),
  ])

  const записи: MetadataRoute.Sitemap = [
    { url: абсолютен('/'), changeFrequency: 'weekly', priority: 1 },
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
