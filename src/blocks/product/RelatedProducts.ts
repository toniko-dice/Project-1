import type { Block } from 'payload'
import { anchorField, blockLabel } from './shared'

/** Свързани продукти — карусел с други модели. */
export const RelatedProducts: Block = {
  slug: 'relatedProducts',
  labels: { singular: 'Свързани продукти', plural: 'Свързани продукти' },
  admin: blockLabel('heading'),
  fields: [
    anchorField,
    { name: 'heading', type: 'text', label: 'Заглавие', defaultValue: 'Може да ви заинтересува' },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'Продукти',
      admin: { description: 'Подредбата тук е подредбата на екрана.' },
    },
  ],
}
