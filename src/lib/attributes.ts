import { slugify } from './slug'

/**
 * Атрибути на продуктите — правилата за стойностите, на едно място.
 *
 * Ползват се от админа (проверка и нормализиране при запис), от вноса
 * (`import-attributes.ts`) и от филтрите в категориите.
 */

export type AttributeType = 'number' | 'text'

/** Число, написано по български или по английски: „0,4", „0.4", „20000". */
const ЧИСЛО = /^-?\d+(?:[.,]\d+)?$/

/**
 * Стойността на числов атрибут в базата — с точка, без интервали.
 * `null`, ако не е число: „около 2 м" не става за филтър по големина.
 */
export const normalizeNumber = (value: unknown): string | null => {
  const s = String(value ?? '').trim().replace(/\s+/g, '')
  if (!ЧИСЛО.test(s)) return null
  // `Number` маха излишните нули: „1,50" и „1.5" са една и съща стойност.
  return String(Number(s.replace(',', '.')))
}

/** Числото за посетителя — с десетична запетая, както се пише на български. */
export const formatNumber = (value: string): string => value.replace('.', ',')

/** Стойността с мерната единица: „0,4 м", „20000 mAh", „USB-C". */
export const formatAttributeValue = (value: string, type: AttributeType, unit?: string | null) => {
  const текст = type === 'number' ? formatNumber(value) : value
  return unit?.trim() ? `${текст} ${unit.trim()}` : текст
}

/**
 * Стойността в адреса на филтъра.
 *
 * Числото остава с точка (`?duljina=0.4,1`) — запетаята разделя
 * стойностите. Текстът става slug (`?konektor=xt60,usb-c`): „AC, BKW" би
 * се разпаднал на две при разделяне по запетая.
 */
export const valueToken = (value: string, type: AttributeType) =>
  type === 'number' ? value : slugify(value) || value

/**
 * Параметрите на общите филтри. Атрибут със същия slug получава
 * представка в адреса (`atr-cena`), за да не се засече с тях.
 */
export const RESERVED_PARAMS = ['cena', 'nalichnost', 'savmestimost', 'kategoriya', 'model', 'sub']

export const attributeParam = (slug: string) =>
  RESERVED_PARAMS.includes(slug) ? `atr-${slug}` : slug
