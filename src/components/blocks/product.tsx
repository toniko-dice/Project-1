import Image from 'next/image'
import Link from 'next/link'

import type { Product } from '@/payload-types'
import { discountPercent, formatEur } from '@/lib/format'
import { mediaAlt, mediaUrl, productCardData, sectionImage } from '@/lib/media'
import { CompareScroll } from '../CompareScroll'
import { SectionImage } from '../SectionImage'
import { ProductCard } from '../ProductCard'
import { BoxTabs } from './BoxTabs'
import { ProductTabs, type ShowcaseTab, type TabsLayout } from './ProductTabs'
import { publishedRelation, resolvedRelations } from '@/lib/relations'

type Sections = NonNullable<Product['sections']>
type Section = Sections[number]
type BlockOf<T extends string> = Extract<Section, { blockType: T }>

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
  // Ни снимка, ни текст — нищо за показване.
  if (!img && !hasText) return null

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

  /*
    Снимка на цяла ширина без снимка няма какво да покаже — голямото поле
    със слой отгоре би било празно място. Секцията пада на подредбата само
    с текст по-долу.
  */
  if (full && img) {
    return (
      <Section id={id} className="py-6">
        <div className="container-site">
          <div className="relative overflow-hidden rounded-xl">
            <div className="relative aspect-[4/5] w-full sm:aspect-[16/9]">
              <SectionImage
                image={img}
                sizes="100vw"
                className="absolute inset-0 size-full object-cover"
              />
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

  /*
    Само текст — без колона за снимка. Иначе половината ширина остава
    празна. Текстът е с ширината на четим ред, както в стекираната
    подредба.
  */
  if (!img) {
    return (
      <Section id={id} className={dark ? 'bg-night py-12 text-white' : 'py-12'}>
        <div className="container-site">
          <div className="max-w-[56rem]">{text}</div>
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
          <SectionImage
            image={img}
            // На широк екран колоната е половин контейнер: 1408 / 2 = 704px.
            sizes="(max-width: 1024px) 100vw, 704px"
            className="h-auto w-full rounded-xl"
          />
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
          const product = publishedRelation(o.product)
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
                  <span className="rounded bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-white max-md:text-xs">
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
    // Чернова — колоната остава с ръчните си полета, без линк към 404.
    const product = publishedRelation(c.product)
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

  /*
    Колона без снимка не показва нищо на мястото ѝ — заместителят е за
    админа, не за посетителя. Мястото обаче се пази, ако ДРУГА колона има
    снимка: иначе имената застават на различни нива. Ако никоя няма —
    редът със снимки изобщо не се рендерира.
  */
  const anyImage = cols.some((c) => c.imageUrl)

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
        {/*
          На телефон (`task-mobilna-optimizaciya.md`, т. 4): таблицата стига
          до ръбовете на екрана, етикетите са 104 px, моделите по 134 px —
          на 375 px се виждат два модела, не един (110 + 2 × 140 от задачата
          не се събират в 343 px между полетата). Снимката до 72 px,
          подзаглавието на един ред, бутонът 36 px.
        */}
        <CompareScroll className="overflow-x-auto rounded-2xl bg-shade py-8 max-md:-mx-4 max-md:rounded-none max-md:py-5">
          <table className="w-full min-w-[46rem] border-collapse max-md:w-auto max-md:min-w-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-48 bg-shade px-4 text-left align-bottom max-md:w-[104px] max-md:min-w-[104px] max-md:max-w-[104px] max-md:px-3" />
                {cols.map((c, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="px-4 text-center align-top max-md:w-[134px] max-md:min-w-[134px] max-md:max-w-[134px] max-md:px-2"
                  >
                    {/*
                      Мястото за снимката е с постоянна височина и когато
                      снимка няма. Иначе колоната без снимка вдига името си
                      нагоре и трите имена застават на различни нива.

                      Височината е зададена на самата снимка, не като горна
                      граница — при „max-h" с „w-auto" размерът зависи от
                      декодираната снимка и клетката се срутва, ако тя
                      закъснее.
                    */}
                    {anyImage ? (
                      <span className="mb-4 flex h-44 items-end justify-center max-md:mb-2 max-md:h-[72px]">
                        {c.imageUrl ? (
                          <Image
                            src={c.imageUrl}
                            alt={c.imageAlt}
                            width={360}
                            height={360}
                            sizes="240px"
                            loading="lazy"
                            className="h-44 w-auto max-w-full object-contain max-md:h-[72px]"
                          />
                        ) : null}
                      </span>
                    ) : null}

                    {/*
                      Текущият продукт се различава само по дебелината на
                      името. Толкова стига, за да се хване с поглед.
                    */}
                    <span
                      className={`block text-xl max-md:text-[15px] max-md:leading-snug sm:text-2xl ${
                        c.highlight ? 'font-bold' : 'font-semibold'
                      }`}
                    >
                      {c.name}
                    </span>

                    {c.tagline ? (
                      <span className="mx-auto mt-2 block max-w-64 text-sm font-normal max-md:mt-1 max-md:line-clamp-1 max-md:text-xs max-md:text-ink-muted">
                        {c.tagline}
                      </span>
                    ) : null}

                    {c.price !== null ? (
                      <span className="mt-3 flex flex-wrap items-baseline justify-center gap-2">
                        <span className="tabular text-lg font-bold text-alert max-md:text-base">
                          {formatEur(c.price)}
                        </span>
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
                        className="mx-auto mt-4 flex min-h-12 w-full max-w-60 cursor-pointer items-center justify-center rounded-lg bg-ink px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand max-md:mt-2 max-md:min-h-9 max-md:px-2 max-md:text-[13px]"
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
                    className="sticky left-0 z-10 bg-shade px-4 py-6 text-left align-middle text-sm font-normal text-ink-muted max-md:w-[104px] max-md:max-w-[104px] max-md:px-3 max-md:py-4 max-md:text-[13px] max-md:leading-snug max-md:[overflow-wrap:anywhere]"
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
                      className="whitespace-pre-line px-4 py-6 text-center align-middle text-base font-semibold max-md:px-2 max-md:py-4 max-md:text-sm"
                    >
                      {(row.values ?? [])[ci]?.value ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CompareScroll>
      </div>
    </Section>
  )
}

/* ─────────── Какво има в кутията ─────────── */

type BoxItem = NonNullable<BlockOf<'inTheBox'>['items']>[number]

/** Картите на една кутия — еднакви при раздели и без тях. */
const BoxItems = ({ items }: { items: BoxItem[] }) => (
  <ul className="grid gap-4 md:grid-cols-3">
    {items.map((item, i) => {
      /*
        Размер „content", не „card". Изрезките на кабела и на ръководството
        са широки; квадратното изрязване на „card" отсича краищата им.
        Фонът на картата е същият сив като на изрезките — затова около тях
        не се вижда ръб.
      */
      const img = sectionImage(item.image)

      return (
        <li key={i} className="flex flex-col rounded-2xl bg-panel p-6 lg:min-h-[550px]">
          <p className="text-base font-semibold">
            {item.name} <span className="tabular">×{item.qty ?? 1}</span>
          </p>

          {/*
            Картата без снимка показва само името и остава със същата
            височина (`min-h` на картата) — без заместител на мястото.
          */}
          {img ? (
            <span className="flex flex-1 items-center justify-center pt-6">
              <SectionImage
                image={img}
                alt={mediaAlt(item.image) || item.name}
                sizes="(max-width: 768px) 100vw, 33vw"
                /*
                  Ширината е определена, височината следва съотношението и се
                  спира на 320 px. С „w-auto" размерът зависи от декодираната
                  снимка — ако тя закъснее или не се зареди, картата се
                  срутва до нула.
                */
                className="h-auto max-h-80 w-full object-contain"
              />
            </span>
          ) : null}
        </li>
      )
    })}
  </ul>
)

const InTheBoxBlock = ({ block, id }: { block: BlockOf<'inTheBox'>; id?: string | null }) => {
  const groups = (block.groups ?? []).filter((g) => (g.items ?? []).length)
  const items = block.items ?? []

  // Раздели има само когато са попълнени; иначе блокът е както досега.
  if (!groups.length && !items.length) return null

  return (
    <Section id={id} className="container-site py-12 lg:py-16">
      <BlockHeading>{block.heading ?? 'Какво има в кутията'}</BlockHeading>

      {groups.length ? (
        <BoxTabs
          labels={groups.map((g) => g.label)}
          panels={groups.map((g) => <BoxItems key={g.id ?? g.label} items={g.items ?? []} />)}
          initial={block.defaultGroup ?? 0}
        />
      ) : (
        <BoxItems items={items} />
      )}

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

  /*
    „Идентификация" се сглобява от полетата на продукта, не от
    „Спецификации по групи". Така номерата се въвеждат веднъж — там,
    където им е мястото — и излизат на всяка продуктова страница, без
    повторен внос и без да се преписват на ръка във всяка таблица.

    Празно поле не дава ред: таблица с „SKU: —" е по-лоша от липсващ ред.
  */
  const идентификация = [
    { label: 'Артикулен номер (SKU)', value: product.sku?.trim() },
    { label: 'Баркод (EAN)', value: product.ean?.trim() },
    // Вторият баркод е само при комплекти от две устройства.
    { label: 'Втори баркод (EAN)', value: product.ean2?.trim() },
  ].filter((r): r is { label: string; value: string } => Boolean(r.value))

  const всички = [
    ...groups,
    ...(идентификация.length
      ? [{ groupLabel: 'Идентификация', rows: идентификация, id: 'identification' }]
      : []),
  ]

  if (!всички.length) return null

  return (
    <Section id={id} className="container-site py-12 lg:py-16">
      <BlockHeading>{block.heading ?? 'Спецификации'}</BlockHeading>

      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
        {всички.map((group, gi) => (
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

/**
 * Списъкът с въпроси — общ за продукта и за страниците (блок „Въпроси и
 * отговори" в ръководствата), за да е един и същ акордеон навсякъде.
 * Въпросът е H3: под H2 на секцията, както в оригинала.
 */
export const FaqList = ({
  items,
  name,
}: {
  items: { question?: string | null; answer?: string | null }[]
  /** Общото име на `details` — уникално за страницата. */
  name: string
}) => (
  /* Колоната е тясна като при другите текстови секции — дълъг ред се чете зле. */
  <div className="mx-auto max-w-[56rem] divide-y divide-line border-y border-line">
    {items.map((item, i) => (
      /*
        details/summary работят и без JavaScript. Общото `name` прави
        акордеона изключващ — отварянето на въпрос затваря предишния,
        без нито ред скрипт. Браузър, който не го разбира, просто
        оставя няколко отворени.
      */
      <details key={i} name={name} className="group">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4">
          <h3 className="text-sm font-medium">{item.question}</h3>
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
)

const FaqBlockRenderer = ({ block, id }: { block: BlockOf<'faqBlock'>; id?: string | null }) => {
  const items = block.items ?? []
  if (!items.length) return null

  return (
    <Section id={id} className="container-site py-12 lg:py-16">
      <BlockHeading>{block.heading ?? 'Често задавани въпроси'}</BlockHeading>
      <FaqList items={items} name={`${id ?? 'faq'}-items`} />
    </Section>
  )
}

/* ─────────── Свързани продукти ─────────── */

const RelatedProductsBlock = ({
  block,
  id,
  showBgn,
  accessories,
}: {
  block: BlockOf<'relatedProducts'>
  id?: string | null
  showBgn: boolean
  /** Съвместимите аксесоари — за автоматичния режим. */
  accessories: Product[]
}) => {
  /*
    Автоматично: аксесоарите, при които в „Съвместим с" е избран този
    продукт или серията му. Списъкът се събира на страницата, за да е
    една заявка, а не по една на блок.
  */
  const products =
    block.mode === 'manual'
      ? resolvedRelations<Product>(block.products, 'relatedProducts.products')
      : accessories
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
  accessories = [],
}: {
  sections: Sections
  anchorIds: (string | null)[]
  product: Product
  showBgn: boolean
  accessories?: Product[]
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
          return (
            <RelatedProductsBlock
              key={key}
              block={block}
              id={id}
              showBgn={showBgn}
              accessories={accessories}
            />
          )
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
