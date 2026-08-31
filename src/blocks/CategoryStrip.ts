import type { Block } from 'payload'

export const CategoryStrip: Block = {
  slug: 'categoryStrip',
  labels: { singular: 'Лента с категории', plural: 'Ленти с категории' },
  imageAltText: 'Хоризонтален ред с икони на категориите',
  fields: [
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      required: true,
      label: 'Категории',
      admin: { description: 'Подредбата тук определя реда на екрана. Препоръчително 6–9 броя.' },
    },
  ],
}
