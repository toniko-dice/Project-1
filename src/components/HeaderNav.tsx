'use client'

import { ArrowRight, CaretDown, CaretUp, List, MagnifyingGlass, X } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

export type MenuCard = {
  imageUrl: string | null
  imageAlt: string
  title: string
  specLine?: string | null
  url?: string | null
  label?: string | null
  ribbon?: string | null
}

export type MenuSection = {
  heading: string
  viewAllLabel?: string | null
  viewAllUrl?: string | null
  featured?: MenuCard | null
  cards: MenuCard[]
  showViewAllTile: boolean
  viewAllTileUrl?: string | null
}

export type MenuEntry = { key: string; label: string; url: string; sections: MenuSection[] }
export type MenuGroup = { heading: string; defaultOpen: boolean; entries: MenuEntry[] }
export type NavItem = {
  label: string
  url?: string | null
  badge?: 'hot' | 'new' | null
  groups: MenuGroup[]
}

const BADGE_TEXT: Record<string, string> = { hot: 'HOT', new: 'НОВО' }

/* ---------- Карта в мрежата ---------- */

const Card = ({ card, large = false }: { card: MenuCard; large?: boolean }) => {
  const body = (
    <>
      <div className={`relative w-full ${large ? 'aspect-square' : 'aspect-[4/3]'}`}>
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.imageAlt}
            fill
            sizes={large ? '360px' : '200px'}
            className="object-contain p-3"
          />
        ) : null}

        {card.ribbon ? (
          <span className="absolute left-2 top-2 rounded-sm bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
            {card.ribbon}
          </span>
        ) : null}
      </div>

      <div className={`px-3 pb-4 text-center ${large ? 'pt-1' : ''}`}>
        {card.label ? (
          <p className="mb-0.5 text-xs font-medium text-info">{card.label}</p>
        ) : null}
        <h4 className={`font-semibold leading-snug ${large ? 'text-xl' : 'text-sm'}`}>
          {card.title}
        </h4>
        {card.specLine ? (
          <p
            className={`mt-1 leading-snug text-ink-muted ${large ? 'text-sm' : 'text-xs'}`}
          >
            {card.specLine}
          </p>
        ) : null}
      </div>
    </>
  )

  // Ефектът при посочване: плочката потъмнява от #f2f2f2 към #e8e8e8.
  const shell =
    'flex h-full cursor-pointer flex-col justify-center rounded-lg bg-tile transition-colors duration-200 hover:bg-tile-hover'

  return card.url ? (
    <Link href={card.url} className={shell}>
      {body}
    </Link>
  ) : (
    <div className={shell.replace('cursor-pointer ', '')}>{body}</div>
  )
}

const ViewAllTile = ({ url, label = 'Виж всички' }: { url?: string | null; label?: string }) => {
  const inner = (
    <>
      <span className="flex size-10 items-center justify-center rounded-full border border-line-strong">
        <ArrowRight size={16} aria-hidden="true" />
      </span>
      <span className="text-sm text-ink-muted">{label}</span>
    </>
  )
  const shell =
    'flex h-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg bg-tile transition-colors duration-200 hover:bg-tile-hover'

  return url ? (
    <Link href={url} className={shell}>
      {inner}
    </Link>
  ) : (
    <div className={shell.replace('cursor-pointer ', '')}>{inner}</div>
  )
}

/* ---------- Дясната част на мега менюто ---------- */

const PanelSections = ({ sections }: { sections: MenuSection[] }) => (
  <div className="space-y-8">
    {sections.map((section, si) => {
      const hasFeatured = Boolean(section.featured?.title)
      return (
        <div key={si}>
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h3 className="border-l-2 border-ink pl-2 text-sm font-medium">
              {section.heading}
            </h3>
            {section.viewAllUrl ? (
              <Link
                href={section.viewAllUrl}
                className="shrink-0 cursor-pointer text-sm text-ink-muted underline-offset-2 transition-colors duration-150 hover:text-ink hover:underline"
              >
                {section.viewAllLabel ?? 'Виж всички'}
              </Link>
            ) : null}
          </div>

          <div
            className={`grid gap-3 ${
              hasFeatured ? 'grid-cols-[1.5fr_1fr_1fr_1fr] grid-rows-2' : 'grid-cols-4'
            }`}
          >
            {hasFeatured && section.featured ? (
              <div className="row-span-2">
                <Card card={section.featured} large />
              </div>
            ) : null}

            {section.cards.map((card, ci) => (
              <Card key={ci} card={card} />
            ))}

            {section.showViewAllTile ? (
              <ViewAllTile url={section.viewAllTileUrl ?? section.viewAllUrl} />
            ) : null}
          </div>
        </div>
      )
    })}
  </div>
)

