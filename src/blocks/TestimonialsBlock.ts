import type { Block } from 'payload'
import { requiredUnlessHidden } from './shared'

/** Отзиви от клиенти със снимка — "Истински отзиви. Истинска мощност." */
export const TestimonialsBlock: Block = {
  slug: 'testimonialsBlock',
  labels: { singular: 'Отзиви', plural: 'Отзиви' },
  imageAltText: 'Ред с отзиви от клиенти',
  fields: [
    {
      name: 'sectionTitle',
      type: 'text',
      validate: requiredUnlessHidden,
      label: 'Заглавие на секцията',
      defaultValue: 'Истински отзиви. Истинска мощност.',
    },
    {
      name: 'testimonials',
      type: 'relationship',
      relationTo: 'testimonials',
      hasMany: true,
      validate: requiredUnlessHidden,
      label: 'Отзиви',
    },
  ],
}
