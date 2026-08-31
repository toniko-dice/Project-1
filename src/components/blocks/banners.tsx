import Image from 'next/image'
import Link from 'next/link'

import type { Page } from '@/payload-types'
import { mediaAlt, mediaUrl } from '@/lib/media'

type Layout = NonNullable<Page['layout']>
type BlockOf<T extends string> = Extract<Layout[number], { blockType: T }>

/** Затъмняващият слой пази контраста на текста върху снимка. */
const OVERLAY: Record<string, string> = {
  none: '',
  light: 'bg-black/25',
  medium: 'bg-black/45',
  strong: 'bg-black/65',
}

const ALIGN: Record<string, string> = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
}

export const CtaButton = ({
  label,
  url,
  newTab,
  variant = 'solid',
}: {
  label?: string | null
  url?: string | null
  newTab?: boolean | null
  variant?: 'solid' | 'light'
}) => {
  if (!url || !label) return null
  const styles =
    variant === 'light'
      ? 'bg-surface text-ink hover:bg-tile'
      : 'bg-brand text-white hover:bg-brand-dark'

  return (
    <Link
      href={url}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-7 text-sm font-semibold transition-colors duration-200 ${styles}`}
    >
      {label}
    </Link>
  )
}

export const HeroBannerBlock = ({ block }: { block: BlockOf<'heroBanner'> }) => {
  const desktop = mediaUrl(block.image, 'banner')
  const mobile = mediaUrl(block.imageMobile, 'banner') ?? desktop
  const dark = block.theme !== 'light'

  return (
    <section className="container-site pt-4">
      <div className="relative overflow-hidden rounded-xl">
        <div className="relative aspect-[4/5] w-full sm:aspect-[21/9]">
          {desktop ? (
            <>
              <Image
                src={mobile ?? desktop}
                alt={mediaAlt(block.image)}
                fill
                priority
                sizes="100vw"
                className="object-cover sm:hidden"
              />
              <Image
                src={desktop}
                alt={mediaAlt(block.image)}
                fill
                priority
                sizes="100vw"
                className="hidden object-cover sm:block"
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-night" />
          )}

          <div className={`absolute inset-0 ${OVERLAY[block.overlay ?? 'medium'] ?? ''}`} />

          <div
            className={`absolute inset-0 flex flex-col justify-center gap-3 p-6 sm:p-12 lg:p-16 ${
              ALIGN[block.align ?? 'left']
            } ${dark ? 'text-white' : 'text-ink'}`}
          >
            {block.eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-90">
                {block.eyebrow}
              </p>
            ) : null}

            <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              {block.heading}
            </h1>

            {block.subheading ? (
              <p className="max-w-xl text-sm opacity-95 sm:text-base">{block.subheading}</p>
            ) : null}

            {block.note ? <p className="text-xs opacity-80">{block.note}</p> : null}

            <div className="mt-2">
              <CtaButton
                label={block.cta?.label}
                url={block.cta?.url}
                newTab={block.cta?.newTab}
                variant={dark ? 'light' : 'solid'}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export const WideBannerBlock = ({ block }: { block: BlockOf<'wideBanner'> }) => {
  const img = mediaUrl(block.image, 'wide')
  const dark = block.theme !== 'light'

  return (
    <section className="container-site py-6">
      <div className="relative overflow-hidden rounded-xl">
        <div className="relative aspect-[16/9] w-full sm:aspect-[3/1]">
          {img ? (
            <Image src={img} alt={mediaAlt(block.image)} fill sizes="100vw" className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-night-soft" />
          )}

          <div className={`absolute inset-0 ${dark ? 'bg-black/40' : 'bg-white/30'}`} />

          <div
            className={`absolute inset-0 flex flex-col justify-center gap-3 p-6 sm:p-10 ${
              ALIGN[block.align ?? 'left']
            } ${dark ? 'text-white' : 'text-ink'}`}
          >
            <h2 className="max-w-xl text-2xl font-bold sm:text-3xl">{block.heading}</h2>
            {block.subheading ? (
              <p className="max-w-lg text-sm opacity-95">{block.subheading}</p>
            ) : null}
            <div className="mt-1">
              <CtaButton
                label={block.cta?.label}
                url={block.cta?.url}
                newTab={block.cta?.newTab}
                variant={dark ? 'light' : 'solid'}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export const PromoCardsBlock = ({ block }: { block: BlockOf<'promoCards'> }) => {
  const cards = block.cards ?? []
  if (!cards.length) return null

  return (
    <section className="container-site py-6">
      {block.sectionTitle ? (
        <h2 className="mb-4 text-xl font-semibold sm:text-2xl">{block.sectionTitle}</h2>
      ) : null}

      <div className={`grid gap-4 ${cards.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {cards.map((card, i) => {
          const img = mediaUrl(card.image, 'banner')
          const dark = card.theme !== 'light'
          return (
            <div key={i} className="relative overflow-hidden rounded-xl">
              <div className="relative aspect-[16/10] w-full">
                {img ? (
                  <Image
                    src={img}
                    alt={mediaAlt(card.image)}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-night-soft" />
                )}

                <div className={`absolute inset-0 ${dark ? 'bg-black/35' : 'bg-white/25'}`} />

                <div
                  className={`absolute inset-0 flex flex-col justify-end gap-2 p-6 ${
                    dark ? 'text-white' : 'text-ink'
                  }`}
                >
                  <h3 className="text-lg font-semibold sm:text-xl">{card.heading}</h3>
                  {card.description ? (
                    <p className="max-w-sm text-sm opacity-95">{card.description}</p>
                  ) : null}
                  <div className="mt-1">
                    <CtaButton
                      label={card.cta?.label}
                      url={card.cta?.url}
                      newTab={card.cta?.newTab}
                      variant={dark ? 'light' : 'solid'}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
