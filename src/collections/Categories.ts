import type { CollectionConfig } from 'payload'
import { revalidateAll, revalidateAllOnDelete } from '../lib/revalidate'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Категория', plural: 'Категории' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'parent', 'order'],
    group: 'Каталог',
    description:
      'Категориите са на две нива: главна категория (напр. „Портативни електроцентрали") и серия под нея (напр. „Серия DELTA"). Серията се закача към главната чрез полето „Подкатегория на".',
  },
  access: { read: () => true },
  hooks: {
    afterChange: [revalidateAll],
    afterDelete: [revalidateAllOnDelete],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Основни',
          fields: [
            { name: 'title', type: 'text', required: true, label: 'Име' },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              label: 'URL адрес',
              admin: {
                description: 'Напр. „delta-seriya" → /categories/delta-seriya. Само латиница и тирета.',
              },
            },
            {
              name: 'parent',
              type: 'relationship',
              relationTo: 'categories',
              label: 'Подкатегория на',
              admin: {
                description:
                  'Оставете празно за главна категория. Попълнете, за да стане серия под друга категория.',
              },
              filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
            },
            {
              name: 'order',
              type: 'number',
              defaultValue: 0,
              label: 'Подредба',
              admin: { description: 'По-малко число = по-напред.' },
            },
            {
              name: 'showInStrip',
              type: 'checkbox',
              label: 'Показване в лентата с икони',
              defaultValue: false,
              admin: { description: 'Отнася се за лентата с кръгли икони на началната страница.' },
            },
          ],
        },
        {
          label: 'Заглавна част',
          fields: [
            {
              name: 'icon',
              type: 'upload',
              relationTo: 'media',
              label: 'Икона',
              admin: { description: 'За лентата с категории. Препоръчително 160×160px.' },
            },
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Заглавно изображение',
              admin: { description: 'Банерът най-отгоре на страницата. Препоръчително 2400×800px.' },
            },
            { name: 'heroTagline', type: 'text', label: 'Подзаглавие в банера' },
            { name: 'description', type: 'textarea', label: 'Описание под продуктите' },
          ],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'metaTitle', type: 'text', label: 'Заглавие за търсачки' },
            { name: 'metaDescription', type: 'textarea', label: 'Описание за търсачки' },
          ],
        },
      ],
    },
  ],
}
