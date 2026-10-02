import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { cleanSlug } from '../lib/slug'
import { layoutField } from '../blocks/pageLayout'
import { revalidateAllOnDelete, revalidateCategory } from '../lib/revalidate'

const parentId = (p: unknown): number | null =>
  typeof p === 'number' ? p : ((p as { id?: number } | null)?.id ?? null)

/**
 * Пътят на категорията: „Домашни и балконски системи › Power Kits".
 *
 * Истинско поле, не виртуално: по него се търси в падащите менюта, а
 * виртуално не може да се търси. Затова не остарява само —
 * `cascadeFullTitle` го опреснява в подкатегориите при преименуване или
 * местене.
 */
const fillFullTitle: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const title = (data.title ?? originalDoc?.title ?? '') as string
  const имена = [title]
  const видяни = new Set<number>()
  let p = parentId(data.parent !== undefined ? data.parent : originalDoc?.parent)
  while (p !== null && !видяни.has(p)) {
    видяни.add(p)
    const родител = await req.payload.findByID({ collection: 'categories', id: p, depth: 0, req })
    имена.unshift(родител.title)
    p = parentId(родител.parent)
  }
  data.fullTitle = имена.join(' › ')
  return data
}

/** Сменен път → подкатегориите се записват наново и си сменят своя. */
const cascadeFullTitle: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (doc.fullTitle === previousDoc?.fullTitle) return doc
  const деца = await req.payload.find({
    collection: 'categories',
    where: { parent: { equals: doc.id } },
    pagination: false,
    depth: 0,
    req,
  })
  for (const дете of деца.docs) {
    await req.payload.update({ collection: 'categories', id: дете.id, data: {}, depth: 0, req })
  }
  return doc
}

export const Categories: CollectionConfig = {
  slug: 'categories',
  // Записите се подреждат с влачене в списъчния изглед.
  orderable: true,
  // Списъкът се отваря в подредбата, зададена с влаченето.
  defaultSort: '_order',
  labels: { singular: 'Категория', plural: 'Категории' },
  admin: {
    /*
      Пътят, не само името: в падащите менюта (категориите на продукта,
      точка в менюто, „Подкатегория на") еднаквите имена иначе не се
      различават — „Комплекти" е и главна, и серия под електроцентралите.
    */
    useAsTitle: 'fullTitle',
    defaultColumns: ['fullTitle', 'slug'],
    group: 'Каталог',
    description:
      'Категориите са на три нива: главна категория („Портативни електроцентрали") → серия („DELTA серия") → подсерия („DELTA 3 серия"). Всяко ниво се закача към горното с полето „Подкатегория на". Продуктът се слага в най-долното ниво, което го описва.',
  },
  access: { read: () => true },
  hooks: {
    beforeChange: [fillFullTitle],
    afterChange: [cascadeFullTitle, revalidateCategory],
    afterDelete: [revalidateAllOnDelete],
  },
  fields: [
    {
      name: 'fullTitle',
      type: 'text',
      label: 'Път',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Попълва се само — името с категориите над него. Така се показва при избор на категория.',
      },
    },
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
            {
              /*
                Кои списъци имат филтри — решава собственикът, не кодът.
                Отметнатите са категориите с аксесоари; те НЯМАТ страница
                „Аксесоари за …" и не са „серия" във филтъра
                „Съвместимост" (виж `src/lib/catalog.ts`).
              */
              name: 'filters',
              type: 'checkbox',
              label: 'Филтри отстрани',
              defaultValue: false,
              admin: {
                description:
                  'За категориите с аксесоари (Кабели, Адаптери…): списъкът е с филтри — цена, наличност, съвместимост и атрибутите на категорията. Важи и за подкатегориите ѝ. Категория с отметка няма страница „Аксесоари за …".',
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
          label: 'Страница Аксесоари',
          description:
            'Страницата /kategorii/<адрес>/aksesoari — аксесоарите, съвместими с категорията (по полето „Съвместим с" на аксесоарите). Попълва се сама; полетата тук са по избор. Празно поле = текстът в описанието му. „{име}" се заменя с името на категорията, „{брой}" — с броя аксесоари.',
          fields: [
            {
              name: 'accessoriesPage',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'h1',
                  type: 'text',
                  label: 'Заглавие (H1)',
                  admin: { description: 'Празно = „Аксесоари за {име}".' },
                },
                {
                  name: 'metaTitle',
                  type: 'text',
                  label: 'Заглавие за търсачки',
                  admin: { description: 'Празно = „Аксесоари за {име}".' },
                },
                {
                  name: 'metaDescription',
                  type: 'textarea',
                  label: 'Описание за търсачки',
                  admin: {
                    description:
                      'Празно = „Кабели, адаптери, чанти и други аксесоари, съвместими с {име} — {брой} продукта. Купете от официалния дистрибутор на EcoFlow в България."',
                  },
                },
                {
                  name: 'intro',
                  type: 'textarea',
                  label: 'Въвеждащ текст',
                  admin: {
                    description:
                      'Под заглавието. Празно = „Всички аксесоари, съвместими с {име}: кабели, адаптери, допълнителни батерии, чанти и други."',
                  },
                },
                {
                  name: 'outro',
                  type: 'textarea',
                  label: 'Текст под списъка',
                  admin: { description: 'По избор, под продуктите. Празно = нищо.' },
                },
              ],
            },
          ],
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
