'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'

export type TabRow = {
  iconUrl: string | null
  iconAlt: string
  label: string
  sublabel?: string | null
  value: string
}

export type ShowcaseTab = {
  label: string
  imageUrl: string | null
  imageAlt: string
  rows: TabRow[]
}

/**
 * Раздели със снимка и редове.
 *
 * Клавиатурното поведение следва образеца за раздели: стрелките местят
 * между тях, Home и End отиват на първия и последния. Само активният
 * раздел е във фокусния ред — останалите се стигат със стрелките.
 */
export const ProductTabs = ({ tabs, idBase }: { tabs: ShowcaseTab[]; idBase: string }) => {
  const [active, setActive] = useState(0)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  const focusTab = (i: number) => {
    const next = (i + tabs.length) % tabs.length
    setActive(next)
    buttons.current[next]?.focus()
  }

  if (!tabs.length) return null

  return (
    <div>
      <div role="tablist" aria-label="Начини на употреба" className="scroll-row border-b border-line">
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
            className={`inline-flex min-h-12 cursor-pointer items-center whitespace-nowrap border-b-2 px-5 text-sm transition-colors duration-200 ${
              active === i
                ? 'border-ink font-medium text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab, i) => (
        <div
          key={i}
          role="tabpanel"
          id={`${idBase}-panel-${i}`}
          aria-labelledby={`${idBase}-tab-${i}`}
          hidden={active !== i}
          className="pt-6"
        >
          <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
            {tab.imageUrl ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-tile">
                <Image
                  src={tab.imageUrl}
                  alt={tab.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  // Само първият раздел е видим при зареждане.
                  loading={i === 0 ? undefined : 'lazy'}
                  className="object-cover"
                />
              </div>
            ) : null}

            <ul className="divide-y divide-line">
              {tab.rows.map((row, ri) => (
                <li key={ri} className="flex items-center gap-3 py-3">
                  {row.iconUrl ? (
                    <Image
                      src={row.iconUrl}
                      alt={row.iconAlt}
                      width={32}
                      height={32}
                      className="size-8 shrink-0 object-contain"
                    />
                  ) : null}

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{row.label}</span>
                    {row.sublabel ? (
                      <span className="block text-xs text-ink-muted">{row.sublabel}</span>
                    ) : null}
                  </span>

                  <span className="tabular shrink-0 text-base font-semibold">{row.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  )
}
