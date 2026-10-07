/**
 * Изборите във формата за оферта — ЕДИН списък за формата, сървъра,
 * колекцията „Нови заявки" и имейлите. Стойностите са латиница (пазят се в
 * базата), надписите — на български. Нова стойност тук не иска миграция:
 * в SQLite изборът е текстова колона.
 */

export type Option = { value: string; label: string }

export const CLIENT_TYPES: Option[] = [
  { value: 'company', label: 'Фирма' },
  { value: 'municipality', label: 'Община' },
  { value: 'institution', label: 'Държавна институция' },
  { value: 'school', label: 'Училище' },
  { value: 'hospital', label: 'Болница' },
  { value: 'other', label: 'Друго' },
]

export const PURPOSES: Option[] = [
  { value: 'building-backup', label: 'Резервно захранване на сграда' },
  { value: 'emergency-teams', label: 'Аварийни и спасителни екипи' },
  { value: 'off-grid', label: 'Обекти без ток' },
  { value: 'events', label: 'Събития' },
  { value: 'schools', label: 'Училища и детски градини' },
  { value: 'healthcare', label: 'Здравни заведения' },
  { value: 'other', label: 'Друго' },
]

/** „Кога ви трябват" — нуждата на клиента, не наш срок. */
export const TIMEFRAMES: Option[] = [
  { value: 'within-month', label: 'До 1 месец' },
  { value: '1-3-months', label: '1–3 месеца' },
  { value: 'later', label: 'По-късно' },
  { value: 'unknown', label: 'Не знам' },
]

export const PROCUREMENT: Option[] = [
  { value: 'direct', label: 'Директна покупка' },
  { value: 'public-procurement', label: 'Обществена поръчка' },
  { value: 'framework', label: 'Рамково споразумение' },
  { value: 'unknown', label: 'Не знам' },
]

export const DOCUMENTS: Option[] = [
  { value: 'offer', label: 'Оферта' },
  { value: 'proforma', label: 'Проформа фактура' },
]

export const CONSULTATION: Option[] = [
  { value: 'yes', label: 'Да' },
  { value: 'no', label: 'Не' },
]

export const STATUSES: (Option & { color: string })[] = [
  { value: 'new', label: 'Нова', color: '#e8590c' },
  { value: 'in-progress', label: 'В работа', color: '#1c7ed6' },
  { value: 'offer-sent', label: 'Изпратена оферта', color: '#868e96' },
  { value: 'won', label: 'Спечелена', color: '#2b8a3e' },
  { value: 'lost', label: 'Отказана', color: '#c92a2a' },
]

export const labelOf = (options: Option[], value: string | null | undefined): string =>
  options.find((o) => o.value === value)?.label ?? value ?? ''

/* ─────────── прикаченият файл ─────────── */

/** Количество на продукт: цяло число от 1 до 9999. */
export const MAX_QTY = 9999

export const MAX_FILE_BYTES = 10 * 1024 * 1024

/** Разширение → mime тип, който се приема. */
export const FILE_TYPES: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
}

export const FILE_ACCEPT = Object.keys(FILE_TYPES)
  .map((e) => `.${e}`)
  .join(',')

/* ─────────── проверки — едни и същи в браузъра и на сървъра ─────────── */

/**
 * ЕИК / БУЛСТАТ — полето е по желание; попълнено се проверява така:
 *
 * - 9 цифри — ЕИК, с контролната цифра по алгоритъма на Агенцията по
 *   вписванията (тегла 1…8, после 3…10; остатък 10 → 0);
 * - 13 цифри — ЕИК на клон/поделение: първите 9 като горе, после 2,7,3,5 /
 *   4,9,5,7;
 * - 10 цифри — БУЛСТАТ на физическо лице (ЕГН-формат): само цифри;
 * - 11 символа — БУЛСТАТ на свободни професии: латински букви и цифри, без
 *   контролна цифра.
 */
export const validEik = (raw: string): boolean => {
  const eik = raw.replace(/\s/g, '')
  if (/^\d{10}$/.test(eik)) return true
  if (/^[A-Za-z0-9]{11}$/.test(eik)) return true
  if (!/^(\d{9}|\d{13})$/.test(eik)) return false
  // Само нули минават контролата формално, но не са ЕИК.
  if (/^0+$/.test(eik)) return false
  const d = eik.split('').map(Number)

  const check = (digits: number[], w1: number[], w2: number[]): number => {
    let sum = digits.reduce((s, x, i) => s + x * w1[i]!, 0)
    let r = sum % 11
    if (r !== 10) return r
    sum = digits.reduce((s, x, i) => s + x * w2[i]!, 0)
    r = sum % 11
    return r === 10 ? 0 : r
  }

  if (check(d.slice(0, 8), [1, 2, 3, 4, 5, 6, 7, 8], [3, 4, 5, 6, 7, 8, 9, 10]) !== d[8]) return false
  if (d.length === 9) return true
  return check(d.slice(8, 12), [2, 7, 3, 5], [4, 9, 5, 7]) === d[12]
}

