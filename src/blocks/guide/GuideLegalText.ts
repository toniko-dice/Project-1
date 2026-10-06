import type { Block } from 'payload'

import { requiredUnlessHidden } from '../shared'

/** Малък сив текст в края на страницата — права върху марки, условия. */
export const GuideLegalText: Block = {
  slug: 'legalText',
  labels: { singular: 'Правен текст', plural: 'Правни текстове' },
  fields: [{ name: 'text', type: 'textarea', validate: requiredUnlessHidden, label: 'Текст' }],
}
