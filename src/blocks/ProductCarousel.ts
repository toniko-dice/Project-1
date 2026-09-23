import type { Block } from 'payload'
import { requiredUnlessHidden } from './shared'

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
      validate: requiredUnlessHidden,
      label: 'Продукти',
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
  ],
}
