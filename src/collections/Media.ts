import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Файл', plural: 'Медия' },
  admin: { group: 'Съдържание' },
  access: { read: () => true },
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
    ],
    mimeTypes: ['image/*'],
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
