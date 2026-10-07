'use client'

import { ArrowRight, CaretDown, CaretUp, EnvelopeSimple, List, MagnifyingGlass, Phone, X } from '@phosphor-icons/react/dist/ssr'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type KeyboardEvent as ReactKeyboardEvent, type PointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import { formatEur } from '@/lib/format'
import { CardImage } from './CardImage'
import { ImagePlaceholder } from './ImagePlaceholder'
import { SearchBar } from './SearchBar'

export type MenuCard = {
  imageUrl: string | null
  imageAlt: string
  /** Изрязаният вариант на снимката — виж `CardImage`. */
  imageTrimmed?: boolean
  title: string
  specLine?: string | null
  url?: string | null
  label?: string | null
  ribbon?: string | null
  /** Цената идва само от продукта — ръчните карти нямат такова поле. */
  price?: number | null
  comparePrice?: number | null
}

export type MenuSection = {
  heading: string
  viewAllLabel?: string | null
  viewAllUrl?: string | null
  featured?: MenuCard | null
  cards: MenuCard[]
  showViewAllTile: boolean
  viewAllTileUrl?: string | null
  /** Надписът на плочката; празно — „Виж всички". */
  viewAllTileLabel?: string | null
}

/** `url` е `null`, когато панелът няма категория — тогава името е текст. */
export type MenuEntry = { key: string; label: string; url: string | null; sections: MenuSection[] }
export type MenuGroup = { heading: string; defaultOpen: boolean; entries: MenuEntry[] }
export type NavItem = {
  label: string
  url?: string | null
  badge?: 'hot' | 'new' | null
  groups: MenuGroup[]
}

const BADGE_TEXT: Record<string, string> = { hot: 'HOT', new: 'НОВО' }

/**
 * Докосване, не мишка — за линковете, които при посочване и отварят нещо.
 *
 * С мишка посочването отваря (панел, меню), а кликът води към страницата.
 * С пръст „посочване" няма: първото докосване само отваря, второто води.
 * Иначе едно докосване и отваря, и навигира — менюто изобщо не се вижда.
 */
const сПръст = (e: PointerEvent) => e.pointerType === 'touch' || e.pointerType === 'pen'

/* ---------- Карта в мрежата ---------- */

const Card = ({
  card,
  large = false,
  onNavigate,
}: {
  card: MenuCard
  large?: boolean
  onNavigate: () => void
}) => {
  const body = (
    <>
      <div className={`relative w-full ${large ? 'aspect-square' : 'aspect-[4/3]'}`}>
        {card.imageUrl ? (
          <CardImage
            src={card.imageUrl}
            alt={card.imageAlt}
            trimmed={Boolean(card.imageTrimmed)}
            sizes={large ? '360px' : '200px'}
            className="p-3"
            hover={false}
          />
        ) : (
          <ImagePlaceholder className="absolute inset-0" />
        )}

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
        {typeof card.price === 'number' ? (
          <p className={`tabular mt-1.5 ${large ? 'text-sm' : 'text-xs'}`}>
            <span className="font-semibold">{formatEur(card.price)}</span>
            {card.comparePrice ? (
              <s className="ml-1.5 text-ink-muted">{formatEur(card.comparePrice)}</s>
            ) : null}
          </p>
        ) : null}
      </div>
    </>
  )

  // Ефектът при посочване: плочката потъмнява от #f2f2f2 към #e8e8e8.
  const shell =
    'flex h-full cursor-pointer flex-col justify-center rounded-lg bg-tile transition-colors duration-200 hover:bg-tile-hover'

  return card.url ? (
    <Link href={card.url} onClick={onNavigate} className={shell}>
      {body}
    </Link>
  ) : (
    <div className={shell.replace('cursor-pointer ', '')}>{body}</div>
  )
}

const ViewAllTile = ({
  url,
  label = 'Виж всички',
  onNavigate,
}: {
  url?: string | null
  label?: string
  onNavigate: () => void
}) => {
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
    <Link href={url} onClick={onNavigate} className={shell}>
      {inner}
    </Link>
  ) : (
    <div className={shell.replace('cursor-pointer ', '')}>{inner}</div>
  )
}

/* ---------- Дясната част на мега менюто ---------- */

