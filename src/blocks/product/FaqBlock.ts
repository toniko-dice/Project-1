import type { Block } from 'payload'
import { anchorField, blockLabel, rowLabel } from './shared'

/** Въпроси и отговори. */
export const FaqBlock: Block = {
  slug: 'faqBlock',
  labels: { singular: 'Въпроси и отговори', plural: 'Въпроси и отговори' },
  admin: blockLabel('heading'),
  fields: [
    anchorField,
    { name: 'heading', type: 'text', label: 'Заглавие', defaultValue: 'Често задавани въпроси' },
    {
      name: 'items',
      type: 'array',
      label: 'Въпроси',
      labels: { singular: 'Въпрос', plural: 'Въпроси' },
      admin: { ...rowLabel('question', 'Въпрос') },
      fields: [
        { name: 'question', type: 'text', required: true, label: 'Въпрос' },
        { name: 'answer', type: 'textarea', required: true, label: 'Отговор' },
      ],
    },
  ],
}
