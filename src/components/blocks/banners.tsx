import { CaretRight } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import Link from 'next/link'

import type { Page } from '@/payload-types'
import { bannerImage, mediaAlt, mediaUrl } from '@/lib/media'
import { SectionImage } from '../SectionImage'
import { HeroSlider, type HeroSlide } from '../HeroSlider'
import { ScrollRow } from '../ScrollRow'
import { BannerButton, BannerEyebrow, PageSection, SectionHeading } from './section'
import { ImagePlaceholder } from '../ImagePlaceholder'

type Layout = NonNullable<Page['layout']>
type BlockOf<T extends string> = Extract<Layout[number], { blockType: T }>

/* ─────────── Голям банер ─────────── */

export const HeroBannerBlock = ({ block }: { block: BlockOf<'heroBanner'> }) => {
  const slides: HeroSlide[] = (block.slides ?? []).map((slide) => ({
    // Webp размерите, изрязани от CSS — виж `bannerImage`.
    desktop: bannerImage(slide.image),
    mobile: bannerImage(slide.imageMobile),
    alt: mediaAlt(slide.image),
    badgeUrl: mediaUrl(slide.badgeImage, 'content'),
    badgeAlt: mediaAlt(slide.badgeImage),
    eyebrow: slide.eyebrow,
    eyebrowColor: slide.eyebrowColor,
    heading: slide.heading,
    subheading: slide.subheading,
    note: slide.note,
    overlay: slide.overlay,
    align: slide.align,
    dark: slide.theme !== 'light',
    ctaLabel: slide.cta?.label,
    ctaUrl: slide.cta?.url,
    ctaNewTab: slide.cta?.newTab,
    ctaStyle: slide.cta?.style,
  }))

  if (!slides.length) return null

  return <HeroSlider slides={slides} autoplaySeconds={block.autoplaySeconds} />
}

/* ─────────── Широк банер ─────────── */

export const WideBannerBlock = ({ block }: { block: BlockOf<'wideBanner'> }) => {
  // Webp размерите, изрязани от CSS — виж `bannerImage`.
  const img = bannerImage(block.image)
  const dark = block.theme !== 'light'

  return (
    <PageSection>
      <SectionHeading>{block.sectionTitle}</SectionHeading>

      <div className="relative overflow-hidden rounded-2xl">
        <div className="relative aspect-[16/9] w-full sm:aspect-[3/1]">
          {img ? (
            <SectionImage
              image={img}
              sizes="100vw"
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <ImagePlaceholder className="absolute inset-0" />
          )}

          <div className="absolute inset-0 flex items-center">
            <div className="w-full px-6 sm:px-12">
              <div
                className={`flex max-w-lg flex-col gap-3 ${dark ? 'text-white' : 'text-ink'}`}
              >
                <BannerEyebrow
                  text={block.eyebrow}
                  color={block.eyebrowColor}
                  dark={dark}
                />

                <h3 className="text-2xl font-normal leading-tight sm:text-3xl lg:text-[32px]">
                  {block.heading}
                </h3>

                {block.subheading ? (
                  <p className="text-[15px] leading-snug sm:text-base">{block.subheading}</p>
                ) : null}

                {/* Цената е по избор — банерите за серия нямат такава. */}
                {block.priceNote ? (
                  <p className="tabular text-base font-medium">{block.priceNote}</p>
                ) : null}

                <div className="mt-2">
                  <BannerButton
                    label={block.cta?.label}
                    url={block.cta?.url}
                    newTab={block.cta?.newTab}
                    style={block.cta?.style}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageSection>
  )
}

/* ─────────── Две половинки ─────────── */

