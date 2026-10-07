import type { CheckboxField, Field } from 'payload'

/** „Скрит" на отделна карта в блока — остава в списъка, не излиза на сайта. */
export const hiddenItemField: CheckboxField = {
  name: 'hidden',
  type: 'checkbox',
  label: 'Скрит',
  defaultValue: false,
  admin: { description: 'Картата остава тук, но не се показва на сайта.' },
}

/** Снимка за компютър и за телефон — и двете по избор (за разлика от `imageFields` на ръководствата). */
export const optionalImageFields = (label = 'Снимка'): Field[] => [
  {
    type: 'row',
    fields: [
      { name: 'image', type: 'upload', relationTo: 'media', label, admin: { width: '50%' } },
      {
        name: 'imageMobile',
        type: 'upload',
        relationTo: 'media',
        label: `${label} за телефон`,
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
