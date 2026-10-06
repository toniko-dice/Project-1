import type { Block } from 'payload'

import { blockLabel } from '../product/shared'
import { requiredUnlessHidden } from '../shared'
import { imageFields } from './shared'

/**
 * Заоблена снимка вляво, вдясно в центъра H2, подзаглавие, сив текст и
 * син „Купи сега". Бутонът води към dice.bg ОТ ПРОДУКТА; без публикуван
 * продукт блокът не се показва.
 */
export const ImageWithText: Block = {
  slug: 'imageWithText',
  labels: { singular: 'Снимка + текст с продукт', plural: 'Снимки + текст с продукт' },
  admin: blockLabel('heading'),
  fields: [
    ...imageFields(),
    { name: 'heading', type: 'text', validate: requiredUnlessHidden, label: 'Заглавие (H2)' },
    { name: 'subheading', type: 'text', label: 'Подзаглавие' },
    { name: 'body', type: 'textarea', label: 'Текст' },
    {
      type: 'row',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          validate: requiredUnlessHidden,
          label: 'Продукт',
          admin: { width: '60%', description: 'Бутонът води към магазина на този продукт.' },
        },
        {
          name: 'ctaLabel',
          type: 'text',
          label: 'Текст на бутона',
          defaultValue: 'Купи сега',
          admin: {
            width: '40%',
            description: 'При „по заявка" и „изчерпан" надписът следва наличността.',
          },
        },
      ],
    },
  ],
}
