import type { Block } from 'payload'

import { blockLabel, rowLabel } from '../product/shared'
import { requiredUnlessHidden } from '../shared'
import { optionalImageFields } from './shared'

/**
 * „История и числа" — тъмна секция с фонова снимка: вляво H2, текст и
 * числа, вдясно карта с отбелязани места (`task-stranica-za-ecoflow.md`).
 */
export const CompanyStats: Block = {
  slug: 'companyStats',
  labels: { singular: 'История и числа', plural: 'История и числа' },
  admin: blockLabel('heading'),
  fields: [
    { name: 'heading', type: 'text', validate: requiredUnlessHidden, label: 'Заглавие (H2)' },
    { name: 'body', type: 'textarea', label: 'Текст' },
    {
      name: 'stats',
      type: 'array',
      label: 'Числа',
      labels: { singular: 'Число', plural: 'Числа' },
      maxRows: 6,
      admin: rowLabel('value', 'Число'),
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'value',
              type: 'text',
              label: 'Стойност',
              admin: { width: '35%', description: 'Както излиза накрая: „6 млн.+", „1129".' },
            },
            { name: 'label', type: 'text', label: 'Надпис под нея', admin: { width: '40%' } },
            {
              name: 'countTo',
              type: 'number',
              label: 'Брои се до',
              min: 0,
              admin: {
                width: '25%',
                description: 'Числото в стойността, до което се брои при влизане в екрана. Празно — без брояч.',
              },
            },
          ],
        },
      ],
    },
    // Фонът на цялата секция.
    ...optionalImageFields('Фонова снимка'),
    {
      type: 'row',
      fields: [
        { name: 'mapImage', type: 'upload', relationTo: 'media', label: 'Карта', admin: { width: '50%' } },
        {
          name: 'mapImageMobile',
          type: 'upload',
          relationTo: 'media',
          label: 'Карта за телефон',
          admin: { width: '50%', description: 'По желание. Празно — същата.' },
        },
      ],
    },
    {
      name: 'locations',
      type: 'array',
      label: 'Места на картата',
      labels: { singular: 'Място', plural: 'Места' },
      admin: {
        ...rowLabel('label', 'Място'),
        description: 'Точка с надпис върху картата. Позицията е в проценти от ширината и височината на картата.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', label: 'Надпис', admin: { width: '50%' } },
            { name: 'x', type: 'number', label: 'Отляво (%)', min: 0, max: 100, admin: { width: '25%', step: 0.5 } },
            { name: 'y', type: 'number', label: 'Отгоре (%)', min: 0, max: 100, admin: { width: '25%', step: 0.5 } },
          ],
        },
      ],
    },
  ],
}
