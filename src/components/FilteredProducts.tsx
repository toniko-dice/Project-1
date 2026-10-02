'use client'

import { CaretDown, Faders, X } from '@phosphor-icons/react/dist/ssr'
import { type ReactNode, useEffect, useMemo, useState, useSyncExternalStore } from 'react'

import type { Product } from '@/payload-types'
import type { FilterData, FilterGroup } from '@/lib/filters'
import { ProductCard } from './ProductCard'

/**
 * Списък с филтри отстрани — за категориите с аксесоари и за страниците
 * „Аксесоари за …".
 *
 * ФИЛТРИРА СЕ В БРАУЗЪРА. Целият списък е в HTML-а (за търсачките и за
 * посетител без JavaScript), страницата остава статична (CLAUDE.md, т. 14),
 * а смяната на филтър е мигновена, без заявка. Сървърът подава само
 * ключовете на всеки продукт (`src/lib/filters.ts`).
 *
 * ИЗБОРЪТ Е В АДРЕСА — `?duljina=1,2&cena=0-100&kategoriya=kabeli`. Отметка
 * прави нов запис в историята („назад" я маха), споделен линк отваря същия
 * избор. Адресът се чете СЛЕД зареждане (`useSyncExternalStore`), не от
 * `searchParams` на сървъра — иначе страницата става динамична. Адресите с
 * параметри са `noindex, follow` (заглавие от middleware), canonical им е
 * чистият адрес.
 *
 * Отметките са бутони и checkbox-ове, не линкове: всяка комбинация от
 * филтри би била отделен адрес за обхождане.
 */

const СЪБИТИЕ = 'filters:change'
const НА_СТРАНИЦА = 24

const слушай = (обади: () => void) => {
  window.addEventListener('popstate', обади)
  window.addEventListener(СЪБИТИЕ, обади)
  return () => {
    window.removeEventListener('popstate', обади)
    window.removeEventListener(СЪБИТИЕ, обади)
  }
}
const адресът = () => window.location.search

type Избор = { checks: Record<string, string[]>; price: [number, number] | null }

const прочети = (search: string, groups: FilterGroup[]): Избор => {
  const params = new URLSearchParams(search)
  const checks: Record<string, string[]> = {}
  let price: Избор['price'] = null
  for (const g of groups) {
    const raw = params.get(g.param)
    if (!raw) continue
    if (g.kind === 'range') {
      const [lo, hi] = raw.split('-').map(Number)
      if (Number.isFinite(lo) && Number.isFinite(hi) && lo <= hi) price = [lo, hi]
    } else {
      const валидни = new Set(g.options.map((o) => o.value))
      const избрани = raw.split(',').filter((v) => валидни.has(v))
      if (избрани.length) checks[g.param] = избрани
    }
  }
  return { checks, price }
}

/**
 * Записва избора в адреса. Чуждите параметри (utm и подобни) остават;
 * запетаите не се кодират — `?duljina=1,2`, не `1%2C2`. Ключовете са
 * числа и slug-ове, тоест безопасни.
 */
const запиши = (избор: Избор, groups: FilterGroup[], push: boolean) => {
  const наши = new Set(groups.map((g) => g.param))
  const части: string[] = []
  new URLSearchParams(window.location.search).forEach((v, k) => {
    if (!наши.has(k)) части.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
  })
  for (const g of groups) {
    if (g.kind === 'range') {
      if (избор.price) части.push(`${g.param}=${избор.price[0]}-${избор.price[1]}`)
    } else if (избор.checks[g.param]?.length) {
      части.push(`${g.param}=${избор.checks[g.param].join(',')}`)
    }
  }
  const адрес = window.location.pathname + (части.length ? `?${части.join('&')}` : '')
  if (push) window.history.pushState(null, '', адрес)
  else window.history.replaceState(null, '', адрес)
  window.dispatchEvent(new Event(СЪБИТИЕ))
}

const продукта = (n: number) => `${n} ${n === 1 ? 'продукт' : 'продукта'}`

