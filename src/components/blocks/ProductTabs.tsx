'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import type { ResponsiveImage } from '@/lib/media'
import { SectionImage } from '../SectionImage'

export type TabRow = {
  iconUrl: string | null
  iconAlt: string
  label: string
  sublabel?: string | null
  value: string
}

export type ShowcaseTab = {
  label: string
  /** Оригиналът с кандидати по ширина — виж `sectionImage`. */
  image: ResponsiveImage | null
  imageAlt: string
  caption?: string | null
  rows: TabRow[]
}

export type TabsLayout = 'side-panel' | 'image-top' | 'tabs-top'

/**
 * Раздели със снимка.
 *
 * Оригиналът ползва три вида. „side-panel" слага снимката вляво и сив
 * панел със стойности вдясно — сценариите на употреба. „image-top" слага
 * снимката на цялата ширина, разделите под нея и едно изречение най-долу —
 * начините за зареждане. „tabs-top" е обратното: разделите центрирани
 * НАД снимката, без текст под нея — сценариите на DELTA 3 Max
 * (кухня, хол, кемпер, офис, пералня).
 *
 * Снимките се показват с истинските си размери, без наложено съотношение.
 * Банерите на EcoFlow са панорамни; изрязване до 4:3 отхапваше по-голямата
 * част от кадъра.
 *
 * Клавиатурното поведение следва образеца за раздели: стрелките местят
 * между тях, Home и End отиват на първия и последния. Само активният
 * раздел е във фокусния ред — останалите се стигат със стрелките.
 */
export const ProductTabs = ({
  tabs,
  idBase,
  layout = 'side-panel',
}: {
  tabs: ShowcaseTab[]
  idBase: string
  layout?: TabsLayout
}) => {
  const [active, setActive] = useState(0)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  const focusTab = (i: number) => {
    const next = (i + tabs.length) % tabs.length
    setActive(next)
    buttons.current[next]?.focus()
  }

  if (!tabs.length) return null

  const imageTop = layout === 'image-top'
  const tabsTop = layout === 'tabs-top'

  const tablist = (
    <div
      role="tablist"
      aria-label="Начини на употреба"
      className={`scroll-row scroll-row-center border-b border-line ${
        imageTop ? 'order-2 mt-8' : tabsTop ? 'mb-8' : ''
      }`}
    >
      {tabs.map((tab, i) => (
        <button
          key={i}
          ref={(el) => {
            buttons.current[i] = el
          }}
          role="tab"
          type="button"
          id={`${idBase}-tab-${i}`}
          aria-selected={active === i}
          aria-controls={`${idBase}-panel-${i}`}
          tabIndex={active === i ? 0 : -1}
          onClick={() => setActive(i)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') {
              e.preventDefault()
              focusTab(i + 1)
            }
            if (e.key === 'ArrowLeft') {
              e.preventDefault()
              focusTab(i - 1)
            }
            if (e.key === 'Home') {
              e.preventDefault()
              focusTab(0)
            }
            if (e.key === 'End') {
              e.preventDefault()
              focusTab(tabs.length - 1)
            }
          }}
          className={`-mb-px inline-flex min-h-12 cursor-pointer items-center whitespace-nowrap border-b-2 px-5 text-sm transition-colors duration-200 ${
            active === i
              ? 'border-ink font-medium text-ink'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )

  /*
    Снимка отгоре, раздели отдолу.

    Редът в кода е разделите → снимката → текстът, а „order" ги подрежда
    визуално обратното. Така екранните четци срещат разделите преди
    съдържанието им, а окото вижда подредбата от оригинала.
  */
  if (imageTop) {
    return (
      <div className="flex flex-col">
        {tablist}

        {tabs.map((tab, i) => (
          <div
            key={i}
            role="tabpanel"
            id={`${idBase}-panel-${i}`}
            aria-labelledby={`${idBase}-tab-${i}`}
            hidden={active !== i}
            className="order-1"
          >
            {tab.image ? (
              <SectionImage
                image={tab.image}
                alt={tab.imageAlt}
                sizes="(max-width: 1408px) 100vw, 1408px"
                // Само първият раздел е видим при зареждане.
                priority={i === 0}
                className="h-auto w-full rounded-2xl"
              />
            ) : null}
          </div>
        ))}

        {tabs.map((tab, i) =>
          tab.caption ? (
            <p
              key={i}
              hidden={active !== i}
              className="order-3 mt-5 text-center text-sm leading-relaxed text-ink-muted"
            >
              {tab.caption}
            </p>
          ) : null,
        )}
      </div>
    )
  }

  /*
    Раздели над снимката.

    Лентата е същата като при другите подредби — центрирана, с черта под
    активния раздел. Снимката е цяла, на пълна ширина, с естествената си
    височина. Текстът под разделите (`caption`) идва под нея и се сменя
    заедно с раздела; празен не показва нищо.
  */
  if (tabsTop) {
    return (
      <div>
        {tablist}

        {tabs.map((tab, i) => (
          <div
            key={i}
            role="tabpanel"
            id={`${idBase}-panel-${i}`}
            aria-labelledby={`${idBase}-tab-${i}`}
            hidden={active !== i}
          >
            {tab.image ? (
              <SectionImage
                image={tab.image}
                alt={tab.imageAlt}
                sizes="(max-width: 1408px) 100vw, 1408px"
                priority={i === 0}
                className="h-auto w-full rounded-2xl"
              />
            ) : null}

            {tab.caption ? (
              <p className="mx-auto mt-5 max-w-[56rem] text-center text-sm leading-relaxed text-ink-muted">
                {tab.caption}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    )
  }

  /* Снимка вляво, сив панел със стойности вдясно. */
  return (
    <div>
      {tablist}

      {tabs.map((tab, i) => {
        // Раздел без стойности не бива да оставя празен сив правоъгълник.
        const withPanel = tab.rows.length > 0

        return (
          <div
            key={i}
            role="tabpanel"
            id={`${idBase}-panel-${i}`}
            aria-labelledby={`${idBase}-tab-${i}`}
            hidden={active !== i}
            className="pt-8"
          >
            <div className={`grid gap-4 ${withPanel ? 'lg:grid-cols-3' : ''}`}>
              {tab.image ? (
                <div className={withPanel ? 'lg:col-span-2' : ''}>
                  <SectionImage
                    image={tab.image}
                    alt={tab.imageAlt}
                    // Две трети от контейнера от 1408px.
                    sizes={
                      withPanel ? '(max-width: 1024px) 100vw, 939px' : '(max-width: 1408px) 100vw, 1408px'
                    }
                    priority={i === 0}
                    className="h-auto w-full rounded-2xl"
                  />
                </div>
              ) : null}

              {/*
                Панелът се разпъва до височината на снимката — това е
                поведението на grid по подразбиране, затова тук няма
                зададена височина. Съдържанието стои в средата.
              */}
              {withPanel ? (
                <ul className="flex flex-col justify-center divide-y divide-line rounded-2xl bg-panel px-6">
                  {tab.rows.map((row, ri) => (
                    <li key={ri} className="py-5">
                      <div className="flex items-center gap-2">
                        {row.iconUrl ? (
                          <Image
                            src={row.iconUrl}
                            alt={row.iconAlt}
                            width={32}
                            height={32}
                            className="size-8 shrink-0 object-contain"
                          />
                        ) : null}

                        <span className="text-sm">
                          {row.label}
                          {row.sublabel ? (
                            <span className="text-ink-muted"> ({row.sublabel})</span>
                          ) : null}
                        </span>
                      </div>

                      <p className="tabular mt-1 text-2xl font-bold sm:text-3xl">{row.value}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
