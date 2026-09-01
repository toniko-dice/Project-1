import type { Block } from 'payload'
import { anchorField, blockLabel, rowLabel } from './shared'

/**
 * Сравнение между модели.
 *
 * В оригинала всяка колона е цяла картичка — снимка, име, кратко описание,
 * цена със стара цена и бутон за покупка. Затова колоните тук не са само
 * заглавия, а носят собствени полета.
 *
 * На тесен екран таблицата се скролва хоризонтално, а колоната с етикетите
 * остава залепена вляво.
 */
export const ComparisonTable: Block = {
  slug: 'comparisonTable',
  labels: { singular: 'Сравнение между модели', plural: 'Сравнения между модели' },
  admin: blockLabel('heading'),
  fields: [
    anchorField,
    { name: 'heading', type: 'text', label: 'Заглавие' },
    {
      name: 'columns',
      type: 'array',
      label: 'Колони',
      labels: { singular: 'Колона', plural: 'Колони' },
      minRows: 2,
      maxRows: 4,
      admin: {
        description: 'Всяка колона е един модел. Редовете по-долу трябва да са в същия ред.',
        ...rowLabel('label', 'Колона'),
      },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          label: 'Продукт',
          admin: { description: 'Ако моделът е в нашия каталог, останалото се допълва от него.' },
        },
        {
          name: 'label',
          type: 'text',
          label: 'Име',
          admin: { description: 'Ползва се, когато моделът не е в каталога ни.' },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Снимка',
          admin: { description: 'По избор. Ако е празно, се взима от продукта.' },
        },
        {
          name: 'tagline',
          type: 'text',
          label: 'Кратко описание',
          admin: { description: 'Напр. най-изгодният за туризъм.' },
        },
        {
          type: 'row',
          fields: [
            { name: 'price', type: 'number', label: 'Цена (EUR)', admin: { width: '50%' } },
            {
              name: 'comparePrice',
              type: 'number',
              label: 'Стара цена (EUR)',
              admin: { width: '50%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'ctaLabel',
              type: 'text',
              label: 'Бутон — текст',
              defaultValue: 'Купи сега',
              admin: { width: '50%' },
            },
            { name: 'ctaUrl', type: 'text', label: 'Бутон — адрес', admin: { width: '50%' } },
          ],
        },
        {
          name: 'highlight',
          type: 'checkbox',
          label: 'Това е текущият продукт',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'rows',
      type: 'array',
      label: 'Редове за сравнение',
      labels: { singular: 'Ред', plural: 'Редове' },
      admin: {
        description: 'Всеки ред е един показател. Стойностите се въвеждат по една за колона.',
        ...rowLabel('label', 'Ред'),
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          label: 'Показател',
          admin: { description: 'Напр. капацитет, изход променлив ток, тегло.' },
        },
        {
          name: 'values',
          type: 'array',
          label: 'Стойности',
          labels: { singular: 'Стойност', plural: 'Стойности' },
          admin: {
            description: 'По една за всяка колона, в същия ред като колоните по-горе.',
            ...rowLabel('value', 'Стойност'),
          },
          fields: [{ name: 'value', type: 'text', label: 'Стойност' }],
        },
      ],
    },
  ],
}
