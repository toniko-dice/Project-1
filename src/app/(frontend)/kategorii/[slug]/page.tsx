import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import type { Category } from '@/payload-types'
import { Breadcrumbs, breadcrumbSchema } from '@/components/Breadcrumbs'
import { CategoryProducts, type CategoryTab } from '@/components/CategoryProducts'
import { ImagePlaceholder } from '@/components/ImagePlaceholder'
import { RenderBlocks } from '@/components/RenderBlocks'
import { SectionImage } from '@/components/SectionImage'
import { bannerImage, mediaAlt, mediaUrl } from '@/lib/media'
import {
  categoryBranchIds,
  getCategory,
  getCategoryProducts,
  getCategorySlugs,
  getCategoryTree,
  getCompatibleAccessories,
  getGlobal,
} from '@/lib/payload'
import { ancestry, categoryCrumbs, childrenOf, levelOf } from '@/lib/tree'
import { categoryPath, productPath } from '@/lib/urls'

type Args = { params: Promise<{ slug: string }> }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const generateStaticParams = async () => {
  const slugs = await getCategorySlugs()
  return slugs.map((slug) => ({ slug }))
}

export const generateMetadata = async ({ params }: Args): Promise<Metadata> => {
  const { slug } = await params
  const category = await getCategory(slug)
  if (!category) return {}

  const image = mediaUrl(category.banner ?? category.heroImage, 'banner')

  return {
    // Наставката „— EcoFlow България" идва от `title.template` в layout.
    title: category.metaTitle ?? category.title,
    description: category.metaDescription ?? category.description ?? undefined,
    /*
      Филтърът по подсерия НЕ е отделна страница за Google — canonical на
      всички раздели сочи чистия адрес. Иначе един и същи списък се
      индексира по веднъж за всеки раздел.
    */
    alternates: { canonical: new URL(categoryPath(slug), SITE_URL).toString() },
    robots: category.noindex ? { index: false, follow: true } : undefined,
    openGraph: image ? { images: [{ url: image }] } : undefined,
  }
}

/**
 * Страница на категория.
 *
 * Показва продуктите на категорията И на всичко под нея: серията събира
 * подсериите си, главната — всички серии. Подсериите са раздели, не
 * отделни страници (виж `src/lib/urls.ts`).
 */
export default async function CategoryPage({ params }: Args) {
  const { slug } = await params

  const [category, tree, settings] = await Promise.all([
    getCategory(slug),
    getCategoryTree(),
    getGlobal('site-settings'),
  ])

  if (!category) notFound()

  /*
    Подсерията няма собствена страница. Ако някой отвори адреса ѝ —
    стар линк, ръчно въведен — отива на серията с избран раздел.
  */
  if (levelOf(tree, category) > 1) {
    const parent = ancestry(tree, category).at(-2)
    // 308, не 307: адресът на подсерията няма да се върне.
    if (parent) permanentRedirect(`${categoryPath(parent.slug)}?sub=${category.slug}`)
  }

  const children = childrenOf(tree, category.id)
  const ids = categoryBranchIds(tree, category.id)

  /*
    Аксесоарите не са в тази категория — те стоят в „Кабели", „Адаптери"
    и сочат насам с „Съвместим с". Затова се търсят отделно, по цялото
    разклонение: аксесоар за DELTA 3 излиза и на страницата на DELTA
    серия, и на портативните електроцентрали.
  */
  const [products, accessories] = await Promise.all([
    getCategoryProducts(slug, ids),
    getCompatibleAccessories(ids),
  ])

  const crumbs = categoryCrumbs(tree, category)
  const heroUrl = mediaUrl(category.heroImage, 'wide')
  const banner = bannerImage(category.banner)

  /* Разделите са прякото ниво отдолу; всеки носи своето разклонение. */
  const tabs: CategoryTab[] = children.map((child: Category) => ({
    slug: child.slug,
    title: child.title,
    ids: categoryBranchIds(tree, child.id),
  }))

  const layout = category.layout ?? []

  return (
    <div className="bg-canvas">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbSchema(crumbs),
            {
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              name: category.title,
              numberOfItems: products.length,
              itemListElement: products.map((p, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: new URL(productPath(p), SITE_URL).toString(),
                name: p.title,
              })),
            },
          ]),
        }}
      />

      <div className="container-site py-6 lg:py-8">
        <Breadcrumbs items={crumbs} />

        {/*
          ── Заглавна част ──

          Без заглавно изображение НЯМА сив правоъгълник със „Няма снимка":
          на категорийната страница той е само празно място, защото
          заглавието и описанието и без това стоят под него. Заместителят
          остава там, където липсата подвежда — продуктова карта, икона.
        */}
        {heroUrl ? (
          <div className="relative mt-4 overflow-hidden rounded-2xl">
            <div className="relative aspect-[16/9] w-full sm:aspect-[3/1]">
              <Image
                src={heroUrl}
                alt={mediaAlt(category.heroImage)}
                fill
                sizes="100vw"
                priority
                className="object-cover"
              />

              <div className="absolute inset-0 flex items-center">
                <div className="w-full px-6 sm:px-12">
                  <h1 className="text-2xl font-medium leading-tight tracking-tight text-white drop-shadow sm:text-3xl lg:text-4xl">
                    {category.title}
                  </h1>
                  {category.heroTagline ? (
                    <p className="mt-2 max-w-lg text-[15px] text-white drop-shadow sm:text-base">
                      {category.heroTagline}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-center">
            <h1 className="text-2xl font-medium leading-tight tracking-tight sm:text-3xl lg:text-4xl">
              {category.title}
            </h1>
            {category.heroTagline ? (
              <p className="mt-2 text-[15px] text-ink-muted sm:text-base">{category.heroTagline}</p>
            ) : null}
          </div>
        )}

        {category.description ? (
          <p className="mx-auto mt-6 max-w-[56rem] text-center leading-relaxed text-ink-muted">
            {category.description}
          </p>
        ) : null}

        {banner ? (
          <SectionImage
            image={banner}
            sizes="(max-width: 1408px) 100vw, 1408px"
            className="mt-8 h-auto w-full rounded-2xl"
          />
        ) : null}

        <div className="mt-10">
          <CategoryProducts
            products={products}
            accessories={accessories}
            tabs={tabs}
            showBgn={Boolean(settings.showBgnPrices)}
            basePath={categoryPath(slug)}
            initialTab="all"
          />
        </div>

        {/*
          Подкатегориите като карти — само когато категорията няма нито
          един продукт. Иначе разделите вече ги показват и картите просто
          повтарят същото.
        */}
        {!products.length && children.length ? (
          <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {children.map((child: Category) => {
              const icon = mediaUrl(child.icon, 'card')
              return (
                <li key={child.id}>
                  <Link
                    href={categoryPath(child.slug)}
                    className="group flex h-full cursor-pointer flex-col gap-3 rounded-xl bg-surface p-4 transition-shadow duration-200 hover:shadow-md"
                  >
                    <span className="relative block aspect-square w-full overflow-hidden rounded-lg">
                      {icon ? (
                        <Image
                          src={icon}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 45vw, 22vw"
                          loading="lazy"
                          className="object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <ImagePlaceholder className="absolute inset-0" />
                      )}
                    </span>
                    <span className="text-[15px] font-medium leading-snug">{child.title}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>

      {/* Промо секции по избор — същите блокове като при страниците. */}
      {layout.length ? (
        <RenderBlocks
          layout={layout as never}
          showBgn={Boolean(settings.showBgnPrices)}
        />
      ) : null}
    </div>
  )
}
