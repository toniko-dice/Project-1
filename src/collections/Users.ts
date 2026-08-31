import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Потребител', plural: 'Потребители' },
  admin: { useAsTitle: 'email', group: 'Настройки' },
  auth: true,
  fields: [
    { name: 'name', type: 'text', label: 'Име' },
  ],
}
