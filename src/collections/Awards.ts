import type { CollectionConfig } from 'payload'
import { revalidateAll, revalidateAllOnDelete } from '../lib/revalidate'

export const Awards: CollectionConfig = {
  slug: 'awards',
  // Записите се подреждат с влачене в списъчния изглед.
  orderable: true,
  // Списъкът се отваря в подредбата, зададена с влаченето.
  defaultSort: '_order',
  labels: { singular: 'Отличие', plural: 'Отличия и медии' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'url'],
    group: 'Съдържание',
  },
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
  ],
}
