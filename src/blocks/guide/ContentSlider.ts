import type { Block } from 'payload'

import { blockLabel, rowLabel } from '../product/shared'
import { requiredUnlessHidden } from '../shared'
import { imageFields } from './shared'

/** H2 и абзац в центъра, под тях слайдер със заоблени снимки и етикет горе вдясно. */
export const ContentSlider: Block = {
  slug: 'contentSlider',
  labels: { singular: 'Слайдер със снимки', plural: 'Слайдери със снимки' },
  admin: blockLabel('heading'),
  fields: [
    { name: 'heading', type: 'text', validate: requiredUnlessHidden, label: 'Заглавие (H2)' },
    { name: 'body', type: 'textarea', label: 'Текст' },
    {
      name: 'slides',
      type: 'array',
      label: 'Слайдове',
      labels: { singular: 'Слайд', plural: 'Слайдове' },
      validate: requiredUnlessHidden,
      admin: { ...rowLabel('label', 'Слайд') },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Етикет',
          admin: { description: 'Малкият надпис горе вдясно на снимката, напр. „Как работи".' },
        },
        ...imageFields(),
      ],
    },
  ],
}
