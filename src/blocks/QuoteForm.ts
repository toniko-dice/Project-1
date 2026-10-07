import type { Block } from 'payload'

import { blockLabel } from './product/shared'

/**
 * „Форма за оферта" — заявка от фирми, общини и институции.
 *
 * Самата форма (полетата, проверките, CAPTCHA-та) е в кода; тук са
 * текстовете около нея и табовете с продукти. Продуктите не се избират
 * тук: във формата влизат ВСИЧКИ публикувани, по реда на категориите —
 * нов продукт се появява сам, чернова — не.
 *
 * Заявките отиват в „Нови заявки" (`quote-requests`) и по имейл.
 */
export const QuoteForm: Block = {
  slug: 'quoteForm',
  labels: { singular: 'Форма за оферта', plural: 'Форми за оферта' },
  admin: blockLabel('heading'),
  fields: [
    {
      name: 'formAnchor',
      type: 'text',
      label: 'Котва на формата',
      defaultValue: 'zayavka',
      admin: { description: 'Адресът „#zayavka" скролва дотук — напр. от бутона в заглавието.' },
    },
    { name: 'heading', type: 'text', label: 'Заглавие над формата (H2)', defaultValue: 'Заявка за оферта' },
    {
      name: 'intro',
      type: 'textarea',
      label: 'Текст над формата',
      defaultValue:
        'Попълнете данните на организацията и изберете продуктите. Полетата със * са задължителни.',
    },
    {
      name: 'tabs',
      type: 'array',
      label: 'Табове с продукти',
      labels: { singular: 'Таб', plural: 'Табове' },
      admin: {
        description:
          'Всеки таб показва публикуваните продукти от категорията и подкатегориите ѝ. Празно — табовете са главните категории с продукти.',
        components: {
          RowLabel: {
            path: '@/components/admin/RowLabel#RowLabel',
            clientProps: { field: 'label', fallback: 'Таб' },
          },
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', label: 'Надпис', admin: { width: '50%' } },
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'categories',
              label: 'Категория',
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      name: 'privacyUrl',
      type: 'text',
      label: 'Адрес на „Политика за поверителност"',
      defaultValue: '/poveritelnost',
      admin: { description: 'Линкът в отметката за съгласие.' },
    },
    {
      name: 'below',
      type: 'textarea',
      label: 'Текст под формата',
      defaultValue: 'Предпочитате да говорим? Обадете се на {телефон} или пишете на {имейл}.',
      admin: {
        description:
          '{телефон} и {имейл} се заместват с тези от „Общи настройки" (същите като във футъра) — като линкове.',
      },
    },
    {
      type: 'collapsible',
      label: 'След изпращане',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'successTitle',
          type: 'text',
          label: 'Заглавие',
          defaultValue: 'Благодарим! Заявка № {номер} е получена.',
        },
        {
          name: 'successText',
          type: 'textarea',
          label: 'Текст',
          defaultValue: 'Ще ви изпратим оферта в максимално кратък срок. Благодарим ви за доверието!',
        },
        {
          name: 'successCopy',
          type: 'text',
          label: 'Ред за копието',
          defaultValue: 'Копие на заявката е изпратено на {имейл}.',
        },
        { name: 'successButton', type: 'text', label: 'Бутон', defaultValue: 'Към началната страница' },
      ],
    },
  ],
}
