import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { RenderProductSections } from '@/components/blocks/product'
import { BuyButton } from '@/components/BuyButton'
import { ProductCard } from '@/components/ProductCard'
import { ProductAnchorNav, type Anchor } from '@/components/ProductAnchorNav'
import { ProductGallery, type GalleryImage } from '@/components/ProductGallery'
import { uniqueAnchor } from '@/lib/anchors'
import { availabilityOf } from '@/lib/availability'
import { BADGE_LABELS, discountPercent, formatBgn, formatEur } from '@/lib/format'
import { mediaAlt, mediaUrl } from '@/lib/media'
import {
  accessoriesForCategory,
  accessoriesForProduct,
  canHaveAccessoriesPage,
} from '@/lib/catalog'
import {
  getCatalog,
  getCategoryTree,
  getGlobal,
  getProduct,
  getProductCards,
  getPublishedProducts,
} from '@/lib/payload'
import type { Category, Product } from '@/payload-types'
import { Breadcrumbs, breadcrumbSchema, type Crumb } from '@/components/Breadcrumbs'
import { categoryCrumbs } from '@/lib/tree'
import { accessoriesPath, productPath } from '@/lib/urls'

/** Колко карти най-много в „Съвместими аксесоари"; останалите са на страницата на серията. */
const МАКС_АКСЕСОАРИ = 8

/** Адресът носи серията и slug-а: /kategorii/delta-seriya/delta-3. */
type Args = { params: Promise<{ slug: string; product: string }> }

export const generateStaticParams = async () => {
  const products = await getPublishedProducts()
  return products.map((p) => {
    // Същият адрес, който сглобява и всеки линк — без второ правило.
    const [, , series, slug] = productPath(p).split('/')
    return { slug: series, product: slug }
  })
}

