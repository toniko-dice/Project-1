'use client'

import Link from 'next/link'
import { useMemo, useState, useSyncExternalStore } from 'react'

import type { Product } from '@/payload-types'
import { ProductCard } from './ProductCard'

export type CategoryTab = {
  slug: string
  title: string
  /** Номерата на категорията и на всичко под нея — по тях се филтрира. */
  ids: number[]
}

/**
 * Разделът от адреса — външно състояние, не състояние на React.
 *
 * `useSyncExternalStore` е точно за това: на сървъра връща `null` (там
 * няма адрес и HTML-ът е еднакъв за всички), а на клиента чете
 * `?sub=` веднага след хидратацията. Така страницата остава статична, а
 * споделен линк отваря правилния раздел.
 */
const слушай = (обади: () => void) => {
  window.addEventListener('popstate', обади)
  return () => window.removeEventListener('popstate', обади)
}
const отАдреса = () => new URLSearchParams(window.location.search).get('sub')

const ВСИЧКИ = 'all'
const АКСЕСОАРИ = 'accessories'
const НА_СТРАНИЦА = 24

/**
 * Списъкът с продукти на категорийната страница, с раздели по подсерия.
 *
 * Подсериите нямат собствена страница — те са раздели тук. Изборът стои в
 * адреса (`?sub=delta-3-seriya`), за да може да се сподели и да преживее
 * презареждане, но смяната НЕ презарежда страницата: продуктите вече са
 * изтеглени, филтрирането е на място.
 *
 * `?sub=` не е отделна страница за търсачките — canonical на всички
 * раздели сочи чистия адрес (виж метаданните на страницата).
 *
 * Адресът се чете СЛЕД зареждане, а не от `searchParams` на сървъра.
 * Причината е скоростта: една заявка със `searchParams` прави цялата
 * страница динамична и тя спира да е статична (виж CLAUDE.md, т. 14).
 * Така страницата си остава статична, цялият списък е в HTML-а — важно
 * и за търсачките — а разделът се избира при хидратацията.
 */
export const CategoryProducts = ({
  products,
  accessories,
  tabs,
  showBgn,
  basePath,
  initialTab,
}: {
  products: Product[]
  accessories: Product[]
  tabs: CategoryTab[]
  showBgn: boolean
  basePath: string
  initialTab: string
}) => {
  /* Избраното с клик има предимство пред адреса. */
  const [избран, setИзбран] = useState<string | null>(null)
  const [visible, setVisible] = useState(НА_СТРАНИЦА)

  const отАдресаSub = useSyncExternalStore(слушай, отАдреса, () => null)
  const валиден = отАдресаSub && tabs.some((t) => t.slug === отАдресаSub) ? отАдресаSub : null
  const active = избран ?? валиден ?? initialTab

  const списъци = useMemo(() => {
    const карта = new Map<string, Product[]>()
    карта.set(ВСИЧКИ, products)
    for (const раздел of tabs) {
      const ids = new Set(раздел.ids)
      карта.set(
        раздел.slug,
        products.filter((p) => {
          const id = typeof p.category === 'number' ? p.category : p.category?.id
          return typeof id === 'number' && ids.has(id)
        }),
      )
    }
    if (accessories.length) карта.set(АКСЕСОАРИ, accessories)
    return карта
  }, [products, accessories, tabs])

  const текущи = списъци.get(active) ?? products
  const показани = текущи.slice(0, visible)

  const смени = (slug: string) => {
    setИзбран(slug)
    setVisible(НА_СТРАНИЦА)

    /*
      Адресът се сменя без презареждане и без нов запис в историята:
      разделът е състояние на същата страница, а не отделна стъпка назад.
    */
    const адрес = slug === ВСИЧКИ ? basePath : `${basePath}?sub=${slug}`
    window.history.replaceState(null, '', адрес)
  }

  const раздели = [
    { slug: ВСИЧКИ, title: 'Всички', брой: products.length },
    ...tabs.map((t) => ({ slug: t.slug, title: t.title, брой: (списъци.get(t.slug) ?? []).length })),
    ...(accessories.length
      ? [{ slug: АКСЕСОАРИ, title: 'Аксесоари', брой: accessories.length }]
      : []),
  ]

  return (
    <div>
      {раздели.length > 1 ? (
        <div
          role="tablist"
          aria-label="Раздели в категорията"
          className="scroll-row scroll-row-center mb-8 border-b border-line"
        >
          {раздели.map((раздел) => (
            <button
              key={раздел.slug}
              role="tab"
              type="button"
              aria-selected={active === раздел.slug}
              onClick={() => смени(раздел.slug)}
              className={`-mb-px inline-flex min-h-12 cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-5 text-sm transition-colors duration-200 ${
                active === раздел.slug
                  ? 'border-ink font-medium text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {раздел.title}
              <span className="tabular text-xs opacity-60">{раздел.брой}</span>
            </button>
          ))}
        </div>
      ) : null}

      {показани.length ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {показани.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} showBgn={showBgn} className="h-full" />
            </li>
          ))}
        </ul>
      ) : (
        /* Дървото се пълни преди продуктите — празно не значи счупено. */
        <p className="py-10 text-center text-sm text-ink-muted">Скоро</p>
      )}

      {текущи.length > показани.length ? (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setVisible((n) => n + НА_СТРАНИЦА)}
            className="inline-flex min-h-12 cursor-pointer items-center rounded-md border border-line-strong px-8 text-sm font-medium transition-colors duration-200 hover:bg-tile"
          >
            Покажи още ({текущи.length - показани.length})
          </button>
        </div>
      ) : null}

      {/*
        Разделите филтрират с JavaScript. За посетител без него — и за
        търсачка, която не изпълнява скриптове — тук стоят обикновени
        линкове към същите адреси.
      */}
      <noscript>
        <ul className="mt-8 flex flex-wrap gap-3 text-sm">
          {tabs.map((t) => (
            <li key={t.slug}>
              <Link href={`${basePath}?sub=${t.slug}`} className="underline">
                {t.title}
              </Link>
            </li>
          ))}
        </ul>
      </noscript>
    </div>
  )
}
