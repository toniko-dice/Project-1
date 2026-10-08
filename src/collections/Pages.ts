import type { CollectionConfig } from 'payload'
import { cleanSlug } from '../lib/slug'
import { revalidatePage, revalidatePageDelete } from '../lib/revalidate'
import { layoutField } from '../blocks/pageLayout'
import { contentAccess, hiddenFor } from '../lib/access'

export const Pages: CollectionConfig = {
  slug: 'pages',
  // Записите се подреждат с влачене в списъчния изглед.
  orderable: true,
  // Списъкът се отваря в подредбата, зададена с влаченето.
  defaultSort: '_order',
  labels: { singular: 'Страница', plural: 'Страници' },
  admin: {
    hidden: hiddenFor('admin', 'editor'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: 'Съдържание',
    description:
      'Всяка страница се сглобява от секции. Добавяйте, местете (с дръжката вляво) и триете секции свободно.',
  },
  access: { ...contentAccess },
  versions: { drafts: true },
  /*
    Страница като ВРЪЗКА (линкът към ръководство в категорията) носи само
    адреса и името — иначе категорията би заредила целия layout на
    страницата заедно с продуктите в него.
  */
  defaultPopulate: { title: true, slug: true, _status: true },
  hooks: {
    afterChange: [revalidatePage],
    afterDelete: [revalidatePageDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Заглавие' },
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
      /*
        Правните страници (`task-stranici-pravni.md`): над текста —
        „Последна актуализация: 08.10.2026" (от `updatedAt`) и съдържание от
        заглавията H2 на блоковете „Текст".
      */
      name: 'legal',
      type: 'checkbox',
      label: 'Правна страница — дата на актуализация и съдържание',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Над текста излизат „Последна актуализация" (датата на последното записване) и съдържание с линкове към заглавията H2.',
      },
    },
    {
      /*
        Кога `import:page` е записал страницата за последно. Запис след това
        (от админа) значи, че текстът е редактиран — повторният внос го
        пропуска без `--force`. Пише го само вносът.
      */
      name: 'importedAt',
      type: 'date',
      admin: { hidden: true },
    },
    layoutField(),
    {
      type: 'collapsible',
      label: 'SEO',
      admin: { initCollapsed: true },
      fields: [
        { name: 'metaTitle', type: 'text', label: 'Заглавие за търсачки' },
        { name: 'metaDescription', type: 'textarea', label: 'Описание за търсачки' },
        {
          name: 'metaImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Изображение при споделяне',
        },
        {
          name: 'noindex',
          type: 'checkbox',
          label: 'Скрий от търсачките (noindex)',
          defaultValue: false,
          admin: {
            description:
              'Страницата получава „noindex, follow" и не е в sitemap.xml. При временен текст — махнете отметката, когато сложите окончателния текст.',
          },
        },
      ],
    },
  ],
}
