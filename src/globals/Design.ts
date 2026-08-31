import type { Field, GlobalConfig } from 'payload'
import { revalidateGlobal } from '../lib/revalidate'

/** Приема #rgb, #rrggbb или празно (= ползва се стойността по подразбиране от кода). */
const hex = (name: string, label: string, fallback: string, description?: string): Field => ({
  name,
  type: 'text',
  label,
  admin: {
    description: description ? `${description} По подразбиране: ${fallback}` : `По подразбиране: ${fallback}`,
    placeholder: fallback,
  },
  validate: (value: unknown) => {
    if (!value) return true
    if (typeof value !== 'string') return 'Очаква се текст.'
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())
      ? true
      : 'Въведете цвят в шестнайсетичен вид, напр. #00a862.'
  },
})

export const Design: GlobalConfig = {
  slug: 'design',
  label: 'Дизайн',
  admin: {
    group: 'Настройки',
    description:
      'Цветовете на целия сайт. Празно поле означава „ползвай стойността по подразбиране“. Промяната се вижда веднага след запис — не е нужен нов билд.',
  },
  access: { read: () => true },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Марка',
          fields: [
            {
              type: 'row',
              fields: [
                hex('brand', 'Основен цвят', '#00a862', 'Бутони и акценти.'),
                hex('brandDark', 'Основен при посочване', '#00854e'),
              ],
            },
          ],
        },
        {
          label: 'Фонове',
          fields: [
            {
              type: 'row',
              fields: [
                hex('page', 'Фон на страницата', '#ffffff'),
                hex('surface', 'Фон на картите', '#ffffff'),
              ],
            },
            {
              type: 'row',
              fields: [
                hex('topbar', 'Лента най-горе', '#f5f5f5'),
                hex('tile', 'Плочки', '#f2f2f2', 'Сивите плочки в менюто и продуктовите мрежи.'),
              ],
            },
            {
              type: 'row',
              fields: [
                hex('tileHover', 'Плочки при посочване', '#e8e8e8', 'Ефектът на потъмняване.'),
                hex('navHover', 'Меню при посочване', '#f0f0f0'),
              ],
            },
            { type: 'row', fields: [hex('navActive', 'Активна точка в менюто', '#ececec')] },
          ],
        },
        {
          label: 'Текст и линии',
          fields: [
            {
              type: 'row',
              fields: [
                hex('ink', 'Основен текст', '#1a1a1a'),
                hex('inkMuted', 'Второстепенен текст', '#6b6b6b'),
              ],
            },
            {
              type: 'row',
              fields: [
                hex('line', 'Линии и рамки', '#e3e3e3'),
                hex('lineStrong', 'По-тъмни рамки', '#c9c9c9'),
              ],
            },
          ],
        },
        {
          label: 'Тъмни банери',
          fields: [
            {
              type: 'row',
              fields: [
                hex('night', 'Черен фон', '#000000'),
                hex('nightSoft', 'Тъмносив фон', '#121212'),
              ],
            },
          ],
        },
        {
          label: 'Сигнални цветове',
          fields: [
            {
              type: 'row',
              fields: [
                hex('accent', 'Оранжев', '#e2551f', 'Промоции и баджове върху снимки.'),
                hex('info', 'Син', '#1a6bd6', 'Етикет „Ново“ над име на продукт.'),
              ],
            },
            {
              type: 'row',
              fields: [hex('alert', 'Червен', '#e0342b', 'Етикети HOT и НОВО в главното меню.')],
            },
          ],
        },
      ],
    },
  ],
}

/** Съответствие между полетата в админа и CSS променливите в globals.css. */
export const DESIGN_TOKEN_MAP: Record<string, string> = {
  brand: '--color-brand',
  brandDark: '--color-brand-dark',
  page: '--color-page',
  surface: '--color-surface',
  topbar: '--color-topbar',
  tile: '--color-tile',
  tileHover: '--color-tile-hover',
  navHover: '--color-nav-hover',
  navActive: '--color-nav-active',
  ink: '--color-ink',
  inkMuted: '--color-ink-muted',
  line: '--color-line',
  lineStrong: '--color-line-strong',
  night: '--color-night',
  nightSoft: '--color-night-soft',
  accent: '--color-accent',
  info: '--color-info',
  alert: '--color-alert',
}
