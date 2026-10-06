import type { Block } from 'payload'

import { blockLabel } from '../product/shared'
import { requiredUnlessHidden } from '../shared'
import { imageFields } from './shared'

/**
 * На цялата ширина: снимка вляво, черно поле вдясно с бял H2, текст и бял
 * бутон. На телефон снимката е отгоре, текстът отдолу.
 */
export const SplitBanner: Block = {
  slug: 'splitBanner',
  labels: { singular: 'Банер снимка + текст', plural: 'Банери снимка + текст' },
  admin: blockLabel('heading'),
  fields: [
    { name: 'heading', type: 'text', validate: requiredUnlessHidden, label: 'Заглавие (H2)' },
    { name: 'body', type: 'textarea', label: 'Текст' },
    ...imageFields(),
    {
      type: 'row',
      fields: [
        {
          name: 'ctaLabel',
          type: 'text',
          label: 'Текст на бутона',
          defaultValue: 'Разгледайте',
          admin: { width: '40%' },
        },
        {
          name: 'ctaLink',
          type: 'text',
          label: 'Адрес на бутона',
          admin: { width: '60%', description: 'Напр. /kategorii/delta-seriya. Празно — без бутон.' },
        },
      ],
    },
  ],
}
