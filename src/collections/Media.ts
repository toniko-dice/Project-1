import type { CollectionConfig } from 'payload'
import { revalidateAll, revalidateAllOnDelete } from '../lib/revalidate'

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
    afterChange: [revalidateAll],
    afterDelete: [revalidateAllOnDelete],
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
  ],
}
