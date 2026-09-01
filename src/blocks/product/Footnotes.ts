import type { Block } from 'payload'
import { anchorField, blockLabel, rowLabel } from './shared'

/**
 * Бележки под линия.
 *
 * Оригиналът има единайсет номерирани уточнения най-долу — за живота на
 * батерията, за условията на измерване, за отклоненията в цветовете.
 * Част от тях уточняват твърдения от самата страница и не бива да падат
 * заедно с превода.
 *
 * Номерацията е автоматична — въвежда се само текстът.
 */
export const Footnotes: Block = {
  slug: 'footnotes',
  labels: { singular: 'Бележки под линия', plural: 'Бележки под линия' },
  admin: blockLabel('anchorLabel'),
  fields: [
    anchorField,
    {
      name: 'items',
      type: 'array',
      label: 'Бележки',
      labels: { singular: 'Бележка', plural: 'Бележки' },
      admin: {
        description: 'Номерацията се слага автоматично по реда тук.',
        ...rowLabel('text', 'Бележка'),
      },
      fields: [{ name: 'text', type: 'textarea', required: true, label: 'Текст' }],
    },
  ],
}