export const PromoCardsBlock = ({ block }: { block: BlockOf<'promoCards'> }) => {
  const cards = block.cards ?? []
  if (!cards.length) return null

  return (
    <PageSection>
      <SectionHeading>{block.sectionTitle}</SectionHeading>

      <div className={`grid gap-4 ${cards.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {cards.map((card, i) => {
          const img = mediaUrl(card.image, 'content')
          const dark = card.theme !== 'light'
          return (
            <div key={i} className="relative overflow-hidden rounded-2xl">
              {/*
                Високи карти — около 1,45:1. Преди тук стоеше 16:10 и
                картите излизаха ниски ленти, а текстът им се лепеше за дъното.
              */}
              <div className="relative aspect-[4/3] w-full sm:aspect-[1.45/1]">
                {img ? (
                  <Image
                    src={img}
                    alt={mediaAlt(card.image)}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    loading="lazy"
                    className="object-cover"
                  />
                ) : (
                  <ImagePlaceholder className="absolute inset-0" />
                )}

                {/* Текстът е ГОРЕ вляво, не долу — както в оригинала. */}
                <div
                  className={`absolute inset-0 flex flex-col items-start gap-2 p-6 sm:p-8 ${
                    dark ? 'text-white' : 'text-ink'
                  }`}
                >
                  <h3 className="text-xl font-medium leading-tight sm:text-2xl">
                    {card.heading}
                  </h3>

                  {card.description ? (
                    <p className="max-w-sm text-[15px] leading-snug">{card.description}</p>
                  ) : null}

                  {/*
                    Текстов линк със стрелка, не овален бутон. В оригинала
                    двете половинки са единственото място с такъв линк.
                  */}
                  {card.cta?.url && card.cta?.label ? (
                    <Link
                      href={card.cta.url}
                      {...(card.cta.newTab
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="mt-1 inline-flex min-h-11 cursor-pointer items-center gap-1 text-[15px] hover:underline"
                    >
                      {card.cta.label}
                      <CaretRight size={14} weight="bold" aria-hidden="true" />
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </PageSection>
  )
}

/* ─────────── Лента с банери ─────────── */

const CARD_BUTTON: Record<string, string> = {
  white: 'bg-white text-ink hover:bg-tile',
  outline: 'border border-white text-white hover:bg-white/15',
  black: 'bg-ink text-white hover:bg-night',
}

export const BannerCarouselBlock = ({ block }: { block: BlockOf<'bannerCarousel'> }) => {
  const cards = block.cards ?? []
  if (!cards.length) return null

  return (
    <section className="py-8 lg:py-12">
      <div className="container-site">
        <SectionHeading>{block.heading}</SectionHeading>
      </div>

      {/*
        Лентата излиза извън контейнера: първата карта застава на неговия
        ляв ръб, а съседната се подава отдясно. Виж `.bleed-row` в globals.css.
      */}
      <ScrollRow
        label={block.heading ?? 'Банери'}
        className="bleed-row flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card, i) => {
          const img = mediaUrl(card.image, 'content')
          const dark = card.textTheme !== 'dark'
          const buttons = card.buttons ?? []

          return (
            <article
              key={i}
              className="relative w-[300px] shrink-0 snap-start overflow-hidden rounded-2xl sm:w-[400px]"
            >
              <div className="relative aspect-[4/5] w-full">
                {img ? (
                  <Image
                    src={img}
                    alt={mediaAlt(card.image)}
                    fill
                    sizes="(max-width: 640px) 300px, 400px"
                    loading="lazy"
                    className="object-cover"
                  />
                ) : (
                  <ImagePlaceholder className="absolute inset-0" />
                )}

                <div
                  className={`absolute inset-0 flex flex-col items-start gap-2 p-6 ${
                    dark ? 'text-white' : 'text-ink'
                  }`}
                >
                  {card.tag ? <p className="text-sm text-flame">{card.tag}</p> : null}

                  {card.heading ? (
                    <h3 className="text-[22px] font-medium leading-tight">{card.heading}</h3>
                  ) : null}

                  {card.subheading ? (
                    <p className="text-[15px] leading-snug">{card.subheading}</p>
                  ) : null}

                  {buttons.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {buttons.map((b, bi) =>
                        b.url ? (
                          <Link
                            key={bi}
                            href={b.url}
                            className={`inline-flex h-11 cursor-pointer items-center justify-center rounded-full px-5 text-sm font-medium transition-colors duration-200 ${
                              CARD_BUTTON[b.style ?? 'white'] ?? CARD_BUTTON.white
                            }`}
                          >
                            {b.label}
                          </Link>
                        ) : null,
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          )
        })}
      </ScrollRow>
    </section>
  )
}
