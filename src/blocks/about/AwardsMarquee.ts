import type { Block } from 'payload'

import { rowLabel } from '../product/shared'
import { hiddenItemField } from './shared'

/** „Лента с отличия" — лога, които се въртят безкрайно; спират при посочване. */
export const AwardsMarquee: Block = {
  slug: 'awardsMarquee',
  labels: { singular: 'Лента с отличия', plural: 'Ленти с отличия' },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Отличия',
      labels: { singular: 'Отличие', plural: 'Отличия' },
      admin: rowLabel('title', 'Отличие'),
      fields: [
        hiddenItemField,
        { name: 'image', type: 'upload', relationTo: 'media', label: 'Лого' },
        {
          type: 'row',
          fields: [
            { name: 'title', type: 'text', label: 'Заглавие', admin: { width: '50%' } },
            {
              name: 'subtitle',
              type: 'text',
              label: 'Подзаглавие',
              admin: { width: '50%', description: 'Напр. „3 отличия".' },
            },
          ],
        },
      ],
    },
  ],
}
