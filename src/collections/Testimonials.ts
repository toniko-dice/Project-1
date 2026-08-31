import type { CollectionConfig } from 'payload'
import { revalidateAll, revalidateAllOnDelete } from '../lib/revalidate'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: 'Отзив', plural: 'Отзиви' },
  admin: { useAsTitle: 'author', defaultColumns: ['author', 'location'], group: 'Съдържание' },
  access: { read: () => true },
  hooks: {
    afterChange: [revalidateAll],
    afterDelete: [revalidateAllOnDelete],
  },
  fields: [
    { name: 'author', type: 'text', required: true, label: 'Име на клиента' },
    { name: 'location', type: 'text', label: 'Град / регион' },
    { name: 'quote', type: 'textarea', required: true, label: 'Текст на отзива' },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Снимка' },
    {
      name: 'rating',
      type: 'number',
      label: 'Оценка (1–5)',
      min: 1,
      max: 5,
      defaultValue: 5,
    },
    { name: 'link', type: 'text', label: 'Линк към пълната история' },
  ],
}
