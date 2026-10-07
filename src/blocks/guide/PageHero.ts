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
    {
      /*
        Тъмна снимка (нощен дом на „За EcoFlow") не понася тъмен текст под
        бял воал — там текстът е бял, отдолу, върху затъмнение, както в
        ecoflow.com/eu/about-us.
      */
      name: 'tone',
      type: 'select',
      label: 'Текст',
      defaultValue: 'dark-top',
      options: [
        { label: 'Тъмен, отгоре (светла снимка)', value: 'dark-top' },
        { label: 'Бял, отдолу (тъмна снимка)', value: 'light-bottom' },
      ],
    },
    ...imageFields(),
  ],
}
