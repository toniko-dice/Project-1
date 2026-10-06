import type { Block } from 'payload'

import { blockLabel, rowLabel } from '../product/shared'
import { requiredUnlessHidden } from '../shared'

/**
 * Въпроси и отговори на страница — същият вид като на продукта.
 *
 * Отделна конфигурация от продуктовата (`product/FaqBlock.ts`), защото в
 * блоковете на страниците няма `required: true` (CLAUDE.md, т. 11).
 * Въпросите влизат и в JSON-LD `FAQPage`.
 */
export const GuideFaq: Block = {
  slug: 'faqBlock',
  labels: { singular: 'Въпроси и отговори', plural: 'Въпроси и отговори' },
  admin: blockLabel('heading'),
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Заглавие (H2)',
      defaultValue: 'Често задавани въпроси',
    },
    {
      name: 'items',
      type: 'array',
      label: 'Въпроси',
      labels: { singular: 'Въпрос', plural: 'Въпроси' },
      validate: requiredUnlessHidden,
      admin: { ...rowLabel('question', 'Въпрос') },
      fields: [
        { name: 'question', type: 'text', validate: requiredUnlessHidden, label: 'Въпрос' },
        { name: 'answer', type: 'textarea', validate: requiredUnlessHidden, label: 'Отговор' },
      ],
    },
  ],
}
