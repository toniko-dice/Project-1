import type { Block } from 'payload'
import { anchorField, blockLabel } from './shared'

/**
 * Правен текст — условия на промоции и подобни.
 * Оригиналът има такъв блок най-долу на страницата.
 */
export const LegalText: Block = {
  slug: 'legalText',
  labels: { singular: 'Правен текст', plural: 'Правни текстове' },
  admin: blockLabel('heading'),
  fields: [
    anchorField,
    { name: 'heading', type: 'text', label: 'Заглавие' },
    { name: 'body', type: 'richText', label: 'Текст' },
    {
      name: 'collapsed',
      type: 'checkbox',
      label: 'Показва се сгънат',
      defaultValue: true,
      admin: { description: 'Разгъва се при клик върху заглавието.' },
    },
  ],
}
