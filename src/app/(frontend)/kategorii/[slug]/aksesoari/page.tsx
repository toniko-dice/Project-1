import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import type { Category } from '@/payload-types'
import { Breadcrumbs, breadcrumbSchema } from '@/components/Breadcrumbs'
import { FilteredProducts } from '@/components/FilteredProducts'
import {
  ACCESSORIES_ROOT_SLUG,
  accessoriesForCategory,
  canHaveAccessoriesPage,
  type Catalog,
  fillTemplate,
} from '@/lib/catalog'
import { buildFilters } from '@/lib/filters'
import { getAttributes, getCatalog, getGlobal, getProductCards } from '@/lib/payload'
import { ancestry, categoryCrumbs } from '@/lib/tree'
import { accessoriesPath, productPath } from '@/lib/urls'
import { pageTitle } from '@/lib/title'

/**
 * „Аксесоари за серия …" — `/kategorii/<категория>/aksesoari`.
 *
 * Пълни се сама от „Съвместим с" на аксесоарите, по правилото в
 * `src/lib/catalog.ts` (същото като в менюто). Нова категория, нов
 * аксесоар — страницата се появява без ръчна работа; без нито един
 * съвместим аксесоар е 404.
 *
 * Фиксираният сегмент `aksesoari` има предимство пред `[product]`, затова
 * `aksesoari` е запазен адрес за продукт (админ и внос).
 */

type Args = { params: Promise<{ slug: string }> }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const ПОДРАЗБИРАНЕ = {
  h1: 'Аксесоари за {име}',
  metaTitle: 'Аксесоари за {име}',
  metaDescription:
    'Кабели, адаптери, чанти и други аксесоари, съвместими с {име} — {брой} продукта. Купете от официалния дистрибутор на EcoFlow в България.',
  intro: 'Всички аксесоари, съвместими с {име}: кабели, адаптери, допълнителни батерии, чанти и други.',
}

/** Категорията, страницата ѝ и аксесоарите — или `null` за 404. */
const зареди = async (slug: string) => {
  const catalog = await getCatalog()
  const category = catalog.tree.find((c) => c.slug === slug)
  if (!category) return null
  return { catalog, category, entries: accessoriesForCategory(catalog, category.id) }
}

/** Текст от полето на категорията или подразбирането, с подстановките. */
const текст = (
  category: Category,
  поле: keyof typeof ПОДРАЗБИРАНЕ | 'outro',
  брой: number,
): string | null => {
  const свой = category.accessoriesPage?.[поле]?.trim()
  const шаблон = свой || (поле === 'outro' ? null : ПОДРАЗБИРАНЕ[поле])
  return шаблон ? fillTemplate(шаблон, category.title, брой) : null
}

/** Предварително — всички категории със страница и поне един аксесоар. */
export const generateStaticParams = async () => {
  const catalog = await getCatalog()
  return catalog.tree
    .filter(
      (c) =>
        canHaveAccessoriesPage(catalog, c.id) && accessoriesForCategory(catalog, c.id).length > 0,
    )
    .map((c) => ({ slug: c.slug }))
}

export const generateMetadata = async ({ params }: Args): Promise<Metadata> => {
  const { slug } = await params
  const data = await зареди(slug)
  if (!data || !data.entries.length || !canHaveAccessoriesPage(data.catalog, data.category.id)) {
    return {}
  }
  const { category, entries } = data
  return {
    title: pageTitle(текст(category, 'metaTitle', entries.length)),
    description: текст(category, 'metaDescription', entries.length) ?? undefined,
    // Филтрите (`?kategoriya=…`) не са отделни страници — canonical е чистият адрес.
    alternates: { canonical: new URL(accessoriesPath(slug), SITE_URL).toString() },
    robots: category.noindex ? { index: false, follow: true } : undefined,
  }
}

/** Подсерия → серията ѝ: подсерията няма собствени страници. */
const серияНа = (catalog: Catalog, category: Category) =>
  ancestry(catalog.tree, category).at(1) ?? category

export default async function AccessoriesPage({ params }: Args) {
  const { slug } = await params
  const data = await зареди(slug)
  if (!data) notFound()
  const { catalog, category, entries } = data

  // Подсерия (трето ниво) — пренасочване към „Аксесоари за" серията ѝ.
  if (ancestry(catalog.tree, category).length > 2) {
    permanentRedirect(accessoriesPath(серияНа(catalog, category).slug))
  }
  if (!canHaveAccessoriesPage(catalog, category.id) || !entries.length) notFound()

  const [products, attributes, settings] = await Promise.all([
    getProductCards(entries.map((e) => e.id)),
    getAttributes(),
    getGlobal('site-settings'),
  ])

  const root = catalog.tree.find((c) => c.slug === ACCESSORIES_ROOT_SLUG) ?? null
  const filters = buildFilters({
    catalog,
    entries: entries.filter((e) => products.some((p) => p.id === e.id)),
    attributes,
    scope: { kind: 'series-accessories', categoryId: category.id },
    accessoriesRootId: root?.id ?? null,
  })

  const брой = products.length
  const h1 = текст(category, 'h1', брой)
  const intro = текст(category, 'intro', брой)
  const outro = текст(category, 'outro', брой)
  const crumbs = [
    ...categoryCrumbs(catalog.tree, category),
    { label: 'Аксесоари', url: accessoriesPath(slug) },
  ]

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
              name: h1,
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

        <div className="mt-4 text-center">
          <h1 className="text-2xl font-medium leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            {h1}
          </h1>
        </div>

        {intro ? (
          <p className="mx-auto mt-6 max-w-[56rem] whitespace-pre-line text-center leading-relaxed text-ink-muted">
            {intro}
          </p>
        ) : null}

        <div className="mt-10">
          <FilteredProducts
            products={products}
            filters={filters}
            showBgn={Boolean(settings.showBgnPrices)}
          />
        </div>

        {outro ? (
          <p className="mx-auto mt-12 max-w-[56rem] whitespace-pre-line leading-relaxed text-ink-muted">
            {outro}
          </p>
        ) : null}
      </div>
    </div>
  )
}
