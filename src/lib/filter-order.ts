import { attributeParam } from './attributes'

/**
 * Редът на филтрите отстрани — общ за вградените и за атрибутите.
 *
 * Източникът е глобалът „Подредба на филтрите" (`filter-order`). Тук са
 * правилата, по които сайтът го прилага:
 * - филтър, който го няма на страницата, просто се прескача;
 * - филтър, който го няма в списъка (нов атрибут), застава преди
 *   „Съвместимост", в реда на влаченето в „Атрибути";
 * - Цена е последна ВИНАГИ, където и да е в списъка.
 */

/** Вградените филтри: стойността е параметърът им в адреса. */
export const BUILTIN_FILTERS = [
  { value: 'nalichnost', label: 'Наличност' },
  { value: 'kategoriya', label: 'Категория' },
  { value: 'model', label: 'Модел' },
  { value: 'savmestimost', label: 'Съвместимост' },
  { value: 'cena', label: 'Цена' },
] as const

export const PRICE_PARAM = 'cena'
const ПРЕДИ = 'savmestimost'

/**
 * Редът, когато глобалът е празен — същият, с който е попълнен първоначално
 * (`20261002_*_filter_order`). Ключ: параметър на вграден филтър или slug на
 * атрибут.
 */
export const DEFAULT_FILTER_ORDER = [
  'nalichnost',
  'kategoriya',
  'vid',
  'konektor',
  'moshtnost',
  'kapacitet-mah',
  'kapacitet-wh',
  'broy-portove',
  'duljina',
  'model',
  'savmestimost',
  'cena',
]

/**
 * Подрежда групите. `order` е списък от параметри (вградените — по
 * стойността си, атрибутите — по параметъра си в адреса).
 */
export const sortByFilterOrder = <T extends { param: string }>(groups: T[], order: string[]): T[] => {
  const място = new Map(order.map((p, i) => [p, i]))
  const предиСъвместимост = място.get(ПРЕДИ) ?? order.length
  const ранг = (g: T, i: number) => {
    if (g.param === PRICE_PARAM) return [Number.POSITIVE_INFINITY, i]
    const m = място.get(g.param)
    // Непознатите — точно преди „Съвместимост", в реда, в който са дошли.
    return m === undefined ? [предиСъвместимост - 0.5, i] : [m, i]
  }
  return groups
    .map((g, i) => ({ g, r: ранг(g, i) }))
    .sort((a, b) => a.r[0] - b.r[0] || a.r[1] - b.r[1])
    .map(({ g }) => g)
}

/**
 * Параметрите в реда на глобала. Празен глобал → `DEFAULT_FILTER_ORDER`.
 * Атрибутът става параметъра си в адреса (`attributeParam`), за да се
 * сравнява с групите, които `buildFilters` сглобява.
 */
export const filterOrderParams = (
  items:
    | { type?: string | null; builtin?: string | null; attribute?: unknown }[]
    | null
    | undefined,
): string[] => {
  const редове = (items ?? []).flatMap((ред) => {
    if (ред.type === 'builtin') return ред.builtin ? [ред.builtin] : []
    const slug = (ред.attribute as { slug?: string } | null)?.slug
    return slug ? [attributeParam(slug)] : []
  })
  if (редове.length) return редове
  const вградени = new Set<string>(BUILTIN_FILTERS.map((b) => b.value))
  return DEFAULT_FILTER_ORDER.map((k) => (вградени.has(k) ? k : attributeParam(k)))
}
