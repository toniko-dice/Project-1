import type { GlobalConfig } from 'payload'

import { PAYMENT_OPTIONS } from '../lib/offers/calc'

/**
 * „Данни за офертите" — продавачът, банковата сметка и условията по
 * подразбиране. Условията се КОПИРАТ в новата оферта и там се редактират;
 * промяна тук не пипа вече направените оферти.
 *
 * Празно поле не излиза в PDF-а.
 */
export const OfferSettings: GlobalConfig = {
  slug: 'offer-settings',
  label: 'Данни за офертите',
  admin: { group: 'Продажби' },
  access: { read: ({ req }) => Boolean(req.user), update: ({ req }) => Boolean(req.user) },
  fields: [
    {
      name: 'company',
      type: 'group',
      label: 'Фирма (доставчик)',
      fields: [
        { name: 'name', type: 'text', label: 'Име', defaultValue: 'ДИ СИ 2008 ООД' },
        {
          type: 'row',
          fields: [
            { name: 'eik', type: 'text', label: 'ЕИК', defaultValue: '200110465', admin: { width: '50%' } },
            { name: 'vatNumber', type: 'text', label: 'ДДС №', defaultValue: 'BG200110465', admin: { width: '50%' } },
          ],
        },
        { name: 'address', type: 'text', label: 'Адрес', defaultValue: 'гр. Асеновград, ул. Драгоман 13' },
        { name: 'mol', type: 'text', label: 'МОЛ', defaultValue: 'Антон Божанов' },
        {
          type: 'row',
          fields: [
            { name: 'phone', type: 'text', label: 'Телефон', defaultValue: '+359 879 437 744', admin: { width: '33%' } },
            { name: 'email', type: 'email', label: 'Имейл', defaultValue: 'support@dice.bg', admin: { width: '33%' } },
            { name: 'website', type: 'text', label: 'Сайт', defaultValue: 'bg-ecoflow.com', admin: { width: '34%' } },
          ],
        },
      ],
    },
    {
      name: 'bank',
      type: 'group',
      label: 'Банкова сметка',
      admin: { description: 'Излиза в „Условия" на офертата; празно — не излиза.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'iban', type: 'text', label: 'IBAN', defaultValue: 'BG15BPBI79421025115701', admin: { width: '45%' } },
            { name: 'bic', type: 'text', label: 'BIC', defaultValue: 'BPBIBGSF', admin: { width: '20%' } },
            {
              name: 'bankName',
              type: 'text',
              label: 'Банка',
              defaultValue: 'Юробанк България (Пощенска банка)',
              admin: { width: '35%' },
            },
          ],
        },
      ],
    },
    {
      name: 'defaults',
      type: 'group',
      label: 'Условия по подразбиране',
      admin: { description: 'Копират се в новата оферта; там се редактират поотделно.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'validityDays', type: 'number', label: 'Валидност (дни)', defaultValue: 14, min: 1, admin: { width: '50%' } },
            { name: 'vatRate', type: 'number', label: 'ДДС (%)', defaultValue: 20, min: 0, admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'payment',
              type: 'select',
              label: 'Плащане',
              defaultValue: 'advance100',
              options: PAYMENT_OPTIONS,
              admin: { width: '50%' },
            },
            {
              name: 'paymentOther',
              type: 'text',
              label: 'Плащане — друго',
              admin: { width: '50%', condition: (_, s) => s?.payment === 'other' },
            },
          ],
        },
        {
          name: 'deliveryTime',
          type: 'text',
          label: 'Срок на доставка',
          defaultValue: 'до 10 работни дни след получаване на плащането',
        },
        {
          name: 'deliveryTerms',
          type: 'textarea',
          label: 'Условия на доставка',
          defaultValue: 'Доставката е за сметка на клиента.',
        },
        {
          name: 'warranty',
          type: 'text',
          label: 'Гаранция',
          defaultValue: 'Съгласно гаранционните условия на производителя: bg-ecoflow.com/garanciya',
        },
        {
          name: 'note',
          type: 'textarea',
          label: 'Бележка в края',
          defaultValue: 'Настоящата оферта не е данъчен документ. Цените са в евро с включен ДДС.',
        },
      ],
    },
  ],
}
