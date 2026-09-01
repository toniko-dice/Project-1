import Image from 'next/image'
import Link from 'next/link'

import type { Product } from '@/payload-types'
import { discountPercent, formatEur } from '@/lib/format'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { ProductCard } from '../ProductCard'
import { ProductTabs, type ShowcaseTab } from './ProductTabs'

type Sections = NonNullable<Product['sections']>
type Section = Sections[number]
type BlockOf<T extends string> = Extract<Section, { blockType: T }>

const resolved = <T,>(items: (number | T)[] | null | undefined): T[] =>
  (items ?? []).filter((x): x is T => typeof x !== 'number')

/** Обвивка около всяка секция — носи котвата и отстъпа под залепеното меню. */
const Section = ({
  id,
  className = '',
  children,
}: {
  id?: string | null
  className?: string
  children: React.ReactNode
}) => (
  <section
    {...(id ? { id } : {})}
    // Заглавието не бива да се скрива под залепената лента при прескачане.
    className={`scroll-mt-28 ${className}`}
  >
    {children}
  </section>
)

const SectionHeading = ({ children }: { children: React.ReactNode }) =>
  children ? (
    <h2 className="mb-6 text-2xl font-semibold sm:text-3xl">{children}</h2>
  ) : null

/* ─────────── Лента с ключови показатели ─────────── */