export const FilteredProducts = ({
  products,
  filters,
  showBgn,
}: {
  products: Product[]
  filters: FilterData
  showBgn: boolean
}) => {
  const { groups, items } = filters
  const search = useSyncExternalStore(слушай, адресът, () => '')
  const избор = useMemo(() => прочети(search, groups), [search, groups])

  /*
    Колко карти са разгънати — за ТЕКУЩИЯ избор. Нов избор (друг адрес)
    почва отначало, без ефект: броят се пази заедно с адреса, за който е.
  */
  const [разгънати, setРазгънати] = useState({ search: '', n: НА_СТРАНИЦА })
  const visible = разгънати.search === search ? разгънати.n : НА_СТРАНИЦА
  const [mobileOpen, setMobileOpen] = useState(false)

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])

  /** Минава ли продуктът всички филтри, освен (по избор) един. */
  const минава = (id: number, освен?: string) => {
    const item = itemById.get(id)
    if (!item) return true
    for (const g of groups) {
      if (g.param === освен) continue
      if (g.kind === 'range') {
        if (!избор.price) continue
        if (item.price === null || item.price < избор.price[0] || item.price > избор.price[1]) {
          return false
        }
      } else {
        const избрани = избор.checks[g.param]
        if (!избрани?.length) continue
        // В един филтър — „или"; между филтрите — „и".
        if (!(item.values[g.param] ?? []).some((v) => избрани.includes(v))) return false
      }
    }
    return true
  }

  const резултат = products.filter((p) => минава(p.id))
  const показани = резултат.slice(0, visible)
  const активни = Object.keys(избор.checks).length + (избор.price ? 1 : 0)

  /* Отвореният панел на телефон спира скрола на страницата отдолу. */
  useEffect(() => {
    if (!mobileOpen) return
    const стар = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = стар
    }
  }, [mobileOpen])

  const превключи = (param: string, value: string) => {
    const сега = избор.checks[param] ?? []
    const нови = сега.includes(value) ? сега.filter((v) => v !== value) : [...сега, value]
    const checks = { ...избор.checks, [param]: нови }
    if (!нови.length) delete checks[param]
    запиши({ ...избор, checks }, groups, true)
  }

  const задайЦена = (price: [number, number] | null) => запиши({ ...избор, price }, groups, true)
  const изчисти = () => запиши({ checks: {}, price: null }, groups, true)

  /** Брой продукти с тази стойност — при останалите избрани филтри. */
  const брой = (param: string, value: string) =>
    products.filter(
      (p) => (itemById.get(p.id)?.values[param] ?? []).includes(value) && минава(p.id, param),
    ).length

  const панел = (
    <div className="divide-y divide-line">
      {groups.map((g) => (
        <FilterBlock key={g.param} group={g} active={g.kind === 'range' ? Boolean(избор.price) : Boolean(избор.checks[g.param])}>
          {g.kind === 'range' ? (
            /* Ключът нулира черновата, когато изборът се смени отвън (назад, „Изчисти"). */
            <PriceRange
              key={избор.price ? избор.price.join('-') : 'всички'}
              group={g}
              value={избор.price}
              onCommit={задайЦена}
            />
          ) : (
            <ul className="space-y-1">
              {g.options.map((o) => {
                const избран = избор.checks[g.param]?.includes(o.value) ?? false
                const n = брой(g.param, o.value)
                return (
                  <li key={o.value}>
                    <label
                      className={`flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-1 text-sm transition-colors duration-150 hover:bg-tile ${
                        n === 0 && !избран ? 'text-ink-muted/60' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={избран}
                        onChange={() => превключи(g.param, o.value)}
                        className="size-4 shrink-0 cursor-pointer accent-ink"
                      />
                      <span className="flex-1">{o.label}</span>
                      <span className="tabular text-xs text-ink-muted">({n})</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </FilterBlock>
      ))}
    </div>
  )

  return (
    <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
      {/* ── Десктоп: колона вляво ── */}
      <aside aria-label="Филтри" className="hidden lg:block">
        <div className="sticky top-4 rounded-xl bg-surface px-4 py-2">{панел}</div>
      </aside>

      <div>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-sm font-medium transition-colors duration-200 hover:bg-tile lg:hidden"
          >
            <Faders size={18} aria-hidden="true" />
            Филтри{активни ? ` (${активни})` : ''}
          </button>
          <p className="text-sm text-ink-muted" aria-live="polite">
            {продукта(резултат.length)}
          </p>
          {активни ? (
            <button
              type="button"
              onClick={изчисти}
              className="cursor-pointer text-sm underline underline-offset-2 transition-colors duration-150 hover:text-brand"
            >
              Изчисти филтрите
            </button>
          ) : null}
        </div>

        {показани.length ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 2xl:grid-cols-4">
            {показани.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} showBgn={showBgn} className="h-full" />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl bg-surface py-12 text-center">
            <p className="text-sm text-ink-muted">Няма продукти по тези филтри.</p>
            <button
              type="button"
              onClick={изчисти}
              className="mt-4 inline-flex min-h-11 cursor-pointer items-center rounded-md border border-line-strong px-6 text-sm font-medium transition-colors duration-200 hover:bg-tile"
            >
              Изчисти филтрите
            </button>
          </div>
        )}

        {резултат.length > показани.length ? (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setРазгънати({ search, n: visible + НА_СТРАНИЦА })}
              className="inline-flex min-h-12 cursor-pointer items-center rounded-md border border-line-strong px-8 text-sm font-medium transition-colors duration-200 hover:bg-tile"
            >
              Покажи още ({резултат.length - показани.length})
            </button>
          </div>
        ) : null}
      </div>

      {/* ── Телефон: панел отдолу ── */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Филтри">
          <button
            type="button"
            aria-label="Затвори филтрите"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 cursor-pointer bg-night/40"
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-base font-medium">Филтри</h2>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Затвори"
                className="flex size-11 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 hover:bg-tile"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4">{панел}</div>
            <div className="flex gap-3 border-t border-line p-4">
              <button
                type="button"
                onClick={изчисти}
                disabled={!активни}
                className="min-h-12 flex-1 cursor-pointer rounded-md border border-line-strong text-sm font-medium transition-colors duration-200 hover:bg-tile disabled:cursor-default disabled:opacity-40"
              >
                Изчисти
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="min-h-12 flex-[2] cursor-pointer rounded-md bg-ink text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90"
              >
                Покажи {продукта(резултат.length)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** Сгъваем блок на един филтър. Блок с избрана стойност се отваря сам. */
const FilterBlock = ({
  group,
  active,
  children,
}: {
  group: FilterGroup
  active: boolean
  children: ReactNode
}) => {
  const [отворен, setОтворен] = useState(group.open)
  const виден = отворен || active
  const id = `filter-${group.param}`
  return (
    <section className="py-3">
      <button
        type="button"
        aria-expanded={виден}
        aria-controls={id}
        onClick={() => setОтворен(!виден)}
        className="flex min-h-10 w-full cursor-pointer items-center justify-between gap-2 text-left text-sm font-medium"
      >
        {group.label}
        <CaretDown
          size={14}
          aria-hidden="true"
          className={`shrink-0 transition-transform duration-200 ${виден ? 'rotate-180' : ''}`}
        />
      </button>
      <div id={id} hidden={!виден} className="pt-2">
        {children}
      </div>
    </section>
  )
}

/**
 * Цена „от–до": плъзгач с две дръжки и две полета. Плъзгането мени само
 * чернова; адресът се записва при пускане — иначе всяка стъпка би била
 * запис в историята.
 */
const PriceRange = ({
  group,
  value,
  onCommit,
}: {
  group: Extract<FilterGroup, { kind: 'range' }>
  value: [number, number] | null
  onCommit: (price: [number, number] | null) => void
}) => {
  const { min, max, unit } = group
  const [draft, setDraft] = useState<[number, number]>(value ?? [min, max])

  const потвърди = (next: [number, number] = draft) => {
    const lo = Math.max(min, Math.min(next[0], next[1]))
    const hi = Math.min(max, Math.max(next[0], next[1]))
    onCommit(lo <= min && hi >= max ? null : [lo, hi])
  }

  const процент = (v: number) => ((v - min) / Math.max(1, max - min)) * 100

  return (
    <div className="px-1">
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-line" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-ink"
          style={{ left: `${процент(draft[0])}%`, right: `${100 - процент(draft[1])}%` }}
        />
        {[0, 1].map((i) => (
          <input
            key={i}
            type="range"
            min={min}
            max={max}
            step={1}
            value={draft[i]}
            aria-label={i === 0 ? 'Цена от' : 'Цена до'}
            onChange={(e) => {
              const v = Number(e.target.value)
              setDraft(i === 0 ? [Math.min(v, draft[1]), draft[1]] : [draft[0], Math.max(v, draft[0])])
            }}
            onPointerUp={() => потвърди()}
            onKeyUp={() => потвърди()}
            className="price-thumb pointer-events-none absolute inset-0 w-full appearance-none bg-transparent"
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        {[0, 1].map((i) => (
          <label key={i} className="flex flex-1 items-center gap-1 rounded-md border border-line-strong px-2">
            <span className="sr-only">{i === 0 ? 'Цена от' : 'Цена до'}</span>
            <input
              type="number"
              inputMode="numeric"
              min={min}
              max={max}
              value={draft[i]}
              onChange={(e) => {
                const v = Number(e.target.value)
                setDraft(i === 0 ? [v, draft[1]] : [draft[0], v])
              }}
              onBlur={() => потвърди()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') потвърди()
              }}
              className="tabular min-h-10 w-full min-w-0 bg-transparent text-sm outline-none"
            />
            <span className="text-xs text-ink-muted">{unit}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
