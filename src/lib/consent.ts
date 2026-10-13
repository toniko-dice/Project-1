/**
 * Съгласие за бисквитки (`task-banner-biskvitki.md`) — ЕДНО място за
 * категориите и бисквитките. От него се пълнят банерът, настройките,
 * таблицата на `/biskvitki` и проверката на записа. Нова услуга = един ред
 * в `COOKIES` (и, ако е нова категория, ред в `CATEGORIES`).
 *
 * Правилата (ЗЕС чл. 4а, GDPR чл. 7, EDPB 05/2020 и доклада за банерите):
 * - нищо извън „Задължителни" не се записва и не се зарежда преди съгласие;
 * - „Отказвам всички" е на първия екран и изглежда като „Приемам всички";
 * - нищо не е отметнато предварително; затварянето не е съгласие;
 * - категория без нито една бисквитка не се показва (празен „Маркетинг").
 *
 * Без сървърни импорти — ползва се и в браузъра.
 */

/** Смени я при нова версия на политиката или нова категория — банерът излиза отново на всички. */
export const CONSENT_VERSION = 1

export const CONSENT_COOKIE = 'ecoflow_consent'

/** 6 месеца — после пита пак. */
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 182

/** Линк, който отваря настройките отвсякъде (футър, страницата `/biskvitki`). */
export const CONSENT_SETTINGS_HASH = '#nastroyki-biskvitki'

/** Събитие в браузъра за отваряне на настройките. */
export const CONSENT_OPEN_EVENT = 'ecoflow:consent-open'

/** Събитие при всеки избор — за аналитиката (`src/lib/track.ts`). */
export const CONSENT_CHANGE_EVENT = 'ecoflow:consent-change'

export type OptionalCategory = 'analytics' | 'marketing'
export type CategoryId = 'necessary' | OptionalCategory

export type Category = {
  id: CategoryId
  title: string
  description: string
}

export const CATEGORIES: Category[] = [
  {
    id: 'necessary',
    title: 'Задължителни',
    description:
      'Нужни са, за да работи сайтът — вход в профила, запомняне на избора ви за бисквитките. Не могат да се изключат.',
  },
  {
    id: 'analytics',
    title: 'Аналитични',
    description:
      'Помагат ни да разберем как се ползва сайтът — кои страници се отварят и откъде идват посетителите, — за да го подобряваме. Данните са обобщени.',
  },
  {
    id: 'marketing',
    title: 'Маркетинг',
    description: 'Използват се за реклами, съобразени с интересите ви, и за измерване на рекламите.',
  },
]

export type CookieInfo = {
  name: string
  provider: string
  purpose: string
  duration: string
  category: CategoryId
  /** Кога се записва — ако не при всяко посещение. */
  note?: string
  /** Шаблон за триене при оттегляне (`_ga_*`). */
  match?: RegExp
}

/**
 * Инвентаризацията — `docs/biskvitki-inventar.md` (13 октомври 2026).
 * Посетителят днес получава само `ecoflow_consent`; останалите
 * задължителни са само за влезли служители.
 */
export const COOKIES: CookieInfo[] = [
  {
    name: CONSENT_COOKIE,
    provider: 'ecoflow.bg',
    purpose: 'Пази избора ви за бисквитките, за да не питаме при всяко отваряне.',
    duration: '6 месеца',
    category: 'necessary',
  },
  {
    name: 'payload-token',
    provider: 'ecoflow.bg',
    purpose: 'Вход в профила (админ и заключен сайт).',
    duration: '2 часа',
    category: 'necessary',
    note: 'само при вход',
  },
  {
    name: 'payload-theme',
    provider: 'ecoflow.bg',
    purpose: 'Избраната светла или тъмна тема на админа.',
    duration: '1 година',
    category: 'necessary',
    note: 'само за влезли, ако сменят темата',
  },
  {
    name: 'payload-lng',
    provider: 'ecoflow.bg',
    purpose: 'Избраният език на админа.',
    duration: '1 година',
    category: 'necessary',
    note: 'само за влезли, ако сменят езика',
  },
  ...(process.env.NEXT_PUBLIC_GA_ID
    ? ([
        {
          name: '_ga',
          provider: 'Google Analytics',
          purpose: 'Различава посетителите, за да се броят посещенията.',
          duration: '2 години',
          category: 'analytics',
          match: /^_ga$/,
        },
        {
          name: '_ga_*',
          provider: 'Google Analytics',
          purpose: 'Пази състоянието на посещението.',
          duration: '2 години',
          category: 'analytics',
          match: /^_ga_/,
        },
      ] satisfies CookieInfo[])
    : []),
]

/**
 * Категориите, които се показват: задължителните винаги, другите — само ако
 * имат поне една бисквитка. Аналитичните се показват и преди GA4 да има ID —
 * банерът е готов и изборът се пази; без ID нищо не се зарежда.
 */
export const shownCategories = (): Category[] =>
  CATEGORIES.filter((c) => c.id === 'necessary' || c.id === 'analytics' || COOKIES.some((k) => k.category === c.id))

export const cookiesOf = (id: CategoryId) => COOKIES.filter((c) => c.category === id)

export type ConsentChoices = Record<OptionalCategory, boolean>

export type ConsentRecord = {
  /** Версия на политиката. */
  v: number
  /** Кога — ISO. */
  d: string
  /** Изборът по категории. */
  c: ConsentChoices
  /** Случаен номер на съгласието (без лични данни). */
  id: string
}

export type ConsentAction = 'accept-all' | 'reject-all' | 'custom'

export const ALL_DENIED: ConsentChoices = { analytics: false, marketing: false }
export const ALL_GRANTED: ConsentChoices = { analytics: true, marketing: true }

/** Прочита бисквитката; стара версия или повреден запис = няма съгласие. */
export const parseConsent = (raw: string | undefined | null): ConsentRecord | null => {
  if (!raw) return null
  try {
    const r = JSON.parse(decodeURIComponent(raw)) as ConsentRecord
    if (r?.v !== CONSENT_VERSION || typeof r.id !== 'string' || !r.c) return null
    return { ...r, c: { analytics: r.c.analytics === true, marketing: r.c.marketing === true } }
  } catch {
    return null
  }
}

export const serializeConsent = (r: ConsentRecord) => encodeURIComponent(JSON.stringify(r))

/** Проверка на данните, които браузърът праща за доказателството. */
export const validConsentPayload = (
  b: unknown,
): b is { id: string; v: number; action: ConsentAction; choices: ConsentChoices } => {
  const x = b as Record<string, unknown> | null
  const c = x?.choices as Record<string, unknown> | undefined
  return (
    !!x &&
    typeof x.id === 'string' &&
    /^[A-Za-z0-9-]{8,64}$/.test(x.id) &&
    x.v === CONSENT_VERSION &&
    (x.action === 'accept-all' || x.action === 'reject-all' || x.action === 'custom') &&
    !!c &&
    typeof c.analytics === 'boolean' &&
    typeof c.marketing === 'boolean'
  )
}
