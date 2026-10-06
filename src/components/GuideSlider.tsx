'use client'

import { CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { ResponsiveImage } from '@/lib/media'
import { ImagePlaceholder } from './ImagePlaceholder'
import { SectionImage } from './SectionImage'

export type GuideSlide = {
  label?: string | null
  desktop: ResponsiveImage | null
  mobile: ResponsiveImage | null
  alt: string
}

/**
 * Слайдерът на блок „Слайдер със снимки" — като на eu.ecoflow.com:
 * заоблена снимка, етикет горе вдясно, кръгли стрелки отстрани и точки
 * отдолу.
 *
 * Смяната е нативен скрол със `scroll-snap` (както `HeroSlider`): пръстът
 * плъзга сам, стрелките и точките само викат `scrollTo`. Без автоматична
 * смяна — това е съдържание за четене, не реклама.
 */
export const GuideSlider = ({ slides, label }: { slides: GuideSlide[]; label: string }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  const go = useCallback((i: number) => {
    const el = ref.current
    const slide = el?.children[i] as HTMLElement | undefined
    if (el && slide) el.scrollTo({ left: slide.offsetLeft - el.offsetLeft, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => {
      const w = (el.children[0] as HTMLElement | undefined)?.offsetWidth ?? el.clientWidth
      setIndex(Math.round(el.scrollLeft / (w + 30)))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const single = slides.length < 2

  return (
    <div role="region" aria-roledescription="слайдер" aria-label={label}>
      <div className="relative">
        <div
          ref={ref}
          className="flex snap-x snap-mandatory gap-[30px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((s, i) => (
            <div
              key={i}
              aria-roledescription="слайд"
              aria-label={`${i + 1} от ${slides.length}${s.label ? `: ${s.label}` : ''}`}
              className="relative w-full shrink-0 snap-start overflow-hidden rounded-lg"
            >
              {s.desktop || s.mobile ? (
                s.desktop && s.mobile ? (
                  <>
                    <SectionImage
                      image={s.mobile}
                      alt={s.alt}
                      sizes="(min-width: 768px) 1px, 100vw"
                      className="h-auto w-full md:hidden"
                    />
                    <SectionImage
                      image={s.desktop}
                      alt={s.alt}
                      sizes="(max-width: 767px) 1px, (max-width: 1264px) 100vw, 1200px"
                      className="hidden aspect-[20/7] w-full object-cover md:block"
                    />
                  </>
                ) : (
                  <SectionImage
                    image={(s.desktop ?? s.mobile)!}
                    alt={s.alt}
                    sizes="(max-width: 1264px) 100vw, 1200px"
                    className="h-auto w-full md:aspect-[20/7] md:object-cover"
                  />
                )
              ) : (
                <ImagePlaceholder className="aspect-[20/7] w-full" />
              )}

              {s.label ? (
                <span className="absolute right-0 top-0 rounded-bl-lg rounded-tr-lg bg-black/50 px-[18px] py-[7px] text-sm font-medium text-white md:text-base">
                  {s.label}
                </span>
              ) : null}
            </div>
          ))}
        </div>

        {!single ? (
          <>
            <button
              type="button"
              onClick={() => go(Math.max(0, index - 1))}
              disabled={index === 0}
              aria-label="Предишен слайд"
              className="absolute left-6 top-1/2 hidden size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[#414141]/80 text-white transition-opacity duration-200 hover:bg-[#414141] disabled:cursor-default disabled:opacity-0 md:flex"
            >
              <CaretLeft size={20} weight="bold" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(Math.min(slides.length - 1, index + 1))}
              disabled={index === slides.length - 1}
              aria-label="Следващ слайд"
              className="absolute right-6 top-1/2 hidden size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[#414141]/80 text-white transition-opacity duration-200 hover:bg-[#414141] disabled:cursor-default disabled:opacity-0 md:flex"
            >
              <CaretRight size={20} weight="bold" aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>

      {!single ? (
        <div className="mt-5 flex justify-center">
          {slides.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Слайд ${i + 1}${s.label ? `: ${s.label}` : ''}`}
              aria-current={i === index ? 'true' : undefined}
              className="flex size-6 cursor-pointer items-center justify-center"
            >
              <span
                className={`block size-2 rounded-full transition-colors duration-200 ${
                  i === index ? 'bg-[#919191]' : 'bg-[#dddddd]'
                }`}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
