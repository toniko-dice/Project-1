import type { Block } from 'payload'

import { blockLabel, rowLabel } from '../product/shared'
import { requiredUnlessHidden } from '../shared'

/**
 * Сравнение на времето за работа: колони с продукти (снимка, име, ред със
 * спецификации, „Купи сега", „Научете повече") и таблица под тях.
 *
 * Снимката, името, цената и двата линка идват ОТ ПРОДУКТА — тук се избира
 * само кой. Колона с чернова не се показва; стойностите в редовете следват
 * колоните по позиция, затова клетката отпада заедно с колоната.
 */
export const RuntimeCompare: Block = {
  slug: 'runtimeCompare',
  labels: { singular: 'Време за работа (таблица)', plural: 'Време за работа (таблици)' },
  admin: blockLabel('anchorLabel'),
  fields: [
    {
      name: 'products',
      type: 'array',
      label: 'Колони (продукти)',
      labels: { singular: 'Колона', plural: 'Колони' },
      validate: requiredUnlessHidden,
      admin: {
        ...rowLabel('specLine', 'Колона'),
        description: 'Колоните са колкото продуктите — 2 до 4.',
      },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          validate: requiredUnlessHidden,
          label: 'Продукт',
        },
        {
          name: 'specLine',
          type: 'text',
          label: 'Ред със спецификации',
          admin: {
            description:
              'Напр. „2048Wh | 3000W | 3900W X-Boost". Празно — кратката спецификация на продукта.',
          },
        },
      ],
    },
    {
      name: 'rows',
      type: 'array',
      label: 'Редове',
      labels: { singular: 'Ред', plural: 'Редове' },
      admin: { ...rowLabel('label', 'Ред') },
      fields: [
        {
          name: 'label',
          type: 'text',
          validate: requiredUnlessHidden,
          label: 'Уред',
          admin: { description: 'Напр. „Лампа 10W:".' },
        },
        {
          name: 'values',
          type: 'array',
          label: 'Стойности по колони',
          labels: { singular: 'Стойност', plural: 'Стойности' },
          admin: { ...rowLabel('value', 'Стойност'), description: 'В реда на колоните отгоре.' },
          fields: [{ name: 'value', type: 'text', label: 'Стойност' }],
        },
      ],
    },
  ],
}