const PanelSections = ({
  sections,
  onNavigate,
}: {
  sections: MenuSection[]
  onNavigate: () => void
}) => (
  <div className="space-y-8">
    {sections.map((section, si) => {
      const hasFeatured = Boolean(section.featured?.title)
      return (
        <div key={si}>
          <div className="mb-3 flex items-baseline justify-between gap-4">
            {/*
              Заглавието на раздела води там, където и „Виж всички" —
              категорията или „Аксесоари за …". Без адрес остава текст.
            */}
            <h3 className="border-l-2 border-ink pl-2 text-sm font-medium">
              {section.viewAllUrl ? (
                <Link
                  href={section.viewAllUrl}
                  onClick={onNavigate}
                  className="cursor-pointer underline-offset-2 transition-colors duration-150 hover:text-brand hover:underline"
                >
                  {section.heading}
                </Link>
              ) : (
                section.heading
              )}
            </h3>
            {section.viewAllUrl ? (
              <Link
                href={section.viewAllUrl}
                onClick={onNavigate}
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
                <Card card={section.featured} large onNavigate={onNavigate} />
              </div>
            ) : null}

            {section.cards.map((card, ci) => (
              <Card key={ci} card={card} onNavigate={onNavigate} />
            ))}

            {section.showViewAllTile ? (
              <ViewAllTile
                url={section.viewAllTileUrl ?? section.viewAllUrl}
                label={section.viewAllTileLabel ?? undefined}
                onNavigate={onNavigate}
              />
            ) : null}
          </div>
        </div>
      )
    })}
  </div>
)

/* ---------- Мега меню: сайдбар + панел ---------- */

