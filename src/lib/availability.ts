/**
 * Наличност на продукта — трите стойности и всичко, което зависи от тях.
 *
 * На едно място, защото от списъка зависят четири неща: опциите на полето
 * в админа, редът под цената, данните за търсачките и проверката при
 * внос. Поотделно те се разминават мълчаливо — вносът приема стойност,
 * която полето не познава, и продуктът излиза като „в наличност", без
 * никой да е решил така.
 *
 * Надписът на бутона е в `BuyButton` — общ за страницата и картите.
 */
export const AVAILABILITY = {
  'in-stock': {
    admin: 'Налично',
    /** Редът под цената. */
    line: 'В наличност',
    schema: 'https://schema.org/InStock',
  },
  'on-request': {
    admin: 'По заявка',
    line: 'Не е наличен в момента — може да се заяви в магазина',
    schema: 'https://schema.org/PreOrder',
  },
  'out-of-stock': {
    admin: 'Изчерпан',
    line: 'Изчерпан',
    schema: 'https://schema.org/OutOfStock',
  },
} as const

export type Availability = keyof typeof AVAILABILITY

export const AVAILABILITY_VALUES = Object.keys(AVAILABILITY) as Availability[]

/** Опциите на select полето в `Products`. */
export const AVAILABILITY_OPTIONS = AVAILABILITY_VALUES.map((value) => ({
  label: AVAILABILITY[value].admin,
  value,
}))

export const isAvailability = (value: unknown): value is Availability =>
  typeof value === 'string' && value in AVAILABILITY

/**
 * Празно поле е „в наличност" — това е и стойността по подразбиране на
 * полето. Непозната стойност в базата не може да влезе през админа (select)
 * и се спира при внос; тук е само защита на рендера.
 */
export const availabilityOf = (value: string | null | undefined) =>
  AVAILABILITY[isAvailability(value) ? value : 'in-stock']
