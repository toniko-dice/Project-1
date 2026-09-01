import type { Block } from 'payload'
import { anchorField, blockLabel, rowLabel } from './shared'

/**
 * Варианти и комплекти.
 *
 * В оригинала изборът сменя цената в кошницата. Тук кошница няма, затова
 * всеки вариант е линк към своя продукт в магазина.
 *
 * Вариант без адрес, без свързан продукт и без отметка за текущ не се
 * показва — по-добре липсващ вариант, отколкото мъртъв бутон.
 */
export const BundleOptions: Block = {
  slug: 'bundleOptions',
  labels: { singular: 'Варианти и комплекти', plural: 'Варианти и комплекти' },
  admin: blockLabel('heading'),
  fields: [
    anchorField,
    { name: 'heading', type: 'text', label: 'Заглавие', defaultValue: 'Варианти' },
    {
      name: 'options',
      type: 'array',
      label: 'Варианти',
      labels: { singular: 'Вариант', plural: 'Варианти' },
      admin: { ...rowLabel('label', 'Вариант') },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          label: 'Име на варианта',
          admin: { description: 'Напр. самостоятелно, или: с панел 220W.' },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'price',
              type: 'number',
              required: true,
              label: 'Цена (EUR)',
              admin: { width: '50%' },
            },
            {
              name: 'comparePrice',
              type: 'number',
              label: 'Стара цена (EUR)',
              admin: {
                width: '50%',
                description: 'Отстъпката се смята от двете цени.',
              },
            },
          ],
        },
        {
          name: 'externalUrl',
          type: 'text',
          label: 'Линк към магазина',
          admin: { description: 'Адресът на този вариант в магазина.' },
        },
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          label: 'Свързан продукт',
          admin: { description: 'Ако вариантът е отделен продукт в нашия каталог.' },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'isCurrent',
              type: 'checkbox',
              label: 'Това е текущият продукт',
              defaultValue: false,
              admin: { width: '50%' },
            },
            {
              name: 'soldOut',
              type: 'checkbox',
              label: 'Изчерпан',
              defaultValue: false,
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
  ],
}
