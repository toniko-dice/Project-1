import type { GlobalConfig } from 'payload'
import { revalidateGlobal } from '../lib/revalidate'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Меню (хедър)',
  admin: {
    group: 'Меню',
    description:
      'Тук се подрежда скелетът на менюто. Самите снимки и карти в мега менюто се редактират в раздел „Панели в менюто".',
  },
  access: { read: () => true },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Лента най-горе',
          fields: [
            {
              name: 'utilityBarEnabled',
              type: 'checkbox',
              label: 'Показване на горната лента',
              defaultValue: false,
              admin: {
                description:
                  'Тънката сива лента НАД менюто — линк, промо текст и надпис за регион. Изключена по подразбиране. Полетата отдолу се пазят и когато е изключена.',
              },
            },
            {
              type: 'row',
              fields: [
                { name: 'topLeftLabel', type: 'text', label: 'Ляв линк — текст', admin: { width: '50%' } },
                { name: 'topLeftUrl', type: 'text', label: 'Ляв линк — адрес', admin: { width: '50%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'topPromoText', type: 'text', label: 'Промо текст', admin: { width: '50%' } },
                { name: 'topPromoUrl', type: 'text', label: 'Промо адрес', admin: { width: '50%' } },
              ],
            },
            {
              name: 'regionLabel',
              type: 'text',
              label: 'Надпис за регион вдясно',
              defaultValue: 'България (Български / € EUR)',
              admin: { description: 'Статичен текст. Оставете празно, за да го скриете.' },
            },
          ],
        },
        {
          label: 'Лого',
          fields: [
            { name: 'logo', type: 'upload', relationTo: 'media', label: 'Лого' },
            {
              name: 'logoSuffix',
              type: 'text',
              label: 'Текст до логото',
              defaultValue: 'МАГАЗИН',
              admin: { description: 'Показва се вдясно от логото, разделен с вертикална черта.' },
            },
            {
              name: 'logoTagline',
              type: 'text',
              label: 'Ред под логото',
              admin: { description: 'Малкият текст под логото.' },
            },
          ],
        },
        {
          label: 'Точки в менюто',
          fields: [
            {
              name: 'items',
              type: 'array',
              label: 'Точки',
              labels: { singular: 'Точка', plural: 'Точки' },
              admin: {
                description:
                  'Главните точки в лентата. Точка без групи е обикновен линк, без мега меню.',
                initCollapsed: true,
                components: {
                  RowLabel: {
                    path: '@/components/admin/RowLabel#RowLabel',
                    clientProps: { field: 'label', fallback: 'Точка' },
                  },
                },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', required: true, label: 'Текст', admin: { width: '40%' } },
                    { name: 'url', type: 'text', label: 'Адрес', admin: { width: '40%' } },
                    {
                      name: 'badge',
                      type: 'select',
                      label: 'Етикет',
                      defaultValue: 'none',
                      admin: { width: '20%' },
                      options: [
                        { label: '— без —', value: 'none' },
                        { label: 'HOT (червен)', value: 'hot' },
                        { label: 'НОВО (червен)', value: 'new' },
                      ],
                    },
                  ],
                },
                {
                  name: 'groups',
                  type: 'array',
                  label: 'Групи в сайдбара',
                  labels: { singular: 'Група', plural: 'Групи' },
                  admin: {
                    description:
                      'Заглавията вляво в мега менюто, които се сгъват и разгъват. Напр. „Портативни електроцентрали".',
                    components: {
                      RowLabel: {
                        path: '@/components/admin/RowLabel#RowLabel',
                        clientProps: { field: 'heading', fallback: 'Група' },
                      },
                    },
                  },
                  fields: [
                    { name: 'heading', type: 'text', required: true, label: 'Заглавие на групата' },
                    {
                      name: 'defaultOpen',
                      type: 'checkbox',
                      label: 'Разгъната по подразбиране',
                      defaultValue: false,
                    },
                    {
                      name: 'entries',
                      type: 'array',
                      label: 'Подточки',
                      labels: { singular: 'Подточка', plural: 'Подточки' },
                      admin: {
                        description:
                          'Всяка подточка отваря панел вдясно. Панелите се редактират в раздел „Панели в менюто".',
                        components: {
                          RowLabel: {
                            path: '@/components/admin/RowLabel#RowLabel',
                            clientProps: { field: 'panel', fallback: 'Подточка' },
                          },
                        },
                      },
                      fields: [
                        {
                          name: 'panel',
                          type: 'relationship',
                          relationTo: 'menu-panels',
                          required: true,
                          label: 'Панел',
                          admin: {
                            description: 'Текстът на подточката се взима от заглавието на панела.',
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Бутон и търсене',
          fields: [
            {
              name: 'searchEnabled',
              type: 'checkbox',
              label: 'Икона за търсене',
              defaultValue: true,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'ctaLabel',
                  type: 'text',
                  label: 'Бутон — текст',
                  defaultValue: 'Към магазина',
                  admin: { width: '50%' },
                },
                { name: 'ctaUrl', type: 'text', label: 'Бутон — адрес', admin: { width: '50%' } },
              ],
            },
          ],
        },
      ],
    },
  ],
}
