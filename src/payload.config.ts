import path from 'path'
import { fileURLToPath } from 'url'

import { sqliteAdapter } from '@payloadcms/db-sqlite'
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
import { MenuPanels } from './collections/MenuPanels'
import { Pages } from './collections/Pages'
import { Products } from './collections/Products'
import { Redirects } from './collections/Redirects'
import { Subscribers } from './collections/Subscribers'
import { Testimonials } from './collections/Testimonials'
import { Users } from './collections/Users'
import { dailyBackupTask } from './jobs/backupTask'
import { Design } from './globals/Design'
import { FilterOrder } from './globals/FilterOrder'
import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
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

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: '— EcoFlow България',
    },
  },
  collections: [
    Pages,
    Products,
    Categories,
    Attributes,
    MenuPanels,
    Media,
    Testimonials,
    Awards,
    Subscribers,
    Backups,
    Users,
    Redirects,
  ],
  globals: [Header, Footer, Design, SiteSettings, FilterOrder],
  // Архивирането по график минава през опашката за задачи на Payload.
  // Работи само докато сървърът върви — при спряна машина архив не се прави.
  jobs: {
    tasks: [dailyBackupTask],
    autoRun: [{ cron: '0 */5 * * * *', queue: 'nightly', limit: 5 }],
    shouldAutoRun: () => true,
    deleteJobOnComplete: true,
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: sqliteAdapter({
    client: { url: process.env.DATABASE_URI || 'file:./ecoflow.db' },
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
    // 20 MB — заради банерните видеа. Снимките са далеч под този размер.
    limits: { fileSize: 20_000_000 },
  },
})
