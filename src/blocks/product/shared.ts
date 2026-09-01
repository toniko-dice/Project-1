import type { Field } from 'payload'

/**
 * Надпис в закаченото меню най-горе на продуктовата страница.
 * Общ за всички продуктови блокове.
 */
export const anchorField: Field = {
  name: 'anchorLabel',
  type: 'text',
  label: 'Надпис в менюто на страницата',
  admin: {
    description:
      'Ако попълните, секцията се появява в закаченото меню най-горе. Оставете празно, за да не се показва.',
  },
}

/**
 * Съкратен запис за надписите на редовете в масивите.
 * Без тях Payload изписва „Ред 01", „Ред 02" и не се вижда какво се влачи.
 */
export const rowLabel = (field: string | undefined, fallback: string) => ({
  components: {
    RowLabel: {
      path: '@/components/admin/RowLabel#RowLabel',
      clientProps: field ? { field, fallback } : { fallback },
    },
  },
})

/** Надпис на самия блок в списъка със секции. */
export const blockLabel = (field: string) => ({
  components: {
    Label: {
      path: '@/components/admin/BlockLabel#BlockLabel',
      clientProps: { field },
    },
  },
})
