import { CaretRight, Quotes } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import type { Media, Page, Product } from '@/payload-types'
import { mediaAlt, mediaUrl, productCardData } from '@/lib/media'
import { resolvedRelations } from '@/lib/relations'
import { AboutTabs } from '../AboutTabs'
import { BuyButton } from '../BuyButton'
import { CardImage } from '../CardImage'
import { CountUp } from '../CountUp'
import { ImagePlaceholder } from '../ImagePlaceholder'
import { ScrollRow } from '../ScrollRow'
import { DualImage } from './guide'

/*
  Блоковете на „За EcoFlow" (`task-stranica-za-ecoflow.md`), по
  ecoflow.com/eu/about-us при 1440 px: съдържание 1280 px, H2 32 px,
  текст 16 px.
*/

type Layout = NonNullable<Page['layout']>
type BlockOf<T extends string> = Extract<Layout[number], { blockType: T }>
type MaybeMedia = number | Media | null | undefined

const Wrap = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`mx-auto w-full max-w-[1344px] px-4 md:px-8 ${className}`}>{children}</div>
)

const H2 = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) =>
  children ? <h2 className={`text-[26px] font-medium leading-[1.25] md:text-[32px] ${className}`}>{children}</h2> : null

/* ─────────── История и числа ─────────── */

