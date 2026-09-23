import Image from 'next/image'
import Link from 'next/link'

import type { Product } from '@/payload-types'
import { discountPercent, formatEur } from '@/lib/format'
import { mediaAlt, mediaUrl, productCardData, sectionImage } from '@/lib/media'
import { SectionImage } from '../SectionImage'
import { ProductCard } from '../ProductCard'
import { ProductTabs, type ShowcaseTab, type TabsLayout } from './ProductTabs'
import { ImagePlaceholder } from '../ImagePlaceholder'

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

/**
 * Заглавие на секция.
 *
 * В оригинала всяко заглавие на секция стои в центъра — затова центърът е
 * по подразбиране и тук. Подравняването вляво остава за подредбите със
 * снимка отстрани, където заглавието е част от текстовата колона.
 */
const BlockHeading = ({
  children,
  align = 'center',
}: {
  children: React.ReactNode
  align?: 'center' | 'left'
}) =>
  children ? (
    <h2
      className={`mb-8 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl ${
        align === 'center' ? 'text-center' : ''
      }`}
    >
      {children}
    </h2>
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
  // Оригиналът (или `large`), без прекодиране — виж `sectionImage`.
  const img = sectionImage(block.image)
  const dark = block.theme === 'dark'
  const full = block.layout === 'image-full'
  const stacked = block.layout === 'stacked'
  const stats = block.stats ?? []
  // „Под" е по-едро подзаглавие между заглавието и текста; „над" е малкият ред.
  const subBelow = block.subheadingPosition === 'below'

  // Секция само със снимка — главният банер в оригинала е точно такъв.
  const hasText = Boolean(block.heading || block.subheading || block.body || stats.length)

  const text = (
    <div className={full ? 'max-w-2xl' : stacked ? 'text-center' : ''}>
      {block.subheading && !subBelow ? (
        /*
          При стекираната подредба малкият надпис стои НАД заглавието, с
          обикновена дебелина и малки букви — точно както в оригинала. При
          останалите подредби остава етикетът с главни букви.
        */
        <p
          className={
            stacked
              ? `mb-2 text-sm ${dark ? 'opacity-80' : 'text-ink-muted'}`
              : 'mb-2 text-xs font-semibold uppercase tracking-[0.12em] opacity-80'
          }
        >
          {block.subheading}
        </p>
      ) : null}

      {block.heading ? (
        <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
          {block.heading}
        </h2>
      ) : null}

      {block.subheading && subBelow ? (
        <p
          className={`mt-3 text-lg font-medium leading-snug sm:text-[22px] ${
            stacked ? 'mx-auto max-w-[56rem]' : ''
          }`}
        >
          {block.subheading}
        </p>
      ) : null}

      {block.body ? (
        <p
          className={`mt-4 leading-relaxed ${stacked ? 'mx-auto max-w-[56rem]' : ''} ${
            dark || full ? 'opacity-90' : 'text-ink-muted'
          }`}
        >
          {block.body}
        </p>
      ) : null}

      {stats.length ? (
        <ul
          className={`mt-6 flex flex-wrap gap-x-10 gap-y-4 ${stacked ? 'justify-center' : ''}`}
        >
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

  /*
    Текст отгоре, снимка отдолу.

    За снимка, която сама съдържа текст или графики — колаж, екрани от
    приложение, три панела един до друг — текстът върху нея я затъмнява и
    изрязва. Тук снимката се показва цяла: собствените ѝ размери, без
    наложено съотношение и без слой отгоре.

    Тъмната тема сменя фона на секцията и цвета на текста, но не пипа
    самата снимка.
  */
  if (stacked) {
    /*
      Разстоянието между секциите е голямо нарочно — в оригинала е около
      120 px на десктоп. При по-малко секциите се слепват и страницата
      изглежда като един непрекъснат блок.
    */
    return (
      <Section id={id} className={dark ? 'bg-night py-10 text-white lg:py-16' : 'py-10 lg:py-16'}>
        <div className="container-site">
          {hasText ? text : null}

          {img ? (
            <SectionImage
              image={img}
              // Контейнерът е max-width: 88rem — по-широка снимка не се показва.
              sizes="(max-width: 1408px) 100vw, 1408px"
              // Без текст отгоре разстоянието е излишно.
              className={`h-auto w-full rounded-2xl ${hasText ? 'mt-10' : ''}`}
            />
          ) : null}
        </div>
      </Section>
    )
  }

  if (full) {
    return (
      <Section id={id} className="py-6">
        <div className="container-site">
          <div className="relative overflow-hidden rounded-xl">
            <div className="relative aspect-[4/5] w-full sm:aspect-[16/9]">
              {img ? (
                <SectionImage
                  image={img}
                  sizes="100vw"
                  className="absolute inset-0 size-full object-cover"
                />
              ) : null}
              <div className={`absolute inset-0 ${dark ? 'bg-black/50' : 'bg-white/20'}`} />
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
      {/* Без текст двете колони нямат смисъл — снимката заема цялата ширина. */}
      <div
        className={`container-site ${hasText ? 'grid items-center gap-8 lg:grid-cols-2' : ''}`}
      >
        {hasText ? (
          <div className={block.layout === 'image-left' ? 'lg:order-2' : ''}>{text}</div>
        ) : null}

        <div className={block.layout === 'image-left' ? 'lg:order-1' : ''}>
          {/*
            Снимката пази собственото си съотношение.

            Преди тук стоеше наложено aspect-[4/3] с object-cover — панорамна
            снимка 2,24 губеше по 40% отстрани. Височината вече следва
            съдържанието; двете колони са центрирани вертикално.
          */}
          {img ? (
            <SectionImage
              image={img}
              // На широк екран колоната е половин контейнер: 1408 / 2 = 704px.
              sizes="(max-width: 1024px) 100vw, 704px"
              className="h-auto w-full rounded-xl"
            />
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
  const tabs: ShowcaseTab[] = (block.tabs ?? []).map((t) => {
    return {
      label: t.label,
      // Оригиналът, без прекодиране; снимката се показва цяла.
      image: sectionImage(t.image),
      imageAlt: mediaAlt(t.image) || t.label,
      caption: t.caption,
      rows: (t.rows ?? []).map((r) => ({
        iconUrl: mediaUrl(r.icon, 'thumbnail'),
        iconAlt: mediaAlt(r.icon),
        label: r.label,
        sublabel: r.sublabel,
        value: r.value,
      })),
    }
  })

  if (!tabs.length) return null

  const layout: TabsLayout =
    block.layout === 'image-top' || block.layout === 'tabs-top' ? block.layout : 'side-panel'

  return (
    <Section id={id} className="container-site py-12 lg:py-16">
      <BlockHeading>{block.heading}</BlockHeading>

      {block.intro ? (
        /* Същият вид като текста в секция с изображение — центриран, сив, до ~900px. */
        <p className="mx-auto -mt-4 mb-8 max-w-[56rem] text-center leading-relaxed text-ink-muted">
          {block.intro}
        </p>
      ) : null}

      <ProductTabs tabs={tabs} idBase={id ?? `showcase-${index}`} layout={layout} />
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
      <BlockHeading>{block.heading ?? 'Варианти'}</BlockHeading>

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
    /*
      Всичко идва от продукта; полетата в колоната са замяна. Размерът е
      „content", не квадрат: „card" и „thumbnail" режат по центъра и при
      висок кадър на електроцентрала отхапват основата.
    */
    const data = productCardData(
      product,
      {
        title: c.label,
        image: c.image,
        tagline: c.tagline,
        price: c.price,
        comparePrice: c.comparePrice,
        // Бутонът води към магазина, не към продуктовата страница.
        url: c.ctaUrl || product?.externalUrl,
      },
      'content',
    )
    return {
      name: data.title,
      imageUrl: data.imageUrl,
      imageAlt: data.imageAlt,
      tagline: data.tagline,
      price: data.price,
      comparePrice: data.comparePrice,
      ctaLabel: c.ctaLabel || product?.ctaLabel || 'Купи сега',
      ctaUrl: data.url,
      highlight: Boolean(c.highlight),
    }
  })

  return (
    <Section id={id} className="py-12 lg:py-16">
      <div className="container-site">
        <BlockHeading>{block.heading}</BlockHeading>

        {block.intro ? (
          /* Същият вид като при секцията с раздели — центриран, сив, до ~900px. */
          <p className="mx-auto -mt-4 mb-8 max-w-[56rem] text-center leading-relaxed text-ink-muted">
            {block.intro}
          </p>
        ) : null}

        {/*
          Цялата таблица лежи върху светлосиво поле, както в оригинала.

          Колоните са равностойни — текущият продукт НЕ се подчертава с фон.
          Това е таблица за сравнение; оцветена колона насочва избора.

          Широката таблица се скролва вътре в себе си, а колоната с
          показателите остава залепена вляво, за да се вижда кой ред се чете.
        */}
        <div className="overflow-x-auto rounded-2xl bg-shade py-8">
          <table className="w-full min-w-[46rem] border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-48 bg-shade px-4 text-left align-bottom" />
                {cols.map((c, i) => (
                  <th key={i} scope="col" className="px-4 text-center align-top">
                    {/*
                      Мястото за снимката е с постоянна височина и когато
                      снимка няма. Иначе колоната без снимка вдига името си
                      нагоре и трите имена застават на различни нива.

                      Височината е зададена на самата снимка, не като горна
                      граница — при „max-h" с „w-auto" размерът зависи от
                      декодираната снимка и клетката се срутва, ако тя
                      закъснее.
                    */}
                    <span className="mb-4 flex h-44 items-end justify-center">
                      {c.imageUrl ? (
                        <Image
                          src={c.imageUrl}
                          alt={c.imageAlt}
                          width={360}
                          height={360}
                          sizes="240px"
                          loading="lazy"
                          className="h-44 w-auto max-w-full object-contain"
                        />
                      ) : (
                        <ImagePlaceholder className="size-44 rounded-lg" />
                      )}
                    </span>

                    {/*
                      Текущият продукт се различава само по дебелината на
                      името. Толкова стига, за да се хване с поглед.
                    */}
                    <span
                      className={`block text-xl sm:text-2xl ${
                        c.highlight ? 'font-bold' : 'font-semibold'
                      }`}
                    >
                      {c.name}
                    </span>

                    {c.tagline ? (
                      <span className="mx-auto mt-2 block max-w-64 text-sm font-normal">
                        {c.tagline}
                      </span>
                    ) : null}

                    {c.price !== null ? (
                      <span className="mt-3 flex flex-wrap items-baseline justify-center gap-2">
                        <span className="tabular text-lg font-bold text-alert">
                          {formatEur(c.price)}
                        </span>
                        {c.comparePrice ? (
                          <s className="tabular text-sm font-normal text-ink-muted">
                            {formatEur(c.comparePrice)}
                          </s>
                        ) : null}
                      </span>
                    ) : null}

                    {/*
                      Колона без адрес не оставя празно място за бутон —
                      моделите, които още не са в каталога, показват само
                      снимка, име и описание.
                    */}
                    {c.ctaUrl ? (
                      <Link
                        href={c.ctaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mx-auto mt-4 flex min-h-12 w-full max-w-60 cursor-pointer items-center justify-center rounded-lg bg-ink px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand"
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
                    className="sticky left-0 z-10 bg-shade px-4 py-6 text-left align-middle text-sm font-normal text-ink-muted"
                  >
                    {row.label}
                  </th>
                  {cols.map((c, ci) => (
                    /*
                      Стойностите идват с нов ред вътре в текста — например
                      USB-A и USB-C на два реда. Без whitespace-pre-line те
                      се слепват в едно изречение.
                    */
                    <td
                      key={ci}
                      className="whitespace-pre-line px-4 py-6 text-center align-middle text-base font-semibold"
                    >
                      {(row.values ?? [])[ci]?.value ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  )
}

/* ─────────── Какво има в кутията ─────────── */

const InTheBoxBlock = ({ block, id }: { block: BlockOf<'inTheBox'>; id?: string | null }) => {
  const items = block.items ?? []
  if (!items.length) return null

  return (
    <Section id={id} className="container-site py-12 lg:py-16">
      <BlockHeading>{block.heading ?? 'Какво има в кутията'}</BlockHeading>

      <ul className="grid gap-4 md:grid-cols-3">
        {items.map((item, i) => {
          /*
            Размер „content", не „card". Изрезките на кабела и на
            ръководството са широки; квадратното изрязване на „card" отсича
            краищата им. Фонът на картата е същият сив като на изрезките —
            затова около тях не се вижда ръб.
          */
          const img = sectionImage(item.image)

          return (
            <li key={i} className="flex flex-col rounded-2xl bg-panel p-6 lg:min-h-[550px]">
              <p className="text-base font-semibold">
                {item.name} <span className="tabular">×{item.qty ?? 1}</span>
              </p>

              {/* Картата без снимка показва само името и остава със същата височина. */}
              {img ? (
                <span className="flex flex-1 items-center justify-center pt-6">
                  <SectionImage
                    image={img}
                    alt={mediaAlt(item.image) || item.name}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    /*
                      Ширината е определена, височината следва съотношението
                      и се спира на 320 px. С „w-auto" размерът зависи от
                      декодираната снимка — ако тя закъснее или не се зареди,
                      картата се срутва до нула.
                    */
                    className="h-auto max-h-80 w-full object-contain"
                  />
                </span>
              ) : (
                <span className="flex flex-1 items-center justify-center pt-6">
                  <ImagePlaceholder className="h-48 w-full rounded-lg" />
                </span>
              )}
            </li>
          )
        })}
      </ul>

      {block.caption ? (
        <p className="mt-6 text-center text-xs text-ink-muted">{block.caption}</p>
      ) : null}
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
    <Section id={id} className="container-site py-12 lg:py-16">
      <BlockHeading>{block.heading ?? 'Спецификации'}</BlockHeading>

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
    <Section id={id} className="container-site py-12 lg:py-16">
      <BlockHeading>{block.heading ?? 'Често задавани въпроси'}</BlockHeading>

      {/* Колоната е тясна като при другите текстови секции — дълъг ред се чете зле. */}
      <div className="mx-auto max-w-[56rem] divide-y divide-line border-y border-line">
        {items.map((item, i) => (
          /*
            details/summary работят и без JavaScript. Общото `name` прави
            акордеона изключващ — отварянето на въпрос затваря предишния,
            без нито ред скрипт. Браузър, който не го разбира, просто
            оставя няколко отворени.
          */
          <details key={i} name={`${id ?? 'faq'}-items`} className="group">
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
    <Section id={id} className="container-site py-12 lg:py-16">
      <BlockHeading>{block.heading ?? 'Може да ви заинтересува'}</BlockHeading>

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
