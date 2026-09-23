'use client'

import Image from 'next/image'
import type { ResponsiveImage } from '@/lib/media'
import { SectionImage } from './SectionImage'
import { useEffect, useRef, useState } from 'react'

import { BannerButton, BannerEyebrow } from './blocks/section'
import { ImagePlaceholder } from './ImagePlaceholder'

export type HeroSlide = {
  desktop: ResponsiveImage | null
  mobile: ResponsiveImage | null
  alt: string
  badgeUrl: string | null
  badgeAlt: string
  eyebrow?: string | null
  eyebrowColor?: string | null
  heading?: string | null
  subheading?: string | null
  note?: string | null
  overlay?: string | null
  align?: string | null
  dark: boolean
  ctaLabel?: string | null
  ctaUrl?: string | null
  ctaNewTab?: boolean | null
  ctaStyle?: string | null
}

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

/**
 * Голям банер със слайдове.
 *
 * Смяната е нативен скрол със `scroll-snap`, същата техника като в
 * галерията: плъзгането с пръст работи само по себе си, а чертичките и
 * автоматичната смяна само викат `scrollTo`.
 *
 * Банер с един слайд се рендерира без чертички и без таймер — тогава
 * компонентът се държи като обикновен банер.
 */
export const HeroSlider = ({
  slides,
  autoplaySeconds = 6,
}: {
  slides: HeroSlide[]
  autoplaySeconds?: number | null
}) => {
  const [index, setIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const isProgrammatic = useRef(false)

  const go = (next: number) => {
    const track = trackRef.current
    if (!track) return
    const clamped = (next + slides.length) % slides.length
    setIndex(clamped)
    isProgrammatic.current = true
    track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' })
    window.setTimeout(() => {
      isProgrammatic.current = false
    }, 600)
  }

  /* Плъзгане с пръст — чертичките следват позицията на лентата. */
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

  /*
    Автоматична смяна.

    Спира при системна настройка за намалено движение — банер, който се
    мени сам, е точно това, което тази настройка иска да няма. Спира и
    когато разделът е скрит, за да не се натрупват прескочени смени.
  */
  useEffect(() => {
    const seconds = autoplaySeconds ?? 6
    if (slides.length < 2 || !seconds) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') go(index + 1)
    }, seconds * 1000)

    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, slides.length, autoplaySeconds])

  if (!slides.length) return null

  const single = slides.length === 1

  return (
    <section className="relative">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            /*
              На тесен екран банерът е висок и почти квадратен, на широк —
              нисък и широк. Затова съотношение отдолу и постоянна височина
              отгоре, вместо едно съотношение за всички.
            */
            className="relative aspect-[4/5] w-full shrink-0 snap-start sm:aspect-auto sm:h-[560px] lg:h-[680px]"
          >
            {/*
              Двете снимки се рендерират само когато наистина са различни.

              Скритата с `display:none` мери нула — тогава Next предупреждава
              „image is not rendered at full viewport width" и точно това
              излизаше като „1 Issue" в разработка. По-важното: с
              `sizes="100vw"` и на двете браузърът теглеше И ДВЕТЕ в пълен
              размер. Тесният `sizes` за скритата казва на браузъра да вземе
              най-малкия вариант, вместо да дърпа банер от 2400px напразно.
            */}
            {slide.desktop ? (
              slide.mobile ? (
                <>
                  <SectionImage
                    image={slide.mobile}
                    alt={slide.alt}
                    priority={i === 0}
                    sizes="(min-width: 640px) 1px, 100vw"
                    className="absolute inset-0 size-full object-cover sm:hidden"
                  />
                  <SectionImage
                    image={slide.desktop}
                    alt={slide.alt}
                    priority={i === 0}
                    sizes="(max-width: 639px) 1px, 100vw"
                    className="absolute inset-0 hidden size-full object-cover sm:block"
                  />
                </>
              ) : (
                <SectionImage
                  image={slide.desktop}
                  alt={slide.alt}
                  priority={i === 0}
                  sizes="100vw"
                  className="absolute inset-0 size-full object-cover"
                />
              )
            ) : (
              <ImagePlaceholder className="absolute inset-0" />
            )}

            <div className={`absolute inset-0 ${OVERLAY[slide.overlay ?? 'none'] ?? ''}`} />

            {/*
              Текстът тръгва от левия ръб на контейнера — там, където
              започва логото в хедъра. Затова вътре има container-site, а не
              просто отстъп.
            */}
            <div className="absolute inset-0 flex items-center">
              <div className="container-site">
                <div
                  className={`flex max-w-xl flex-col gap-4 ${ALIGN[slide.align ?? 'left']} ${
                    slide.dark ? 'text-white' : 'text-ink'
                  }`}
                >
                  {slide.badgeUrl ? (
                    <Image
                      src={slide.badgeUrl}
                      alt={slide.badgeAlt}
                      width={240}
                      height={40}
                      className="h-10 w-auto max-w-full object-contain object-left"
                    />
                  ) : null}

                  <BannerEyebrow
                    text={slide.eyebrow}
                    color={slide.eyebrowColor}
                    dark={slide.dark}
                  />

                  {slide.heading ? (
                    <h1 className="text-3xl font-medium leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                      {slide.heading}
                    </h1>
                  ) : null}

                  {slide.subheading ? (
                    <p className="text-base leading-snug sm:text-lg lg:text-2xl">
                      {slide.subheading}
                    </p>
                  ) : null}

                  {slide.note ? <p className="text-sm opacity-80">{slide.note}</p> : null}

                  <div className="mt-2">
                    <BannerButton
                      label={slide.ctaLabel}
                      url={slide.ctaUrl}
                      newTab={slide.ctaNewTab}
                      style={slide.ctaStyle}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!single ? (
        <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Слайд ${i + 1} от ${slides.length}`}
              aria-current={i === index ? 'true' : undefined}
              className="group flex h-8 cursor-pointer items-center px-1"
            >
              <span
                className={`block h-0.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-10 bg-white' : 'w-6 bg-white/50 group-hover:bg-white/80'
                }`}
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}
