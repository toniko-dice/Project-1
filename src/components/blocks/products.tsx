import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import Link from 'next/link'

import type { Category, Page, Product } from '@/payload-types'
import { formatEur } from '@/lib/format'
import { bannerImage, mediaUrl, productImage } from '@/lib/media'
import { categoryPath, productPath } from '@/lib/urls'
import { SectionImage } from '../SectionImage'
import { ProductCard } from '../ProductCard'
import { ScrollRow } from '../ScrollRow'
import { BannerButton, BannerEyebrow, PageSection, SectionHeading } from './section'
import { ImagePlaceholder } from '../ImagePlaceholder'

type Layout = NonNullable<Page['layout']>
type BlockOf<T extends string> = Extract<Layout[number], { blockType: T }>

/** Връзките идват като ID или като пълен обект според дълбочината на заявката. */
const resolved = <T,>(items: (number | T)[] | null | undefined): T[] =>
  (items ?? []).filter((x): x is T => typeof x !== 'number')

/* ─────────── Лента с категории ─────────── */

export const CategoryStripBlock = ({ block }: { block: BlockOf<'categoryStrip'> }) => {
  const categories = resolved<Category>(block.categories)
  if (!categories.length) return null

  return (
    <PageSection>
      <nav aria-label="Категории">
        {/*
          Категориите се разстилат равномерно по цялата ширина.

          `flex-1 basis-0` дава на всяка еднакъв дял от контейнера, а
          `max-w` спира разтягането, когато са малко. Когато престанат да се
          побират, стигат до `min-w`, лентата прелива и започва да се
          скролва — тогава се появяват и стрелките.

          Центрирането е през `scroll-row-center` (safe center), не през
          обикновено `justify-center`: то би скрило първите категории при
          препълване.
        */}
        <ScrollRow
          label="Категории"
          className="scroll-row-center flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((cat) => {
            // `content` не изрязва — иконите са продуктови кадри с различни пропорции.
            const icon = mediaUrl(cat.icon, 'content')
            return (
              <Link
                key={cat.id}
                href={categoryPath(cat.slug)}
                className="flex min-w-[110px] max-w-[180px] flex-1 basis-0 snap-start flex-col items-center gap-2 rounded-lg p-2 text-center transition-colors duration-150 hover:bg-tile"
              >
                {/*
                  Без кръг отдолу. В оригинала иконата е просто снимка на
                  продукта върху фона на страницата.
                */}
                <span className="relative block h-[90px] w-[90px]">
                  {icon ? (
                    <Image
                      src={icon}
                      alt=""
                      fill
                      sizes="90px"
                      loading="lazy"
                      className="object-contain"
                    />
                  ) : (
                    <ImagePlaceholder className="absolute inset-0 rounded-lg" compact />
                  )}
                </span>

                <span className="text-sm leading-tight">{cat.title}</span>

                {cat.stripBadge ? (
                  <span className="text-xs text-alert">{cat.stripBadge}</span>
                ) : null}
              </Link>
            )
          })}
        </ScrollRow>
      </nav>
    </PageSection>
  )
}

/* ─────────── Лента с продукти ─────────── */

export const ProductCarouselBlock = ({
  block,
  showBgn,
}: {
  block: BlockOf<'productCarousel'>
  showBgn: boolean
}) => {
  const products = resolved<Product>(block.products)
  if (!products.length) return null

  return (
    <PageSection>
      <SectionHeading>{block.sectionTitle}</SectionHeading>
      {block.subtitle ? (
        <p className="-mt-4 mb-6 text-sm text-ink-muted">{block.subtitle}</p>
      ) : null}

      {/*
        Лентата е същата като при категориите и банерите — влачи се с мишка,
        има стрелки и се управлява със стрелките на клавиатурата.
      */}
      {block.cardStyle === 'image' ? (
        <ScrollRow
          label={block.sectionTitle ?? 'Продукти'}
          className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((p) => {
            const image = productImage(p, 'card')
            return (
              <div key={p.id} className="w-[248px] shrink-0 snap-start sm:w-[300px]">
                <Link
                  href={productPath(p)}
                  className="group block cursor-pointer overflow-hidden rounded-xl bg-night"
                >
                  <div className="p-4 text-white">
                    <h3 className="text-sm font-medium">{p.title}</h3>
                    {p.tagline ? <p className="mt-0.5 text-[11px] opacity-75">{p.tagline}</p> : null}
                    <span className="mt-3 inline-flex min-h-9 items-center gap-1 rounded-full bg-white/15 px-3 text-xs font-medium transition-colors duration-200 group-hover:bg-white/25">
                      Научете повече
                      <ArrowRight size={12} weight="bold" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="relative aspect-[4/3] w-full">
                    {image.url ? (
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        sizes="300px"
                        loading="lazy"
                        className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <ImagePlaceholder className="absolute inset-0" />
                    )}
                  </div>
                </Link>
              </div>
            )
          })}
        </ScrollRow>
      ) : (
        <ScrollRow
          label={block.sectionTitle ?? 'Продукти'}
          className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((p) => (
            <div key={p.id} className="w-[220px] shrink-0 snap-start sm:w-[248px]">
              <ProductCard product={p} showBgn={showBgn} className="h-full" />
            </div>
          ))}
        </ScrollRow>
      )}
    </PageSection>
  )
}

