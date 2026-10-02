import type { GlobalBeforeChangeHook, GlobalConfig } from 'payload'
import { BUILTIN_FILTERS } from '../lib/filter-order'
import { revalidateGlobal } from '../lib/revalidate'

/**
 * Надписът на реда в админа — „Наличност", „Дължина (м)".
 *
 * Скрито поле, попълнено при запис: връзката към атрибута е само номер в
 * админа и общият `RowLabel` не може да прочете името ѝ.
 */
const fillLabels: GlobalBeforeChangeHook = async ({ data, req }) => {
  for (const ред of (data.items ?? []) as Record<string, unknown>[]) {
    if (ред.type === 'builtin') {
      ред.label = BUILTIN_FILTERS.find((b) => b.value === ред.builtin)?.label ?? null
      ред.attribute = null
      continue
    }
    ред.builtin = null
    const raw = ред.attribute
    const id = typeof raw === 'object' && raw !== null ? (raw as { id?: number }).id : raw
    if (typeof id !== 'number') {
      ред.label = null
      continue
    }
    const a = await req.payload
      .findByID({ collection: 'attributes', id, depth: 0, req })
      .catch(() => null)
    ред.label = a ? (a.unit ? `${a.name} (${a.unit})` : a.name) : null
  }
  return data
}

/**
 * Един ред за всички филтри отстрани — вградените (Наличност, Категория,
 * Модел, Съвместимост, Цена) и атрибутите, в един масив с влачене.
 *
 * Сайтът го чете в `src/lib/filters.ts`: филтър, който го няма в списъка
 * на страницата, просто се прескача. Нов атрибут, който още не е тук,
 * излиза преди „Съвместимост". Цена е последна винаги.
 */
export const FilterOrder: GlobalConfig = {
  slug: 'filter-order',
  label: 'Подредба на филтрите',
  admin: {
    group: 'Каталог',
    description:
      'Редът на филтрите отстрани в категориите с аксесоари и на страниците „Аксесоари за …". Подрежда се с влачене. Филтър без стойности в дадена категория не се показва.',
  },
  access: { read: () => true },
  hooks: { beforeChange: [fillLabels], afterChange: [revalidateGlobal] },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Филтри',
      labels: { singular: 'Филтър', plural: 'Филтри' },
      admin: {
        description:
          'Цена винаги е последна. Нов атрибут, който го няма тук, се показва преди „Съвместимост", докато не бъде нареден.',
        components: {
          RowLabel: {
            path: '@/components/admin/RowLabel#RowLabel',
            clientProps: { field: 'label', fallback: 'Филтър' },
          },
        },
      },
      fields: [
        {
          name: 'type',
          type: 'radio',
          label: 'Вид',
          defaultValue: 'attribute',
          options: [
            { label: 'Атрибут', value: 'attribute' },
            { label: 'Вграден филтър', value: 'builtin' },
          ],
          admin: { layout: 'horizontal' },
        },
        {
          name: 'builtin',
          type: 'select',
          label: 'Вграден филтър',
          options: BUILTIN_FILTERS.map(({ label, value }) => ({ label, value })),
          admin: { condition: (_, siblingData) => siblingData?.type === 'builtin' },
        },
        {
          name: 'attribute',
          type: 'relationship',
          relationTo: 'attributes',
          label: 'Атрибут',
          admin: { condition: (_, siblingData) => siblingData?.type !== 'builtin' },
        },
        { name: 'label', type: 'text', admin: { hidden: true } },
      ],
    },
  ],
}
