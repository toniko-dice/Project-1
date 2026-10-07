import { ArrowRight, CaretRight } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import Link from 'next/link'

import type { Category, Page, Product } from '@/payload-types'
import { formatEur } from '@/lib/format'
import { bannerImage, mediaUrl, productImage } from '@/lib/media'
import { publishedRelation } from '@/lib/relations'
import { CardImage } from '../CardImage'
import { getStripCategories } from '@/lib/payload'
import { categoryPath, productPath } from '@/lib/urls'
import { SectionImage } from '../SectionImage'
import { ProductCard } from '../ProductCard'
import { ScrollRow } from '../ScrollRow'
import { BannerButton, BannerEyebrow, PageSection, SectionHeading } from './section'
import { ImagePlaceholder } from '../ImagePlaceholder'
import { resolvedRelations } from '@/lib/relations'
import { carouselProducts } from '@/lib/page-products'

type Layout = NonNullable<Page['layout']>
type BlockOf<T extends string> = Extract<Layout[number], { blockType: T }>

/** Връзките идват като ID или като пълен обект според дълбочината на заявката. */
/* ─────────── Лента с категории ─────────── */

/**
 * Лентата с икони под главния банер.
 *
 * Списъкът НЕ идва от блока — идва от отметката „Показване в лентата с
 * икони" на всяка категория, подредена с влачене (`_order`). Вижте
 * `src/blocks/CategoryStrip.ts` защо: докато блокът държеше собствени
 * връзки, отметката не се четеше никъде и двете се разминаваха мълчаливо.
 *
 * Няма филтър по брой продукти, по икона или по каквото и да било друго —
 * собственикът решава от админа кое е в лентата.
 */
export const CategoryStripBlock = async () => {
  const categories = await getStripCategories()
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
                    <ImagePlaceholder className="absolute inset-0 rounded-lg" />
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

export const ProductCarouselBlock = async ({
  block,
  showBgn,
  guide = false,
}: {
  block: BlockOf<'productCarousel'>
  showBgn: boolean
  /** На страница-ръководство: ширината (1200 px) и заглавието (H2 в центъра) на ръководството. */
  guide?: boolean
}) => {
  // Ръчният списък или всички от „Продукти от категория" — виж `carouselProducts`.
  const products = await carouselProducts(block)
  if (!products.length) return null

  const imageStyle = block.cardStyle === 'image'
  /*
    „Фон на картите": светлият е бялата карта на класическите (текст ink /
    ink-muted — 17:1 и 5,5:1 върху бяло), бутонът е с тъмен контур и се
    запълва при посочване; тъмният е черната карта отпреди, без промяна.
  */
  const dark = block.cardTheme === 'dark'
  const card = (p: Product) => {
    if (!imageStyle) return <ProductCard product={p} showBgn={showBgn} className="h-full" />
    const image = productImage(p, 'trimmed')
    return (
      <Link
        href={productPath(p)}
        className={`group block h-full cursor-pointer overflow-hidden rounded-xl ${
          dark ? 'bg-night' : 'bg-surface transition-shadow duration-200 hover:shadow-md'
        }`}
      >
        <div className={`p-4 ${dark ? 'text-white' : 'text-ink'}`}>
          <h3 className="text-sm font-medium">{p.title}</h3>
          {p.tagline ? (
            <p className={`mt-0.5 text-[11px] ${dark ? 'opacity-75' : 'text-ink-muted'}`}>
              {p.tagline}
            </p>
          ) : null}
          <span
            className={`mt-3 inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-xs font-medium transition-colors duration-200 ${
              dark
                ? 'bg-white/15 group-hover:bg-white/25'
                : 'border border-ink group-hover:bg-ink group-hover:text-white'
            }`}
          >
            Научете повече
            <ArrowRight size={12} weight="bold" aria-hidden="true" />
          </span>
        </div>
        <div className="relative aspect-[4/3] w-full">
          {image.url ? (
            <CardImage
              src={image.url}
              alt={image.alt}
              trimmed={image.trimmed}
              sizes="300px"
              className="p-3"
            />
          ) : (
            <ImagePlaceholder className="absolute inset-0" />
          )}
        </div>
      </Link>
    )
  }

  return (
    <PageSection className={guide ? '!max-w-[1264px]' : ''}>
      {guide ? (
        block.sectionTitle ? (
          <h2 className="mb-8 text-center text-[28px] font-bold leading-[1.3] text-black md:mb-10 md:text-[40px]">
            {block.sectionTitle}
          </h2>
        ) : null
      ) : (
        <SectionHeading>{block.sectionTitle}</SectionHeading>
      )}
      {block.subtitle ? (
        <p className="-mt-4 mb-6 text-sm text-ink-muted">{block.subtitle}</p>
      ) : null}

      {/*
        „Подредба": лентата е същата като при категориите и банерите —
        влачи се с мишка, има стрелки и се управлява от клавиатурата;
        решетката е по 4 на ред, като в категориите, и показва всичко
        наведнъж (ръководството — 16 електроцентрали, петата в лентата
        излизаше отрязана на края на контейнера).
      */}
      {block.arrangement === 'grid' ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <li key={p.id}>{card(p)}</li>
          ))}
        </ul>
      ) : (
        <ScrollRow
          label={block.sectionTitle ?? 'Продукти'}
          className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((p) => (
            <div
              key={p.id}
              className={`shrink-0 snap-start ${
                imageStyle ? 'w-[248px] sm:w-[300px]' : 'w-[220px] sm:w-[248px]'
              }`}
            >
              {card(p)}
            </div>
          ))}
        </ScrollRow>
      )}
    </PageSection>
  )
}

