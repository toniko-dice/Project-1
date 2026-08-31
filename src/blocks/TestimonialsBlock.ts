import type { Block } from 'payload'

/** Отзиви от клиенти със снимка — "Истински отзиви. Истинска мощност." */
export const TestimonialsBlock: Block = {
  slug: 'testimonialsBlock',
  labels: { singular: 'Отзиви', plural: 'Отзиви' },
  imageAltText: 'Ред с отзиви от клиенти',
  fields: [
    {
      name: 'sectionTitle',
      type: 'text',
      required: true,
      label: 'Заглавие на секцията',
      defaultValue: 'Истински отзиви. Истинска мощност.',
    },
    {
      name: 'testimonials',
      type: 'relationship',
      relationTo: 'testimonials',
      hasMany: true,
      required: true,
      label: 'Отзиви',
    },
  ],
}
