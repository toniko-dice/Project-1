import type { Block } from 'payload'

import { blockLabel, rowLabel } from '../product/shared'
import { requiredUnlessHidden } from '../shared'
import { imageFields } from './shared'

/**
 * Сив заоблен контейнер: вляво бяла карта с акордеон (първата точка е
 * отворена), вдясно снимка. На телефон снимката е отгоре.
 */
export const AccordionImage: Block = {
  slug: 'accordionImage',
  labels: { singular: 'Акордеон със снимка', plural: 'Акордеони със снимка' },
  admin: blockLabel('heading'),
  fields: [
    { name: 'heading', type: 'text', validate: requiredUnlessHidden, label: 'Заглавие (H2)' },
    {
      name: 'items',
      type: 'array',
      label: 'Точки',
      labels: { singular: 'Точка', plural: 'Точки' },
      validate: requiredUnlessHidden,
      admin: { ...rowLabel('title', 'Точка') },
      fields: [
        { name: 'title', type: 'text', validate: requiredUnlessHidden, label: 'Заглавие' },
        { name: 'text', type: 'textarea', label: 'Текст' },
      ],
    },
    ...imageFields(),
  ],
}
