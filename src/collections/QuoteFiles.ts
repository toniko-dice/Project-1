import type { CollectionConfig } from 'payload'

import { FILE_TYPES } from '../lib/quote/options'
import { isAdmin, isSales } from '../lib/access'

/**
 * Прикачените файлове към заявките за оферта.
 *
 * Отделно от „Медия", защото са лични данни на клиента (спецификации,
 * задания, понякога подписани документи): Медия е публична (`read: true`)
 * и всичко в нея се вижда на `/api/media/file/…`. Тук четенето е само за
 * влязъл админ — и записът, и самият файл (`/api/quote-files/file/…`
 * минава през същата проверка за достъп).
 *
 * Папката `quote-files/` е извън git, както `media/`. Записва се само от
 * пътя на формата (`/api/oferta`); от админа не се качва.
 */
export const QuoteFiles: CollectionConfig = {
  slug: 'quote-files',
  labels: { singular: 'Файл към заявка', plural: 'Файлове към заявки' },
  admin: {
    group: 'Продажби',
    hidden: true,
  },
  access: { read: isSales, create: () => false, update: () => false, delete: isAdmin },
  upload: {
    staticDir: 'quote-files',
    mimeTypes: [...new Set(Object.values(FILE_TYPES).flat())],
    // Без размери — и снимките тук са документи, не илюстрации.
    imageSizes: [],
    disableLocalStorage: false,
  },
  fields: [],
}
