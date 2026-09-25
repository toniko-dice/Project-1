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
      admin: {
        ...rowLabel('name', 'Артикул'),
        description: 'Ползва се, когато няма раздели по-долу.',
      },
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
      /*
        Раздели по модел.

        Страница, която покрива няколко модела (RIVER 3 Plus / Max /
        Max Plus), показва различно съдържание на кутията за всеки — така е
        и в оригинала. Празно поле значи една кутия: тогава се показва
        списъкът „Съдържание" по-горе, както досега.
      */
      name: 'groups',
      type: 'array',
      label: 'Раздели по модел',
      labels: { singular: 'Раздел', plural: 'Раздели' },
      admin: {
        ...rowLabel('label', 'Раздел'),
        description:
          'По избор. С попълнени раздели списъкът „Съдържание" по-горе НЕ се показва.',
      },
      fields: [
        { name: 'label', type: 'text', required: true, label: 'Име на раздела' },
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
      ],
    },
    {
      name: 'defaultGroup',
      type: 'number',
      label: 'Отворен раздел',
      min: 0,
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.groups?.length),
        description:
          'Номер на раздела, който е отворен при зареждане — първият е 0. Празно значи първия.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Бележка под картите',
      admin: { description: 'По избор.' },
    },
  ],
}
