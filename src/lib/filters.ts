import type { Attribute } from '@/payload-types'

import { type AttributeType, attributeParam, formatAttributeValue, normalizeNumber, valueToken } from './attributes'
import {
  type Catalog,
  type CatalogEntry,
  compatibleWithCategory,
  compatibleWithProduct,
  deviceSeries,
  devicesInCategory,
} from './catalog'
import { sortByFilterOrder } from './filter-order'

/**
 * ФИЛТРИТЕ НА СПИСЪК — сглобяват се на сървъра, прилагат се в браузъра.
 *
 * Сървърът дава за всеки продукт само ключовете, по които се филтрира
 * (`FilterItem`), и списъка с филтри (`FilterGroup`). Браузърът не знае
 * нищо за дървото, „Съвместим с" и атрибутите — само сравнява ключове.
 * Така картите и HTML-ът остават същите, а страницата — статична.
 */

export type FilterOption = { value: string; label: string }

export type FilterGroup =
  | { param: string; label: string; kind: 'checkbox'; open: boolean; options: FilterOption[] }
  | { param: string; label: string; kind: 'range'; open: boolean; min: number; max: number; unit: string }

export type FilterItem = {
  id: number
  price: number | null
  /** Параметър → ключовете на продукта: `{ duljina: ['1', '2'], kategoriya: ['kabeli'] }`. */
  values: Record<string, string[]>
}

export type FilterData = { groups: FilterGroup[]; items: FilterItem[] }

/** Къде е списъкът — от това зависи кои филтри има. */
export type FilterScope =
  /** Категория с аксесоари (Кабели, Монтаж и кабели за панели). */
  | { kind: 'category'; categoryId: number }
  /** „Аксесоари" — главната: и филтър „Категория". */
  | { kind: 'accessories-root'; categoryId: number }
  /** „Аксесоари за серия …": „Категория" и „Модел". */
  | { kind: 'series-accessories'; categoryId: number }

const НАЛИЧНОСТ: Record<string, string> = {
  'in-stock': 'Налично',
  'on-request': 'По заявка',
  'out-of-stock': 'Изчерпан',
}

/** Наличността на продукта като ключ — същото подразбиране като на сайта. */
const наличност = (e: CatalogEntry) => e.availability || 'in-stock'

