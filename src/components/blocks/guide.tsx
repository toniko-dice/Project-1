import { CaretDown } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import type { CSSProperties } from 'react'

import type { Media, Page, Product } from '@/payload-types'
import { formatBgn, formatEur } from '@/lib/format'
import { mediaAlt, productCardData, sectionImage } from '@/lib/media'
import { runtimeColumns } from '@/lib/page-products'
import { publishedRelation } from '@/lib/relations'
import { BuyButton } from '../BuyButton'
import { CardImage } from '../CardImage'
import { GuideSlider } from '../GuideSlider'
import { ImagePlaceholder } from '../ImagePlaceholder'
import { SectionImage } from '../SectionImage'
import { FaqList } from './product'

/*
  Блоковете на ръководствата (`task-stranica-portativni-elektrocentrali.md`).
  Мерките са от eu.ecoflow.com/pages/portable-power-stations при 1440 px:
  съдържание 1200 px, H2 40 px удебелен, текст 16 px #757575, отстояния
  60 px между секциите (120 над слайдера и под последната).
*/

type Layout = NonNullable<Page['layout']>
type BlockOf<T extends string> = Extract<Layout[number], { blockType: T }>
type MaybeMedia = number | Media | null | undefined

/** Ширината на съдържанието в оригинала — 1200 px, с отстъп на тесен екран. */
const Wrap = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`mx-auto w-full max-w-[1264px] px-4 md:px-8 ${className}`}>{children}</div>
)

/** H2 на секция — 40 px удебелено в центъра, както в оригинала. */
const GuideHeading = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) =>
  children ? (
    <h2 className={`text-center text-[28px] font-bold leading-[1.3] text-black md:text-[40px] ${className}`}>
      {children}
    </h2>
  ) : null

const Lead = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) =>
  children ? (
    <p className={`text-base leading-[1.3] text-[#757575] ${className}`}>{children}</p>
  ) : null

/**
 * Снимка за компютър и за телефон.
 *
 * Двете се рендерират само когато наистина са различни, със `sizes`, които
 * казват на браузъра да не тегли скритата в пълен размер (виж `HeroSlider`).
 * Класовете на всяка се подават отделно — на телефон снимката често е с
 * естествената си височина, на компютър е изрязана в рамка.
 */
const DualImage = ({
  image,
  mobile,
  alt,
  sizes,
  className,
  mobileClassName = className,
  priority = false,
}: {
  image: MaybeMedia
  mobile: MaybeMedia
  alt?: string | null
  sizes: string
  className: string
  mobileClassName?: string
  priority?: boolean
}) => {
  const d = sectionImage(image)
  const m = sectionImage(mobile)
  const altText = alt?.trim() || mediaAlt(image ?? mobile)
  if (!d && !m) return null
  if (d && m) {
    return (
      <>
        <SectionImage
          image={m}
          alt={altText}
          priority={priority}
          sizes={`(min-width: 768px) 1px, 100vw`}
          className={`${mobileClassName} md:hidden`}
        />
        <SectionImage
          image={d}
          alt={altText}
          priority={priority}
          sizes={`(max-width: 767px) 1px, ${sizes}`}
          className={`${className} max-md:hidden`}
        />
      </>
    )
  }
  return (
    <SectionImage image={(d ?? m)!} alt={altText} priority={priority} sizes={sizes} className={className} />
  )
}

/* ─────────── Заглавна снимка (H1) ─────────── */

export const PageHeroBlock = ({ block }: { block: BlockOf<'pageHero'> }) => (
  <section className="relative overflow-hidden">
    {/*
      Снимката е фонът, текстът стои ОТГОРЕ в центъра, тъмен — както в
      оригинала. На телефон снимката е вертикална (около 375×528).
    */}
    <div className="relative aspect-[375/528] w-full md:aspect-auto md:h-[600px]">
      <DualImage
        image={block.image}
        mobile={block.imageMobile}
        alt={block.imageAlt}
        sizes="100vw"
        priority
        className="absolute inset-0 size-full object-cover"
      />
      {/*
        Лек бял воал отгоре: заглавието тук е по-дълго от това на оригинала
        и текстът стига до продуктите на снимката. Воалът пази четимостта,
        без да закрива сцената отдолу.
      */}
      <div className="absolute inset-x-0 top-0 h-3/5 bg-gradient-to-b from-white/70 via-white/40 to-transparent" />
      <div className="absolute inset-x-0 top-0 px-4 pt-8 md:pt-12">
        <div className="mx-auto max-w-[1000px] text-center text-[#222]">
          <h1 className="text-[28px] font-medium leading-[1.2] md:text-[44px] lg:text-[52px]">{block.heading}</h1>
          {block.body ? (
            <p className="mx-auto mt-3 max-w-[880px] text-sm leading-[1.35] md:text-lg">{block.body}</p>
          ) : null}
        </div>
      </div>
    </div>
  </section>
)

