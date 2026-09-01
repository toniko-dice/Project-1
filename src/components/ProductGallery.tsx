'use client'

import { CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

export type GalleryImage = { url: string; alt: string }

/**
 * Продуктова галерия.
 *
 * На телефон се плъзга с пръст — самата лента е скролваща и снимките се
 * захващат със `scroll-snap`. На широк екран същата лента се управлява със
 * стрелки, с чертичките отдолу и с клавиатурата.
 *
 * Няма безкраен цикъл: на първата снимка стрелката назад изчезва, на
 * последната — напред.
 */
export const ProductGallery = ({ images }: { images: GalleryImage[] }) => {
  const [index, setIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const isProgrammatic = useRef(false)

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(images.length - 1, next))
    setIndex(clamped)

    const track = trackRef.current
    if (!track) return
    isProgrammatic.current = true
    track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' })
    // Плъзгането отвътре не бива да връща индекса назад, докато траe анимацията.
    window.setTimeout(() => {
      isProgrammatic.current = false
    }, 400)
  }

  // Плъзгане с пръст — индексът следва позицията на лентата.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let frame = 0
    const onScroll = () => {
      if (isProgrammatic.current) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const width = track.clientWidth || 1
        setIndex(Math.round(track.scrollLeft / width))
      })
    }

    track.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      track.removeEventListener('scroll', onScroll)
    }
  }, [])

  if (!images.length) return null

  const single = images.length === 1

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div
          ref={trackRef}
          role="group"
          aria-roledescription="карусел"
          aria-label="Снимки на продукта"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') {
              e.preventDefault()
              go(index + 1)
            }
            if (e.key === 'ArrowLeft') {
              e.preventDefault()
              go(index - 1)
            }
          }}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-xl bg-tile [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <div
              key={i}
              className="relative aspect-square w-full shrink-0 snap-start"
              aria-label={`Снимка ${i + 1} от ${images.length}`}
            >
              <Image
                src={img.url}
                alt={img.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                // Само първата снимка се дърпа веднага — деветте наведнъж
                // забавят чувствително първото зареждане.
                priority={i === 0}
                loading={i === 0 ? undefined : 'lazy'}
                className="object-contain p-6"
              />
            </div>
          ))}
        </div>

        {!single && index > 0 ? (
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Предишна снимка"
            className="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/80 backdrop-blur transition-colors duration-200 hover:bg-white sm:flex"
          >
            <CaretLeft size={18} weight="bold" aria-hidden="true" />
          </button>
        ) : null}

        {!single && index < images.length - 1 ? (
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Следваща снимка"
            className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/80 backdrop-blur transition-colors duration-200 hover:bg-white sm:flex"
          >
            <CaretRight size={18} weight="bold" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {!single ? (
        <div className="flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Снимка ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              className="group flex h-11 cursor-pointer items-center px-1"
            >
              <span
                className={`block h-0.5 w-6 rounded-full transition-colors duration-200 ${
                  i === index ? 'bg-ink' : 'bg-line group-hover:bg-line-strong'
                }`}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
