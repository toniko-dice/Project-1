import type { Block } from 'payload'

/**
 * Ред с предимства на магазина — "Защо да пазарувате при нас".
 * Иконите се избират от списък (Phosphor), а не се качват като изображения,
 * за да остане дебелината на щриха и размерът еднакви навсякъде.
 */
export const BenefitsGrid: Block = {
  slug: 'benefitsGrid',
  labels: { singular: 'Предимства', plural: 'Предимства' },
  imageAltText: 'Ред с предимства, всяко с икона и кратък текст',
  fields: [
    { name: 'sectionTitle', type: 'text', label: 'Заглавие на секцията' },
    {
      name: 'items',
      type: 'array',
      label: 'Предимства',
      minRows: 2,
      maxRows: 6,
      labels: { singular: 'Предимство', plural: 'Предимства' },
      admin: {
        components: {
          RowLabel: {
            path: '@/components/admin/RowLabel#RowLabel',
            clientProps: { field: 'title', fallback: 'Предимство' },
          },
        },
      },
      fields: [
        {
          name: 'icon',
          type: 'select',
          required: true,
          label: 'Икона',
          defaultValue: 'shield',
          options: [
            { label: 'Щит (гаранция)', value: 'shield' },
            { label: 'Глобус (международно)', value: 'globe' },
            { label: 'Карта (разсрочено плащане)', value: 'card' },
            { label: 'Слушалки (поддръжка)', value: 'support' },
            { label: 'Стрелка назад (връщане)', value: 'return' },
            { label: 'Камион (доставка)', value: 'truck' },
            { label: 'Светкавица (мощност)', value: 'bolt' },
            { label: 'Сертификат (оторизиран)', value: 'certificate' },
          ],
        },
        { name: 'title', type: 'text', required: true, label: 'Заглавие' },
        { name: 'description', type: 'textarea', label: 'Описание' },
      ],
    },
  ],
}
