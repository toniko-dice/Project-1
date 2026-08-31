import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import Link from 'next/link'

import type { Category, Page, Product } from '@/payload-types'
import { formatEur } from '@/lib/format'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { ProductCard } from '../ProductCard'
import { CtaButton } from './banners'

type Layout = NonNullable<Page['layout']>
type BlockOf<T extends string> = Extract<Layout[number], { blockType: T }>

/** Връзките идват като ID или като пълен обект според дълбочината на заявката. */
const resolved = <T,>(items: (number | T)[] | null | undefined): T[] =>
  (items ?? []).filter((x): x is T => typeof x !== 'number')

export const CategoryStripBlock = ({ block }: { block: BlockOf<'categoryStrip'> }) => {
  const categories = resolved<Category>(block.categories)
  if (!categories.length) return null

  return (
    <section className="container-site py-6">
      <nav aria-label="Категории">
        <ul className="scroll-row sm:grid sm:grid-cols-5 sm:gap-4 lg:grid-cols-9">
          {categories.map((cat) => {
            const icon = mediaUrl(cat.icon, 'thumbnail')
            return (
              <li key={cat.id} className="w-24 sm:w-auto">
                <Link
                  href={`/categories/${cat.slug}`}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-lg p-2 text-center transition-colors duration-150 hover:bg-tile"
                >
                  <span className="flex size-14 items-center justify-center rounded-full bg-tile">
                    {icon ? (
                      <Image
                        src={icon}
                        alt=""
                        width={40}
                        height={40}
                        className="size-9 object-contain"
                      />
                    ) : null}
                  </span>
                  <span className="text-[11px] font-medium leading-tight">{cat.title}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </section>
  )
}

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
    <section className="container-site py-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold sm:text-2xl">{block.sectionTitle}</h2>
        {block.subtitle ? (
          <p className="mt-1 text-sm text-ink-muted">{block.subtitle}</p>
        ) : null}
      </div>

      {block.cardStyle === 'image' ? (
        <ul className="scroll-row">
          {products.map((p) => {
            const img = mediaUrl(p.image, 'card')
            return (
              <li key={p.id} className="w-[248px] sm:w-[300px]">
                <Link
                  href={p.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block cursor-pointer overflow-hidden rounded-lg bg-night"
                >
                  <div className="p-4 text-white">
                    <h3 className="text-sm font-semibold">{p.title}</h3>
                    {p.tagline ? (
                      <p className="mt-0.5 text-[11px] opacity-75">{p.tagline}</p>
                    ) : null}
                    <span className="mt-3 inline-flex min-h-9 items-center gap-1 rounded-full bg-white/15 px-3 text-xs font-medium transition-colors duration-200 group-hover:bg-white/25">
                      Научете повече
                      <ArrowRight size={12} weight="bold" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="relative aspect-[4/3] w-full">
                    {img ? (
                      <Image
                        src={img}
                        alt={mediaAlt(p.image)}
                        fill
                        sizes="300px"
                        className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : null}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <ul className="scroll-row">
          {products.map((p) => (
            <li key={p.id} className="w-[200px] sm:w-[228px]">
              <ProductCard product={p} showBgn={showBgn} className="h-full" />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export const BannerProductRowBlock = ({
  block,
  showBgn,
}: {
  block: BlockOf<'bannerProductRow'>
  showBgn: boolean
}) => {
  const products = resolved<Product>(block.products)
  const banner = block.banner
  const bannerImg = mediaUrl(banner?.image, 'wide')
  const dark = banner?.theme !== 'light'
  const moreImg = mediaUrl(block.moreTile?.image, 'card')

  return (
    <section className="container-site py-6">
      <h2 className="mb-4 text-xl font-semibold sm:text-2xl">{block.sectionTitle}</h2>

      {block.showBanner && banner ? (
        <div className="relative mb-4 overflow-hidden rounded-xl">
          <div className="relative aspect-[16/10] w-full sm:aspect-[3/1]">
            {bannerImg ? (
              <Image
                src={bannerImg}
                alt={mediaAlt(banner.image)}
                fill
                sizes="100vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-night-soft" />
            )}

            <div className={`absolute inset-0 ${dark ? 'bg-black/40' : 'bg-white/25'}`} />

            <div
              className={`absolute inset-0 flex flex-col justify-center gap-2 p-6 sm:p-10 ${
                dark ? 'text-white' : 'text-ink'
              }`}
            >
              {banner.eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-90">
                  {banner.eyebrow}
                </p>
              ) : null}
              {banner.heading ? (
                <h3 className="max-w-lg text-2xl font-bold sm:text-3xl">{banner.heading}</h3>
              ) : null}
              {banner.subheading ? (
                <p className="max-w-md text-sm opacity-95">{banner.subheading}</p>
              ) : null}
              {banner.priceNote ? (
                <p className="tabular text-lg font-semibold">{banner.priceNote}</p>
              ) : null}
              <div className="mt-1">
                <CtaButton
                  label={banner.cta?.label}
                  url={banner.cta?.url}
                  newTab={banner.cta?.newTab}
                  variant={dark ? 'light' : 'solid'}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {products.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} showBgn={showBgn} className="h-full" />
            </li>
          ))}

          {block.showMoreTile && block.moreTile?.url ? (
            <li>
              <Link
                href={block.moreTile.url}
                className="group flex h-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-surface p-4 text-center transition-colors duration-200 hover:border-brand"
              >
                {moreImg ? (
                  <Image
                    src={moreImg}
                    alt=""
                    width={96}
                    height={96}
                    className="size-24 object-contain"
                  />
                ) : null}
                <span className="inline-flex items-center gap-1 text-sm font-semibold">
                  {block.moreTile.label ?? 'Виж още'}
                  <ArrowRight
                    size={14}
                    weight="bold"
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </span>
                {block.moreTile.description ? (
                  <span className="text-xs text-ink-muted">
                    {block.moreTile.description}
                  </span>
                ) : null}
              </Link>
            </li>
          ) : null}
        </ul>
      ) : null}
    </section>
  )
}

/** Изнесено, за да може цената да се ползва и извън продуктовата карта. */
export const PriceLabel = ({ value }: { value: number }) => (
  <span className="tabular font-semibold">{formatEur(value)}</span>
)
