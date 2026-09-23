import type { Block } from 'payload'
import { linkField, requiredUnlessHidden, themeField } from './shared'

/** Две или три промо карти една до друга — "Специални програми" и "Станете член". */
export const PromoCards: Block = {
  slug: 'promoCards',
  labels: { singular: 'Промо карти', plural: 'Промо карти' },
  imageAltText: 'Две или три промоционални карти една до друга',
  fields: [
    { name: 'sectionTitle', type: 'text', label: 'Заглавие на секцията' },
    {
      name: 'cards',
      type: 'array',
      label: 'Карти',
      minRows: 1,
      maxRows: 3,
      labels: { singular: 'Карта', plural: 'Карти' },
      admin: {
        components: {
          RowLabel: {
            path: '@/components/admin/RowLabel#RowLabel',
            clientProps: { field: 'heading', fallback: 'Карта' },
          },
        },
      },
      fields: [
        { name: 'heading', type: 'text', validate: requiredUnlessHidden, label: 'Заглавие' },
        { name: 'description', type: 'textarea', label: 'Описание' },
        { name: 'image', type: 'upload', relationTo: 'media', validate: requiredUnlessHidden, label: 'Изображение' },
        linkField(),
        themeField,
      ],
    },
  ],
}
