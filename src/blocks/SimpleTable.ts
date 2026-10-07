import type { Block } from 'payload'

import { blockLabel } from './product/shared'

/**
 * „Таблица" — заглавие, колони, редове, бележка. Еднаквите стойности в
 * първата колона една под друга се обединяват (напр. серия). На телефон —
 * картички по първата колона.
 */
export const SimpleTable: Block = {
  slug: 'simpleTable',
  labels: { singular: 'Таблица', plural: 'Таблици' },
  admin: blockLabel('heading'),
  fields: [
    { name: 'heading', type: 'text', label: 'Заглавие (H2)' },
    {
      name: 'columns',
      type: 'array',
      label: 'Колони',
      labels: { singular: 'Колона', plural: 'Колони' },
      fields: [{ name: 'label', type: 'text', label: 'Надпис' }],
    },
    {
      name: 'rows',
      type: 'array',
      label: 'Редове',
      labels: { singular: 'Ред', plural: 'Редове' },
      admin: {
        components: {
          RowLabel: { path: '@/components/admin/RowLabel#RowLabel', clientProps: { field: 'cells.0.value', fallback: 'Ред' } },
        },
      },
      fields: [
        {
          name: 'cells',
          type: 'array',
          label: 'Клетки (по реда на колоните)',
          labels: { singular: 'Клетка', plural: 'Клетки' },
          fields: [{ name: 'value', type: 'text', label: 'Стойност' }],
        },
      ],
    },
    { name: 'note', type: 'textarea', label: 'Бележка под таблицата' },
  ],
}
