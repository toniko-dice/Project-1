import type { CollectionConfig, Field, Validate } from 'payload'
import { cleanSlug } from '../lib/slug'
import { revalidateAll, revalidateAllOnDelete } from '../lib/revalidate'

/**
 * Една карта в мега менюто — голямата отляво и малките в мрежата ползват едни и същи полета.
 * Голямата карта е незадължителна (някои секции нямат такава), затова името ѝ не е задължително.
 *
 * Картата може да сочи продукт от каталога. Тогава снимката, името, редът
 * със спецификации и адресът идват от него, а полетата тук са ЗАМЯНА за
 * конкретното място — попълненото има предимство. Собственикът не качва
 * снимката втори път и не я оразмерява; размерът се избира от кода.
 *
 * Името не е `required`, а с проверка: иначе картата с продукт и без
 * име не може да се запише, макар името да идва от продукта.
 */
const cardFields = (titleRequired: boolean): Field[] => [
  {
    name: 'product',
    type: 'relationship',
    relationTo: 'products',
    label: 'Продукт от каталога',
    admin: {
      description:
        'По избор. Снимката, името, редът със спецификации и адресът се взимат от продукта. Полетата по-долу ги заменят, ако са попълнени.',
    },
  },
  {
    name: 'image',
    type: 'upload',
    relationTo: 'media',
    label: 'Снимка',
    admin: {
      description:
        'По избор. Ако е празно, се взима главната снимка на продукта. Продуктова снимка на прозрачен фон, препоръчително 600×600px.',
    },
  },
  {
    name: 'title',
    type: 'text',
    label: 'Име',
    admin: {
      description: titleRequired
        ? 'По избор при избран продукт — тогава се взима името му. Задължително без продукт.'
        : 'По избор. Ако е празно, се взима от продукта.',
    },
    validate: ((value, { siblingData }) => {
      if (!titleRequired) return true
      const ред = siblingData as { product?: unknown } | undefined
      return value || ред?.product ? true : 'Въведете име или изберете продукт.'
    }) as Validate,
  },
  {
    name: 'specLine',
    type: 'textarea',
    label: 'Ред със спецификации',
    admin: {
      description:
        'По избор. Ако е празно, се взима от продукта (кратката спецификация). Сивият текст под името, напр. „1024Wh капацитет | 1800W изход | LFP".',
    },
  },
  {
    name: 'url',
    type: 'text',
    label: 'Адрес',
    admin: { description: 'По избор. Ако е празно, води към страницата на продукта.' },
  },
  {
    name: 'label',
    type: 'text',
    label: 'Етикет над името',
    admin: {
      description:
        'По избор. Малък син надпис над името, напр. „Ново". Етикетът на продукта НЕ се пренася сам — вие решавате къде да има етикет.',
    },
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
  // Записите се подреждат с влачене в списъчния изглед.
  orderable: true,
  // Списъкът се отваря в подредбата, зададена с влаченето.
  defaultSort: '_order',
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
      label: 'Заглавие',
      admin: {
        description:
          'Текстът, който се вижда в сайдбара. Напр. „Серия EcoFlow DELTA". При автоматичен режим може да е празно — тогава се взима името на категорията.',
      },
      /*
        Задължително само в ръчен режим. В автоматичния заглавието идва от
        категорията, а празно поле тук значи „същото като нея".
      */
      validate: ((value, { siblingData }) => {
        const данни = siblingData as { mode?: string; category?: unknown } | undefined
        if (данни?.mode === 'auto' && данни?.category) return true
        return value ? true : 'Заглавието е задължително при ръчен режим.'
      }) as Validate,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'URL адрес на страницата',
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
      name: 'mode',
      type: 'select',
      label: 'Съдържание',
      defaultValue: 'auto',
      options: [
        { label: 'Автоматично от категорията', value: 'auto' },
        { label: 'Ръчен избор', value: 'manual' },
      ],
      admin: {
        description:
          'Автоматично: продуктите на избраната категория се показват сами — първите седем, голяма първа карта, „Виж всички" към категорията. Ръчен избор: секциите и картите по-долу се попълват на ръка.',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Категория',
      admin: {
        condition: (_, siblingData) => siblingData?.mode !== 'manual',
        description:
          'Продуктите ѝ се показват в панела. Ако е празно, панелът се държи като ръчен.',
      },
    },
    {
      name: 'sections',
      type: 'array',
      label: 'Секции в панела',
      labels: { singular: 'Секция', plural: 'Секции' },
      admin: {
        condition: (_, siblingData) => siblingData?.mode === 'manual',
        description:
          'Всяка секция е един ред със заглавие, линк „Виж всички" вдясно и мрежа с продукти. В референтния дизайн панелът има две секции — продукти и аксесоари.',
        initCollapsed: false,
        components: {
          RowLabel: {
            path: '@/components/admin/RowLabel#RowLabel',
            clientProps: { field: 'heading', fallback: 'Секция' },
          },
        },
      },
      fields: [
        { name: 'heading', type: 'text', required: true, label: 'Заглавие на секцията' },
        {
          /*
            „Виж всички" сочи КАТЕГОРИЯ, не адрес.

            Ръчно изписаните адреси от първия seed сочеха категории,
            които не съществуват (`/categories/delta-seriya`) — всяко
            „Виж всички" даваше 404. Адресът вече се извежда от
            категорията и следва преименуванията ѝ.
          */
          name: 'viewAllCategory',
          type: 'relationship',
          relationTo: 'categories',
          label: 'Категория на „Виж всички"',
          admin: {
            description:
              'Страницата, към която водят линкът „Виж всички" и плочката в края на мрежата. Адресът се извежда от категорията.',
          },
        },
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
              label: 'Друг адрес (по избор)',
              admin: {
                width: '50%',
                description: 'Ползва се само ако е попълнен — вместо категорията по-горе.',
              },
            },
          ],
        },
        {
          name: 'featured',
          type: 'group',
          label: 'Голяма карта (вляво)',
          admin: { description: 'Заема цялата височина на мрежата. Оставете името и продукта празни, за да я скриете.' },
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
            components: {
              RowLabel: {
                path: '@/components/admin/RowLabel#RowLabel',
                clientProps: { field: 'title', fallback: 'Карта' },
              },
            },
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
              label: 'Друг адрес на плочката (по избор)',
              admin: {
                width: '50%',
                condition: (_, sibling) => Boolean(sibling?.showViewAllTile),
                description: 'Празно — плочката води към категорията по-горе.',
              },
            },
          ],
        },
      ],
    },
  ],
}
