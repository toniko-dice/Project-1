import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { RenderProductSections } from '@/components/blocks/product'
import { ProductAnchorNav, type Anchor } from '@/components/ProductAnchorNav'
import { ProductGallery, type GalleryImage } from '@/components/ProductGallery'
import { uniqueAnchor } from '@/lib/anchors'
import {
  AVAILABILITY_LABELS,
  BADGE_LABELS,
  discountPercent,
  formatBgn,
  formatEur,
} from '@/lib/format'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { getGlobal, getProduct, getPublishedProductSlugs } from '@/lib/payload'

type Args = { params: Promise<{ slug: string }> }

export const generateStaticParams = async () => {
  const slugs = await getPublishedProductSlugs()
  return slugs.map((slug) => ({ slug }))
}

export const generateMetadata = async ({ params }: Args): Promise<Metadata> => {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return {}

  const image = mediaUrl(product.image, 'banner') ?? mediaUrl(product.image)

  return {
    title: product.title,
    description: product.tagline ?? product.description ?? undefined,
    openGraph: image ? { images: [{ url: image }] } : undefined,
  }
}

/** Съответствие между полето „Наличност" и речника на Schema.org. */
const SCHEMA_AVAILABILITY: Record<string, string> = {
  'in-stock': 'https://schema.org/InStock',
  preorder: 'https://schema.org/PreOrder',
  'out-of-stock': 'https://schema.org/OutOfStock',
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
  const { slug } = await params
  const [product, settings] = await Promise.all([getProduct(slug), getGlobal('site-settings')])

  if (!product) notFound()

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
    .map(({ value }) => ({ url: mediaUrl(value, 'large') ?? '', alt: mediaAlt(value) }))
    .filter((img) => img.url)

  const discount = discountPercent(product.price, product.compareAtPrice)
  const soldOut = product.availability === 'out-of-stock'
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
      availability: SCHEMA_AVAILABILITY[product.availability ?? 'in-stock'],
      // Покупката се извършва във външния магазин — това е верният адрес.
      url: product.externalUrl,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        // Съдържанието е наше, сглобено от полета — не идва от посетител.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* ── Галерия и купуване ── */}
      <div className="container-site grid gap-8 py-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={images} />

        <div className="flex flex-col gap-4 lg:pt-8">
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
            {AVAILABILITY_LABELS[product.availability ?? 'in-stock']}
          </p>

          {/* Продукт без акценти не оставя празно място — блокът изчезва изцяло. */}
          {highlights.length ? (
            <ul className="rounded-lg bg-tile p-4 text-sm leading-relaxed">
              {highlights.map((h, i) => (
                <li key={i} className={i > 0 ? 'mt-2' : ''}>
                  <strong className="font-semibold">{h.title}</strong>{' '}
                  <span className="text-ink-muted">{h.text}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {soldOut ? (
            <span className="inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-md bg-tile px-6 text-sm font-semibold text-ink-muted sm:w-auto">
              Изчерпан
            </span>
          ) : (
            <Link
              href={product.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-md bg-brand px-8 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-dark sm:w-auto"
            >
              {product.ctaLabel ?? 'Купи сега'}
            </Link>
          )}

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
      <RenderProductSections
        sections={sections}
        anchorIds={anchorIds}
        product={product}
        showBgn={showBgn}
      />
    </>
  )
}
