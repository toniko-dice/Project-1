import type { CollectionConfig } from 'payload'
import { cleanSlug } from '../lib/slug'
import { revalidateAll, revalidateAllOnDelete } from '../lib/revalidate'

export const Categories: CollectionConfig = {
  slug: 'categories',
  // Записите се подреждат с влачене в списъчния изглед.
  orderable: true,
  // Списъкът се отваря в подредбата, зададена с влаченето.
  defaultSort: '_order',
  labels: { singular: 'Категория', plural: 'Категории' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'parent'],
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
                description:
                  'Само малки латински букви, цифри и тирета. Кирилицата се транслитерира, интервалите стават тирета, представки като „products/" се махат. Не е нужно да пишете пътя — само името.',
              },
              hooks: {
                beforeValidate: [
                  ({ value }) => (typeof value === 'string' ? cleanSlug(value) : value),
                ],
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
              name: 'showInStrip',
              type: 'checkbox',
              label: 'Показване в лентата с икони',
              defaultValue: false,
              admin: { description: 'Отнася се за лентата с икони на началната страница.' },
            },
            {
              name: 'stripBadge',
              type: 'text',
              label: 'Етикет в лентата',
              admin: {
                description:
                  'По избор. Показва се в червено под името в лентата с категории. Напр. „Ново".',
              },
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
