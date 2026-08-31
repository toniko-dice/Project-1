import type { CollectionConfig } from 'payload'
import { revalidateAll, revalidateAllOnDelete } from '../lib/revalidate'

export const Products: CollectionConfig = {
  slug: 'products',
  // Записите се подреждат с влачене в списъчния изглед.
  orderable: true,
  // Списъкът се отваря в подредбата, зададена с влаченето.
  defaultSort: '_order',
  labels: { singular: 'Продукт', plural: 'Продукти' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'categoryName', 'price', 'badge'],
    group: 'Каталог',
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
            { name: 'title', type: 'text', required: true, label: 'Име на продукта' },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              label: 'URL адрес',
              admin: { description: 'Напр. "delta-pro-ultra-x".' },
            },
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'categories',
              required: true,
              label: 'Категория',
              admin: { disableListColumn: true },
            },
            {
              /*
                Списъчният изглед на Payload подава само номера на връзката към
                клетката, затова колоната „Категория“ показваше „‹Няма Категория›“.
                Това поле не се записва в базата — сглобява се при всяко четене,
                така че никога не остарява при преименуване на категория.
              */
              name: 'categoryName',
              type: 'text',
              virtual: 'category.title',
              label: 'Категория',
              admin: {
                readOnly: true,
                description: 'Попълва се само — взима се от избраната по-горе категория.',
              },
            },
            {
              name: 'tagline',
              type: 'text',
              label: 'Кратка спецификация',
              admin: {
                description:
                  'Редът под името в продуктовата карта. Напр. "6144Wh капацитет / 7200W изход".',
              },
            },
            {
              name: 'badge',
              type: 'select',
              label: 'Етикет',
              options: [
                { label: '— без етикет —', value: 'none' },
                { label: 'НОВО', value: 'new' },
                { label: 'ПРОМОЦИЯ', value: 'sale' },
                { label: 'БЕСТСЕЛЪР', value: 'bestseller' },
                { label: 'ОГРАНИЧЕНА НАЛИЧНОСТ', value: 'limited' },
              ],
              defaultValue: 'none',
            },
          ],
        },
        {
          label: 'Цена и покупка',
          fields: [
            {
              name: 'price',
              type: 'number',
              required: true,
              label: 'Цена (EUR)',
              admin: {
                description:
                  'Цената в евро. Левовата равностойност се изчислява автоматично по фиксирания курс 1.95583.',
              },
            },
            {
              name: 'compareAtPrice',
              type: 'number',
              label: 'Стара цена (EUR)',
              admin: {
                description: 'Ако е попълнена, се показва зачертана до текущата цена.',
              },
            },
            {
              name: 'externalUrl',
              type: 'text',
              required: true,
              label: 'Линк към магазина',
              admin: {
                description:
                  'Пълен адрес към продуктовата страница във външния магазин, където се извършва покупката.',
              },
            },
            {
              name: 'ctaLabel',
              type: 'text',
              defaultValue: 'Купи сега',
              label: 'Текст на бутона',
            },
            {
              name: 'availability',
              type: 'select',
              label: 'Наличност',
              defaultValue: 'in-stock',
              options: [
                { label: 'В наличност', value: 'in-stock' },
                { label: 'По заявка', value: 'preorder' },
                { label: 'Изчерпан', value: 'out-of-stock' },
              ],
            },
          ],
        },
        {
          label: 'Изображения',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: 'Основна снимка',
            },
            {
              name: 'gallery',
              type: 'array',
              label: 'Галерия',
              admin: {
                components: {
                  RowLabel: {
                    path: '@/components/admin/RowLabel#RowLabel',
                    clientProps: { fallback: 'Снимка' },
                  },
                },
              },
              fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
            },
          ],
        },
        {
          label: 'Спецификации',
          fields: [
            {
              name: 'specs',
              type: 'array',
              label: 'Технически данни',
              labels: { singular: 'Ред', plural: 'Редове' },
              admin: {
                components: {
                  RowLabel: {
                    path: '@/components/admin/RowLabel#RowLabel',
                    clientProps: { field: 'label', fallback: 'Ред' },
                  },
                },
              },
              fields: [
                { name: 'label', type: 'text', required: true, label: 'Показател' },
                { name: 'value', type: 'text', required: true, label: 'Стойност' },
              ],
            },
            { name: 'description', type: 'textarea', label: 'Пълно описание' },
          ],
        },
      ],
    },
  ],
}
