import type { Block } from 'payload'

import { blockLabel, rowLabel } from '../product/shared'
import { requiredUnlessHidden } from '../shared'
import { optionalImageFields } from './shared'

/**
 * „Табове с продукти" — H2, табове-хапчета; във всеки таб голям банер и
 * карти на продукти. Снимката, името, адресът и бутонът „Купи" идват от
 * продукта; чернова не се показва, таб без продукти — също.
 */
export const ProductTabs: Block = {
  slug: 'productTabs',
  labels: { singular: 'Табове с продукти', plural: 'Табове с продукти' },
  admin: blockLabel('heading'),
  fields: [
    { name: 'heading', type: 'text', label: 'Заглавие (H2)' },
    {
      name: 'tabs',
      type: 'array',
      label: 'Табове',
      labels: { singular: 'Таб', plural: 'Табове' },
      admin: rowLabel('label', 'Таб'),
      fields: [
        { name: 'label', type: 'text', validate: requiredUnlessHidden, label: 'Надпис на таба' },
        { name: 'heading', type: 'text', label: 'Заглавие на банера' },
        { name: 'body', type: 'textarea', label: 'Текст на банера' },
        {
          type: 'row',
          fields: [
            {
              name: 'ctaLabel',
              type: 'text',
              label: 'Текст на линка',
              defaultValue: 'Научете повече',
              admin: { width: '50%' },
            },
            {
              name: 'ctaLink',
              type: 'text',
              label: 'Адрес на линка',
              admin: { width: '50%', description: 'Вътрешен път, напр. /kategorii/delta-seriya' },
            },
          ],
        },
        ...optionalImageFields('Снимка на банера'),
        {
          name: 'products',
          type: 'array',
          label: 'Продукти',
          labels: { singular: 'Продукт', plural: 'Продукти' },
          admin: {
            ...rowLabel('specLine', 'Продукт'),
            description: 'До 4 в ред; на телефон се плъзгат. Чернова не се показва.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'product',
                  type: 'relationship',
                  relationTo: 'products',
                  label: 'Продукт',
                  admin: { width: '50%' },
                },
                {
                  name: 'specLine',
                  type: 'text',
                  label: 'Ред под името',
                  admin: { width: '50%', description: 'Празно — кратката спецификация на продукта.' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