/* ─────────── Слайдер със снимки ─────────── */

export const ContentSliderBlock = ({ block }: { block: BlockOf<'contentSlider'> }) => {
  const slides = (block.slides ?? []).map((s) => ({
    label: s.label,
    desktop: sectionImage(s.image),
    mobile: sectionImage(s.imageMobile),
    alt: s.imageAlt?.trim() || mediaAlt(s.image) || s.label || '',
  }))

  return (
    <section className="pb-10 pt-16 md:pb-[60px] md:pt-[120px]">
      <Wrap>
        <div className="mx-auto mb-8 max-w-[800px] text-center md:mb-10">
          <GuideHeading className="mb-4 md:mb-6">{block.heading}</GuideHeading>
          <Lead>{block.body}</Lead>
        </div>
        {slides.length ? <GuideSlider slides={slides} label={block.heading ?? 'Снимки'} /> : null}
      </Wrap>
    </section>
  )
}

/* ─────────── Акордеон със снимка ─────────── */

export const AccordionImageBlock = ({
  block,
  index,
}: {
  block: BlockOf<'accordionImage'>
  /** Позицията на страницата — за уникалното име на акордеона. */
  index: number
}) => {
  const items = block.items ?? []
  if (!items.length) return null

  return (
    <section className="py-10 md:py-[60px]">
      <Wrap>
        <GuideHeading className="mx-auto mb-8 max-w-[800px] md:mb-10">{block.heading}</GuideHeading>

        {/* Сив контейнер: вляво бялата карта, вдясно снимката; на телефон снимката е отгоре. */}
        <div className="flex flex-col overflow-hidden rounded-xl bg-[#f5f5f5] md:min-h-[598px] md:flex-row">
          <div className="relative md:order-2 md:w-1/2">
            <DualImage
              image={block.image}
              mobile={block.imageMobile}
              alt={block.imageAlt}
              sizes="(max-width: 1264px) 50vw, 600px"
              className="absolute inset-0 size-full object-cover"
              mobileClassName="h-auto w-full"
            />
          </div>

          <div className="flex items-center p-4 md:w-1/2 md:px-[77px] md:py-[30px]">
            <div className="w-full overflow-hidden rounded-xl bg-white">
              {items.map((item, i) => (
                /*
                  details/summary — работи без скрипт; общото `name` прави
                  акордеона изключващ. Първата точка е отворена.
                */
                <details
                  key={i}
                  name={`akordeon-${index}`}
                  open={i === 0}
                  className="group border-t-2 border-[#f5f5f5] first:border-t-0"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-6 [&::-webkit-details-marker]:hidden">
                    <h3 className="flex-1 text-sm font-medium leading-[1.4] text-[#03060b]">{item.title}</h3>
                    <span
                      aria-hidden="true"
                      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] text-[#03060b] transition-transform duration-200 group-open:rotate-180"
                    >
                      <CaretDown size={12} weight="bold" />
                    </span>
                  </summary>
                  {item.text ? (
                    <p className="-mt-3.5 px-6 pb-6 text-xs leading-[1.3] text-[#757575]">{item.text}</p>
                  ) : null}
                </details>
              ))}
            </div>
          </div>
        </div>
      </Wrap>
    </section>
  )
}

/* ─────────── Банер снимка + текст ─────────── */

