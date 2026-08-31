/**
 * Попълва мега менюто по структурата от eu.ecoflow.com, преведена на български.
 *
 * Пуска се с:  npm run seed:menu
 *
 * Скриптът е ПОВТОРЯЕМ — трие старите панели и ги създава наново,
 * така че може да се пуска колкото пъти трябва, докато настройваме структурата.
 * Снимките са автоматично генерирани заместители; заменете ги от админа.
 */
import config from '@payload-config'
import { getPayload } from 'payload'
import sharp from 'sharp'

const payload = await getPayload({ config })

const placeholder = async (label: string, w: number, h: number): Promise<Buffer> => {
  const size = Math.round(Math.min(w, h) / 9)
  const text = label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="100%" height="100%" fill="#f2f2f2"/>
    <rect x="${w * 0.18}" y="${h * 0.22}" width="${w * 0.64}" height="${h * 0.46}" rx="${w * 0.05}" fill="#cfcfcf"/>
    <text x="50%" y="86%" text-anchor="middle" font-family="Arial, sans-serif"
          font-size="${size}" fill="#8a8a8a">${text}</text>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

const imgCache = new Map<string, number>()

const img = async (label: string, w = 600, h = 600): Promise<number> => {
  const key = `${label}-${w}x${h}`
  if (imgCache.has(key)) return imgCache.get(key)!
  const data = await placeholder(label, w, h)
  const doc = await payload.create({
    collection: 'media',
    data: { alt: `${label} — продуктова снимка` },
    file: {
      data,
      mimetype: 'image/png',
      name: `menu-${key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`,
      size: data.length,
    },
  })
  imgCache.set(key, doc.id)
  return doc.id
}

console.log('Изтриване на старите панели…')
const existing = await payload.find({ collection: 'menu-panels', limit: 500, depth: 0 })
for (const doc of existing.docs) {
  await payload.delete({ collection: 'menu-panels', id: doc.id })
}

type CardSeed = {
  title: string
  spec?: string
  label?: string
  ribbon?: string
}

type SectionSeed = {
  heading: string
  viewAllUrl: string
  featured?: CardSeed
  cards: CardSeed[]
  tile?: boolean
}

type PanelSeed = { title: string; slug: string; sections: SectionSeed[] }

const ACCESSORIES = (slug: string): SectionSeed => ({
  heading: 'Аксесоари',
  viewAllUrl: '/categories/aksesoari',
  cards: [
    { title: 'Допълнителна батерия', spec: 'Разширение на капацитета' },
    { title: 'Транспортна чанта', spec: 'Защита при пренасяне' },
    { title: 'Зареждащ кабел', spec: 'Бързо зареждане' },
  ],
  tile: true,
})

const PANELS: PanelSeed[] = [
  {
    title: 'Серия EcoFlow DELTA',
    slug: 'delta-seriya',
    sections: [
      {
        heading: 'Серия EcoFlow DELTA',
        viewAllUrl: '/categories/delta-seriya',
        featured: {
          title: 'DELTA 3 Classic',
          spec: '1024Wh капацитет | 1800W изход | LFP',
        },
        cards: [
          { title: 'DELTA 3 Max Series', spec: '2kWh капацитет | 3000W изход' },
          { title: 'DELTA 2 Max', spec: '2kWh–6kWh капацитет | 2400W изход | LFP | 30dB' },
          { title: 'DELTA 2', spec: '1kWh капацитет | 1800W изход' },
          { title: 'DELTA 3 Series', spec: '1–5kWh капацитет | 1800W изход' },
          { title: 'DELTA Pro 3', spec: '4kWh капацитет | 4000W изход | LFP | 30dB' },
        ],
        tile: true,
      },
      ACCESSORIES('delta'),
    ],
  },
  {
    title: 'Серия EcoFlow RIVER',
    slug: 'river-seriya',
    sections: [
      {
        heading: 'Серия EcoFlow RIVER',
        viewAllUrl: '/categories/river-seriya',
        featured: { title: 'RIVER 2 Max', spec: '512Wh капацитет\n500W изход' },
        cards: [
          { title: 'RIVER 2 Pro', spec: '768Wh капацитет\n800W изход', ribbon: 'Подарък' },
          { title: 'RIVER 3', spec: '245Wh капацитет\n300W изход' },
          { title: 'RIVER 3 Plus Series', spec: '286–858Wh капацитет\n600W изход' },
          { title: 'RIVER 3 Plus (Wireless)', spec: '286Wh капацитет | 5000mAh RAPID' },
          { title: 'RIVER 2', spec: '256Wh капацитет\n300W изход' },
        ],
        tile: true,
      },
      ACCESSORIES('river'),
    ],
  },
  {
    title: 'Серия EcoFlow TRAIL',
    slug: 'trail-seriya',
    sections: [
      {
        heading: 'Серия EcoFlow TRAIL',
        viewAllUrl: '/categories/trail-seriya',
        featured: { title: 'TRAIL 200 DC', spec: '192Wh капацитет | 300W изход', label: 'Ново' },
        cards: [
          { title: 'TRAIL 300 DC', spec: '288Wh капацитет | 400W изход', label: 'Ново' },
          { title: 'TRAIL Pro', spec: '512Wh капацитет | 800W изход' },
        ],
        tile: true,
      },
    ],
  },
  {
    title: 'Соларен генератор EcoFlow',
    slug: 'solaren-generator',
    sections: [
      {
        heading: 'Соларни комплекти',
        viewAllUrl: '/categories/solaren-generator',
        featured: { title: 'DELTA 3 Plus + 220W', spec: 'Комплект с двулицев панел' },
        cards: [
          { title: 'DELTA 2 + 400W', spec: 'Комплект за дълъг престой' },
          { title: 'RIVER 3 + 110W', spec: 'Лек комплект за туризъм' },
          { title: 'DELTA Pro 3 + 400W', spec: 'Комплект за дома' },
        ],
        tile: true,
      },
    ],
  },
  {
    title: 'Портативни соларни панели',
    slug: 'portativni-solarni-paneli',
    sections: [
      {
        heading: 'Портативни соларни панели',
        viewAllUrl: '/categories/portativni-solarni-paneli',
        featured: {
          title: '220W двулицев',
          spec: '25% ефективност\nIP68',
          label: 'Ново',
        },
        cards: [
          { title: '160W', spec: '25% ефективност\nIP68', label: 'Ново' },
          { title: '400W', spec: '25% ефективност\nIP68' },
          { title: '110W', spec: '25% ефективност\nIP68', label: 'Ново' },
          { title: '60W (Type-C)', spec: '23,4% ефективност\nIP68' },
          { title: '45W', spec: '25% ефективност\nIP68' },
        ],
        tile: true,
      },
      ACCESSORIES('solar'),
    ],
  },
  {
    title: 'Монтажни соларни панели',
    slug: 'montajni-solarni-paneli',
    sections: [
      {
        heading: 'Монтажни соларни панели',
        viewAllUrl: '/categories/montajni-solarni-paneli',
        featured: { title: '400W твърд панел', spec: 'За покрив и кемпер' },
        cards: [
          { title: '100W гъвкав', spec: 'Извит монтаж' },
          { title: '200W твърд', spec: 'Стенен монтаж' },
        ],
        tile: true,
      },
    ],
  },
  {
    title: 'Интелигентни устройства',
    slug: 'inteligentni-ustroystva',
    sections: [
      {
        heading: 'Интелигентни устройства',
        viewAllUrl: '/categories/inteligenten-dom',
        featured: { title: 'Smart Home Panel 2', spec: 'Превключване за 20ms', label: 'Ново' },
        cards: [
          { title: 'Smart Plug', spec: 'Следене на потреблението' },
          { title: 'Power Hub', spec: 'За кемпер и лодка' },
          { title: 'Smart Generator', spec: 'Двугоривен, 4000W' },
        ],
        tile: true,
      },
    ],
  },
  {
    title: 'Външни батерии',
    slug: 'vanshni-baterii-menu',
    sections: [
      {
        heading: 'Серия RAPID',
        viewAllUrl: '/categories/vanshni-baterii',
        featured: { title: 'RAPID Pro', spec: '27 650mAh | 300W изход', label: 'Ново' },
        cards: [
          { title: 'RAPID Magnetic 5000', spec: '5000mAh | 20W' },
          { title: 'RAPID Magnetic 10000', spec: '10 000mAh | 30W' },
          { title: 'RAPID 20000', spec: '20 000mAh | 65W' },
        ],
        tile: true,
      },
    ],
  },
  {
    title: 'Домашна батерия PowerOcean',
    slug: 'powerocean',
    sections: [
      {
        heading: 'Системи PowerOcean',
        viewAllUrl: '/categories/domashni-baterii',
        featured: { title: 'PowerOcean DC Fit', spec: '5–20 kWh | За съществуващи инсталации' },
        cards: [
          { title: 'PowerOcean Plus', spec: 'Хибридна система с инвертор' },
          { title: 'PowerOcean Single Phase', spec: 'Еднофазна, 5–45 kWh' },
          { title: 'PowerOcean Three Phase', spec: 'Трифазна, 10–45 kWh' },
        ],
        tile: true,
      },
    ],
  },
  {
    title: 'STREAM серия',
    slug: 'stream-seriya',
    sections: [
      {
        heading: 'STREAM — plug & play соларни системи',
        viewAllUrl: '/categories/stream-seriya',
        featured: {
          title: 'STREAM Ultra',
          spec: 'Балконна соларна система',
          label: 'Ново',
        },
        cards: [
          { title: 'STREAM Pro', spec: 'Разширяем капацитет', label: 'Ново' },
          { title: 'STREAM AC Pro', spec: 'С вграден инвертор' },
          { title: 'STREAM Microinverter', spec: '800W изход' },
        ],
        tile: true,
      },
    ],
  },
]

console.log('Създаване на панелите…')
const panelIds: Record<string, number> = {}

for (const p of PANELS) {
  const sections = []
  for (const s of p.sections) {
    const featured = s.featured
      ? {
          image: await img(s.featured.title, 800, 800),
          title: s.featured.title,
          specLine: s.featured.spec ?? null,
          url: `${s.viewAllUrl}`,
          label: s.featured.label ?? null,
          ribbon: s.featured.ribbon ?? null,
        }
      : {}

    const cards = []
    for (const c of s.cards) {
      cards.push({
        image: await img(c.title),
        title: c.title,
        specLine: c.spec ?? null,
        url: s.viewAllUrl,
        label: c.label ?? null,
        ribbon: c.ribbon ?? null,
      })
    }

    sections.push({
      heading: s.heading,
      viewAllLabel: 'Виж всички',
      viewAllUrl: s.viewAllUrl,
      featured,
      cards,
      showViewAllTile: s.tile ?? true,
      viewAllTileUrl: s.viewAllUrl,
    })
  }

  const doc = await payload.create({
    collection: 'menu-panels',
    data: { title: p.title, slug: p.slug, sections },
  })
  panelIds[p.slug] = doc.id
  console.log(`  ✓ ${p.title}`)
}

const ref = (...slugs: string[]) => slugs.map((s) => ({ panel: panelIds[s] })).filter((e) => e.panel)

console.log('Настройка на менюто…')
await payload.updateGlobal({
  slug: 'header',
  data: {
    topLeftLabel: 'ecoflow.com',
    topLeftUrl: 'https://www.ecoflow.com',
    topPromoText: 'До 64% отстъпка | STREAM серия — plug & play соларна система',
    topPromoUrl: '/promocii',
    regionLabel: 'България (Български / € EUR)',
    logoSuffix: 'МАГАЗИН',
    logoTagline: 'Официален дистрибутор за България',
    searchEnabled: true,
    ctaLabel: 'Към магазина',
    ctaUrl: 'https://example.com/shop',
    items: [
      {
        label: 'Промоции',
        url: '/promocii',
        badge: 'hot',
        groups: [],
      },
      {
        label: 'Соларни системи',
        badge: 'new',
        groups: [
          {
            heading: 'Соларни системи',
            defaultOpen: true,
            entries: ref('stream-seriya', 'solaren-generator'),
          },
          {
            heading: 'Соларни панели',
            defaultOpen: false,
            entries: ref('portativni-solarni-paneli', 'montajni-solarni-paneli'),
          },
        ],
      },
      {
        label: 'Електроцентрали',
        groups: [
          {
            heading: 'Портативни електроцентрали',
            defaultOpen: true,
            entries: ref('delta-seriya', 'river-seriya', 'trail-seriya', 'solaren-generator'),
          },
        ],
      },
      {
        label: 'Домашна батерия',
        groups: [
          {
            heading: 'Домашни системи',
            defaultOpen: true,
            entries: ref('powerocean', 'stream-seriya'),
          },
        ],
      },
      {
        label: 'Още продукти',
        groups: [
          {
            heading: 'Соларни панели',
            defaultOpen: true,
            entries: ref('portativni-solarni-paneli', 'montajni-solarni-paneli'),
          },
          {
            heading: 'Интелигентни устройства',
            defaultOpen: false,
            entries: ref('inteligentni-ustroystva'),
          },
          {
            heading: 'Зареждащи устройства',
            defaultOpen: false,
            entries: ref('vanshni-baterii-menu'),
          },
        ],
      },
      { label: 'Приложения', url: '/prilozheniya', groups: [] },
      { label: 'Обслужване', url: '/obsluzhvane', groups: [] },
    ],
  },
})

console.log('\nГотово. Менюто е попълнено.')
process.exit(0)