export const buildFilters = ({
  catalog,
  entries,
  attributes,
  scope,
  accessoriesRootId,
  order,
  open,
}: {
  catalog: Catalog
  entries: CatalogEntry[]
  attributes: Attribute[]
  scope: FilterScope
  /** Категорията „Аксесоари" — децата ѝ са опциите на „Категория". */
  accessoriesRootId: number | null
  /** Редът от глобала „Подредба на филтрите" (`filterOrderParams`). */
  order: string[]
  /** Отворените при зареждане (`filterOpenParams`); останалите са затворени. */
  open: string[]
}): FilterData => {
  const items: FilterItem[] = entries.map((e) => ({ id: e.id, price: e.price, values: {} }))
  const добави = (i: number, param: string, value: string) => {
    const v = (items[i].values[param] ??= [])
    if (!v.includes(value)) v.push(value)
  }
  const groups: FilterGroup[] = []

  /* ── Цена ── */
  const цени = entries.flatMap((e) => (e.price === null ? [] : [e.price]))
  if (цени.length > 1 && Math.min(...цени) < Math.max(...цени)) {
    groups.push({
      param: 'cena',
      label: 'Цена',
      kind: 'range',
      open: true,
      min: Math.floor(Math.min(...цени)),
      max: Math.ceil(Math.max(...цени)),
      unit: '€',
    })
  }

  /* ── Категория (подкатегориите на „Аксесоари") ── */
  if (scope.kind !== 'category' && accessoriesRootId !== null) {
    const подкатегории = catalog.tree.filter((c) => {
      const p = typeof c.parent === 'number' ? c.parent : c.parent?.id
      return p === accessoriesRootId
    })
    const options: FilterOption[] = []
    for (const под of подкатегории) {
      const клон = catalog.branch(под.id)
      let има = false
      entries.forEach((e, i) => {
        if (e.categories.some((c) => клон.has(c))) {
          добави(i, 'kategoriya', под.slug)
          има = true
        }
      })
      if (има) options.push({ value: под.slug, label: под.title })
    }
    groups.push({ param: 'kategoriya', label: 'Категория', kind: 'checkbox', open: true, options })
  }

  /* ── Наличност ── */
  {
    const налични = new Set(entries.map(наличност))
    entries.forEach((e, i) => добави(i, 'nalichnost', наличност(e)))
    groups.push({
      param: 'nalichnost',
      label: 'Наличност',
      kind: 'checkbox',
      open: false,
      options: Object.keys(НАЛИЧНОСТ)
        .filter((k) => налични.has(k))
        .map((k) => ({ value: k, label: НАЛИЧНОСТ[k] })),
    })
  }

  /* ── Съвместимост (сериите) ── */
  {
    const options: FilterOption[] = []
    for (const серия of deviceSeries(catalog)) {
      let има = false
      entries.forEach((e, i) => {
        if (compatibleWithCategory(catalog, e, серия.id)) {
          добави(i, 'savmestimost', серия.slug)
          има = true
        }
      })
      if (има) options.push({ value: серия.slug, label: серия.title })
    }
    groups.push({ param: 'savmestimost', label: 'Съвместимост', kind: 'checkbox', open: false, options })
  }

  /* ── Модел (само на „Аксесоари за серия …") ── */
  if (scope.kind === 'series-accessories') {
    const options: FilterOption[] = []
    for (const модел of devicesInCategory(catalog, scope.categoryId)) {
      let има = false
      entries.forEach((e, i) => {
        if (compatibleWithProduct(catalog, e, модел.id)) {
          добави(i, 'model', модел.slug)
          има = true
        }
      })
      if (има) options.push({ value: модел.slug, label: модел.title })
    }
    groups.push({ param: 'model', label: 'Модел', kind: 'checkbox', open: false, options })
  }

  /* ── Атрибутите ── */
  {
    /*
      В категория — атрибутите, отбелязани за нея или за категория под нея
      („Аксесоари" събира тези на Кабели, Адаптери…). На „Аксесоари за …" —
      тези на категориите на продуктите в списъка. И в двата случая се
      показват само стойностите, които ги има в списъка.
    */
    const свои =
      scope.kind === 'series-accessories'
        ? new Set(entries.flatMap((e) => e.categories))
        : catalog.branch(scope.categoryId)

    for (const атрибут of attributes) {
      const категории = (атрибут.categories ?? []).map((c) => (typeof c === 'number' ? c : c.id))
      if (!категории.some((c) => свои.has(c))) continue

      const тип = (атрибут.type ?? 'text') as AttributeType
      const param = attributeParam(атрибут.slug)
      const етикети = new Map<string, { label: string; sort: number | string }>()

      entries.forEach((e, i) => {
        for (const ред of e.attributes) {
          if (ред.attribute !== атрибут.id) continue
          const стойност = тип === 'number' ? normalizeNumber(ред.value) : ред.value
          if (стойност === null) continue
          const ключ = valueToken(стойност, тип)
          добави(i, param, ключ)
          if (!етикети.has(ключ)) {
            етикети.set(ключ, {
              label: formatAttributeValue(стойност, тип, атрибут.unit),
              sort: тип === 'number' ? Number(стойност) : стойност,
            })
          }
        }
      })

      const options = [...етикети.entries()]
        .sort(([, a], [, b]) =>
          typeof a.sort === 'number' && typeof b.sort === 'number'
            ? a.sort - b.sort
            : String(a.sort).localeCompare(String(b.sort), 'bg'),
        )
        .map(([value, { label }]) => ({ value, label }))
      groups.push({ param, label: атрибут.name, kind: 'checkbox', open: false, options })
    }
  }

  /*
    Филтър с една-единствена стойност за целия списък не стеснява нищо —
    не се показва (празните — още по-малко).
  */
  return {
    groups: sortByFilterOrder(
      groups.filter((g) => g.kind === 'range' || g.options.length > 1),
      order,
    ).map((g) => ({ ...g, open: open.includes(g.param) })),
    items,
  }
}
