import type { Field } from 'payload'

import { requiredUnlessHidden } from '../shared'

/**
 * Снимка за компютър, снимка за телефон и alt — общото за блоковете на
 * ръководствата (`task-stranica-portativni-elektrocentrali.md`).
 *
 * Снимката за телефон е по избор: празна значи същата като за компютър.
 * Alt е отделно поле, защото една снимка от Медия може да стои на различни
 * места с различен смисъл; празно — alt от Медия.
 */
export const imageFields = (): Field[] => [
  {
    type: 'row',
    fields: [
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        validate: requiredUnlessHidden,
        label: 'Снимка',
        admin: { width: '50%' },
      },
      {
        name: 'imageMobile',
        type: 'upload',
        relationTo: 'media',
        label: 'Снимка за телефон',
        admin: { width: '50%', description: 'По желание. Празно — същата като за компютър.' },
      },
    ],
  },
  {
    name: 'imageAlt',
    type: 'text',
    label: 'Описание на снимката (alt)',
    admin: { description: 'За незрящи и за търсачките. Празно — описанието от Медия.' },
  },
]
