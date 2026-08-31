/** Фиксираният курс на лева към еврото, по който се извършва превалутирането. */
export const BGN_PER_EUR = 1.95583

const eur = new Intl.NumberFormat('bg-BG', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
})

const bgn = new Intl.NumberFormat('bg-BG', {
  style: 'currency',
  currency: 'BGN',
  minimumFractionDigits: 2,
})

export const formatEur = (value: number): string => eur.format(value)

export const formatBgn = (value: number): string => bgn.format(value * BGN_PER_EUR)

/** Отстъпка в цели проценти, изчислена от старата цена. */
export const discountPercent = (price: number, compareAt?: number | null): number | null => {
  if (!compareAt || compareAt <= price) return null
  return Math.round(((compareAt - price) / compareAt) * 100)
}

export const BADGE_LABELS: Record<string, string> = {
  new: 'НОВО',
  sale: 'ПРОМОЦИЯ',
  bestseller: 'БЕСТСЕЛЪР',
  limited: 'ОГРАНИЧЕНА НАЛИЧНОСТ',
}

export const AVAILABILITY_LABELS: Record<string, string> = {
  'in-stock': 'В наличност',
  preorder: 'По заявка',
  'out-of-stock': 'Изчерпан',
}