/* ─────────── Банер + продукти ─────────── */

/** Кръглата стрелка › горе вдясно в картите „Виж всички". */
const RoundArrow = () => (
  <span
    aria-hidden="true"
    className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink transition-colors duration-200 group-hover:border-ink"
  >
    <CaretRight size={14} weight="bold" />
  </span>
)

export const BannerProductRowBlock = ({
  block,
  showBgn,
}: {
  block: BlockOf<'bannerProductRow'>
  showBgn: boolean
}) => {
  const products = resolvedRelations<Product>(block.products, 'bannerProductRow.products')
  const banner = block.banner
  // Webp размерите, изрязани от CSS — виж `bannerImage`.
  const bannerImg = bannerImage(banner?.image)
  const videoUrl = mediaUrl(banner?.video)
  // Без снимка текстът е тъмен и бутонът черен, каквато и да е темата — бял върху сивия фон не се чете.
  const noImage = !bannerImg && !videoUrl
  const dark = banner?.theme !== 'light' && !noImage
  // Цената от продукта има предимство пред ръчния текст; чернова — без цена.
  const priceProduct = publishedRelation<Product>(banner?.product)

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

                  {priceProduct ? (
                    <p className="flex flex-wrap items-baseline gap-2 text-base font-medium">
                      <span className="tabular">{formatEur(priceProduct.price)}</span>
                      {priceProduct.compareAtPrice ? (
                        <s className="tabular text-sm font-normal opacity-75">
                          {formatEur(priceProduct.compareAtPrice)}
                        </s>
                      ) : null}
                    </p>
                  ) : banner.priceNote ? (
                    <p className="tabular text-base font-medium">{banner.priceNote}</p>
                  ) : null}

                  <div className="mt-2">
                    <BannerButton
                      label={banner.cta?.label}
                      url={banner.cta?.url}
                      newTab={banner.cta?.newTab}
                      style={noImage ? 'dark' : banner.cta?.style}
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
            Плочката в края на реда: бяла карта с размера на продуктовите
            (клетка от същата мрежа, `flex-1` я разпъва до височината на
            реда) — заглавие горе вляво, кръгла стрелка горе вдясно, снимка
            в дъното; цялата карта е линк. По желание под нея — втора, ниска
            карта само с текст. Без текст или без адрес и на двете колоната
            изобщо не се показва.
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
                    <span className="relative mt-auto block aspect-square w-full pt-4">
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
