import type { Block, Validate } from 'payload'

import { requiredUnlessHidden } from './shared'

/**
 * Ръчният списък е задължителен, освен когато блокът е скрит или
 * продуктите идват от категория (`fromCategory`).
 */
const productsOrCategory: Validate = (value, { blockData }) => {
  const b = blockData as { hidden?: boolean; fromCategory?: unknown } | undefined
  if (b?.hidden === true || b?.fromCategory) return true
  return Array.isArray(value) && value.length ? true : 'Изберете продукти или категория.'
}

/** Хоризонтално превъртащ се ред с продукти — секцията "Най-търсени" в референцията. */
export const ProductCarousel: Block = {
  slug: 'productCarousel',
  labels: { singular: 'Продуктов карусел', plural: 'Продуктови карусели' },
  imageAltText: 'Хоризонтално превъртащ се ред с продукти',
  fields: [
    { name: 'sectionTitle', type: 'text', validate: requiredUnlessHidden, label: 'Заглавие на секцията' },
    { name: 'subtitle', type: 'text', label: 'Подзаглавие' },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      validate: productsOrCategory,
      label: 'Продукти',
      admin: { condition: (_, siblingData) => !siblingData?.fromCategory },
    },
    {
      name: 'fromCategory',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Продукти от категория',
      admin: {
        description:
          'Избрана — показват се ВСИЧКИ публикувани продукти от категорията и подкатегориите ѝ, по реда им, и ръчният списък не се ползва.',
      },
    },
    {
      name: 'cardStyle',
      type: 'select',
      label: 'Вид на картите',
      defaultValue: 'image',
      options: [
        { label: 'Голяма снимка с надпис върху нея', value: 'image' },
        { label: 'Класическа карта с цена', value: 'price' },
      ],
    },
    /*
      Само за „Голяма снимка с надпис върху нея". Светлият е бялата карта
      на класическите по-долу; тъмният е черната от началото (до 7 октомври
      2026 — единствената, зашита в кода). Миграцията сложи „Светъл" на
      всички съществуващи блокове.
    */
    {
      name: 'cardTheme',
      type: 'select',
      label: 'Фон на картите',
      defaultValue: 'light',
      options: [
        { label: 'Светъл (бял)', value: 'light' },
        { label: 'Тъмен (черен)', value: 'dark' },
      ],
      admin: { condition: (_, siblingData) => siblingData?.cardStyle !== 'price' },
    },
  ],
}
