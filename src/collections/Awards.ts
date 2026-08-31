import type { CollectionConfig } from 'payload'
import { revalidateAll, revalidateAllOnDelete } from '../lib/revalidate'

export const Awards: CollectionConfig = {
  slug: 'awards',
  labels: { singular: 'Отличие', plural: 'Отличия и медии' },
  admin: { useAsTitle: 'name', group: 'Съдържание' },
  access: { read: () => true },
  hooks: {
    afterChange: [revalidateAll],
    afterDelete: [revalidateAllOnDelete],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Име' },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Лого',
      admin: { description: 'Прозрачен PNG или SVG. Показва се в секцията "Отличени от".' },
    },
    { name: 'url', type: 'text', label: 'Линк' },
    { name: 'order', type: 'number', defaultValue: 0, label: 'Подредба' },
  ],
}
