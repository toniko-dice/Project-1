import type { Block } from 'payload'
import { anchorField, blockLabel, rowLabel } from './shared'

/**
 * Какво има в кутията.
 *
 * В оригинала това е една картинка с нарисуван списък вътре. Тук е на
 * истински карти, за да може да се превежда и да се чете от търсачките.
 */
export const InTheBox: Block = {
  slug: 'inTheBox',
  labels: { singular: 'Какво има в кутията', plural: 'Какво има в кутията' },
  admin: blockLabel('heading'),
  fields: [
    anchorField,
    { name: 'heading', type: 'text', label: 'Заглавие', defaultValue: 'Какво има в кутията' },
    {
      name: 'items',
      type: 'array',
      label: 'Съдържание',
      labels: { singular: 'Артикул', plural: 'Артикули' },
      admin: { ...rowLabel('name', 'Артикул') },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', label: 'Снимка' },
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'Име',
          admin: { description: 'Напр. кабел за зареждане.' },
        },
        { name: 'qty', type: 'number', label: 'Брой', defaultValue: 1, min: 1 },
      ],
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Бележка под картите',
      admin: { description: 'По избор.' },
    },
  ],
}
