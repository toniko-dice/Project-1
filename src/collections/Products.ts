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
  /*
    Чернови. Внесеният продукт не бива да излиза наживо, преди собственикът
    да го е прегледал — при внасяне на 45 продукта наведнъж това е разликата
    между спокойна проверка и 45 недовършени страници пред клиентите.

    Последствие: продукт се вижда на сайта чак след „Публикувай".
  */
  versions: { drafts: true },
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
              name: 'sku',
              type: 'text',
              label: 'Каталожен номер (SKU)',
              admin: {
                description:
                  'Номерът на артикула в dice.bg. Служи за сверяване при внос и за търсачките.',
              },
            },
            {
              name: 'brand',
              type: 'text',
              label: 'Марка',
              defaultValue: 'EcoFlow',
              admin: {
                description:
                  'Обикновено EcoFlow. Сменя се при аксесоари на друг производител — в каталога има артикули на Anker, VEMARK, 4smarts и други.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'ean',
                  type: 'text',
                  label: 'Баркод EAN',
                  admin: {
                    width: '50%',
                    description:
                      'Основният баркод на производителя, 13 цифри. Влиза в данните за търсачките и позволява на Google да разпознае продукта еднозначно.',
                  },
                },
                {
                  name: 'barcodeInternal',
                  type: 'text',
                  label: 'Втори баркод (вътрешен)',
                  admin: {
                    width: '50%',
                    description:
                      'Складов или доставчиков номер. Служи за сверяване при внос и не се показва никъде на сайта.',
                  },
                },
              ],
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
              /*
                Акцентите стоят в кутията за покупка, не в секциите на
                страницата — виждат се без скролване. Затова са поле на
                продукта, а не блок.
              */
              name: 'highlights',
              type: 'array',
              label: 'Акценти под цената',
              labels: { singular: 'Акцент', plural: 'Акценти' },
              maxRows: 5,
              admin: {
                description:
                  'Кратките изречения в кутията за покупка, под цената. Три до пет са достатъчни — това е първото, което клиентът чете.',
                components: {
                  RowLabel: {
                    path: '@/components/admin/RowLabel#RowLabel',
                    clientProps: { field: 'title', fallback: 'Акцент' },
                  },
                },
              },
              fields: [
                { name: 'title', type: 'text', required: true, label: 'Заглавие' },
                { name: 'text', type: 'textarea', required: true, label: 'Пояснение' },
              ],
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
          label: 'SEO',
          fields: [
            {
              name: 'metaTitle',
              type: 'text',
              label: 'Заглавие за търсачки',
              admin: { description: 'Ако е празно, се ползва името на продукта.' },
            },
            {
              name: 'metaDescription',
              type: 'textarea',
              label: 'Описание за търсачки',
              admin: { description: 'Ако е празно, се ползва кратката спецификация.' },
            },
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
