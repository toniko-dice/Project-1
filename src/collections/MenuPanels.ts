import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { cleanSlug } from '../lib/slug'
import { revalidateAll, revalidateAllOnDelete } from '../lib/revalidate'

/**
 * Панел в мега менюто — това, което се показва вдясно, когато потребителят
 * посочи точка от сайдбара.
 *
 * Панелът е списък от секции, секцията — списък от редове „продукт +
 * полета под него". Режими няма. Сайтът показва ТОЧНО редовете, в този
 * ред; първият е голямата карта.
 *
 * При избор на продукт името, подзаглавието и снимката на реда се
 * попълват от продукта (в админа веднага — `CardProductSync`; на сървъра —
 * `fillCardsFromProducts`, ако са празни) и собственикът може да ги
 * промени. Цената НЕ се копира: показва се под реда само за четене и на
 * сайта винаги идва от продукта. „Етикет" е свободен текст, не се
 * попълва сам.
 *
 * Вносът само ДОБАВЯ новите продукти в края на секцията за тяхната
 * категория (`addToMenuPanels` в `import-product-core.ts`) — с попълнени
 * полета и празен етикет. Махане и подредба са на собственика.
 */
type Ред = { product?: number | { id: number } | null; title?: string | null; specLine?: string | null; image?: unknown; label?: string | null }
type Секция = { cards?: Ред[] | null; [k: string]: unknown }

/**
 * Редовете без продукт отпадат, празните полета се попълват от продукта.
 *
 * Без продукт редът няма какво да покаже — такъв остава, когато продуктът
 * е изтрит (връзката става празна) или когато е добавен ред, но не е
 * избран продукт. Попълването е резерва за записи, минали покрай админа
 * (REST, скрипт): там `CardProductSync` не работи, а полетата не бива да
 * стоят празни.
 */
const fillCardsFromProducts: CollectionBeforeValidateHook = async ({ data, req }) => {
  const sections = (data?.sections ?? []) as Секция[]
  const кеш = new Map<number, { title?: string | null; tagline?: string | null; image?: unknown } | null>()

  for (const section of sections) {
    if (!Array.isArray(section.cards)) continue
    const редове: Ред[] = []
    for (const ред of section.cards) {
      const id = typeof ред.product === 'number' ? ред.product : ред.product?.id
      if (typeof id !== 'number') continue

      if (!ред.title || !ред.specLine || !ред.image) {
        if (!кеш.has(id)) {
          const продукт = await req.payload
            .findByID({ collection: 'products', id, depth: 0, draft: true, req })
            .catch(() => null)
          кеш.set(id, продукт)
        }
        const продукт = кеш.get(id)
        if (продукт) {
          ред.title ||= продукт.title ?? null
          ред.specLine ||= продукт.tagline ?? null
          ред.image ||= (typeof продукт.image === 'object' && продукт.image
            ? (продукт.image as { id: number }).id
            : продукт.image) ?? null
        }
      }
      редове.push(ред)
    }
    section.cards = редове
  }
  return data
}

export const MenuPanels: CollectionConfig = {
  slug: 'menu-panels',
  // Записите се подреждат с влачене в списъчния изглед.
  orderable: true,
  // Списъкът се отваря в подредбата, зададена с влаченето.
  defaultSort: '_order',
  labels: { singular: 'Панел в менюто', plural: 'Панели в менюто' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'menu', 'slug', 'updatedAt'],
    group: 'Меню',
    description:
      'Всеки панел е това, което се показва вдясно в мега менюто, когато потребителят посочи подточка от сайдбара. Секциите му са списъци с продукти — сайтът показва точно тях, в този ред.',
  },
  access: { read: () => true },
  hooks: {
    beforeValidate: [fillCardsFromProducts],
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
      /*
        Къде в менюто стои панелът — „Соларни панели › Сгъваеми панели".
        Виртуално: пресмята се от хедъра при четене, в базата го няма.
        Панел, към който хедърът не сочи, е „—" и на сайта не се вижда.
      */
      name: 'menu',
      type: 'text',
      virtual: true,
      label: 'Меню',
      admin: {
        readOnly: true,
        description: 'Къде в менюто се показва панелът. „—" значи никъде.',
      },
      hooks: {
        afterRead: [
          async ({ data, req }) => {
            const ctx = req.context as { менюНаПанелите?: Map<number, string[]> }
            if (!ctx.менюНаПанелите) {
              const карта = new Map<number, string[]>()
              const header = await req.payload.findGlobal({ slug: 'header', depth: 0, req })
              for (const item of header.items ?? []) {
                for (const group of item.groups ?? []) {
                  for (const entry of group.entries ?? []) {
                    const id = typeof entry.panel === 'number' ? entry.panel : entry.panel?.id
                    if (typeof id !== 'number') continue
                    карта.set(id, [...(карта.get(id) ?? []), `${item.label} › ${group.heading}`])
                  }
                }
              }
              ctx.менюНаПанелите = карта
            }
            const места = ctx.менюНаПанелите.get(data?.id as number)
            return места?.length ? места.join('; ') : '—'
          },
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
            clientProps: { field: 'heading', fallback: 'Секция', countField: 'cards' },
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
          name: 'cards',
          type: 'array',
          label: 'Продукти',
          labels: { singular: 'Продукт', plural: 'Продукти' },
          admin: {
            description:
              'Сайтът показва точно тези, в този ред; първият е голямата карта. При избор на продукт името, подзаглавието и снимката се попълват от него — може да ги промените. Цената винаги идва от продукта. Чернова не се показва.',
            initCollapsed: true,
            components: {
              RowLabel: {
                path: '@/components/admin/RowLabel#RowLabel',
                clientProps: { field: 'title', fallback: 'Продукт', suffixField: 'label' },
              },
            },
          },
          fields: [
            {
              // Не е `required`: изтрит продукт оставя празна връзка, а редът
              // отпада при следващия запис (`fillCardsFromProducts`).
              name: 'product',
              type: 'relationship',
              relationTo: 'products',
              label: 'Продукт',
            },
            {
              // Попълва полетата при избор на продукт и показва цената му.
              name: 'productSync',
              type: 'ui',
              admin: {
                components: { Field: '@/components/admin/CardProductSync#CardProductSync' },
              },
            },
            {
              type: 'row',
              fields: [
                { name: 'title', type: 'text', label: 'Име', admin: { width: '65%' } },
                {
                  name: 'label',
                  type: 'text',
                  label: 'Етикет',
                  maxLength: 20,
                  admin: {
                    width: '35%',
                    description:
                      'По избор, до 20 знака. Малък надпис в ъгъла на снимката: „Ново", „−20%", „Хит". Празно — нищо.',
                  },
                },
              ],
            },
            { name: 'specLine', type: 'text', label: 'Подзаглавие' },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              label: 'Снимка',
              admin: { description: 'Главната снимка на продукта, освен ако не изберете друга.' },
            },
          ],
        },
        {
          name: 'accessories',
          type: 'checkbox',
          label: 'Раздел „Аксесоари"',
          admin: {
            /*
              Отметнат раздел без редове се пълни сам в `Header.tsx`: до шест
              аксесоара за устройствата от останалите секции на панела.
              Ръчните редове имат предимство — има ли поне един, показват се
              само те.
            */
            description:
              'Остави празно — аксесоарите се попълват автоматично от полето „Съвместим с" на аксесоарите.',
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
