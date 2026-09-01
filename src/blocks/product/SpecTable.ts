import type { Block } from 'payload'
import { anchorField, blockLabel } from './shared'

/**
 * Таблица със спецификации.
 *
 * Блокът няма собствено съдържание — изчертава полето „Спецификации по групи"
 * на самия продукт. Така таблицата се поддържа на едно място, а блокът само
 * казва къде на страницата да се появи.
 */
export const SpecTable: Block = {
  slug: 'specTable',
  labels: { singular: 'Таблица със спецификации', plural: 'Таблици със спецификации' },
  admin: blockLabel('heading'),
  fields: [
    anchorField,
    {
      name: 'heading',
      type: 'text',
      label: 'Заглавие',
      defaultValue: 'Спецификации',
      admin: {
        description:
          'Съдържанието идва от раздел „Спецификации" на продукта — тук не се въвежда нищо.',
      },
    },
  ],
}
