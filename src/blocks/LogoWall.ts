import type { Block } from 'payload'
import { requiredUnlessHidden } from './shared'

/** Ред с лога на отличия и медии — "Отличени от". */
export const LogoWall: Block = {
  slug: 'logoWall',
  labels: { singular: 'Лога и отличия', plural: 'Лога и отличия' },
  imageAltText: 'Ред с лога на награди и медии',
  fields: [
    {
      name: 'sectionTitle',
      type: 'text',
      label: 'Заглавие на секцията',
      defaultValue: 'Отличени от',
    },
    {
      name: 'awards',
      type: 'relationship',
      relationTo: 'awards',
      hasMany: true,
      validate: requiredUnlessHidden,
      label: 'Отличия',
    },
  ],
}
