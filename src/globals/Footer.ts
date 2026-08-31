import type { GlobalConfig } from 'payload'
import { revalidateGlobal } from '../lib/revalidate'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Футър',
  admin: { group: 'Настройки' },
  access: { read: () => true },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      name: 'columns',
      type: 'array',
      label: 'Колони с линкове',
      labels: { singular: 'Колона', plural: 'Колони' },
      maxRows: 6,
      admin: {
        components: {
          RowLabel: {
            path: '@/components/admin/RowLabel#RowLabel',
            clientProps: { field: 'heading', fallback: 'Колона' },
          },
        },
      },
      fields: [
        { name: 'heading', type: 'text', required: true, label: 'Заглавие' },
        {
          name: 'links',
          type: 'array',
          label: 'Линкове',
          admin: {
            components: {
              RowLabel: {
                path: '@/components/admin/RowLabel#RowLabel',
                clientProps: { field: 'label', fallback: 'Линк' },
              },
            },
          },
          fields: [
            { name: 'label', type: 'text', required: true, label: 'Текст' },
            { name: 'url', type: 'text', required: true, label: 'Адрес' },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Бюлетин',
      fields: [
        { name: 'newsletterEnabled', type: 'checkbox', label: 'Показване', defaultValue: true },
        { name: 'newsletterHeading', type: 'text', label: 'Заглавие' },
        { name: 'newsletterText', type: 'textarea', label: 'Текст' },
      ],
    },
    {
      name: 'social',
      type: 'array',
      label: 'Социални мрежи',
      admin: {
        components: {
          RowLabel: {
            path: '@/components/admin/RowLabel#RowLabel',
            clientProps: { field: 'platform', fallback: 'Мрежа' },
          },
        },
      },
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          label: 'Мрежа',
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'TikTok', value: 'tiktok' },
          ],
        },
        { name: 'url', type: 'text', required: true, label: 'Адрес' },
      ],
    },
    { name: 'copyright', type: 'text', label: 'Текст за авторски права' },
    {
      name: 'legalLinks',
      type: 'array',
      label: 'Правни линкове',
      admin: {
        components: {
          RowLabel: {
            path: '@/components/admin/RowLabel#RowLabel',
            clientProps: { field: 'label', fallback: 'Линк' },
          },
        },
      },
      fields: [
        { name: 'label', type: 'text', required: true, label: 'Текст' },
        { name: 'url', type: 'text', required: true, label: 'Адрес' },
      ],
    },
  ],
}