export const SplitBannerBlock = ({ block }: { block: BlockOf<'splitBanner'> }) => (
  /*
    На цялата ширина. На компютър снимката е фонът (вляво сцената, вдясно
    черно — както в оригинала), текстът стои в дясната половина; черният
    фон отдолу пази текста четим и докато снимката се зарежда. На телефон —
    снимката отгоре, текстът отдолу на черно.
  */
  <section className="relative bg-black md:my-[60px]">
    <div className="md:absolute md:inset-0">
      <DualImage
        image={block.image}
        mobile={block.imageMobile}
        alt={block.imageAlt}
        sizes="100vw"
        className="size-full object-cover"
        /*
          Снимките за телефон на EcoFlow са сцена отгоре и черно отдолу
          (там в оригинала ляга текстът). Тук текстът е ПОД снимката, затова
          тя се изрязва до сцената — иначе остава празно черно поле.
        */
        mobileClassName="aspect-[9/5] w-full object-cover object-top"
      />
    </div>
    <div className="relative mx-auto flex max-w-[1250px] md:min-h-[506px] md:items-center md:justify-end md:px-3">
      <div className="px-4 py-10 md:w-[552px] md:px-0 md:py-[60px]">
        <h2 className="text-[28px] font-bold leading-[1.3] text-white md:text-[40px]">{block.heading}</h2>
        {block.body ? (
          <p className="mt-6 text-base leading-[1.3] text-[#c6c6c6]">{block.body}</p>
        ) : null}
        {block.ctaLink && block.ctaLabel ? (
          <Link
            href={block.ctaLink}
            className="mt-6 inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-white px-[43px] text-sm font-medium text-black transition-colors duration-200 hover:bg-tile"
          >
            {block.ctaLabel}
          </Link>
        ) : null}
      </div>
    </div>
  </section>
)

/* ─────────── Време за работа (таблица) ─────────── */

