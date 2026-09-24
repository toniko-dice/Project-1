import type { CollectionConfig } from 'payload'
import { cleanSlug } from '../lib/slug'
import { layoutField } from '../blocks/pageLayout'
import { revalidateAllOnDelete, revalidateCategory } from '../lib/revalidate'

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
      'Категориите са на три нива: главна категория („Портативни електроцентрали") → серия („DELTA серия") → подсерия („DELTA 3 серия"). Всяко ниво се закача към горното с полето „Подкатегория на". Продуктът се слага в най-долното ниво, което го описва.',
  },
  access: { read: () => true },
  hooks: {
    afterChange: [revalidateCategory],
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
                  'Празно = главна категория. Изберете главна, за да стане серия; изберете серия, за да стане подсерия. Подсерията няма собствена страница — показва се като раздел на страницата на серията.',
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
            {
              name: 'banner',
              type: 'upload',
              relationTo: 'media',
              label: 'Широк банер над списъка',
              admin: {
                description:
                  'По избор. Показва се между описанието и продуктите. Препоръчително 2400×800px.',
              },
            },
            {
              name: 'description',
              type: 'textarea',
              label: 'Описание под заглавието',
              admin: {
                description:
                  'Кратък въвеждащ текст под името на категорията. Ползва се и като описание за търсачки, ако полето в раздел SEO е празно.',
              },
            },
          ],
        },
        {
          label: 'Секции',
          description:
            'По избор. Промо секции над списъка с продукти — същите блокове като при страниците. Празно = само заглавие, описание и списък.',
          fields: [layoutField()],
        },
        {
          label: 'SEO',
          fields: [
            { name: 'metaTitle', type: 'text', label: 'Заглавие за търсачки' },
            { name: 'metaDescription', type: 'textarea', label: 'Описание за търсачки' },
            {
              name: 'noindex',
              type: 'checkbox',
              label: 'Да не се индексира от търсачки',
              defaultValue: false,
              admin: {
                description:
                  'Включи за категории с под 3 продукта или без собствен текст — да не се индексират като празни страници. Страницата остава достъпна; само излиза от sitemap.xml и получава noindex.',
              },
            },
          ],
        },
      ],
    },
  ],
}
