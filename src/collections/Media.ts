import fs from 'fs/promises'
import path from 'path'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
} from 'payload'
import { revalidateAll, revalidateAllOnDelete } from '../lib/revalidate'
import { makeTrimmed, NO_TRIMMED } from '../lib/trim-image'

const MEDIA_DIR = path.resolve(process.cwd(), 'media')

type Trimmed = { filename?: string | null } | null | undefined

/**
 * Изрязаният вариант за картите (`src/lib/trim-image.ts`) — при всяко
 * качване на файл. Запис без файл (alt, име) не го пипа.
 *
 * НЕ е размер в `imageSizes`: Payload би го направил за ВСЯКА снимка, а
 * снимка без прозрачен фон не бива да има такъв. Подмяната на файла от
 * вноса (`replaceMediaContent`) и `media:regenerate` го правят сами.
 */
const fillTrimmed: CollectionBeforeChangeHook = async ({ data, req }) => {
  const file = req.file
  if (!file || !data.filename || !String(file.mimetype ?? '').startsWith('image/')) return data
  try {
    const stem = path.parse(data.filename).name
    data.trimmed = (await makeTrimmed(file.tempFilePath || file.data, stem, MEDIA_DIR)) ?? NO_TRIMMED
  } catch (e) {
    // Без вариант картата показва снимката както досега — качването не се отказва.
    req.payload.logger.warn(`Изрязан вариант на ${data.filename}: ${e instanceof Error ? e.message : e}`)
    data.trimmed = NO_TRIMMED
  }
  return data
}

const removeFile = (name: string | null | undefined) =>
  name ? fs.rm(path.join(MEDIA_DIR, name), { force: true }) : undefined

/** Новият файл е с нов вариант — старият се трие, щом записът е минал. */
const dropOldTrimmed: CollectionAfterChangeHook = async ({ doc, previousDoc }) => {
  const old = (previousDoc?.trimmed as Trimmed)?.filename
  if (old && old !== (doc.trimmed as Trimmed)?.filename) await removeFile(old)
  return doc
}

const dropTrimmedOnDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  await removeFile((doc.trimmed as Trimmed)?.filename)
}

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Файл', plural: 'Медия' },
  admin: { group: 'Съдържание' },
  access: { read: () => true },
  /*
    Снимката се показва навсякъде, а адресът ѝ носи `?v=<време на промяна>`.
    Без тези куки презаписана или изрязана снимка остава със стария адрес в
    кешираните страници и не се сменя до следващия билд.
  */
  hooks: {
    beforeChange: [fillTrimmed],
    afterChange: [dropOldTrimmed, revalidateAll],
    afterDelete: [dropTrimmedOnDelete, revalidateAllOnDelete],
  },
  upload: {
    staticDir: 'media',

    /*
      ТУК НЯМА `formatOptions` НАРОЧНО. Не го връщайте.

      На това ниво настройката важи само за главния файл, а не за размерите.
      Резултатът беше обърнат: оригиналът излизаше .webp, а thumbnail, card,
      banner и wide оставаха .png или .jpg — тоест точно файловете, които
      сайтът реално показва, не бяха преобразувани.

      Сега оригиналът се пази както е качен. Той е архивът: ако утре
      потрябва друг формат, други изрезки или по-високо качество, има от
      какво да се направят. Преобразуван оригинал е загубен безвъзвратно.

      Преобразуването се прави на всеки размер поотделно, по-долу.
    */

    // Размерите отговарят на местата, където изображенията се ползват в дизайна.
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 400,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 82 } },
      },
      {
        name: 'card',
        width: 768,
        height: 768,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 82 } },
      },
      {
        name: 'banner',
        width: 1920,
        height: 900,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 82 } },
      },
      {
        name: 'wide',
        width: 2400,
        height: 800,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 82 } },
      },

      /*
        Тези два размера имат САМО ширина — Sharp пази съотношението и не
        изрязва нищо.

        Размерите по-горе задават и височина, тоест режат до точно
        съотношение. За миниатюри и банери това е желаното, но за секционни
        снимки е разрушително: портретен колаж 1680×2037, свит до 1920×900,
        губи две трети от съдържанието си.
      */
      {
        name: 'content',
        width: 1600,
        formatOptions: { format: 'webp', options: { quality: 82 } },
      },
      {
        name: 'large',
        width: 2000,
        formatOptions: { format: 'webp', options: { quality: 82 } },
      },

      /*
        Най-големият вариант за фронта.

        Оригиналът НЕ се сервира на посетители — той е архив (виж по-горе) и
        е JPEG: PC_3_1_D3P_RV е 454 KB срещу 80 KB за същата снимка в webp.
        Браузър с devicePixelRatio ≥ 1,5 избираше точно него и страницата
        излизаше 5–6 MB. `full` дава същата резолюция в webp.

        `withoutEnlargement` е задължително: без него оригинал от 2048 px
        се разтяга до 2400 и качеството пада, вместо да се запази. С него
        Sharp спира на ширината на оригинала — 2048 px оригинал дава
        `…-2048x640.webp`.

        Качество 85, не 82: това е най-голямото копие и единственото, което
        се гледа на 4K екран.
      */
      {
        name: 'full',
        width: 2400,
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 85 } },
      },
    ],
    /*
      Приема и видео заради банерите с движещ се фон.

      Sharp не пипа видеата — Payload прескача `imageSizes` за файлове,
      които не са изображения, така че размерите по-горе остават празни за
      тях. Затова видеото се вгражда с оригиналния си адрес.
    */
    mimeTypes: ['image/*', 'video/mp4', 'video/webm'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Алтернативен текст',
      admin: { description: 'Описание на изображението за екранни четци и SEO. Задължително.' },
    },
    /*
      Само за справка — името, под което снимката е дошла (dice.bg,
      EcoFlow), преди `npm run snimki:imena` да ѝ даде смислено. Вносът и
      замяната НЕ търсят по него: търсят по името на файла.
    */
    {
      name: 'originalName',
      type: 'text',
      label: 'Оригинално име',
      admin: {
        readOnly: true,
        description: 'Името на файла, преди да получи смислено име. Само за справка.',
      },
    },
    /*
      Изрязаният вариант за продуктовите карти — само видимата част на
      снимка с прозрачен фон (`src/lib/trim-image.ts`). Празен при снимка
      без прозрачност: тогава картата показва снимката както досега.
      Пише се само от кода — при качване, от вноса и от `media:regenerate`.
    */
    {
      name: 'trimmed',
      type: 'group',
      label: 'Изрязан вариант за картите',
      admin: { hidden: true },
      fields: [
        { name: 'filename', type: 'text' },
        { name: 'width', type: 'number' },
        { name: 'height', type: 'number' },
      ],
    },
  ],
}