/* ─────────── Банер + продукти ─────────── */

/** Кръглата стрелка вдясно в картите „Виж всички". */
const RoundArrow = () => (
  <span
    aria-hidden="true"
    className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink transition-colors duration-200 group-hover:border-ink"
  >
    <ArrowRight size={14} weight="bold" />
  </span>
)

export const BannerProductRowBlock = ({
  block,
  showBgn,
}: {
  block: BlockOf<'bannerProductRow'>
  showBgn: boolean
}) => {
  const products = resolved<Product>(block.products)
  const banner = block.banner
  // Webp размерите, изрязани от CSS — виж `bannerImage`.
  const bannerImg = bannerImage(banner?.image)
  const videoUrl = mediaUrl(banner?.video)
  const dark = banner?.theme !== 'light'

  const more = block.moreTile
  const moreImg = mediaUrl(more?.image, 'content')
  const hasTop = Boolean(more?.label && more?.url)
  const hasBottom = Boolean(more?.secondaryLabel && more?.secondaryUrl)
  const showMore = Boolean(block.showMoreTile) && (hasTop || hasBottom)

  return (
    <PageSection>
      <SectionHeading>{block.sectionTitle}</SectionHeading>

      {block.showBanner && banner ? (
        <div className="relative mb-4 overflow-hidden rounded-2xl">
          <div className="relative aspect-[16/10] w-full sm:aspect-[3/1]">
            {bannerImg ? (
              <SectionImage
                image={bannerImg}
                sizes="100vw"
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <ImagePlaceholder className="absolute inset-0" />
            )}

            {/*
              Видеото ляга ВЪРХУ снимката, а не вместо нея. Така снимката се
              вижда, докато то се зарежда, и остава единственото, което се
              вижда при системна настройка за намалено движение — тогава
              класът `motion-video` го скрива (виж globals.css).
            */}
            {videoUrl ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                poster={bannerImg?.src}
                aria-hidden="true"
                className="motion-video absolute inset-0 size-full object-cover"
              >
                <source src={videoUrl} />
              </video>
            ) : null}

            <div className="absolute inset-0 flex items-center">
              <div className="w-full px-6 sm:px-12">
                <div className={`flex max-w-lg flex-col gap-3 ${dark ? 'text-white' : 'text-ink'}`}>
                  <BannerEyebrow
                    text={banner.eyebrow}
                    color={banner.eyebrowColor}
                    dark={dark}
                  />

                  {banner.heading ? (
                    <h3 className="text-2xl font-normal leading-tight sm:text-3xl lg:text-[32px]">
                      {banner.heading}
                    </h3>
                  ) : null}

                  {banner.subheading ? (
                    <p className="text-[15px] leading-snug sm:text-base">{banner.subheading}</p>
                  ) : null}

                  {banner.priceNote ? (
                    <p className="tabular text-base font-medium">{banner.priceNote}</p>
                  ) : null}

                  <div className="mt-2">
                    <BannerButton
                      label={banner.cta?.label}
                      url={banner.cta?.url}
                      newTab={banner.cta?.newTab}
                      style={banner.cta?.style}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {products.length || showMore ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} showBgn={showBgn} className="h-full" />
            </li>
          ))}

          {/*
            Петата колона не е продукт, а две карти една над друга. Ако и
            двете са без текст или без адрес, колоната изобщо не се показва —
            вместо празна пунктирана плочка, каквато стоеше преди.
          */}
          {showMore ? (
            <li className="flex flex-col gap-4">
              {hasTop ? (
                <Link
                  href={more!.url!}
                  className="group flex flex-1 cursor-pointer flex-col rounded-xl bg-surface p-4 transition-shadow duration-200 hover:shadow-md"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-[15px] font-medium leading-snug">{more!.label}</span>
                    <RoundArrow />
                  </span>

                  {more!.description ? (
                    <span className="mt-1 text-sm text-ink-muted">{more!.description}</span>
                  ) : null}

                  {moreImg ? (
                    <span className="relative mt-4 block h-40 w-full">
                      <Image
                        src={moreImg}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 45vw, 18vw"
                        loading="lazy"
                        className="object-contain"
                      />
                    </span>
                  ) : null}
                </Link>
              ) : null}

              {hasBottom ? (
                <Link
                  href={more!.secondaryUrl!}
                  className="group flex cursor-pointer items-start justify-between gap-3 rounded-xl bg-surface p-4 transition-shadow duration-200 hover:shadow-md"
                >
                  <span className="text-[15px] font-medium leading-snug">
                    {more!.secondaryLabel}
                  </span>
                  <RoundArrow />
                </Link>
              ) : null}
            </li>
          ) : null}
        </ul>
      ) : null}
    </PageSection>
  )
}

/** Изнесено, за да може цената да се ползва и извън продуктовата карта. */
export const PriceLabel = ({ value }: { value: number }) => (
  <span className="tabular font-semibold">{formatEur(value)}</span>
)