export const generateMetadata = async ({ params }: Args): Promise<Metadata> => {
  const { product: slug } = await params
  const product = await getProduct(slug)
  if (!product) return {}

  const image = mediaUrl(product.image, 'banner') ?? mediaUrl(product.image)

  return {
    // Наставката „— EcoFlow България" идва от `title.template` в layout.
    title: product.metaTitle ?? product.title,
    description: product.metaDescription ?? product.tagline ?? product.description ?? undefined,
    // Продуктът има ЕДИН адрес — този под серията си.
    alternates: { canonical: new URL(productPath(product), SITE_URL).toString() },
    openGraph: image ? { images: [{ url: image }] } : undefined,
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/** Търсачките не разчитат относителни адреси на снимки. */
const absoluteUrl = (path: string): string => new URL(path, SITE_URL).toString()

/**
 * GTIN се приема само ако е точно 13 цифри.
 * Невалиден идентификатор дава грешка при валидация; липсващият не дава.
 */
const validGtin13 = (value?: string | null): string | null => {
  const digits = value?.trim() ?? ''
  return /^\d{13}$/.test(digits) ? digits : null
}

export default async function ProductPage({ params }: Args) {
  const { slug: series, product: slug } = await params
  const [product, settings, tree, catalog] = await Promise.all([
    getProduct(slug),
    getGlobal('site-settings'),
    getCategoryTree(),
    getCatalog(),
  ])

  if (!product) notFound()

  /*
    Адресът съдържа серията. Ако някой отвори продукта под чужда серия —
    стар линк след преместване — правилният адрес е един и той е този под
    серията му. Обикновено middleware-ът вече е върнал 301 (пита
    `/api/kanon`); това е резервата за случая, в който не е — пак
    постоянно, не временно.
  */
  const правилен = productPath(product)
  if (правилен !== `/kategorii/${series}/${slug}`) permanentRedirect(правилен)

  const категория =
    product.category && typeof product.category !== 'number' ? product.category : null

  /*
    Съвместимите аксесоари — НАГОРЕ от модела: самият продукт, всяка от
    категориите му и всичко над тях (кабел за „DELTA серия" важи за всеки
    DELTA). Правилото е в `src/lib/catalog.ts`, общо с менюто и с
    филтъра „Модел".
  */
  const съвместими = accessoriesForProduct(catalog, product.id)
  const accessories = await getProductCards(съвместими.map((e) => e.id))

  /* Страницата „Аксесоари за <серията>", ако я има. */
  const серия = tree.find((c) => c.slug === series)
  const всичкиАксесоари =
    серия &&
    canHaveAccessoriesPage(catalog, серия.id) &&
    accessoriesForCategory(catalog, серия.id).length
      ? { url: accessoriesPath(серия.slug), label: `Всички аксесоари за ${серия.title}` }
      : null

  /*
    „Съвместим с:" на страницата на аксесоара — линкове към каноничните
    адреси. Черновите не се показват: линкът би водил към 404.
  */
  const съвместимСЪс = (product.compatibleWith ?? []).flatMap((rel) => {
    const value = rel.value
    if (!value || typeof value === 'number') return []
    if (rel.relationTo === 'categories') {
      const c = tree.find((t) => t.id === (value as Category).id)
      const url = c ? categoryCrumbs(tree, c).at(-1)?.url : null
      return c && url ? [{ label: c.title, url }] : []
    }
    const p = value as Product
    return p._status === 'published' ? [{ label: p.title, url: productPath(p) }] : []
  })

  const crumbs: Crumb[] = категория
    ? [...categoryCrumbs(tree, категория), { label: product.title, url: productPath(product) }]
    : [
        { label: 'Начало', url: '/' },
        { label: product.title, url: productPath(product) },
      ]

  const showBgn = Boolean(settings.showBgnPrices)
  const sections = product.sections ?? []

  /*
    Котвите се раждат от секциите с попълнен „Надпис в менюто".
    Няма отделен списък за поддържане, значи няма и как да се разсинхронизира.
  */
  const used = new Set<string>()
  const anchorIds: (string | null)[] = []
  const anchors: Anchor[] = []

  for (const block of sections) {
    const label = (block as { anchorLabel?: string | null }).anchorLabel?.trim()
    if (!label) {
      anchorIds.push(null)
      continue
    }
    const id = uniqueAnchor(label, used)
    anchorIds.push(id)
    anchors.push({ id, label })
  }

  const images: GalleryImage[] = [
    { value: product.image },
    ...(product.gallery ?? []).map((g) => ({ value: g.image })),
  ]
    /*
      Три размера на една и съща снимка.

      `fullUrl` е оригиналът и се ползва само при уголемяване на цял екран.
      На 27" екран снимката заема над 2000 px — по-малкият `large` там вече
      се вижда мек. За галерията на страницата `large` стига.
    */
    .map(({ value }) => ({
      url: mediaUrl(value, 'large') ?? '',
      fullUrl: mediaUrl(value) ?? '',
      thumbUrl: mediaUrl(value, 'thumbnail') ?? '',
      alt: mediaAlt(value),
    }))
    .filter((img) => img.url)

  const discount = discountPercent(product.price, product.compareAtPrice)
  const availability = availabilityOf(product.availability)
  const highlights = product.highlights ?? []

  /*
    Празните полета изобщо не влизат в маркировката — по-добре липсващ
    ключ, отколкото ключ с празен низ. Второто дава грешка при валидация.

    Вътрешният баркод (`barcodeInternal`) е складов номер и остава само
    в админа; Schema.org приема един идентификатор от този тип.
  */
  const gtin13 = validGtin13(product.ean)
  const sku = product.sku?.trim() || null
  const brand = product.brand?.trim() || null

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.tagline ?? product.description ?? undefined,
    // Пълни адреси на всички снимки, не само на основната.
    image: images.map((i) => absoluteUrl(i.url)),
    ...(sku ? { sku } : {}),
    ...(gtin13 ? { gtin13 } : {}),
    ...(brand ? { brand: { '@type': 'Brand', name: brand } } : {}),
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'EUR',
      availability: availability.schema,
      // Покупката се извършва във външния магазин — това е верният адрес.
      url: product.externalUrl,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        // Съдържанието е наше, сглобено от полета — не идва от посетител.
        dangerouslySetInnerHTML={{ __html: JSON.stringify([schema, breadcrumbSchema(crumbs)]) }}
      />

      <div className="container-site pt-6">
        <Breadcrumbs items={crumbs} />
      </div>

      {/*
        ── Галерия и купуване ──

        Двете колони започват на една и съща височина, както в оригинала.
        Преди информационната колона имаше `lg:pt-8` и заглавието тръгваше
        по-ниско от горния ръб на галерията.

        `items-start` пази колоната да не се разтяга до височината на
        галерията: по-късият текст стои горе, а не увисва центриран.
      */}
      <div className="container-site grid items-start gap-8 pb-8 pt-4 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={images} />

        <div className="flex flex-col gap-4">
          {product.badge && product.badge !== 'none' ? (
            <span className="w-fit rounded bg-ink px-2 py-1 text-[11px] font-semibold tracking-wide text-white">
              {BADGE_LABELS[product.badge]}
            </span>
          ) : null}

          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{product.title}</h1>

          {product.tagline ? <p className="text-ink-muted">{product.tagline}</p> : null}

          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <span className="tabular text-3xl font-bold">{formatEur(product.price)}</span>
            {product.compareAtPrice ? (
              <s className="tabular text-lg text-ink-muted">{formatEur(product.compareAtPrice)}</s>
            ) : null}
            {discount ? (
              <span className="rounded bg-accent px-2 py-1 text-xs font-semibold text-white">
                −{discount}%
              </span>
            ) : null}
          </div>

          {showBgn ? (
            <p className="tabular -mt-2 text-sm text-ink-muted">{formatBgn(product.price)}</p>
          ) : null}

          <p className="text-sm text-ink-muted">
            {availability.line}
          </p>

          {съвместимСЪс.length ? (
            <p className="text-sm leading-relaxed">
              <span className="text-ink-muted">Съвместим с: </span>
              {съвместимСЪс.map((x, i) => (
                <span key={x.url}>
                  {i > 0 ? ', ' : null}
                  <Link
                    href={x.url}
                    className="cursor-pointer underline underline-offset-2 transition-colors duration-150 hover:text-brand"
                  >
                    {x.label}
                  </Link>
                </span>
              ))}
            </p>
          ) : null}

          {/* Продукт без акценти не оставя празно място — блокът изчезва изцяло. */}
          {highlights.length ? (
            <ul className="rounded-lg bg-tile p-4 text-sm leading-relaxed">
              {highlights.map((h, i) => (
                <li key={i} className={i > 0 ? 'mt-2' : ''}>
                  <strong className="font-semibold">{h.title}</strong>
                  {/* Без пояснение — само заглавието, без празен ред. */}
                  {h.text?.trim() ? <span className="text-ink-muted"> {h.text}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}

          {/* Същият бутон като на картите — надписът следва наличността. */}
          <BuyButton product={product} size="lg" />

          {product.description ? (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-muted">
              {product.description}
            </p>
          ) : null}
        </div>
      </div>

      {/* ── Закачено меню; скрито, ако никоя секция няма надпис ── */}
      <ProductAnchorNav anchors={anchors} />

      {/* ── Секциите ── */}
      {/*
        Автоматичният блок „Свързани продукти" показва същите аксесоари —
        при показан „Съвместими аксесоари" получава празен списък и не се
        рендерира. Ръчните блокове не се засягат.
      */}
      <RenderProductSections
        sections={sections}
        anchorIds={anchorIds}
        product={product}
        showBgn={showBgn}
        accessories={accessories.length ? [] : accessories}
      />

      {/* ── Съвместими аксесоари ── */}
      {accessories.length ? (
        <section aria-labelledby="sav-aksesoari" className="container-site py-12 lg:py-16">
          <h2
            id="sav-aksesoari"
            className="mb-8 text-center text-2xl font-medium tracking-tight sm:text-3xl"
          >
            Съвместими аксесоари
          </h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {accessories.slice(0, МАКС_АКСЕСОАРИ).map((p) => (
              <li key={p.id}>
                <ProductCard product={p} showBgn={showBgn} className="h-full" />
              </li>
            ))}
          </ul>
          {всичкиАксесоари ? (
            <div className="mt-8 text-center">
              <Link
                href={всичкиАксесоари.url}
                className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-md border border-line-strong px-6 text-sm font-medium transition-colors duration-200 hover:bg-tile"
              >
                {всичкиАксесоари.label}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}
    </>
  )
}
