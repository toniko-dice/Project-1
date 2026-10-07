import type { Block } from 'payload'

import { blockLabel } from './product/shared'
import { requiredUnlessHidden } from './shared'

/**
 * Начало на страница без снимка: H1, въвеждащ текст и по избор бутон
 * (напр. към формата по-долу — адрес `#zayavka`).
 *
 * За страница със снимка е „Заглавна снимка (H1)" (`pageHero`). Отделен
 * блок, а не `pageHero` без снимка: страницата с `pageHero` е на бял фон
 * (ръководство), а тази остава на сивия фон на съставените страници.
 */
export const PageIntro: Block = {
  slug: 'pageIntro',
  labels: { singular: 'Заглавие на страницата (H1)', plural: 'Заглавия на страницата (H1)' },
  admin: blockLabel('heading'),
  fields: [
    {
      name: 'heading',
      type: 'text',
      validate: requiredUnlessHidden,
      label: 'Заглавие (H1)',
      admin: { description: 'Главното заглавие на страницата. Една такава секция на страница.' },
    },
    { name: 'body', type: 'textarea', label: 'Въвеждащ текст' },
    {
      type: 'row',
      fields: [
        { name: 'ctaLabel', type: 'text', label: 'Бутон — текст', admin: { width: '50%' } },
        {
          name: 'ctaUrl',
          type: 'text',
          label: 'Бутон — адрес',
          admin: { width: '50%', description: 'Напр. „#zayavka" — скролва до секцията с тази котва.' },
        },
      ],
    },
  ],
}
