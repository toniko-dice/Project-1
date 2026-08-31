import type { CollectionConfig, Field } from 'payload'
import { revalidateAll, revalidateAllOnDelete } from '../lib/revalidate'

/**
 * Една карта в мега менюто — голямата отляво и малките в мрежата ползват едни и същи полета.
 * Голямата карта е незадължителна (някои секции нямат такава), затова името ѝ не е задължително.
 */
const cardFields = (titleRequired: boolean): Field[] => [
  {
    name: 'image',
    type: 'upload',
    relationTo: 'media',
    label: 'Снимка',
    admin: { description: 'Продуктова снимка на прозрачен фон. Препоръчително 600×600px.' },
  },
  { name: 'title', type: 'text', required: titleRequired, label: 'Име' },
  {
    name: 'specLine',
    type: 'textarea',
    label: 'Ред със спецификации',
    admin: {
      description: 'Сивият текст под името. Напр. „1024Wh капацитет | 1800W изход | LFP".',
    },
  },
  { name: 'url', type: 'text', label: 'Адрес' },
  {
    name: 'label',
    type: 'text',
    label: 'Етикет над името',
    admin: { description: 'Малък син надпис над името. Напр. „Ново". Оставете празно, ако не трябва.' },
  },
  {
    name: 'ribbon',
    type: 'text',
    label: 'Бадж върху снимката',
    admin: { description: 'Оранжев бадж в ъгъла на снимката. Напр. „ПОДАРЪК".' },
  },
]

export const MenuPanels: CollectionConfig = {
  slug: 'menu-panels',
  labels: { singular: 'Панел в менюто', plural: 'Панели в менюто' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: 'Меню',
    description:
      'Всеки панел е това, което се показва вдясно в мега менюто, когато потребителят посочи подточка от сайдбара. Тук се сменят снимките и картите.',
  },
  access: { read: () => true },
  hooks: {
    afterChange: [revalidateAll],
    afterDelete: [revalidateAllOnDelete],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Заглавие',
      admin: { description: 'Текстът, който се вижда в сайдбара. Напр. „Серия EcoFlow DELTA".' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'URL адрес на страницата',
      admin: {
        description:
          'Адресът, към който води подточката. Напр. „delta-seriya" → /categories/delta-seriya',
      },
    },
    {
      name: 'sections',
      type: 'array',
      label: 'Секции в панела',
      labels: { singular: 'Секция', plural: 'Секции' },
      admin: {
        description:
          'Всяка секция е един ред със заглавие, линк „Виж всички" вдясно и мрежа с продукти. В референтния дизайн панелът има две секции — продукти и аксесоари.',
        initCollapsed: false,
      },
      fields: [
        { name: 'heading', type: 'text', required: true, label: 'Заглавие на секцията' },
        {
          type: 'row',
          fields: [
            {
              name: 'viewAllLabel',
              type: 'text',
              label: 'Текст „Виж всички"',
              defaultValue: 'Виж всички',
              admin: { width: '50%' },
            },
            {
              name: 'viewAllUrl',
              type: 'text',
              label: 'Адрес на „Виж всички"',
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'featured',
          type: 'group',
          label: 'Голяма карта (вляво)',
          admin: { description: 'Заема цялата височина на мрежата. Оставете името празно, за да я скриете.' },
          fields: cardFields(false),
        },
        {
          name: 'cards',
          type: 'array',
          label: 'Малки карти',
          labels: { singular: 'Карта', plural: 'Карти' },
          maxRows: 6,
          admin: {
            description:
              'До 5 карти, ако плочката „Виж всички" е включена, иначе до 6. Подредбата тук е подредбата на екрана.',
          },
          fields: cardFields(true),
        },
        {
          type: 'row',
          fields: [
            {
              name: 'showViewAllTile',
              type: 'checkbox',
              label: 'Плочка „Виж всички" в края на мрежата',
              defaultValue: true,
              admin: { width: '50%' },
            },
            {
              name: 'viewAllTileUrl',
              type: 'text',
              label: 'Адрес на плочката',
              admin: {
                width: '50%',
                condition: (_, sibling) => Boolean(sibling?.showViewAllTile),
              },
            },
          ],
        },
      ],
    },
  ],
}
