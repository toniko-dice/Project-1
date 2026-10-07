import type { Block } from 'payload'

import { blockLabel } from './product/shared'

/**
 * „Текст" — rich text (H2/H3, удебелено, списъци, линкове) с ширина за
 * четене (~760 px) и шрифта на текстовете в категориите. За правни и
 * информационни страници (`/garanciya`). Вносът го пълни от Markdown.
 */
export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Текст', plural: 'Текстове' },
  admin: blockLabel('heading'),
  fields: [
    { name: 'heading', type: 'text', label: 'Заглавие (H2) — по избор' },
    { name: 'content', type: 'richText', label: 'Текст' },
  ],
}
