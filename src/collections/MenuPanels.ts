import type { CollectionConfig } from 'payload'
import { cleanSlug } from '../lib/slug'
import { revalidateAll, revalidateAllOnDelete } from '../lib/revalidate'

/**
 * Панел в мега менюто — това, което се показва вдясно, когато потребителят
 * посочи точка от сайдбара.
 *
 * Панелът е списък от секции, а секцията — списък от продукти. Режими
 * няма. Сайтът показва ТОЧНО списъка, в този ред; първият продукт е
 * голямата карта. Името, редът, снимката и цената идват от продукта —
 * нищо не се преписва в панела.
 *
 * Преди имаше „автоматичен" режим (продуктите на категорията се сглобяваха
 * при всяко зареждане) и „ръчен" (карти с полета за замяна). В
 * автоматичния списъкът в админа стоеше празен и собственикът не виждаше
 * какво показва менюто, нито можеше да го подреди. Сега вносът само
 * ДОБАВЯ новите продукти в края на секцията за тяхната категория
 * (`addToMenuPanels` в `import-product-core.ts`); всичко останало —
 * махане, подредба — е на собственика.
 */
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
      'Всеки панел е това, което се показва вдясно в мега менюто, когато потребителят посочи подточка от сайдбара. Секциите му са списъци с продукти — сайтът показва точно тях, в този ред.',
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
      admin: { description: 'Текстът, който се вижда в сайдбара. Напр. „Сгъваеми панели".' },
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
      name: 'sections',
      type: 'array',
      label: 'Секции в панела',
      labels: { singular: 'Секция', plural: 'Секции' },
      admin: {
        description:
          'Всяка секция е един ред със заглавие, линк „Виж всички" вдясно и мрежа с продукти.',
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
            Категорията на секцията — и за „Виж всички", и за вноса.

            Името на полето е останало от времето, когато служеше само за
            линка; смяната му би пресъздала таблицата за нищо.

            „Виж всички" сочи КАТЕГОРИЯ, не адрес: ръчно изписаните адреси
            от първия seed сочеха несъществуващи категории и всяко „Виж
            всички" даваше 404.
          */
          name: 'viewAllCategory',
          type: 'relationship',
          relationTo: 'categories',
          label: 'Категория на секцията',
          admin: {
            description:
              'Линкът „Виж всички" води към нея. Вносът добавя в края на тази секция НОВИТЕ продукти от категорията (и от подкатегориите ѝ).',
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
          name: 'products',
          type: 'relationship',
          relationTo: 'products',
          hasMany: true,
          label: 'Продукти',
          admin: {
            description:
              'Сайтът показва точно тези, в този ред; първият е голямата карта. Влачете за подредба, „×" маха. Име, снимка, ред и цена идват от продукта. Чернова не се показва.',
            components: {
              afterInput: ['@/components/admin/PanelProductsPreview#PanelProductsPreview'],
            },
          },
        },
        {
          name: 'accessories',
          type: 'checkbox',
          label: 'Аксесоари по съвместимост',
          admin: {
            description:
              'Вносът добавя тук нов аксесоар, чието „Съвместим с" сочи категорията на секцията или подкатегория под нея.',
          },
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
