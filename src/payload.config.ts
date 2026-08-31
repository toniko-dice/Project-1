import path from 'path'
import { fileURLToPath } from 'url'

import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { bg } from '@payloadcms/translations/languages/bg'
import { en } from '@payloadcms/translations/languages/en'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Awards } from './collections/Awards'
import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { MenuPanels } from './collections/MenuPanels'
import { Pages } from './collections/Pages'
import { Products } from './collections/Products'
import { Testimonials } from './collections/Testimonials'
import { Users } from './collections/Users'
import { Design } from './globals/Design'
import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: '— EcoFlow България',
    },
  },
  collections: [Pages, Products, Categories, MenuPanels, Media, Testimonials, Awards, Users],
  globals: [Header, Footer, Design, SiteSettings],
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
  sharp,
  // Интерфейсът на админа е на български; английският остава като резервен.
  i18n: {
    supportedLanguages: { bg, en },
    fallbackLanguage: 'bg',
  },
  upload: {
    limits: { fileSize: 15_000_000 },
  },
})