export const RuntimeCompareBlock = ({ block, showBgn }: { block: BlockOf<'runtimeCompare'>; showBgn: boolean }) => {
  /*
    Само публикуваните продукти; стойностите в редовете се взимат по
    позицията на колоната, тоест клетката на скрития продукт отпада с него.
  */
  const cols = runtimeColumns(block)
  if (!cols.length) return null
  const rows = block.rows ?? []

  /*
    Първата колона са етикетите; на телефон лентата се скролва и тя стои
    закачена вляво (`sticky`), за да се вижда кой уред е на кой ред.
    На компютър етикетът е на един ред — колоната е поне 180 px и колкото
    най-дългия етикет („Хладилна кутия 60W:" се чупеше на 120 px).
  */
  const grid = { '--cols': cols.length } as CSSProperties

  return (
    <section className="py-10 md:py-[60px]">
      <Wrap>
        <div className="overflow-hidden rounded-lg bg-[#f4f4f4] pb-10 pt-5 md:pb-[50px]">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <div
              className="grid min-w-max grid-cols-[minmax(104px,120px)_repeat(var(--cols),minmax(168px,1fr))] px-4 md:min-w-0 md:grid-cols-[minmax(180px,max-content)_repeat(var(--cols),minmax(168px,1fr))] md:px-[21px]"
              style={grid}
            >
              <div className="sticky left-0 z-10 bg-[#f4f4f4]" />
              {cols.map(({ product, specLine }) => {
                // Изрязаната снимка с еднакво отстояние — като в картите (`CardImage`).
                const card = productCardData(product)
                return (
                  <div key={product.id} className="flex flex-col items-center px-2 pb-6 pt-6 text-center">
                    <Link href={card.url ?? '#'} className="relative block aspect-square w-full max-w-[217px]">
                      {card.imageUrl ? (
                        <CardImage
                          src={card.imageUrl}
                          alt={card.imageAlt}
                          trimmed={card.imageTrimmed}
                          sizes="217px"
                          hover={false}
                        />
                      ) : (
                        <ImagePlaceholder className="absolute inset-0" />
                      )}
                    </Link>
                    <h3 className="mb-3 mt-2.5 text-base font-medium leading-[1.15] text-black md:text-xl">{card.title}</h3>
                    {/*
                      На широк екран на един ред: „2048Wh | 3000W | 3900W X-Boost"
                      е 237 px при 14 px, а клетката — 223 px; 13 px дава 220.
                      Под 1280 px колоните са по-тесни и редът се пренася.
                    */}
                    <p className="text-sm leading-[1.2] text-[#898989] xl:whitespace-nowrap xl:text-[13px]">
                      {specLine?.trim() || card.tagline}
                    </p>
                    {/* Цената и бутоните — в дъното, на една линия във всички колони. */}
                    <div className="mt-auto" />
                    {card.price !== null ? (
                      <p className="mt-4 flex flex-wrap items-baseline justify-center gap-2">
                        <span className="tabular text-base font-semibold">{formatEur(card.price)}</span>
                        {card.comparePrice ? (
                          <s className="tabular text-sm text-ink-muted">{formatEur(card.comparePrice)}</s>
                        ) : null}
                      </p>
                    ) : null}
                    {showBgn && card.price !== null ? (
                      <p className="tabular mt-0.5 text-xs text-ink-muted">{formatBgn(card.price)}</p>
                    ) : null}
                    <BuyButton product={product} size="sm" tone="dark" className="mt-4" />
                    {card.url ? (
                      <Link
                        href={card.url}
                        className="mt-3 text-sm font-medium text-[#3f68e0] underline-offset-4 hover:underline"
                      >
                        Научете повече &gt;
                      </Link>
                    ) : null}
                  </div>
                )
              })}

              {rows.map((row, r) => (
                <div key={r} className="contents">
                  <div className="sticky left-0 z-10 flex items-center border-t border-[#dddddd] bg-[#f4f4f4] py-4 pr-3 text-sm leading-[1.4] text-[#757575] md:whitespace-nowrap md:pr-6 md:text-base">
                    {row.label}
                  </div>
                  {cols.map(({ product, index }) => (
                    <div
                      key={product.id}
                      className="tabular flex items-center justify-center border-t border-[#dddddd] px-2 py-4 text-center text-base font-medium text-[#03060b] md:text-xl"
                    >
                      {row.values?.[index]?.value || '—'}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Wrap>
    </section>
  )
}

/* ─────────── Снимка + текст с продукт ─────────── */

export const ImageWithTextBlock = ({ block }: { block: BlockOf<'imageWithText'> }) => {
  // Без публикуван продукт няма накъде да води „Купи сега" — блокът не се показва.
  const product = publishedRelation<Product>(block.product)
  if (!product) return null

  return (
    <section className="pb-16 pt-10 md:pb-[120px] md:pt-[60px]">
      <Wrap>
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-5">
          <div className="overflow-hidden rounded-xl">
            <DualImage
              image={block.image}
              mobile={block.imageMobile}
              alt={block.imageAlt}
              sizes="(max-width: 767px) 100vw, 600px"
              className="aspect-[590/342] w-full object-cover"
              mobileClassName="h-auto w-full"
            />
          </div>
          <div className="text-center">
            <h2 className="text-[28px] font-medium leading-[1.3] text-[#03060b] md:text-[40px]">{block.heading}</h2>
            {block.subheading ? (
              <p className="mt-3 text-lg font-semibold leading-[1.3] text-[#03060b] md:text-2xl">{block.subheading}</p>
            ) : null}
            {block.body ? (
              <p className="mt-3 text-base font-medium leading-[1.3] text-[#757575]">{block.body}</p>
            ) : null}
            <BuyButton product={product} size="sm" tone="blue" label={block.ctaLabel} className="mt-6" />
          </div>
        </div>
      </Wrap>
    </section>
  )
}

/* ─────────── Въпроси и отговори ─────────── */

export const GuideFaqBlock = ({ block, index }: { block: BlockOf<'faqBlock'>; index: number }) => {
  const items = block.items ?? []
  if (!items.length) return null

  return (
    <section className="pb-16 pt-10 md:pb-[120px] md:pt-[60px]">
      <Wrap>
        <GuideHeading className="mx-auto mb-8 max-w-[1000px] md:mb-10">{block.heading}</GuideHeading>
        <FaqList items={items} name={`vaprosi-${index}`} />
      </Wrap>
    </section>
  )
}

/* ─────────── Правен текст ─────────── */

export const GuideLegalTextBlock = ({ block }: { block: BlockOf<'legalText'> }) =>
  block.text ? (
    <section className="pb-10">
      <Wrap>
        <p className="whitespace-pre-line text-xs leading-relaxed text-[#757575]">{block.text}</p>
      </Wrap>
    </section>
  ) : null
