import type { Block } from 'payload'
import { anchorField, blockLabel, rowLabel } from './shared'

/** Хоризонтална лента с едри числа под галерията — капацитет, мощност, тегло. */
export const KeySpecStrip: Block = {
  slug: 'keySpecStrip',
  labels: { singular: 'Лента с ключови показатели', plural: 'Ленти с ключови показатели' },
  admin: blockLabel('anchorLabel'),
  fields: [
    anchorField,
    {
      name: 'items',
      type: 'array',
      label: 'Показатели',
      labels: { singular: 'Показател', plural: 'Показатели' },
      minRows: 3,
      maxRows: 8,
      admin: { ...rowLabel('value', 'Показател') },
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
          label: 'Число',
          admin: { description: 'Едрият текст. Напр. 1024Wh.' },
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          label: 'Пояснение',
          admin: { description: 'Дребният текст отдолу. Напр. Капацитет.' },
        },
      ],
    },
  ],
}