export const validEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim())

/** Телефон: цифри, интервали, тирета, скоби и „+" отпред; поне 9 цифри. */
export const validPhone = (v: string): boolean => {
  const t = v.trim()
  return /^\+?[\d\s\-()/]+$/.test(t) && t.replace(/\D/g, '').length >= 9
}

/** Полетата на формата — ключовете на грешките са тези имена. */
export type QuoteItem = { product: number; quantity: number }

export type QuotePayload = {
  clientType: string
  organization: string
  eik: string
  city: string
  contactName: string
  position: string
  email: string
  phone: string
  items: QuoteItem[]
  otherProducts: string
  purposes: string[]
  timeframe: string
  budget: string
  procurement: string
  documents: string[]
  deliveryTo: string
  consultation: string
  details: string
  consent: boolean
}

const has = (options: Option[], v: string) => options.some((o) => o.value === v)

/**
 * Грешките по поле. Празен обект — всичко е наред. Файлът и CAPTCHA-та се
 * проверяват отделно (на сървъра).
 */
export const validateQuote = (p: QuotePayload): Record<string, string> => {
  const e: Record<string, string> = {}
  const req = (k: keyof QuotePayload, msg: string) => {
    if (!String(p[k] ?? '').trim()) e[k] = msg
  }

  if (!has(CLIENT_TYPES, p.clientType)) e.clientType = 'Изберете тип клиент.'
  req('organization', 'Въведете името на организацията.')
  // По желание; попълнено — проверено (`validEik`).
  if (p.eik.trim() && !validEik(p.eik)) e.eik = 'Невалиден ЕИК/БУЛСТАТ. Проверете цифрите или оставете полето празно.'
  req('city', 'Въведете град или община.')
  req('contactName', 'Въведете име и фамилия.')
  if (!p.email.trim()) e.email = 'Въведете имейл.'
  else if (!validEmail(p.email)) e.email = 'Имейлът не изглежда правилен.'
  if (!p.phone.trim()) e.phone = 'Въведете телефон.'
  else if (!validPhone(p.phone)) e.phone = 'Телефонът трябва да съдържа поне 9 цифри, напр. +359 88 123 4567.'

  const items = p.items.filter((i) => Number.isInteger(i.quantity) && i.quantity >= 1 && i.quantity <= MAX_QTY)
  if (items.length !== p.items.length) e.items = `Количеството трябва да е цяло число от 1 до ${MAX_QTY}.`
  else if (!items.length && !p.otherProducts.trim()) {
    e.items = 'Изберете поне един продукт или опишете нужното в „Други продукти или изисквания".'
  }

  if (p.purposes.some((v) => !has(PURPOSES, v))) e.purposes = 'Невалиден избор.'
  if (p.timeframe && !has(TIMEFRAMES, p.timeframe)) e.timeframe = 'Невалиден избор.'
  if (p.procurement && !has(PROCUREMENT, p.procurement)) e.procurement = 'Невалиден избор.'
  if (p.documents.some((v) => !has(DOCUMENTS, v))) e.documents = 'Невалиден избор.'
  if (p.consultation && !has(CONSULTATION, p.consultation)) e.consultation = 'Невалиден избор.'
  if (!p.consent) e.consent = 'Нужно е съгласието ви, за да обработим заявката.'

  const long: [keyof QuotePayload, number][] = [
    ['organization', 200],
    ['city', 120],
    ['contactName', 120],
    ['position', 120],
    ['email', 200],
    ['phone', 40],
    ['budget', 120],
    ['deliveryTo', 300],
    ['otherProducts', 5000],
    ['details', 5000],
  ]
  for (const [k, max] of long) {
    if (String(p[k] ?? '').length > max) e[k] = `Най-много ${max} знака.`
  }
  return e
}

/** Проверката на файла — по разширение, тип и размер. */
export const fileError = (name: string, type: string, size: number): string | null => {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const types = FILE_TYPES[ext]
  if (!types) return 'Позволени са PDF, DOC, DOCX, XLS, XLSX, JPG и PNG.'
  if (type && !types.includes(type) && type !== 'application/octet-stream') {
    return 'Видът на файла не отговаря на разширението му.'
  }
  if (size > MAX_FILE_BYTES) return 'Файлът е над 10 MB.'
  return null
}
