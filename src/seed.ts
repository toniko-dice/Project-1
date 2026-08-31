/**
 * Първоначално зареждане на примерно съдържание.
 *
 * Пуска се с:  npm run seed
 *
 * Скриптът е предвиден за ПРАЗНА база. Ако вече сте въвели съдържание,
 * няма да го изтрие, но ще добави дубликати. Изображенията са автоматично
 * генерирани заместители — заменете ги с истинските продуктови снимки от админа.
 */
import config from '@payload-config'
import { getPayload } from 'payload'
import sharp from 'sharp'

const payload = await getPayload({ config })

/** Генерира прост заместващ PNG с надпис — не изисква външни файлове или мрежа. */
const placeholder = async (
  label: string,
  width: number,
  height: number,
  bg = '#121212',
  fg = '#ffffff',
): Promise<Buffer> => {
  const fontSize = Math.round(Math.min(width, height) / 12)
  const escaped = label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="#2a2a2a"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          font-family="Arial, sans-serif" font-size="${fontSize}" fill="${fg}" opacity="0.85">${escaped}</text>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

const upload = async (label: string, alt: string, w: number, h: number, bg?: string, fg?: string) => {
  const data = await placeholder(label, w, h, bg, fg)
  const doc = await payload.create({
    collection: 'media',
    data: { alt },
    file: {
      data,
      mimetype: 'image/png',
      name: `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${w}x${h}.png`,
      size: data.length,
    },
  })
  return doc.id
}

console.log('Създаване на администратор…')
const adminEmail = 'admin@ecoflow.bg'
const adminPassword = 'EcoFlow2026!'
try {
  await payload.create({
    collection: 'users',
    data: { email: adminEmail, password: adminPassword, name: 'Администратор' },
  })
  console.log(`  ✓ ${adminEmail} / ${adminPassword}`)
} catch {
  console.log('  · потребителят вече съществува, пропускам')
}

console.log('Качване на заместващи изображения…')
const heroImg = await upload('Hero', 'Къща с резервно захранване по време на буря', 2400, 1000)
const logoImg = await upload('EcoFlow', 'Лого на EcoFlow България', 320, 68, '#000000')

const CATEGORY_DEFS = [
  ['Портативни електроцентрали', 'portativni-elektrocentrali'],
  ['Домашни батерии', 'domashni-baterii'],
  ['Соларни панели', 'solarni-paneli'],
  ['Външни батерии', 'vanshni-baterii'],
  ['Генератори', 'generatori'],
  ['Климатици', 'klimatici'],
  ['Интелигентен дом', 'inteligenten-dom'],
  ['Аксесоари', 'aksesoari'],
] as const

console.log('Създаване на категории…')
const categoryIds: Record<string, number> = {}
for (const [i, [title, slug]] of CATEGORY_DEFS.entries()) {
  const icon = await upload(title.slice(0, 12), title, 160, 160, '#f1f3f5', '#0f172a')
  const doc = await payload.create({
    collection: 'categories',
    data: { title, slug, icon, description: title },
  })
  categoryIds[slug] = doc.id
}

type ProductDef = {
  title: string
  slug: string
  cat: string
  tagline: string
  price: number
  compareAt?: number
  badge?: 'new' | 'sale' | 'bestseller' | 'limited'
}

/* Примерни данни по реалната продуктова гама. Цените са условни — заменете ги с вашите. */
const PRODUCTS: ProductDef[] = [
  { title: 'DELTA Pro Ultra X', slug: 'delta-pro-ultra-x', cat: 'domashni-baterii', tagline: '6144Wh капацитет / 7200W изход', price: 7299, compareAt: 8499, badge: 'new' },
  { title: 'DELTA Pro 3', slug: 'delta-pro-3', cat: 'portativni-elektrocentrali', tagline: '4096Wh капацитет / 4000W изход', price: 3199, compareAt: 3899, badge: 'sale' },
  { title: 'DELTA 3 Ultra', slug: 'delta-3-ultra', cat: 'portativni-elektrocentrali', tagline: '2560Wh капацитет / 2500W изход', price: 2149, badge: 'bestseller' },
  { title: 'DELTA 3 Plus', slug: 'delta-3-plus', cat: 'portativni-elektrocentrali', tagline: '1024Wh капацитет / 1800W изход', price: 899, compareAt: 1099 },
  { title: 'DELTA 3 Max', slug: 'delta-3-max', cat: 'portativni-elektrocentrali', tagline: '2048Wh капацитет / 2400W изход', price: 1549, badge: 'new' },
  { title: 'DELTA 2 Max', slug: 'delta-2-max', cat: 'portativni-elektrocentrali', tagline: '2048Wh капацитет / 2400W изход', price: 1349, compareAt: 1699, badge: 'sale' },
  { title: 'RIVER 3 Plus', slug: 'river-3-plus', cat: 'portativni-elektrocentrali', tagline: '286Wh капацитет / 600W изход', price: 319, compareAt: 399 },
  { title: 'RIVER 3 Max', slug: 'river-3-max', cat: 'portativni-elektrocentrali', tagline: '512Wh капацитет / 1000W изход', price: 479 },
  { title: 'PowerOcean DC Fit', slug: 'powerocean-dc-fit', cat: 'domashni-baterii', tagline: 'Домашна батерийна система 5–20 kWh', price: 4990, badge: 'new' },
  { title: 'PowerOcean Plus', slug: 'powerocean-plus', cat: 'domashni-baterii', tagline: 'Хибридна система с инвертор', price: 6490 },
  { title: 'RAPID Pro Power Bank', slug: 'rapid-pro-power-bank', cat: 'vanshni-baterii', tagline: '27 650mAh / 300W изход', price: 179, compareAt: 229, badge: 'sale' },
  { title: 'RAPID Magnetic 5000', slug: 'rapid-magnetic-5000', cat: 'vanshni-baterii', tagline: '5000mAh магнитна / 20W', price: 59 },
  { title: '400W сгъваем соларен панел', slug: 'solaren-panel-400w', cat: 'solarni-paneli', tagline: 'Ефективност 23% / IP68', price: 749, compareAt: 899 },
  { title: 'WAVE 3 климатик', slug: 'wave-3-klimatik', cat: 'klimatici', tagline: '6100 BTU охлаждане и отопление', price: 1099, badge: 'bestseller' },
  { title: 'Smart Home Panel 2', slug: 'smart-home-panel-2', cat: 'inteligenten-dom', tagline: 'Автоматично превключване за 20ms', price: 1599 },
  { title: 'Допълнителна батерия DELTA Pro 3', slug: 'dop-bateriya-delta-pro-3', cat: 'aksesoari', tagline: '4096Wh разширение', price: 2299 },
]

console.log('Създаване на продукти…')
const productIds: Record<string, number> = {}
for (const p of PRODUCTS) {
  const image = await upload(p.title, `${p.title} — продуктова снимка`, 900, 900, '#f1f3f5', '#0f172a')
  const doc = await payload.create({
    collection: 'products',
    data: {
      title: p.title,
      slug: p.slug,
      category: categoryIds[p.cat],
      tagline: p.tagline,
      badge: p.badge ?? 'none',
      price: p.price,
      compareAtPrice: p.compareAt ?? null,
      externalUrl: `https://example.com/shop/${p.slug}`,
      ctaLabel: 'Купи сега',
      availability: 'in-stock',
      image,
    },
  })
  productIds[p.slug] = doc.id
}

console.log('Създаване на отзиви…')
const TESTIMONIALS = [
  ['Иван Петров', 'София', 'При последното спиране на тока DELTA Pro 3 издържа хладилника и отоплението цяла нощ. Инсталацията отне по-малко от час.'],
  ['Мария Георгиева', 'Пловдив', 'Вземаме RIVER 3 на всяко пътуване с кемпера. Зарежда лаптопи, дрон и хладилна чанта без проблем.'],
  ['Николай Димитров', 'Варна', 'Комбинацията от соларни панели и домашна батерия покри голяма част от сметката ни за ток през лятото.'],
  ['Елена Стоянова', 'Бургас', 'Поръчах в четвъртък, получих в петък. Гаранционното обслужване е на български, което беше решаващо за мен.'],
]
const testimonialIds: number[] = []
for (const [author, location, quote] of TESTIMONIALS) {
  const image = await upload(location, `Клиент от ${location}`, 800, 600, '#1e293b')
  const doc = await payload.create({
    collection: 'testimonials',
    data: { author, location, quote, rating: 5, image },
  })
  testimonialIds.push(doc.id)
}

console.log('Създаване на отличия…')
const awardIds: number[] = []
for (const name of ['iF Design Award', 'Red Dot', 'Good Design', 'CES Innovation', 'TIME Best Inventions']) {
  const logo = await upload(name, `Лого на ${name}`, 240, 96, '#ffffff', '#0f172a')
  const doc = await payload.create({ collection: 'awards', data: { name, logo } })
  awardIds.push(doc.id)
}

console.log('Създаване на банери…')
const bannerHome = await upload('Домашно захранване', 'Домашна батерийна система в мазе', 2400, 800)
const bannerOutdoor = await upload('На открито', 'Семейство с кемпер и електроцентрала', 2400, 800, '#1f3a2e')
const bannerPower = await upload('Външни батерии', 'Серия външни батерии RAPID', 2400, 800, '#0a0e27')
const bannerBulk = await upload('Големи поръчки', 'Складирани електроцентрали', 2400, 800, '#1a1a1a')
const promoTrade = await upload('Замени и спести', 'Програма за замяна на стар уред', 1200, 750, '#7c3a12')
const promoOcean = await upload('PowerOcean', 'Домашна батерийна система PowerOcean', 1200, 750, '#0b3b2e')
const promoMember = await upload('Членство', 'Програма за лоялни клиенти', 1200, 750, '#2d1b4e')
const promoRefer = await upload('Препоръчай', 'Реферална програма', 1200, 750, '#3d2a15')
const moreTile = await upload('Виж още', 'Още продукти в категорията', 400, 400, '#f1f3f5', '#0f172a')

const pick = (...slugs: string[]) => slugs.map((s) => productIds[s]).filter(Boolean)

console.log('Създаване на началната страница…')
await payload.create({
  collection: 'pages',
  data: {
    title: 'Начало',
    slug: 'home',
    metaTitle: 'EcoFlow България — Портативни електроцентрали и домашно захранване',
    metaDescription:
      'Официален вносител на EcoFlow за България. Портативни електроцентрали DELTA и RIVER, домашни батерии PowerOcean, соларни панели и аксесоари.',
    layout: [
      {
        blockType: 'heroBanner',
        eyebrow: 'Сезон на бурите',
        heading: 'До 55% отстъпка',
        subheading: 'Подгответе дома си за спиране на тока — и вземете подарък към поръчката.',
        note: '5 – 31 август',
        image: heroImg,
        cta: { label: 'Разгледайте офертите', url: 'https://example.com/shop', newTab: true },
        align: 'left',
        theme: 'dark',
        overlay: 'medium',
      },
      {
        blockType: 'categoryStrip',
        categories: CATEGORY_DEFS.map(([, slug]) => categoryIds[slug]),
      },
      {
        blockType: 'productCarousel',
        sectionTitle: 'Най-търсени портативни електроцентрали',
        products: pick('delta-pro-3', 'delta-3-ultra', 'delta-3-max', 'delta-3-plus', 'river-3-max'),
        cardStyle: 'image',
      },
      {
        blockType: 'bannerProductRow',
        sectionTitle: 'Домашно резервно захранване',
        showBanner: true,
        banner: {
          eyebrow: 'НОВО',
          heading: 'DELTA Pro Ultra X',
          subheading: 'Захранване за целия дом, без прекъсване.',
          priceNote: 'от 7 299 €',
          image: bannerHome,
          cta: { label: 'Купи сега', url: 'https://example.com/shop/delta-pro-ultra-x', newTab: true },
          theme: 'dark',
        },
        products: pick('delta-pro-ultra-x', 'delta-pro-3', 'powerocean-dc-fit', 'powerocean-plus'),
        showMoreTile: true,
        moreTile: {
          label: 'Виж още',
          description: 'Сравнете всички решения за дома',
          image: moreTile,
          url: '/categories/domashni-baterii',
        },
      },
      {
        blockType: 'bannerProductRow',
        sectionTitle: 'Захранване на открито',
        showBanner: true,
        banner: {
          eyebrow: 'ЗА КЕМПЕР И ПРИРОДА',
          heading: 'DELTA 3 Max',
          subheading: 'Тих, лек и готов за път.',
          priceNote: 'от 1 549 €',
          image: bannerOutdoor,
          cta: { label: 'Разгледай', url: 'https://example.com/shop/delta-3-max', newTab: true },
          theme: 'dark',
        },
        products: pick('delta-3-max', 'delta-2-max', 'river-3-plus', 'river-3-max', 'solaren-panel-400w'),
        showMoreTile: false,
      },
      {
        blockType: 'bannerProductRow',
        sectionTitle: 'Външни батерии',
        showBanner: true,
        banner: {
          eyebrow: 'RAPID СЕРИЯ',
          heading: 'Зареждане навсякъде',
          subheading: 'Вграден кабел, 300W изход, магнитно закрепване.',
          priceNote: 'от 59 €',
          image: bannerPower,
          cta: { label: 'Разгледай', url: 'https://example.com/shop/power-banks', newTab: true },
          theme: 'dark',
        },
        products: pick('rapid-pro-power-bank', 'rapid-magnetic-5000', 'wave-3-klimatik', 'smart-home-panel-2'),
        showMoreTile: false,
      },
      {
        blockType: 'promoCards',
        sectionTitle: 'Специални програми',
        cards: [
          {
            heading: 'Замени и спести',
            description: 'Върнете стар уред и получете отстъпка от новата си покупка.',
            image: promoTrade,
            cta: { label: 'Научете повече', url: '/programi/zamiana' },
            theme: 'dark',
          },
          {
            heading: 'PowerOcean за дома',
            description: 'Безплатен оглед и проектиране на система за вашия дом.',
            image: promoOcean,
            cta: { label: 'Заявете оглед', url: '/kontakti' },
            theme: 'dark',
          },
        ],
      },
      {
        blockType: 'wideBanner',
        heading: 'Големи поръчки, по-големи отстъпки',
        subheading: 'Специални условия за фирми, общини и институции.',
        image: bannerBulk,
        cta: { label: 'Заявете оферта', url: '/biznes' },
        align: 'left',
        theme: 'dark',
      },
      {
        blockType: 'benefitsGrid',
        sectionTitle: 'Защо да пазарувате при нас',
        items: [
          { icon: 'certificate', title: 'Официален вносител', description: 'Пълна гаранция и оригинални продукти.' },
          { icon: 'card', title: 'Разсрочено плащане', description: 'До 12 вноски без оскъпяване.' },
          { icon: 'support', title: 'Поддръжка на български', description: 'Телефон, имейл и чат в работни дни.' },
          { icon: 'return', title: '30 дни за връщане', description: 'Без обяснения, ако размислите.' },
          { icon: 'truck', title: 'Безплатна доставка', description: 'За поръчки над 200 €.' },
        ],
      },
      {
        blockType: 'testimonialsBlock',
        sectionTitle: 'Истински отзиви. Истинска мощност.',
        testimonials: testimonialIds,
      },
      {
        blockType: 'logoWall',
        sectionTitle: 'Отличени от',
        awards: awardIds,
      },
      {
        blockType: 'promoCards',
        sectionTitle: 'Станете член',
        cards: [
          {
            heading: 'Клуб EcoFlow',
            description: 'Събирайте точки от всяка покупка и ги обръщайте в отстъпки.',
            image: promoMember,
            cta: { label: 'Регистрация', url: '/chlenstvo' },
            theme: 'dark',
          },
          {
            heading: 'Препоръчайте на приятел',
            description: 'Вие получавате до 100 €, приятелят ви — отстъпка от първата поръчка.',
            image: promoRefer,
            cta: { label: 'Как работи', url: '/preporaki' },
            theme: 'dark',
          },
        ],
      },
    ],
  },
})

console.log('Настройка на футъра…')
// Менюто (хедърът) се попълва отделно с `npm run seed:menu`,
// защото структурата му е по-обемна и се настройва самостоятелно.

await payload.updateGlobal({
  slug: 'footer',
  data: {
    newsletterEnabled: true,
    newsletterHeading: 'Бъдете в течение',
    newsletterText: 'Промоции, нови продукти и съвети за резервно захранване. Без спам.',
    columns: [
      {
        heading: 'Продукти',
        links: [
          { label: 'Портативни електроцентрали', url: '/categories/portativni-elektrocentrali' },
          { label: 'Домашни батерии', url: '/categories/domashni-baterii' },
          { label: 'Соларни панели', url: '/categories/solarni-paneli' },
          { label: 'Аксесоари', url: '/categories/aksesoari' },
        ],
      },
      {
        heading: 'Поддръжка',
        links: [
          { label: 'Гаранция', url: '/garanciya' },
          { label: 'Ръководства', url: '/rakovodstva' },
          { label: 'Сервиз', url: '/serviz' },
          { label: 'Често задавани въпроси', url: '/vaprosi' },
        ],
      },
      {
        heading: 'Фирма',
        links: [
          { label: 'За нас', url: '/za-nas' },
          { label: 'Контакти', url: '/kontakti' },
          { label: 'Кариери', url: '/karieri' },
          { label: 'Новини', url: '/novini' },
        ],
      },
      {
        heading: 'Програми',
        links: [
          { label: 'Замени и спести', url: '/programi/zamiana' },
          { label: 'Клуб EcoFlow', url: '/chlenstvo' },
          { label: 'За бизнеса', url: '/biznes' },
        ],
      },
    ],
    social: [
      { platform: 'facebook', url: 'https://facebook.com' },
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'youtube', url: 'https://youtube.com' },
    ],
    copyright: `© ${new Date().getFullYear()} EcoFlow България. Всички права запазени.`,
    legalLinks: [
      { label: 'Общи условия', url: '/obshti-usloviya' },
      { label: 'Поверителност', url: '/poveritelnost' },
      { label: 'Бисквитки', url: '/biskvitki' },
    ],
  },
})

await payload.updateGlobal({
  slug: 'site-settings',
  data: {
    announcementEnabled: true,
    announcementText: 'Безплатна доставка за поръчки над 200 € · Гаранция 5 години',
    announcementUrl: '/dostavka',
    logo: logoImg,
    brandColor: '#00A862',
    shopUrl: 'https://example.com/shop',
    showBgnPrices: false,
    companyName: 'Вашата фирма ЕООД',
    vatNumber: '000000000',
    address: 'ул. Примерна 1\n1000 София',
    phone: '+359 2 000 0000',
    email: 'info@example.bg',
    distributorNotice: 'Официален дистрибутор на EcoFlow за България',
  },
})

console.log('\nГотово. Влезте в /admin с:')
console.log(`  Имейл: ${adminEmail}`)
console.log(`  Парола: ${adminPassword}`)
process.exit(0)
