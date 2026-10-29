import path from 'path'
import { fileURLToPath } from 'url'

import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { bg } from '@payloadcms/translations/languages/bg'
import { en } from '@payloadcms/translations/languages/en'
import { buildConfig } from 'payload'
import sharp, { type SharpOptions } from 'sharp'

import { Attributes } from './collections/Attributes'
import { Awards } from './collections/Awards'
import { Backups } from './collections/Backups'
import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Documents } from './collections/Documents'
import { MenuPanels } from './collections/MenuPanels'
import { Offers } from './collections/Offers'
import { Pages } from './collections/Pages'
import { Products } from './collections/Products'
import { QuoteFiles } from './collections/QuoteFiles'
import { QuoteRequests } from './collections/QuoteRequests'
import { ContactMessages } from './collections/ContactMessages'
import { Redirects } from './collections/Redirects'
import { CookieConsents } from './collections/CookieConsents'
import { Subscribers } from './collections/Subscribers'
import { Testimonials } from './collections/Testimonials'
import { Users } from './collections/Users'
import { dailyBackupTask } from './jobs/backupTask'
import { mailLogAdapter } from './lib/mail-log'
import { SITE_URL } from './lib/site-url'
import { diceSyncTask } from './jobs/diceSyncTask'
import { DiceSyncs } from './collections/DiceSyncs'
import { PriceApprovals } from './collections/PriceApprovals'
import { PriceHistory } from './collections/PriceHistory'
import { DiceSync } from './globals/DiceSync'
import { Design } from './globals/Design'
import { FilterOrder } from './globals/FilterOrder'
import { Footer } from './globals/Footer'
import { OfferSettings } from './globals/OfferSettings'
import { Header } from './globals/Header'
import { InfoPages } from './globals/InfoPages'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Sharp с по-висок таван на пикселите — заради анимациите.
 *
 * Payload отваря WebP, GIF и AVIF с `animated: true` и Sharp брои ВСИЧКИ
 * кадри като една висока снимка. Анимацията в секцията на GLACIER Classic
 * (2000×2000, 120 кадъра) е 480 млн. пиксела при таван 268 млн. и качването
 * падаше с „Input image exceeds pixel limit" — трите хладилника не се
 * внасяха. Паметта не расте: libvips обработва кадрите на части (проба —
 * 74 MB), но размерите се правят бавно, около минута на размер.
 *
 * Таванът остава — един милиард, не изключен: защитава от файл,
 * който се разгъва до безкрайност.
 */
const sharpForUploads = ((input?: Parameters<typeof sharp>[0], options?: SharpOptions) =>
  sharp(input, { limitInputPixels: 1_000_000_000, ...options })) as typeof sharp

/**
 * Пощата — SMTP през nodemailer, ако `SMTP_HOST` е зададен (виж
 * `.env.example` и README „Имейли"). Без него — или с `EMAIL_MODE=log` —
 * писмата само се записват в `mail-log/` и в лога (`src/lib/mail-log.ts`):
 * формите работят, нищо не се праща. `skipVerify`: скриптовете
 * (`payload run`) и билдът не бива да чакат или падат, ако пощенският
 * сървър не отговаря.
 */
function mailAdapter() {
  const from = process.env.MAIL_FROM || 'EcoFlow България <noreply@ecoflow.bg>'
  const m = /^(.*)<([^>]+)>\s*$/.exec(from)
  const name = (m?.[1] ?? 'EcoFlow България').trim().replace(/^"|"$/g, '')
  const address = (m?.[2] ?? from).trim()
  if (!process.env.SMTP_HOST || process.env.EMAIL_MODE === 'log') return mailLogAdapter({ name, address })
  return nodemailerAdapter({
    defaultFromName: name,
    defaultFromAddress: address,
    skipVerify: true,
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      ...(process.env.SMTP_USER
        ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' } }
        : {}),
    },
  })
}

