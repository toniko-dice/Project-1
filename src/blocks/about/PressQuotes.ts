import type { Block } from 'payload'

import { blockLabel, rowLabel } from '../product/shared'
import { hiddenItemField } from './shared'

/** „Цитати от медии" — карти със снимка-лого на изданието и цитат. */
export const PressQuotes: Block = {
  slug: 'pressQuotes',
  labels: { singular: 'Цитати от медии', plural: 'Цитати от медии' },
  admin: blockLabel('heading'),
  fields: [
    { name: 'heading', type: 'text', label: 'Заглавие (H2)' },
    {
      name: 'items',
      type: 'array',
      label: 'Цитати',
      labels: { singular: 'Цитат', plural: 'Цитати' },
      admin: rowLabel('source', 'Цитат'),
      fields: [
        hiddenItemField,
        { name: 'image', type: 'upload', relationTo: 'media', label: 'Снимка с логото на изданието' },
        {
          name: 'quote',
          type: 'textarea',
          label: 'Цитат',
          admin: { description: 'Без кавички — слагат се сами („…").' },
        },
        { name: 'source', type: 'text', label: 'Източник' },
      ],
    },
  ],
}