export const CompanyStatsBlock = ({ block }: { block: BlockOf<'companyStats'> }) => {
  const stats = block.stats ?? []
  const locations = (block.locations ?? []).filter((l) => l.label && typeof l.x === 'number' && typeof l.y === 'number')

  return (
    <section className="relative overflow-hidden bg-black text-white">
      <DualImage
        image={block.image}
        mobile={block.imageMobile}
        alt=""
        sizes="100vw"
        className="absolute inset-0 size-full object-cover"
      />
      <Wrap className="relative grid items-center gap-10 py-14 md:min-h-[540px] md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-12 md:py-20">
        <div>
          <H2>{block.heading}</H2>
          {block.body ? <p className="mt-5 max-w-[470px] text-base leading-[1.4]">{block.body}</p> : null}
          {stats.length ? (
            /* На телефон 2×2; на компютър в ред с тънки черти между числата. */
            <dl className="mt-10 grid grid-cols-2 gap-y-6 md:mt-12 md:grid-cols-4">
              {stats.map((s, i) => (
                <div
                  key={i}
                  className="border-white/25 pr-4 max-md:[&:nth-child(even)]:border-l max-md:[&:nth-child(even)]:pl-5 md:border-l md:pl-4 md:first:border-l-0 md:first:pl-0"
                >
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="text-[22px] font-semibold leading-none md:text-2xl">
                    <CountUp value={s.value ?? ''} countTo={s.countTo} />
                  </dd>
                  <dd className="mt-2 text-xs leading-[1.35] text-white/65">{s.label}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        {block.mapImage || block.mapImageMobile ? (
          <div className="relative mx-auto w-full max-w-[640px]">
            <DualImage
              image={block.mapImage}
              mobile={block.mapImageMobile}
              alt={block.imageAlt}
              sizes="(max-width: 767px) 100vw, 640px"
              className="h-auto w-full"
            />
            {/* Надписите са HTML — в снимката ги няма, а така се превеждат и местят от админа. */}
            {locations.map((l, i) => (
              <span
                key={i}
                className="absolute flex -translate-x-[5px] -translate-y-1/2 items-center gap-1.5"
                style={{ left: `${l.x}%`, top: `${l.y}%` }}
              >
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full rounded-full bg-white/70 motion-safe:animate-ping" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-white" />
                </span>
                <span className="whitespace-nowrap text-[11px] font-medium leading-none md:text-xs">{l.label}</span>
              </span>
            ))}
          </div>
        ) : null}
      </Wrap>
    </section>
  )
}

/* ─────────── Табове с продукти ─────────── */

type Tab = NonNullable<BlockOf<'productTabs'>['tabs']>[number]

const ProductTile = ({ product, specLine }: { product: Product; specLine?: string | null }) => {
  const card = productCardData(product)
  return (
    <article className="flex h-full flex-col rounded-xl bg-[#f5f5f5] p-3 md:p-4">
      <Link href={card.url ?? '#'} className="relative block aspect-square overflow-hidden rounded-lg bg-white">
        {card.imageUrl ? (
          <CardImage src={card.imageUrl} alt={card.imageAlt} trimmed={card.imageTrimmed} sizes="(max-width: 767px) 75vw, 300px" />
        ) : (
          <ImagePlaceholder className="absolute inset-0" />
        )}
      </Link>
      <h3 className="mt-4 text-lg font-medium leading-tight text-black">
        <Link href={card.url ?? '#'}>{card.title}</Link>
      </h3>
      <p className="mt-2 text-sm leading-[1.35] text-[#898989]">{specLine?.trim() || card.tagline}</p>
      <div className="mt-auto flex gap-2 pt-5">
        {card.url ? (
          <Link
            href={card.url}
            className="inline-flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-full bg-black px-2 text-[13px] font-semibold sm:px-3 sm:text-sm text-white transition-colors duration-200 hover:bg-ink"
          >
            Научете повече
          </Link>
        ) : null}
        <BuyButton product={product} size="pill" tone="outline" label="Купи" className="flex-1" />
      </div>
    </article>
  )
}

const TabPanel = ({ tab, products }: { tab: Tab; products: { product: Product; specLine?: string | null }[] }) => (
  <>
    <div className="relative overflow-hidden rounded-2xl bg-[#e9e9e9]">
      <DualImage
        image={tab.image}
        mobile={tab.imageMobile}
        alt={tab.imageAlt}
        sizes="(max-width: 1344px) 100vw, 1280px"
        className="aspect-[7/6] w-full object-cover md:aspect-[1280/410]"
        mobileClassName="aspect-[7/6] w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 text-white md:flex-row md:items-end md:justify-between md:p-6">
        <div className="max-w-[860px]">
          {tab.heading ? <h3 className="text-xl font-medium leading-tight md:text-2xl">{tab.heading}</h3> : null}
          {tab.body ? <p className="mt-2 text-sm leading-[1.4] md:text-base">{tab.body}</p> : null}
        </div>
        {tab.ctaLink ? (
          <Link
            href={tab.ctaLink}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
          >
            {tab.ctaLabel?.trim() || 'Научете повече'}
            <CaretRight size={12} weight="bold" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </div>
    <ScrollRow
      label={tab.label ?? 'Продукти'}
      className="mt-3 flex snap-x gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {products.map(({ product, specLine }) => (
        <div key={product.id} className="w-[75%] max-w-[300px] shrink-0 snap-start md:w-[calc((100%-36px)/4)] md:max-w-none">
          <ProductTile product={product} specLine={specLine} />
        </div>
      ))}
    </ScrollRow>
  </>
)

export const ProductTabsBlock = ({ block }: { block: BlockOf<'productTabs'> }) => {
  /* Само публикувани продукти; таб без нито един не се показва. */
  const tabs = (block.tabs ?? [])
    .map((tab) => {
      const rows = tab.products ?? []
      const docs = resolvedRelations<Product>(
        rows.map((r) => r.product).filter((p): p is number | Product => p != null),
        'productTabs.tabs.products',
      )
      const products = docs.map((product) => ({
        product,
        specLine: rows.find((r) => (typeof r.product === 'number' ? r.product : r.product?.id) === product.id)?.specLine,
      }))
      return { tab, products }
    })
    .filter((t) => t.products.length && t.tab.label)
  if (!tabs.length) return null

  return (
    <section className="py-14 md:py-20">
      <Wrap>
        <H2 className="mb-6 md:mb-8">{block.heading}</H2>
        <AboutTabs
          labels={tabs.map((t) => t.tab.label!)}
          panels={tabs.map((t, i) => (
            <TabPanel key={i} tab={t.tab} products={t.products} />
          ))}
        />
      </Wrap>
    </section>
  )
}

/* ─────────── Лента с отличия ─────────── */

export const AwardsMarqueeBlock = ({ block }: { block: BlockOf<'awardsMarquee'> }) => {
  const items = (block.items ?? []).filter((i) => !i.hidden)
  if (!items.length) return null

  const card = (item: (typeof items)[number], i: number, copy: boolean) => {
    const src = mediaUrl(item.image as MaybeMedia, 'content') ?? mediaUrl(item.image as MaybeMedia)
    return (
      /* Отстоянието е вътре в елемента (pr), не `gap` — иначе −50 % не съвпада точно и лентата подскача. */
      <li key={`${copy ? 'b' : 'a'}-${i}`} aria-hidden={copy || undefined} className={`shrink-0 pr-3 ${copy ? 'motion-reduce:hidden' : ''}`}>
        <div className="flex size-[200px] flex-col justify-between overflow-hidden rounded-lg bg-[#1d1d1f] p-5 md:size-[240px] md:p-6">
          {src ? (
            // Логата са 3:1 с марката вляво; излишното вдясно се реже, както в оригинала.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={copy ? '' : mediaAlt(item.image as MaybeMedia) || item.title || ''} loading="lazy" className="h-[84px] w-auto max-w-none md:h-[100px]" />
          ) : (
            <span />
          )}
          <p className="text-sm leading-[1.3] text-white">
            {item.title}
            {item.subtitle ? <span className="block text-white/70">{item.subtitle}</span> : null}
          </p>
        </div>
      </li>
    )
  }

  return (
    <section className="bg-black py-10 md:py-12" aria-label="Отличия">
      {/* При намалено движение — неподвижен ред, който се скролва. */}
      <div className="group overflow-hidden motion-reduce:overflow-x-auto">
        <ul className="flex w-max animate-[marquee_60s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:px-4">
          {items.map((item, i) => card(item, i, false))}
          {items.map((item, i) => card(item, i, true))}
        </ul>
      </div>
    </section>
  )
}

/* ─────────── Текст + голяма снимка ─────────── */

export const TextSectionBlock = ({ block }: { block: BlockOf<'textSection'> }) => {
  const dark = block.theme === 'dark'
  const Heading = block.headingLevel === 'h3' ? 'h3' : 'h2'
  const buttons = (block.buttons ?? []).filter((b) => b.label && b.link)
  const image =
    block.image || block.imageMobile ? (
      <div className="mx-auto max-w-[1280px] overflow-hidden rounded-2xl">
        <DualImage
          image={block.image}
          mobile={block.imageMobile}
          alt={block.imageAlt}
          sizes="(max-width: 1344px) 100vw, 1280px"
          className="h-auto w-full"
        />
      </div>
    ) : null
  const above = block.imagePosition === 'above'

  return (
    <section className={dark ? 'bg-black text-white' : 'bg-white text-black'}>
      {/* Схема над текста продължава предишната секция (екосистемата → алиансът) — без второ голямо отстояние отгоре. */}
      <Wrap className={above && image ? 'pb-14 pt-2 md:pb-20 md:pt-4' : 'py-14 md:py-20'}>
        {above && image ? <div className="mb-8 md:mb-12">{image}</div> : null}
        <div className="mx-auto max-w-[760px] text-center">
          <Heading
            className={`font-medium leading-[1.25] ${Heading === 'h3' ? 'text-[22px] md:text-[28px]' : 'text-[26px] md:text-[32px]'}`}
          >
            {block.heading}
          </Heading>
          {block.body ? (
            <p className={`mt-4 text-base leading-[1.45] ${dark ? 'text-white/75' : 'text-[#555]'}`}>{block.body}</p>
          ) : null}
          {buttons.length ? (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {buttons.map((b, i) => {
                const primary = i === 0
                const cls = primary
                  ? dark
                    ? 'bg-white text-black hover:bg-[#e6e6e6]'
                    : 'bg-black text-white hover:bg-ink'
                  : dark
                    ? 'border border-white text-white hover:bg-white hover:text-black'
                    : 'border border-black text-black hover:bg-black hover:text-white'
                return (
                  <Link
                    key={i}
                    href={b.link!}
                    className={`inline-flex h-11 items-center rounded-full px-8 text-sm font-semibold transition-colors duration-200 ${cls}`}
                  >
                    {b.label}
                  </Link>
                )
              })}
            </div>
          ) : null}
        </div>
        {!above && image ? <div className="mt-8 md:mt-12">{image}</div> : null}
      </Wrap>
    </section>
  )
}

/* ─────────── Цитати от медии ─────────── */

const кавички = (q: string) => `„${q.trim().replace(/^["„“”«]+|["„“”»]+$/g, '')}“`

export const PressQuotesBlock = ({ block }: { block: BlockOf<'pressQuotes'> }) => {
  const items = (block.items ?? []).filter((i) => !i.hidden && i.quote?.trim())
  if (!items.length) return null

  return (
    <section className="bg-[#f5f5f5] py-14 md:py-20">
      <Wrap>
        <H2 className="mb-6 text-center md:mb-10">{block.heading}</H2>
        {/* Колона е 1/3 от 1280 px, както в оригинала; картите застават в центъра. */}
        <ul className="flex flex-col gap-3 md:flex-row md:flex-wrap md:justify-center">
          {items.map((item, i) => {
            const src = mediaUrl(item.image as MaybeMedia, 'content') ?? mediaUrl(item.image as MaybeMedia)
            return (
              <li key={i} className="relative flex flex-col rounded-xl bg-white p-6 md:w-[calc((100%-24px)/3)]">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={item.source ?? mediaAlt(item.image as MaybeMedia)}
                    loading="lazy"
                    className="aspect-[371/128] w-full rounded-lg object-cover"
                  />
                ) : null}
                <blockquote className="mt-8 text-[15px] leading-[1.45] text-black">{кавички(item.quote!)}</blockquote>
                {item.source ? <p className="mt-3 pb-8 text-xs text-[#757575]">{item.source}</p> : <div className="pb-8" />}
                <Quotes size={20} weight="fill" aria-hidden="true" className="absolute bottom-5 right-5 text-[#d6d6d6]" />
              </li>
            )
          })}
        </ul>
      </Wrap>
    </section>
  )
}