/*
  Откъде браузърът може да праща бисквитката за вход (CSRF) и CORS: адресът
  на сайта (`NEXT_PUBLIC_SITE_URL` — https://ecoflow.bg) и SSH тунелът
  (http://localhost:8080 — резервният вход). Заявка с бисквитка от друг
  произход се приема като анонимна. `serverURL` НЕ се задава нарочно: с него
  админът през тунела праща заявките към ecoflow.bg (друг произход, без
  бисквитката) и тунелът спира да работи; без него адресите са относителни.
  Пълните адреси в сайта и имейлите идват от `SITE_URL`, не от `serverURL`.
*/
const ПРОИЗХОДИ = [...new Set([SITE_URL, 'http://localhost:8080'])]

export default buildConfig({
  cors: ПРОИЗХОДИ,
  csrf: ПРОИЗХОДИ,
  admin: {
    user: Users.slug,
    /*
      Без Gravatar: по подразбиране Payload тегли снимката на профила от
      gravatar.com — с хеш от имейла и IP адреса на служителя към трета
      страна (`docs/biskvitki-inventar.md`). Стандартната иконка — без заявка.
    */
    avatar: 'default',
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: '— EcoFlow България',
      /*
        Иконата „EF" като на сайта — файловете са в `src/app/`. `favicon.ico`
        Next слага сам на всяка страница (и тук), затова го няма в списъка.
      */
      icons: [
        { rel: 'icon', type: 'image/svg+xml', url: '/icon.svg' },
        { rel: 'apple-touch-icon', url: '/apple-icon.png', sizes: '180x180' },
      ],
    },
    // Кръгчето с броя на заявките „Нова" до „Нови заявки" в менюто.
    components: {
      afterNavLinks: [
        '@/components/admin/QuoteNavBadge#QuoteNavBadge',
        {
          path: '@/components/admin/QuoteNavBadge#CollectionNavBadge',
          clientProps: { slug: 'contact-messages', noun: 'нови съобщения' },
        },
        {
          path: '@/components/admin/QuoteNavBadge#CollectionNavBadge',
          clientProps: { slug: 'price-approvals', noun: 'цени чакат одобрение', status: 'pending' },
        },
      ],
    },
  },
  collections: [
    QuoteRequests,
    ContactMessages,
    Offers,
    DiceSyncs,
    PriceApprovals,
    PriceHistory,
    QuoteFiles,
    Pages,
    Products,
    Categories,
    Attributes,
    MenuPanels,
    Media,
    Documents,
    Testimonials,
    Awards,
    Subscribers,
    Backups,
    Users,
    Redirects,
    CookieConsents,
  ],
  globals: [Header, Footer, Design, SiteSettings, FilterOrder, OfferSettings, DiceSync, InfoPages],
  // Архивирането по график минава през опашката за задачи на Payload.
  // Работи само докато сървърът върви — при спряна машина архив не се прави.
  jobs: {
    tasks: [dailyBackupTask, diceSyncTask],
    autoRun: [{ cron: '0 */5 * * * *', queue: 'nightly', limit: 5 }],
    shouldAutoRun: () => true,
    deleteJobOnComplete: true,
  },
  email: mailAdapter(),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: sqliteAdapter({
    client: { url: process.env.DATABASE_URI || 'file:./ecoflow.db' },
    /*
      Втори процес (`payload run`, вносът на сървъра, синхронизацията)
      чака заетата база до 15 s, вместо да падне със `SQLITE_BUSY` — на
      12 октомври 2026 така се прекъсна синхронизацията с dice.bg по средата.
    */
    busyTimeout: 15_000,
    // Схемата се променя САМО чрез миграции. Автоматичното напасване (push)
    // е изключено, защото при промяна на поле то задава интерактивни въпроси
    // и рискува да загуби данни. Работният ред е:
    //   npm run migrate:create  →  преглед на файла  →  npm run migrate
    push: false,
  }),
  sharp: sharpForUploads,
  // Интерфейсът на админа е на български; английският остава като резервен.
  i18n: {
    supportedLanguages: { bg, en },
    fallbackLanguage: 'bg',
  },
  upload: {
    // 50 MB — заради PDF-ите на документите (ръководствата за монтаж на STREAM са ~29 MB).
    // Реалният таван е в nginx: 50m само за /api/documents, 12m за всичко останало.
    limits: { fileSize: 50_000_000 },
  },
})
