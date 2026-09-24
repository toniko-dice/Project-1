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
      name: 'mode',
      type: 'select',
      label: 'Съдържание',
      defaultValue: 'auto',
      options: [
        { label: 'Автоматично — съвместими аксесоари', value: 'auto' },
        { label: 'Ръчен избор', value: 'manual' },
      ],
      admin: {
        description:
          'Автоматично: аксесоарите, при които в „Съвместим с" е избран този продукт или неговата серия. Ръчно: списъкът по-долу.',
      },
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'Продукти',
      admin: {
        condition: (_, siblingData) => siblingData?.mode !== 'auto',
        description: 'Подредбата тук е подредбата на екрана.',
      },
    },
  ],
}