/* ---------- Мега меню: сайдбар + панел ---------- */

const MegaMenu = ({ item, onClose }: { item: NavItem; onClose: () => void }) => {
  const allEntries = useMemo(() => item.groups.flatMap((g) => g.entries), [item])
  const [activeKey, setActiveKey] = useState<string>(allEntries[0]?.key ?? '')
  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    item.groups.filter((g, i) => g.defaultOpen || i === 0).map((g) => g.heading),
  )

  // При смяна на главната точка сайдбарът се връща на първата подточка.
  useEffect(() => {
    setActiveKey(allEntries[0]?.key ?? '')
    setOpenGroups(item.groups.filter((g, i) => g.defaultOpen || i === 0).map((g) => g.heading))
  }, [item, allEntries])

  const active = allEntries.find((e) => e.key === activeKey) ?? allEntries[0]

  return (
    <div
      className="absolute inset-x-0 top-full z-40 hidden border-t border-line bg-surface shadow-lg lg:block"
      onMouseLeave={onClose}
    >
      <div className="container-site flex gap-8 py-8">
        {/* Сайдбар */}
        <div className="w-64 shrink-0">
          {item.groups.map((group) => {
            const isOpen = openGroups.includes(group.heading)
            return (
              <div key={group.heading} className="mb-2">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenGroups(
                      isOpen
                        ? openGroups.filter((h) => h !== group.heading)
                        : [...openGroups, group.heading],
                    )
                  }
                  className="flex min-h-11 w-full cursor-pointer items-center justify-between rounded px-2 text-left text-base font-medium transition-colors duration-200 hover:bg-nav-hover"
                >
                  {group.heading}
                  {isOpen ? (
                    <CaretUp size={14} aria-hidden="true" />
                  ) : (
                    <CaretDown size={14} aria-hidden="true" />
                  )}
                </button>

                {isOpen ? (
                  <ul className="mt-1">
                    {group.entries.map((entry) => {
                      const isActive = entry.key === activeKey
                      return (
                        <li key={entry.key}>
                          <button
                            type="button"
                            onMouseEnter={() => setActiveKey(entry.key)}
                            onFocus={() => setActiveKey(entry.key)}
                            onClick={() => setActiveKey(entry.key)}
                            aria-current={isActive ? 'true' : undefined}
                            className={`flex min-h-11 w-full cursor-pointer items-center rounded px-4 text-left text-sm transition-colors duration-200 ${
                              isActive ? 'bg-nav-active font-medium' : 'hover:bg-nav-hover'
                            }`}
                          >
                            {entry.label}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </div>
            )
          })}
        </div>

        {/* Панел */}
        <div className="min-w-0 flex-1">
          {active?.sections?.length ? (
            <PanelSections sections={active.sections} />
          ) : (
            <p className="text-sm text-ink-muted">
              Този панел още няма секции. Добавете ги от „Панели в менюто“.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Хедър ---------- */

export const HeaderNav = ({
  items,
  logoUrl,
  logoAlt,
  logoSuffix,
  logoTagline,
  ctaLabel,
  ctaUrl,
  searchEnabled,
}: {
  items: NavItem[]
  logoUrl: string | null
  logoAlt: string
  logoSuffix?: string | null
  logoTagline?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  searchEnabled?: boolean | null
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenIndex(null)
        setMobileOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenIndex(null)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={navRef} className="relative border-b border-line bg-surface">
      <div className="container-site flex h-16 items-center gap-6">
        <Link href="/" className="flex shrink-0 flex-col justify-center" aria-label="Начална страница">
          <span className="flex items-center gap-2">
            {logoUrl ? (
              <Image src={logoUrl} alt={logoAlt} width={132} height={24} className="h-6 w-auto" priority />
            ) : (
              <span className="font-heading text-lg font-bold tracking-tight">
                ECOFLOW
              </span>
            )}
            {logoSuffix ? (
              <span className="border-l border-line pl-2 text-sm font-medium text-ink-muted">
                {logoSuffix}
              </span>
            ) : null}
          </span>
          {logoTagline ? (
            <span className="text-[10px] leading-tight text-ink-muted">{logoTagline}</span>
          ) : null}
        </Link>

        <nav aria-label="Основна навигация" className="hidden flex-1 justify-center lg:flex">
          <ul className="flex items-center">
            {items.map((item, i) => {
              const hasMenu = item.groups.length > 0
              const isOpen = openIndex === i
              // Header.tsx вече е превърнал „none" в null.
              const badge = item.badge ? BADGE_TEXT[item.badge] : null

              const inner = (
                <>
                  {badge ? (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-sm bg-alert px-1 text-[9px] font-bold leading-[14px] text-white">
                      {badge}
                    </span>
                  ) : null}
                  {item.label}
                  {hasMenu ? (
                    isOpen ? (
                      <CaretUp size={11} weight="bold" aria-hidden="true" />
                    ) : (
                      <CaretDown size={11} weight="bold" aria-hidden="true" />
                    )
                  ) : null}
                </>
              )

              const base = `relative inline-flex min-h-16 cursor-pointer items-center gap-1 px-3 text-[15px] transition-colors duration-200 hover:text-brand ${
                isOpen ? 'border-b-2 border-ink font-medium' : ''
              }`

              return (
                <li key={i}>
                  {hasMenu ? (
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                      onMouseEnter={() => setOpenIndex(i)}
                      className={base}
                    >
                      {inner}
                    </button>
                  ) : (
                    <Link
                      href={item.url ?? '#'}
                      onMouseEnter={() => setOpenIndex(null)}
                      className={base}
                    >
                      {inner}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {searchEnabled ? (
            <button
              type="button"
              aria-label="Търсене"
              className="inline-flex size-11 cursor-pointer items-center justify-center rounded transition-colors duration-200 hover:bg-nav-hover"
            >
              <MagnifyingGlass size={20} aria-hidden="true" />
            </button>
          ) : null}

          {ctaUrl ? (
            <Link
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-h-11 cursor-pointer items-center rounded-md bg-brand px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-dark sm:inline-flex"
            >
              {ctaLabel ?? 'Към магазина'}
            </Link>
          ) : null}

          <button
            type="button"
            aria-label={mobileOpen ? 'Затваряне на менюто' : 'Отваряне на менюто'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded transition-colors duration-200 hover:bg-nav-hover lg:hidden"
          >
            {mobileOpen ? <X size={22} aria-hidden="true" /> : <List size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {openIndex !== null && items[openIndex]?.groups.length ? (
        <MegaMenu item={items[openIndex]} onClose={() => setOpenIndex(null)} />
      ) : null}

      {/* Мобилно меню */}
      {mobileOpen ? (
        <div className="max-h-[70vh] overflow-y-auto border-t border-line bg-surface lg:hidden">
          <nav aria-label="Мобилна навигация" className="container-site py-4">
            <ul className="space-y-1">
              {items.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.url ?? '#'}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-11 cursor-pointer items-center rounded px-2 font-medium transition-colors duration-200 hover:bg-nav-hover"
                  >
                    {item.label}
                  </Link>
                  {item.groups.map((group) => (
                    <div key={group.heading} className="ml-2 border-l border-line pl-3">
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        {group.heading}
                      </p>
                      <ul>
                        {group.entries.map((entry) => (
                          <li key={entry.key}>
                            <Link
                              href={entry.url}
                              onClick={() => setMobileOpen(false)}
                              className="flex min-h-11 cursor-pointer items-center rounded px-2 text-sm text-ink-muted transition-colors duration-200 hover:bg-nav-hover"
                            >
                              {entry.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      ) : null}
    </div>
  )
}
