import type { CollectionConfig } from 'payload'
import { cleanSlug, slugify } from '../lib/slug'
import { revalidateAll, revalidateAllOnDelete } from '../lib/revalidate'
import { contentAccess } from '../lib/access'

/**
 * Атрибутите за филтрите в категориите — „Дължина", „Капацитет",
 * „Конектор".
 *
 * Атрибутът казва в кои категории се ползва („Категории"): там излиза
 * като филтър отстрани, а в продукта — в падащото меню на таб „Атрибути".
 * Стойностите стоят в самия продукт (`attributes` в `Products.ts`), не
 * тук: един кабел е 1 м, друг — 2 м.
 *
 * Подредбата на филтрите е с влачене (`_order`), както при останалите
 * колекции — без числово поле „Подредба" (т. 5 в CLAUDE.md).
 */
export const Attributes: CollectionConfig = {
  slug: 'attributes',
  orderable: true,
  defaultSort: '_order',
  labels: { singular: 'Атрибут', plural: 'Атрибути' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'unit', 'type', 'categories'],
    group: 'Каталог',
    description:
      'Атрибутите са филтрите отстрани в категориите („Дължина", „Капацитет"). Подредбата на филтрите се сменя с влачене. Стойностите се попълват в продукта, таб „Атрибути".',
  },
  access: { ...contentAccess },
  hooks: {
    afterChange: [revalidateAll],
    afterDelete: [revalidateAllOnDelete],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Име' },
    {
      /*
        Slug-ът е името на параметъра в адреса на филтъра (`?duljina=1,2`).
        Споделен линк и закладка го съдържат — затова не се сменя след
        създаване, дори при преименуване на атрибута.
      */
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Попълва се от името при създаване и после не се сменя — стои в адресите на филтрите.',
      },
      hooks: {
        beforeValidate: [
          ({ value, data, operation, originalDoc }) => {
            if (operation === 'update' && originalDoc?.slug) return originalDoc.slug
            if (typeof value === 'string' && value.trim()) return cleanSlug(value)
            return typeof data?.name === 'string' ? slugify(data.name) : value
          },
        ],
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'number',
      label: 'Тип',
      options: [
        { label: 'Число', value: 'number' },
        { label: 'Текст', value: 'text' },
      ],
      admin: {
        description:
          'Число — стойностите се подреждат по големина (1 м, 2 м, 10 м). Текст — по азбучен ред.',
      },
    },
    {
      name: 'unit',
      type: 'text',
      label: 'Мерна единица',
      admin: { description: 'По избор: „м", „mAh", „W", „Wh". Показва се след стойността.' },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      label: 'Категории',
      admin: {
        description:
          'Къде се ползва атрибутът: в тези категории излиза като филтър, а в продуктите им — в падащото меню „Атрибут".',
      },
    },
  ],
}
