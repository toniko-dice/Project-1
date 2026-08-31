import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Файл', plural: 'Медия' },
  admin: { group: 'Съдържание' },
  access: { read: () => true },
  upload: {
    staticDir: 'media',
    // Размерите отговарят на местата, където изображенията се ползват в дизайна.
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 400, position: 'centre' },
      { name: 'card', width: 768, height: 768, position: 'centre' },
      { name: 'banner', width: 1920, height: 900, position: 'centre' },
      { name: 'wide', width: 2400, height: 800, position: 'centre' },
    ],
    mimeTypes: ['image/*'],
    formatOptions: { format: 'webp', options: { quality: 82 } },
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
