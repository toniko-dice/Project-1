import type { Block } from 'payload'

import { blockLabel, rowLabel } from '../product/shared'
import { requiredUnlessHidden } from '../shared'
import { optionalImageFields } from './shared'

/** „Текст + голяма снимка" — центрирано заглавие, текст, снимка и до два бутона. */
export const TextSection: Block = {
  slug: 'textSection',
  labels: { singular: 'Текст + голяма снимка', plural: 'Текст + голяма снимка' },
  admin: blockLabel('heading'),
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'theme',
          type: 'select',
          label: 'Тема',
          defaultValue: 'light',
          options: [
            { label: 'Светла', value: 'light' },
            { label: 'Тъмна', value: 'dark' },
          ],
          admin: { width: '33%' },
        },
        {
          name: 'headingLevel',
          type: 'select',
          label: 'Ниво на заглавието',
          defaultValue: 'h2',
          options: [
            { label: 'H2', value: 'h2' },
            { label: 'H3', value: 'h3' },
          ],
          admin: { width: '33%' },
        },
        {
          // „Алиансът" в оригинала е схема НАД заглавието.
          name: 'imagePosition',
          type: 'select',
          label: 'Снимката',
          defaultValue: 'below',
          options: [
            { label: 'Под текста', value: 'below' },
            { label: 'Над текста', value: 'above' },
          ],
          admin: { width: '34%' },
        },
      ],
    },
    { name: 'heading', type: 'text', validate: requiredUnlessHidden, label: 'Заглавие' },
    { name: 'body', type: 'textarea', label: 'Текст' },
    ...optionalImageFields(),
    {
      name: 'buttons',
      type: 'array',
      label: 'Бутони',
      labels: { singular: 'Бутон', plural: 'Бутони' },
      maxRows: 2,
      admin: { ...rowLabel('label', 'Бутон'), description: 'До два. Първият е основният (запълнен).' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', label: 'Текст', admin: { width: '50%' } },
            { name: 'link', type: 'text', label: 'Адрес', admin: { width: '50%' } },
          ],
        },
      ],
    },
  ],
}
