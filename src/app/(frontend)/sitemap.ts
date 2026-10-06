import type { MetadataRoute } from 'next'

import { accessoriesForCategory, canHaveAccessoriesPage } from '@/lib/catalog'
import { getCatalog, getCategoryTree, getPayloadClient, getPublishedProducts } from '@/lib/payload'
import { mediaUrl } from '@/lib/media'
import { categoryNoindex } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site-url'
import { levelOf } from '@/lib/tree'
import { accessoriesPath, categoryPath, productPath } from '@/lib/urls'

/**
 * Картата на сайта.
 *
 * Влизат: публикуваните продукти (със снимките си), категориите без
 * отметка „Да не се индексира" и публикуваните страници. НЕ влизат:
 *
 * - подсериите — те нямат собствена страница, а са раздели на серията
 *   (`?sub=`), и canonical им сочи серията;
 * - категориите с `noindex` — смисълът на отметката е точно този;
 * - празните категории — без нито един публикуван продукт в разклонението
 *   (`isEmptyCategory`); връщат се сами с първия продукт;
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
      // Дълбочина 1 — снимките в секциите идват като записи от Медия (за `<image:image>`).
      depth: 1,
      select: { slug: true, updatedAt: true, metaImage: true, layout: true },
    }),
    getCatalog(),
  ])

  const начална = pages.docs.find((p) => p.slug === 'home')
  const записи: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      lastModified: начална?.updatedAt ? new Date(начална.updatedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]

  for (const page of pages.docs) {
    if (page.slug === 'home') continue
    const снимки = pageImages(page.metaImage, page.layout)
    записи.push({
      url: absoluteUrl(`/${page.slug}`),
      lastModified: page.updatedAt ? new Date(page.updatedAt) : undefined,
      changeFrequency: 'monthly',
      ...(снимки.length ? { images: снимки } : {}),
    })
  }

  for (const category of tree) {
    // Отметката „Да не се индексира" ИЛИ празна категория (т. 3 — връща се сама).
    if (categoryNoindex(catalog, category)) continue
    if (levelOf(tree, category) > 1) continue

    записи.push({
      url: absoluteUrl(categoryPath(category.slug)),
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
      url: absoluteUrl(accessoriesPath(category.slug)),
      lastModified: последна ? new Date(последна) : undefined,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  for (const product of products) {
    /*
      Снимките на продукта — `<image:image>` (т. 2): главната първа, после
      галерията, до 10. Адресът е webp размерът `large`, който галерията
      реално показва (`ProductGallery`), не JPEG оригиналът.
    */
    const снимки = [product.image, ...(product.gallery ?? []).map((g) => g.image)]
      .map((m) => mediaUrl(m, 'large'))
      .filter((u): u is string => Boolean(u))
      .slice(0, 10)
      .map(absoluteUrl)
    записи.push({
      url: absoluteUrl(productPath(product)),
      lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 0.9,
      ...(снимки.length ? { images: снимки } : {}),
    })
  }

  return записи
}

/**
 * Снимките на страница за `<image:image>`: мета снимката първа, после
 * снимките за компютър от видимите секции (`image` — не `imageMobile`,
 * същата сцена в друга рамка), без повторения, до 10. Webp размерът
 * `large`, както при продуктите.
 *
 * Обхождането е общо, а не по вид блок: нов блок със снимка влиза сам.
 * Свързаните продукти не влизат — при дълбочина 1 тяхната снимка е само
 * номер, а и те имат своя адрес в картата.
 */
const pageImages = (metaImage: unknown, layout: unknown): string[] => {
  const адреси: string[] = []
  const добави = (m: unknown) => {
    if (!m || typeof m !== 'object' || !('filename' in m)) return
    const url = mediaUrl(m as never, 'large') ?? mediaUrl(m as never)
    if (url && !адреси.includes(absoluteUrl(url))) адреси.push(absoluteUrl(url))
  }
  добави(metaImage)
  const обходи = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(обходи)
    if (!node || typeof node !== 'object') return
    if ((node as { hidden?: boolean }).hidden === true) return
    for (const [k, v] of Object.entries(node)) {
      if (k === 'image') добави(v)
      else if (!['imageMobile', 'products', 'product', 'fromCategory'].includes(k)) обходи(v)
    }
  }
  обходи(layout)
  return адреси.slice(0, 10)
}
