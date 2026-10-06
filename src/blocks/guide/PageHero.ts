import type { Block } from 'payload'

import { blockLabel } from '../product/shared'
import { requiredUnlessHidden } from '../shared'
import { imageFields } from './shared'

/**
 * Голяма снимка на цялата ширина с H1 и абзац отгоре, тъмен текст.
 * Началото на ръководство — заглавието тук е ЕДИНСТВЕНИЯТ H1 на страницата.
 */
export const PageHero: Block = {
  slug: 'pageHero',
  labels: { singular: 'Заглавна снимка (H1)', plural: 'Заглавни снимки (H1)' },
  admin: blockLabel('heading'),
  fields: [
    {
      name: 'heading',
      type: 'text',
      validate: requiredUnlessHidden,
      label: 'Заглавие (H1)',
      admin: { description: 'Главното заглавие на страницата. Една такава секция на страница.' },
    },
    { name: 'body', type: 'textarea', label: 'Текст под заглавието' },
    ...imageFields(),
  ],
}