const KeySpecStripBlock = ({ block, id }: { block: BlockOf<'keySpecStrip'>; id?: string | null }) => {
  const items = block.items ?? []
  if (!items.length) return null

  return (
    <Section id={id} className="container-site py-10">
      <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <li key={i} className="text-center">
            <p className="tabular text-2xl font-bold sm:text-3xl">{item.value}</p>
            <p className="mt-1 text-xs text-ink-muted sm:text-sm">{item.label}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ─────────── Секция с изображение ─────────── */

const FeatureSectionBlock = ({
  block,
  id,
}: {
  block: BlockOf<'featureSection'>
  id?: string | null
}) => {
  const img = mediaUrl(block.image, 'banner')
  const dark = block.theme === 'dark'
  const full = block.layout === 'image-full'
  const stats = block.stats ?? []

  const text = (
    <div className={full ? 'max-w-2xl' : ''}>
      {block.subheading ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] opacity-80">
          {block.subheading}
        </p>
      ) : null}

      <h2 className="text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">
        {block.heading}
      </h2>

      {block.body ? (
        <p className={`mt-4 leading-relaxed ${dark || full ? 'opacity-90' : 'text-ink-muted'}`}>
          {block.body}
        </p>
      ) : null}

      {stats.length ? (
        <ul className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
          {stats.map((s, i) => (
            <li key={i}>
              <p className="tabular text-xl font-bold sm:text-2xl">{s.value}</p>
              <p className={`text-xs ${dark || full ? 'opacity-80' : 'text-ink-muted'}`}>
                {s.label}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )

  if (full) {
    return (
      <Section id={id} className="py-6">
        <div className="container-site">
          <div className="relative overflow-hidden rounded-xl">
            <div className="relative aspect-[4/5] w-full sm:aspect-[16/9]">
              {img ? (
                <Image
                  src={img}
                  alt={mediaAlt(block.image)}
                  fill
                  sizes="100vw"
                  loading="lazy"
                  className="object-cover"
                />
              ) : null}
              <div className={`absolute inset-0 ${dark ? 'bg-black/50' : 'bg-white/40'}`} />
              <div
                className={`absolute inset-0 flex flex-col justify-center p-6 sm:p-12 ${
                  dark ? 'text-white' : 'text-ink'
                }`}
              >
                {text}
              </div>
            </div>
          </div>
        </div>
      </Section>
    )
  }

  return (
    <Section id={id} className={dark ? 'bg-night py-12 text-white' : 'py-12'}>
      <div className="container-site grid items-center gap-8 lg:grid-cols-2">
        <div className={block.layout === 'image-left' ? 'lg:order-2' : ''}>{text}</div>

        <div className={block.layout === 'image-left' ? 'lg:order-1' : ''}>
          {img ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-tile">
              <Image
                src={img}
                alt={mediaAlt(block.image)}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
                className="object-cover"
              />
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  )
}

/* ─────────── Секция с раздели ─────────── */

const TabbedShowcaseBlock = ({
  block,
  id,
  index,
}: {
  block: BlockOf<'tabbedShowcase'>
  id?: string | null
  index: number
}) => {
  const tabs: ShowcaseTab[] = (block.tabs ?? []).map((t) => ({
    label: t.label,
    imageUrl: mediaUrl(t.image, 'banner'),
    imageAlt: mediaAlt(t.image) || t.label,
    rows: (t.rows ?? []).map((r) => ({
      iconUrl: mediaUrl(r.icon, 'thumbnail'),
      iconAlt: mediaAlt(r.icon),
      label: r.label,
      sublabel: r.sublabel,
      value: r.value,
    })),
  }))

  if (!tabs.length) return null

  return (
    <Section id={id} className="container-site py-12">
      <SectionHeading>{block.heading}</SectionHeading>
      <ProductTabs tabs={tabs} idBase={id ?? `showcase-${index}`} />
    </Section>
  )
}

/* ─────────── Варианти и комплекти ─────────── */

const BundleOptionsBlock = ({
  block,
  id,
}: {
  block: BlockOf<'bundleOptions'>
  id?: string | null
}) => {
  const options = (block.options ?? []).filter((o) => {
    // Вариант без адрес, без свързан продукт и без отметка за текущ
    // би бил мъртъв бутон — по-добре да липсва.
    const linked = o.externalUrl || o.product
    return Boolean(linked || o.isCurrent)
  })

  if (!options.length) return null

  return (
    <Section id={id} className="container-site py-12">
      <SectionHeading>{block.heading ?? 'Варианти'}</SectionHeading>

      <ul className="flex flex-col gap-3">
        {options.map((o, i) => {
          const off = discountPercent(o.price, o.comparePrice)
          const product = typeof o.product === 'number' ? null : o.product
          const href = o.externalUrl || product?.externalUrl || null
          const clickable = !o.isCurrent && !o.soldOut && href

          const inner = (
            <>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{o.label}</span>
                {o.isCurrent ? (
                  <span className="text-xs text-ink-muted">Разглеждате този вариант</span>
                ) : null}
                {o.soldOut ? <span className="text-xs text-ink-muted">Изчерпан</span> : null}
              </span>

              <span className="flex shrink-0 items-baseline gap-2">
                {o.comparePrice ? (
                  <s className="tabular text-xs text-ink-muted">{formatEur(o.comparePrice)}</s>
                ) : null}
                <span className="tabular text-base font-semibold">{formatEur(o.price)}</span>
                {off ? (
                  <span className="rounded bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    −{off}%
                  </span>
                ) : null}
              </span>
            </>
          )

          const base =
            'flex min-h-14 items-center gap-4 rounded-lg border px-4 py-3 transition-colors duration-200'

          if (o.isCurrent) {
            return (
              <li key={i}>
                <div className={`${base} border-ink bg-tile`} aria-current="true">
                  {inner}
                </div>
              </li>
            )
          }

          if (!clickable) {
            return (
              <li key={i}>
                <div className={`${base} border-line opacity-50`}>{inner}</div>
              </li>
            )
          }

          return (
            <li key={i}>
              <Link
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${base} cursor-pointer border-line hover:border-ink`}
              >
                {inner}
              </Link>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

/* ─────────── Сравнение между модели ─────────── */

const ComparisonTableBlock = ({
  block,
  id,
}: {
  block: BlockOf<'comparisonTable'>
  id?: string | null
}) => {
  const columns = block.columns ?? []
  if (!columns.length) return null

  const rows = block.rows ?? []

  const cols = columns.map((c) => {
    const product = typeof c.product === 'number' ? null : c.product
    return {
      name: c.label || product?.title || '',
      imageUrl: mediaUrl(c.image, 'card') ?? mediaUrl(product?.image, 'card'),
      imageAlt: mediaAlt(c.image) || product?.title || '',
      tagline: c.tagline,
      price: c.price ?? product?.price ?? null,
      comparePrice: c.comparePrice ?? product?.compareAtPrice ?? null,
      ctaLabel: c.ctaLabel || product?.ctaLabel || 'Купи сега',
      ctaUrl: c.ctaUrl || product?.externalUrl || null,
      highlight: Boolean(c.highlight),
    }
  })

  return (
    <Section id={id} className="container-site py-12">
      <SectionHeading>{block.heading}</SectionHeading>

      {/* Широката таблица се скролва вътре в себе си, за да не чупи страницата. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-40 bg-surface p-3 text-left align-bottom" />
              {cols.map((c, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`p-3 text-center align-bottom ${c.highlight ? 'bg-tile' : ''}`}
                >
                  {c.imageUrl ? (
                    <span className="mb-2 block">
                      <Image
                        src={c.imageUrl}
                        alt={c.imageAlt}
                        width={140}
                        height={140}
                        loading="lazy"
                        className="mx-auto h-28 w-auto object-contain"
                      />
                    </span>
                  ) : null}

                  <span className="block font-semibold">{c.name}</span>

                  {c.tagline ? (
                    <span className="mt-1 block text-xs font-normal text-ink-muted">
                      {c.tagline}
                    </span>
                  ) : null}

                  {c.price !== null ? (
                    <span className="mt-2 flex items-baseline justify-center gap-2">
                      {c.comparePrice ? (
                        <s className="tabular text-xs font-normal text-ink-muted">
                          {formatEur(c.comparePrice)}
                        </s>
                      ) : null}
                      <span className="tabular font-bold">{formatEur(c.price)}</span>
                    </span>
                  ) : null}

                  {c.ctaUrl ? (
                    <Link
                      href={c.ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-ink px-4 text-xs font-semibold text-white transition-colors duration-200 hover:bg-brand"
                    >
                      {c.ctaLabel}
                    </Link>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-t border-line">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-surface p-3 text-left font-medium text-ink-muted"
                >
                  {row.label}
                </th>
                {cols.map((c, ci) => (
                  <td
                    key={ci}
                    className={`p-3 text-center ${c.highlight ? 'bg-tile' : ''}`}
                  >
                    {(row.values ?? [])[ci]?.value ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

/* ─────────── Какво има в кутията ─────────── */

const InTheBoxBlock = ({ block, id }: { block: BlockOf<'inTheBox'>; id?: string | null }) => {
  const items = block.items ?? []
  if (!items.length) return null

  return (
    <Section id={id} className="container-site py-12">
      <SectionHeading>{block.heading ?? 'Какво има в кутията'}</SectionHeading>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item, i) => {
          const img = mediaUrl(item.image, 'card')
          return (
            <li key={i} className="rounded-lg border border-line bg-surface p-3 text-center">
              {img ? (
                <div className="relative mb-2 aspect-square w-full">
                  <Image
                    src={img}
                    alt={mediaAlt(item.image) || item.name}
                    fill
                    sizes="(max-width: 640px) 45vw, 20vw"
                    loading="lazy"
                    className="object-contain"
                  />
                </div>
              ) : null}
              <p className="text-sm font-medium">{item.name}</p>
              <p className="tabular text-xs text-ink-muted">×{item.qty ?? 1}</p>
            </li>
          )
        })}
      </ul>

      {block.caption ? <p className="mt-4 text-xs text-ink-muted">{block.caption}</p> : null}
    </Section>
  )
}

/* ─────────── Таблица със спецификации ─────────── */

const SpecTableBlock = ({
  block,
  id,
  product,
}: {
  block: BlockOf<'specTable'>
  id?: string | null
  product: Product
}) => {
  const groups = product.specGroups ?? []
  if (!groups.length) return null

  return (
    <Section id={id} className="container-site py-12">
      <SectionHeading>{block.heading ?? 'Спецификации'}</SectionHeading>

      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
        {groups.map((group, gi) => (
          <div key={gi}>
            {/* Група без заглавие продължава предишната — затова заглавието се пропуска. */}
            {group.groupLabel ? (
              <h3 className="mb-2 border-b border-line pb-2 text-sm font-semibold uppercase tracking-wide">
                {group.groupLabel}
              </h3>
            ) : null}

            <dl className="divide-y divide-line">
              {(group.rows ?? []).map((row, ri) => (
                <div key={ri} className="flex gap-4 py-2 text-sm">
                  <dt className="w-1/2 shrink-0 text-ink-muted">{row.label}</dt>
                  <dd className="tabular flex-1">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ─────────── Въпроси и отговори ─────────── */

const FaqBlockRenderer = ({ block, id }: { block: BlockOf<'faqBlock'>; id?: string | null }) => {
  const items = block.items ?? []
  if (!items.length) return null

  return (
    <Section id={id} className="container-site py-12">
      <SectionHeading>{block.heading ?? 'Често задавани въпроси'}</SectionHeading>

      <div className="divide-y divide-line border-y border-line">
        {items.map((item, i) => (
          /* details/summary работят и без JavaScript. */
          <details key={i} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium">
              {item.question}
              <span
                aria-hidden="true"
                className="shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="pb-4 text-sm leading-relaxed text-ink-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  )
}

/* ─────────── Свързани продукти ─────────── */

const RelatedProductsBlock = ({
  block,
  id,
  showBgn,
}: {
  block: BlockOf<'relatedProducts'>
  id?: string | null
  showBgn: boolean
}) => {
  const products = resolved<Product>(block.products)
  if (!products.length) return null

  return (
    <Section id={id} className="container-site py-12">
      <SectionHeading>{block.heading ?? 'Може да ви заинтересува'}</SectionHeading>

      <ul className="scroll-row">
        {products.map((p) => (
          <li key={p.id} className="w-[200px] sm:w-[228px]">
            <ProductCard product={p} showBgn={showBgn} className="h-full" />
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ─────────── Бележки под линия ─────────── */

const FootnotesBlock = ({ block, id }: { block: BlockOf<'footnotes'>; id?: string | null }) => {
  const items = block.items ?? []
  if (!items.length) return null

  return (
    <Section id={id} className="container-site py-8">
      <ol className="list-decimal space-y-1 border-t border-line pt-6 pl-5 text-xs leading-relaxed text-ink-muted">
        {items.map((item, i) => (
          <li key={i}>{item.text}</li>
        ))}
      </ol>
    </Section>
  )
}

/* ─────────── Правен текст ─────────── */

const LegalTextBlock = ({ block, id }: { block: BlockOf<'legalText'>; id?: string | null }) => {
  const paragraphs = extractText(block.body)
  if (!paragraphs.length && !block.heading) return null

  return (
    <Section id={id} className="container-site py-8">
      <details open={block.collapsed === false} className="border-t border-line pt-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-xs font-medium text-ink-muted">
          {block.heading ?? 'Условия'}
          <span aria-hidden="true">▾</span>
        </summary>
        <div className="mt-3 space-y-2 text-xs leading-relaxed text-ink-muted">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </details>
    </Section>
  )
}

/**
 * Изважда обикновен текст от Lexical съдържанието.
 *
 * Правният блок е кратък и без форматиране; пълен рендерер на Lexical би
 * бил излишен тук. Ако някога потрябва богат текст, това е мястото.
 */
const extractText = (body: unknown): string[] => {
  const out: string[] = []
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const n = node as { type?: string; text?: string; children?: unknown[] }
    if (n.type === 'paragraph') {
      const parts: string[] = []
      const collect = (c: unknown) => {
        const cn = c as { text?: string; children?: unknown[] }
        if (typeof cn?.text === 'string') parts.push(cn.text)
        cn?.children?.forEach(collect)
      }
      n.children?.forEach(collect)
      const line = parts.join('').trim()
      if (line) out.push(line)
      return
    }
    n.children?.forEach(walk)
  }
  const root = (body as { root?: unknown })?.root
  walk(root)
  return out
}

/* ─────────── Разпределител ─────────── */

export const RenderProductSections = ({
  sections,
  anchorIds,
  product,
  showBgn,
}: {
  sections: Sections
  anchorIds: (string | null)[]
  product: Product
  showBgn: boolean
}) => (
  <>
    {sections.map((block, i) => {
      const id = anchorIds[i]
      const key = `${block.blockType}-${i}`

      switch (block.blockType) {
        case 'keySpecStrip':
          return <KeySpecStripBlock key={key} block={block} id={id} />
        case 'featureSection':
          return <FeatureSectionBlock key={key} block={block} id={id} />
        case 'tabbedShowcase':
          return <TabbedShowcaseBlock key={key} block={block} id={id} index={i} />
        case 'bundleOptions':
          return <BundleOptionsBlock key={key} block={block} id={id} />
        case 'comparisonTable':
          return <ComparisonTableBlock key={key} block={block} id={id} />
        case 'inTheBox':
          return <InTheBoxBlock key={key} block={block} id={id} />
        case 'specTable':
          return <SpecTableBlock key={key} block={block} id={id} product={product} />
        case 'faqBlock':
          return <FaqBlockRenderer key={key} block={block} id={id} />
        case 'relatedProducts':
          return <RelatedProductsBlock key={key} block={block} id={id} showBgn={showBgn} />
        case 'footnotes':
          return <FootnotesBlock key={key} block={block} id={id} />
        case 'legalText':
          return <LegalTextBlock key={key} block={block} id={id} />
        default:
          return null
      }
    })}
  </>
)