const MegaMenu = ({
  item,
  index,
  loading,
  onClose,
  onNavigate,
}: {
  item: NavItem
  /** Картите още идват от `/api/menyu`. */
  loading: boolean
  /** Номерът на главната точка — за връщане на фокуса при Esc. */
  index: number
  onClose: () => void
  /** Клик по линк: менюто се затваря веднага. */
  onNavigate: () => void
}) => {
  const allEntries = useMemo(() => item.groups.flatMap((g) => g.entries), [item])
  const [activeKey, setActiveKey] = useState<string>(allEntries[0]?.key ?? '')
  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    item.groups.filter((g, i) => g.defaultOpen || i === 0).map((g) => g.heading),
  )

  /*
    При смяна на главната точка сайдбарът се връща на първата подточка —
    родителят подава `key` по точката и състоянието се ражда наново.
  */

  const active = allEntries.find((e) => e.key === activeKey) ?? allEntries[0]

  return (
    <div
      data-mega={index}
      className="absolute inset-x-0 top-full z-40 hidden border-t border-line bg-surface shadow-lg lg:block"
      onMouseLeave={onClose}
    >
      <div className="container-site flex gap-8 py-8">
        {/*
          Сайдбарът има смисъл само при избор. При единствена точка той би
          показвал един-единствен, вече избран ред — тогава картите взимат
          цялата ширина.
        */}
        {allEntries.length > 1 ? (
        <div className="w-64 shrink-0">
          {item.groups.map((group) => {
            const isOpen = openGroups.includes(group.heading)
            const toggle = () =>
              setOpenGroups(
                isOpen ? openGroups.filter((h) => h !== group.heading) : [...openGroups, group.heading],
              )
            /*
              Заглавието на групата е линк към категорията на главната точка
              само когато групата е една — тогава двете са едно и също
              („Други продукти" → Аксесоари). Стрелката отделно сгъва.
            */
            const groupUrl = item.groups.length === 1 ? item.url : null
            return (
              <div key={group.heading} className="mb-2">
                <div className="flex min-h-11 items-center rounded transition-colors duration-200 hover:bg-nav-hover">
                  {groupUrl ? (
                    <Link
                      href={groupUrl}
                      onClick={onNavigate}
                      className="flex min-h-11 flex-1 cursor-pointer items-center px-2 text-left text-base font-medium hover:text-brand"
                    >
                      {group.heading}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={toggle}
                      className="flex min-h-11 flex-1 cursor-pointer items-center px-2 text-left text-base font-medium"
                    >
                      {group.heading}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-label={isOpen ? `Сгъни „${group.heading}"` : `Разгъни „${group.heading}"`}
                    onClick={toggle}
                    className="flex size-11 shrink-0 cursor-pointer items-center justify-center"
                  >
                    {isOpen ? (
                      <CaretUp size={14} aria-hidden="true" />
                    ) : (
                      <CaretDown size={14} aria-hidden="true" />
                    )}
                  </button>
                </div>

                {isOpen ? (
                  <ul className="mt-1">
                    {group.entries.map((entry) => {
                      const isActive = entry.key === activeKey
                      const cls = `flex min-h-11 w-full cursor-pointer items-center rounded px-4 text-left text-sm transition-colors duration-200 ${
                        isActive ? 'bg-nav-active font-medium' : 'hover:bg-nav-hover'
                      }`
                      return (
                        <li key={entry.key}>
                          {/*
                            Посочване сменя панела вдясно, клик води към
                            категорията. С пръст първото докосване само сменя
                            панела (виж `сПръст`).
                          */}
                          {entry.url ? (
                            <Link
                              href={entry.url}
                              onMouseEnter={() => setActiveKey(entry.key)}
                              onFocus={() => setActiveKey(entry.key)}
                              onPointerDown={(e) => {
                                if (сПръст(e) && !isActive) e.currentTarget.dataset.firstTap = '1'
                              }}
                              onClick={(e) => {
                                if (e.currentTarget.dataset.firstTap) {
                                  delete e.currentTarget.dataset.firstTap
                                  e.preventDefault()
                                  setActiveKey(entry.key)
                                  return
                                }
                                onNavigate()
                              }}
                              aria-current={isActive ? 'true' : undefined}
                              className={cls}
                            >
                              {entry.label}
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onMouseEnter={() => setActiveKey(entry.key)}
                              onFocus={() => setActiveKey(entry.key)}
                              onClick={() => setActiveKey(entry.key)}
                              aria-current={isActive ? 'true' : undefined}
                              className={cls}
                            >
                              {entry.label}
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </div>
            )
          })}
        </div>
        ) : null}

        {/* Панел */}
        <div className="min-w-0 flex-1">
          {active?.sections?.length ? (
            <PanelSections sections={active.sections} onNavigate={onNavigate} />
          ) : loading ? (
            <p className="text-sm text-ink-muted">Зареждане…</p>
          ) : (
            /*
              Панел без показваем продукт — категория, която още няма
              продукти, или списък само с чернови. Преди тук стоеше указание
              за админа („Добавете ги от „Панели в менюто"") — пред
              посетителя. Той вижда кратък ред и линк към категорията.
            */
            <p className="text-sm text-ink-muted">
              Продуктите в тази категория предстоят.{' '}
              {active?.url ? (
                <Link
                  href={active.url}
                  onClick={onNavigate}
                  className="cursor-pointer text-ink underline underline-offset-2"
                >
                  Към категорията
                </Link>
              ) : null}
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
  logoWidth = 600,
  logoHeight = 120,
  logoSuffix,
  logoTagline,
  ctaLabel,
  ctaUrl,
  searchEnabled,
  mobileLinks = [],
  phone,
  email,
}: {
  items: NavItem[]
  logoUrl: string | null
  logoAlt: string
  logoWidth?: number
  logoHeight?: number
  logoSuffix?: string | null
  logoTagline?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  searchEnabled?: boolean | null
  /** Бързите линкове най-долу в менюто на телефон. */
  mobileLinks?: { label: string; url: string }[]
  phone?: string | null
  email?: string | null
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<number | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const barRef = useRef<HTMLUListElement>(null)
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  /*
    Картите в панелите идват отделно — от `/api/menyu`, не с HTML-а на
    страницата (виж `Header.tsx`). Теглят се веднъж: на компютър, когато
    браузърът е свободен след зареждането, или при първото посочване на
    точка от менюто — каквото дойде първо. На телефон не трябват.
  */
  const [карти, setКарти] = useState<Record<string, MenuSection[]> | null>(null)
  const тегли = useRef(false)
  const заредиКарти = () => {
    if (тегли.current) return
    тегли.current = true
    fetch('/api/menyu')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: Record<string, MenuSection[]>) => setКарти(j))
      .catch(() => {
        // Следващото посочване опитва пак.
        тегли.current = false
      })
  }
  useEffect(() => {
    if (!window.matchMedia('(min-width: 1024px)').matches) return
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(заредиКарти, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    // Safari няма requestIdleCallback.
    const t = setTimeout(заредиКарти, 2000)
    return () => clearTimeout(t)
  }, [])

  /** Точката на менюто с картите ѝ, щом са дошли. */
  const сКарти = (item: NavItem): NavItem =>
    карти
      ? {
          ...item,
          groups: item.groups.map((g) => ({
            ...g,
            entries: g.entries.map((e) => ({ ...e, sections: карти[e.key] ?? e.sections })),
          })),
        }
      : item
  const overlayRef = useRef<HTMLDivElement>(null)

  /*
    Лепнещ хедър на телефон и таблет (`< lg`, където е и бутонът „Меню"):
    при скрол надолу се прибира, при скрол нагоре се показва
    (`task-mobilna-optimizaciya.md`, т. 2). На компютър — както досега,
    не лепне. Отворено търсене или меню го държат видим.

    Височината на видимия хедър отива в `--header-offset` на `<html>` —
    лентата с котвите на продукта лепне ПОД него и се качва горе, когато
    той се прибере. Няма две ленти една върху друга.
  */
  const [прибран, setПрибран] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023.98px)')
    let последно = window.scrollY
    let кадър = 0
    const обнови = () => {
      кадър = 0
      const y = window.scrollY
      const dy = y - последно
      // Трептене на пръста и отскок на iOS в края не местят хедъра.
      if (Math.abs(dy) < 8 && y > 0) return
      последно = y
      setПрибран(mq.matches && dy > 0 && y > (navRef.current?.offsetHeight ?? 56))
    }
    const onScroll = () => {
      if (!кадър) кадър = requestAnimationFrame(обнови)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    mq.addEventListener('change', обнови)
    return () => {
      window.removeEventListener('scroll', onScroll)
      mq.removeEventListener('change', обнови)
      if (кадър) cancelAnimationFrame(кадър)
    }
  }, [])

  /*
    След клик по линк менюто се затваря — и НЕ се отваря отново само защото
    мишката още стои върху точката. `заспало` е тази точка; отваря се пак,
    когато мишката излезе от лентата с точките или посочи друга.
  */
  const [заспало, setЗаспало] = useState<number | null>(null)

  const отвори = (i: number) => {
    if (заспало === i) return
    setЗаспало(null)
    setOpenIndex(i)
  }

  /** Клик по линк в менюто — затваря веднага, без да чака мишката да излезе. */
  const следКлик = () => {
    setЗаспало(openIndex)
    setOpenIndex(null)
    setMobileOpen(false)
    setMobileExpanded(null)
  }

  /*
    Смяна на страницата — по какъвто и да е път („назад", линк от
    страницата) — затваря менюто. Сравнява се по време на рендера, не в
    ефект: така затварянето е в същия кадър, без мигване.
  */
  const pathname = usePathname()
  const [страница, setСтраница] = useState(pathname)
  if (страница !== pathname) {
    setСтраница(pathname)
    setOpenIndex(null)
    setMobileOpen(false)
    setMobileExpanded(null)
  }

  /* Заспалата точка се събужда, щом мишката е извън лентата с точките. */
  useEffect(() => {
    if (заспало === null) return
    const onMove = (e: globalThis.PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setЗаспало(null)
    }
    document.addEventListener('pointermove', onMove)
    return () => document.removeEventListener('pointermove', onMove)
  }, [заспало])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      /*
        Фокусът в мега менюто не бива да остане в скрит елемент — връща се
        на главната точка, от която е отворено.
      */
      const mega = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('[data-mega]')
      if (mega) {
        document.querySelector<HTMLElement>(`[data-mega-trigger="${mega.dataset.mega}"]`)?.focus()
      }
      setOpenIndex(null)
      setMobileOpen(false)
      setSearchOpen(false)
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

  /*
    Отвореното мобилно меню спира скрола на страницата; затварянето го
    пуска и връща фокуса на бутона „Меню" — иначе той пада на `body` и
    следващият Tab тръгва от началото на страницата.
  */
  useEffect(() => {
    if (!mobileOpen) return
    const стар = document.body.style.overflow
    const старHtml = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    const бутон = menuBtnRef.current
    return () => {
      document.body.style.overflow = стар
      document.documentElement.style.overflow = старHtml
      бутон?.focus({ preventScroll: true })
    }
  }, [mobileOpen])

  const скрит = прибран && !mobileOpen && !searchOpen && openIndex === null
  useEffect(() => {
    const el = navRef.current
    const задай = () => {
      const лепне = window.matchMedia('(max-width: 1023.98px)').matches
      document.documentElement.style.setProperty(
        '--header-offset',
        лепне && !скрит && el ? `${el.offsetHeight}px` : '0px',
      )
    }
    задай()
    window.addEventListener('resize', задай)
    return () => window.removeEventListener('resize', задай)
  }, [скрит, searchOpen])

  /* Tab не излиза от отвореното меню на цял екран. */
  const пазиФокуса = (e: ReactKeyboardEvent) => {
    if (e.key !== 'Tab' || !overlayRef.current) return
    const цели = overlayRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
    if (!цели.length) return
    const първа = цели[0]!
    const последна = цели[цели.length - 1]!
    if (e.shiftKey && document.activeElement === първа) {
      e.preventDefault()
      последна.focus()
    } else if (!e.shiftKey && document.activeElement === последна) {
      e.preventDefault()
      първа.focus()
    }
  }

  return (
    <header
      ref={navRef}
      className={`relative z-40 border-b border-line bg-surface max-lg:sticky max-lg:top-0 max-lg:transition-transform max-lg:duration-200 ${
        скрит ? 'max-lg:-translate-y-full' : ''
      }`}
    >
      {/* 55 + линията = 56 px на телефон; на компютър 64 + линията, както досега. */}
      <div className="container-site flex h-[55px] items-center gap-3 lg:h-16 lg:gap-6">
        {/*
          Без `aria-label`: името на линка е видимият текст (alt на логото,
          „МАГАЗИН", редът отдолу) + „начална страница" за екранния четец.
          `aria-label`, различен от видимото, пречи на гласовото управление
          („натисни МАГАЗИН" не намира линка).
        */}
        <Link href="/" className="flex shrink-0 flex-col justify-center">
          <span className="flex items-center gap-2">
            {logoUrl ? (
              /*
                Широко лого: 14 px високо — горният ред (лого + „МАГАЗИН")
                е колкото реда „Официален дистрибутор за България" под него
                (6 октомври 2026, по желание на собственика; преди 24 px и
                до 160 px ширина). Ширината следва съотношението, без
                таван. Ширината и височината са истинските, за да не
                трепва при зареждане. Квадратното лого изобщо не стига
                дотук — Header.tsx подава null и излиза надписът.
              */
              <Image
                src={logoUrl}
                alt={logoAlt}
                width={logoWidth}
                height={logoHeight}
                className="h-[14px] w-auto max-w-none object-contain object-left"
                priority
              />
            ) : (
              <span className="font-heading text-lg font-bold tracking-tight">
                ECOFLOW
              </span>
            )}
            {/* Под 360 px лого, „МАГАЗИН", търсене и меню не се събират на един ред. */}
            {logoSuffix ? (
              <span className="border-l border-line pl-2 text-sm font-medium text-ink-muted max-[359px]:hidden">
                {logoSuffix}
              </span>
            ) : null}
          </span>
          {/*
            На телефон 10 px не се чете — там редът е в менюто
            (`task-mobilna-optimizaciya.md`, т. 2); на таблет е 11 px.
          */}
          {logoTagline ? (
            <span className="text-[11px] leading-tight text-ink-muted max-md:hidden lg:text-[10px]">
              {logoTagline}
            </span>
          ) : null}
          <span className="sr-only"> — начална страница</span>
        </Link>

        <nav aria-label="Основна навигация" className="hidden min-w-0 flex-1 justify-center lg:flex">
          <ul ref={barRef} className="flex items-center" onPointerEnter={заредиКарти} onFocus={заредиКарти}>
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

              /*
                Точката никога не се чупи на два реда. При недостиг на място
                се свиват шрифтът (14 px под 1440) и разстоянията — не текстът.
              */
              const base = `relative inline-flex min-h-16 cursor-pointer items-center gap-1 whitespace-nowrap px-2 text-sm transition-colors duration-200 hover:text-brand 2xl:px-3 2xl:text-[15px] ${
                isOpen ? 'border-b-2 border-ink font-medium' : ''
              }`

              return (
                <li key={i}>
                  {hasMenu && item.url ? (
                    /*
                      Точка с меню И категория: посочването отваря менюто,
                      кликът води към категорията („Други продукти" →
                      /kategorii/aksesoari). С пръст — първото докосване
                      отваря, второто води.
                    */
                    <Link
                      href={item.url}
                      data-mega-trigger={i}
                      aria-haspopup="true"
                      aria-expanded={isOpen}
                      onMouseEnter={() => отвори(i)}
                      onFocus={() => отвори(i)}
                      onPointerDown={(e) => {
                        if (сПръст(e) && !isOpen) e.currentTarget.dataset.firstTap = '1'
                      }}
                      onClick={(e) => {
                        if (e.currentTarget.dataset.firstTap) {
                          delete e.currentTarget.dataset.firstTap
                          e.preventDefault()
                          setOpenIndex(i)
                          setSearchOpen(false)
                          return
                        }
                        setSearchOpen(false)
                        setЗаспало(i)
                        setOpenIndex(null)
                      }}
                      className={base}
                    >
                      {inner}
                    </Link>
                  ) : hasMenu ? (
                    <button
                      type="button"
                      data-mega-trigger={i}
                      aria-expanded={isOpen}
                      onClick={() => {
                        setOpenIndex(isOpen ? null : i)
                        /* Клик по точка от менюто прибира лентата за търсене. */
                        setSearchOpen(false)
                      }}
                      onMouseEnter={() => отвори(i)}
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
            /*
              Една и съща икона на всички ширини — на телефон отваря
              същата лента, само че списъкът ѝ заема цялата ширина.
            */
            <button
              type="button"
              aria-label={searchOpen ? 'Затваряне на търсенето' : 'Търсене'}
              aria-expanded={searchOpen}
              onClick={() => {
                setSearchOpen(!searchOpen)
                setOpenIndex(null)
                setMobileOpen(false)
              }}
              className={`inline-flex size-11 cursor-pointer items-center justify-center rounded transition-colors duration-200 hover:bg-nav-hover ${
                searchOpen ? 'bg-nav-active' : ''
              }`}
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
            ref={menuBtnRef}
            type="button"
            aria-label={mobileOpen ? 'Затваряне на менюто' : 'Отваряне на менюто'}
            aria-expanded={mobileOpen}
            aria-controls="mobilno-menyu"
            onClick={() => {
              setMobileOpen(!mobileOpen)
              setSearchOpen(false)
            }}
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded transition-colors duration-200 hover:bg-nav-hover lg:hidden"
          >
            {mobileOpen ? <X size={22} aria-hidden="true" /> : <List size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {searchOpen ? <SearchBar onClose={() => setSearchOpen(false)} /> : null}

      {/*
        Мега менюто и лентата за търсене излизат на едно и също място —
        под хедъра. Докато се търси, минаването с мишката над точка от
        менюто не бива да покрива списъка с резултати; затова менюто чака
        лентата да се затвори (клик по точка я затваря).
      */}
      {!searchOpen && openIndex !== null && items[openIndex]?.groups.length ? (
        <MegaMenu
          key={openIndex}
          item={сКарти(items[openIndex])}
          index={openIndex}
          loading={!карти}
          onClose={() => setOpenIndex(null)}
          onNavigate={следКлик}
        />
      ) : null}

      {/*
        Мобилно меню — на цял екран, над страницата (`task-mobilna-
        optimizaciya.md`, т. 3). Преди беше блок под хедъра, който избутваше
        страницата, а отдолу съдържанието се скролваше. Името води към
        страницата, стрелката до него отваря подменюто — две отделни цели,
        за да не би едно докосване и да отвори, и да навигира. Редовете са
        48 px. Затваря се с X, с Esc и с избор на линк; фокусът се връща на
        бутона „Меню".
      */}
      {mobileOpen ? (
        <div
          ref={overlayRef}
          id="mobilno-menyu"
          role="dialog"
          aria-modal="true"
          aria-label="Меню"
          onKeyDown={пазиФокуса}
          className="fade-in fixed inset-0 z-50 flex h-dvh flex-col bg-surface pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] lg:hidden"
        >
          <div className="container-site flex h-14 shrink-0 items-center justify-between border-b border-line">
            <span className="text-base font-semibold">Меню</span>
            <button
              type="button"
              autoFocus
              aria-label="Затваряне на менюто"
              onClick={() => setMobileOpen(false)}
              className="-mr-2 inline-flex size-12 cursor-pointer items-center justify-center rounded transition-colors duration-200 hover:bg-nav-hover"
            >
              <X size={22} aria-hidden="true" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            <nav aria-label="Мобилна навигация" className="container-site py-3">
              <ul>
                {items.map((item, i) => {
                  const разгънат = mobileExpanded === i
                  const превключи = () => setMobileExpanded(разгънат ? null : i)
                  return (
                    <li key={i} className="border-b border-line last:border-b-0">
                      <div className="flex items-center">
                        {item.url ? (
                          <Link
                            href={item.url}
                            onClick={следКлик}
                            className="flex min-h-12 flex-1 cursor-pointer items-center rounded px-2 text-base font-medium transition-colors duration-200 hover:bg-nav-hover"
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={превключи}
                            className="flex min-h-12 flex-1 cursor-pointer items-center rounded px-2 text-left text-base font-medium transition-colors duration-200 hover:bg-nav-hover"
                          >
                            {item.label}
                          </button>
                        )}
                        {item.groups.length ? (
                          <button
                            type="button"
                            aria-expanded={разгънат}
                            aria-label={разгънат ? `Затвори „${item.label}"` : `Отвори „${item.label}"`}
                            onClick={превключи}
                            className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded transition-colors duration-200 hover:bg-nav-hover"
                          >
                            <CaretDown
                              size={16}
                              aria-hidden="true"
                              className={`transition-transform duration-200 ${разгънат ? 'rotate-180' : ''}`}
                            />
                          </button>
                        ) : null}
                      </div>
                      {разгънат
                        ? item.groups.map((group) => (
                            <div key={group.heading} className="mb-2 ml-2 border-l border-line pl-3">
                              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                                {group.heading}
                              </p>
                              <ul>
                                {group.entries.map((entry) => (
                                  <li key={entry.key}>
                                    {entry.url ? (
                                      <Link
                                        href={entry.url}
                                        onClick={следКлик}
                                        className="flex min-h-12 cursor-pointer items-center rounded px-2 text-[15px] text-ink-muted transition-colors duration-200 hover:bg-nav-hover"
                                      >
                                        {entry.label}
                                      </Link>
                                    ) : (
                                      <span className="flex min-h-12 items-center px-2 text-[15px] text-ink-muted">
                                        {entry.label}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))
                        : null}
                    </li>
                  )
                })}
              </ul>
            </nav>

            {mobileLinks.length || phone || email ? (
              <div className="container-site flex-1 border-t border-line bg-canvas py-3">
                <ul>
                  {mobileLinks.map((l, i) => (
                    <li key={i}>
                      <Link
                        href={l.url}
                        onClick={следКлик}
                        className="flex min-h-12 cursor-pointer items-center rounded px-2 text-[15px] transition-colors duration-200 hover:bg-nav-hover"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                  {phone ? (
                    <li>
                      <a
                        href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                        className="tabular flex min-h-12 cursor-pointer items-center gap-3 rounded px-2 text-[15px] transition-colors duration-200 hover:bg-nav-hover"
                      >
                        <Phone size={18} aria-hidden="true" className="text-ink-muted" />
                        {phone}
                      </a>
                    </li>
                  ) : null}
                  {email ? (
                    <li>
                      <a
                        href={`mailto:${email}`}
                        className="flex min-h-12 cursor-pointer items-center gap-3 rounded px-2 text-[15px] transition-colors duration-200 hover:bg-nav-hover"
                      >
                        <EnvelopeSimple size={18} aria-hidden="true" className="text-ink-muted" />
                        {email}
                      </a>
                    </li>
                  ) : null}
                </ul>
                {logoTagline ? <p className="mt-2 px-2 text-xs text-ink-muted">{logoTagline}</p> : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  )
}
