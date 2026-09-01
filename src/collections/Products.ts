import type { CollectionConfig } from 'payload'
import { productBlocks } from '../blocks/product'
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
    defaultColumns: ['title', 'categoryName', 'productType', 'price', 'badge'],
    group: 'Каталог',
    description:
      'Продуктовата страница се сглобява от секции, също като обикновените страници. Продукт без добавени секции показва галерия, цена, бутон и описание.',
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
            {
              name: 'productType',
              type: 'select',
              label: 'Вид на продукта',
              defaultValue: 'accessory',
              options: [
                { label: 'Основен продукт', value: 'hero' },
                { label: 'Аксесоар', value: 'accessory' },
              ],
              admin: {
                description:
                  'Служи само за подреждане и филтриране на списъка тук. Не влияе на изгледа на страницата — той зависи единствено от добавените секции.',
              },
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
              name: 'specGroups',
              type: 'array',
              label: 'Спецификации по групи',
              labels: { singular: 'Група', plural: 'Групи' },
              admin: {
                description:
                  'Оригиналът показва спецификациите като плосък списък. Групите са наша добавка — при 30+ реда плоският списък е нечетим. Заглавието на групата е по избор: оставите ли го празно, редовете се сливат с предишната група.',
                components: {
                  RowLabel: {
                    path: '@/components/admin/RowLabel#RowLabel',
                    clientProps: { field: 'groupLabel', fallback: 'Група' },
                  },
                },
              },
              fields: [
                {
                  name: 'groupLabel',
                  type: 'text',
                  label: 'Заглавие на групата',
                  admin: { description: 'Напр. Изход променлив ток. Може да остане празно.' },
                },
                {
                  name: 'rows',
                  type: 'array',
                  label: 'Редове',
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
              ],
            },
            {
              /*
                Старото плоско поле. Съдържанието му е пренесено в „Спецификации
                по групи" с миграция. Стои временно, за да може пренасянето да
                бъде проверено; пада с отделна миграция след потвърждение.
              */
              name: 'specs',
              type: 'array',
              label: 'Технически данни (остаряло)',
              labels: { singular: 'Ред', plural: 'Редове' },
              admin: {
                description:
                  'Не въвеждайте тук. Полето е пренесено в „Спецификации по групи" и предстои да бъде премахнато.',
                initCollapsed: true,
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
        {
          label: 'Секции на страницата',
          description:
            'Всяка секция се добавя, мести с дръжката вляво и трие поотделно. Продукт без секции показва галерия, цена, бутон и описание.',
          fields: [
            {
              name: 'sections',
              type: 'blocks',
              label: 'Секции на страницата',
              labels: { singular: 'Секция', plural: 'Секции' },
              blocks: productBlocks,
            },
          ],
        },
      ],
    },
  ],
}
