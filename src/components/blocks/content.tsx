import { Star } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import Link from 'next/link'

import type { Award, Page, Testimonial } from '@/payload-types'
import { mediaAlt, mediaUrl } from '@/lib/media'
import { Icon } from '../Icon'

type Layout = NonNullable<Page['layout']>
type BlockOf<T extends string> = Extract<Layout[number], { blockType: T }>

const resolved = <T,>(items: (number | T)[] | null | undefined): T[] =>
  (items ?? []).filter((x): x is T => typeof x !== 'number')

export const BenefitsGridBlock = ({ block }: { block: BlockOf<'benefitsGrid'> }) => {
  const items = block.items ?? []
  if (!items.length) return null

  return (
    <section className="container-site py-10">
      {block.sectionTitle ? (
        <h2 className="mb-6 text-xl font-semibold sm:text-2xl">{block.sectionTitle}</h2>
      ) : null}

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item, i) => (
          <li key={i} className="flex flex-col gap-2 border-l border-line pl-4">
            <Icon name={item.icon} size={28} className="text-brand" />
            <h3 className="text-sm font-semibold">{item.title}</h3>
            {item.description ? (
              <p className="text-xs leading-relaxed text-ink-muted">{item.description}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

export const TestimonialsBlockRenderer = ({ block }: { block: BlockOf<'testimonialsBlock'> }) => {
  const testimonials = resolved<Testimonial>(block.testimonials)
  if (!testimonials.length) return null

  return (
    <section className="container-site py-10">
      <h2 className="mb-6 text-xl font-semibold sm:text-2xl">{block.sectionTitle}</h2>

      <ul className="scroll-row lg:grid lg:grid-cols-4 lg:gap-4">
        {testimonials.map((t) => {
          const img = mediaUrl(t.image, 'card')
          return (
            <li
              key={t.id}
              className="w-[280px] overflow-hidden rounded-lg border border-line bg-surface lg:w-auto"
            >
              {img ? (
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={img}
                    alt={mediaAlt(t.image)}
                    fill
                    sizes="(max-width: 1024px) 280px, 25vw"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <div className="p-4">
                {t.rating ? (
                  <p className="mb-2 flex gap-0.5" aria-label={`Оценка ${t.rating} от 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        weight={i < (t.rating ?? 0) ? 'fill' : 'regular'}
                        aria-hidden="true"
                        className="text-accent"
                      />
                    ))}
                  </p>
                ) : null}

                <blockquote className="text-xs leading-relaxed text-ink-muted">
                  {t.quote}
                </blockquote>

                <p className="mt-3 text-xs font-semibold">
                  {t.author}
                  {t.location ? (
                    <span className="font-normal text-ink-muted"> · {t.location}</span>
                  ) : null}
                </p>

                {t.link ? (
                  <Link
                    href={t.link}
                    className="mt-2 inline-flex min-h-9 cursor-pointer items-center text-xs font-medium text-brand underline-offset-2 hover:underline"
                  >
                    Прочетете историята
                  </Link>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export const LogoWallBlock = ({ block }: { block: BlockOf<'logoWall'> }) => {
  const awards = resolved<Award>(block.awards)
  if (!awards.length) return null

  return (
    <section className="container-site py-10">
      {block.sectionTitle ? (
        <h2 className="mb-6 text-xl font-semibold sm:text-2xl">{block.sectionTitle}</h2>
      ) : null}

      <ul className="flex flex-wrap items-center gap-x-10 gap-y-6">
        {awards.map((a) => {
          const logo = mediaUrl(a.logo, 'thumbnail')
          if (!logo) return null
          const img = (
            <Image
              src={logo}
              alt={a.name}
              width={120}
              height={48}
              className="h-10 w-auto object-contain opacity-70 transition-opacity duration-200 hover:opacity-100"
            />
          )
          return (
            <li key={a.id}>
              {a.url ? (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer items-center"
                >
                  {img}
                </a>
              ) : (
                img
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
