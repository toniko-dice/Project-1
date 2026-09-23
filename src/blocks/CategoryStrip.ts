import type { Block } from 'payload'
import { requiredUnlessHidden } from './shared'

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
      validate: requiredUnlessHidden,
      label: 'Категории',
      admin: { description: 'Подредбата тук определя реда на екрана. Препоръчително 6–9 броя.' },
    },
  ],
}
