import type { CollectionConfig, Field } from 'payload'

import {
  CLIENT_TYPES,
  CONSULTATION,
  DOCUMENTS,
  PROCUREMENT,
  PURPOSES,
  STATUSES,
  TIMEFRAMES,
} from '../lib/quote/options'

/** Всичко, което е дошло от формата, е само за четене — редактират се статусът и бележките. */
const ro = <T extends Field>(f: T): T => ({ ...f, admin: { ...(f.admin ?? {}), readOnly: true } }) as T

const opts = (o: { value: string; label: string }[]) => o.map(({ value, label }) => ({ value, label }))

/**
 * „Нови заявки" — заявките за оферта от `/oferta-za-firmi`.
 *
 * ДОСТЪПЪТ Е ЗАТВОРЕН ЗА ВСИЧКИ ОСВЕН ВЛЕЗЛИЯ АДМИН — и за четене.
 * `/api/quote-requests` без вход връща 403. Формата пише през
 * `POST /api/oferta` (`src/app/(frontend)/api/oferta/route.ts`), който прави
 * проверките и записва през локалното API (то заобикаля правата).
 *
 * Броячът „Нови заявки — N" в менюто е `QuoteNavBadge` (брои статус „Нова").
 */
export const QuoteRequests: CollectionConfig = {
  slug: 'quote-requests',
  labels: { singular: 'Заявка за оферта', plural: 'Нови заявки' },
  admin: {
    group: 'Продажби',
    useAsTitle: 'number',
    defaultColumns: ['number', 'createdAt', 'organization', 'clientType', 'city', 'itemsSummary', 'status'],
    listSearchableFields: ['organization', 'eik', 'email'],
    description:
      'Заявките от страницата „Оферта за фирми". Статусът и бележките се редактират; останалото е както го е изпратил клиентът.',
  },
  defaultSort: '-createdAt',
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => false,
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    ro({
      name: 'number',
      type: 'text',
      label: '№',
      unique: true,
      index: true,
      admin: { description: 'Пореден за годината: ГГГГ-NNNN.' },
    } as Field),
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      defaultValue: 'new',
      required: true,
      index: true,
      options: opts(STATUSES),
      admin: {
        position: 'sidebar',
        components: { Cell: '@/components/admin/QuoteStatusCell#QuoteStatusCell' },
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Бележки',
      admin: {
        position: 'sidebar',
        description: 'Вътрешни — не се пращат на клиента.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Организация и контакт',
          fields: [
            ro({ name: 'clientType', type: 'select', label: 'Тип клиент', options: opts(CLIENT_TYPES) } as Field),
            ro({ name: 'organization', type: 'text', label: 'Организация', index: true } as Field),
            ro({ name: 'eik', type: 'text', label: 'ЕИК / БУЛСТАТ', index: true } as Field),
            ro({ name: 'city', type: 'text', label: 'Град / община' } as Field),
            ro({ name: 'contactName', type: 'text', label: 'Име и фамилия' } as Field),
            ro({ name: 'position', type: 'text', label: 'Длъжност' } as Field),
            ro({ name: 'email', type: 'email', label: 'Имейл', index: true } as Field),
            ro({ name: 'phone', type: 'text', label: 'Телефон' } as Field),
          ],
        },
        {
          label: 'Продукти',
          fields: [
            {
              name: 'itemsTable',
              type: 'ui',
              admin: { components: { Field: '@/components/admin/QuoteItemsTable#QuoteItemsTable' } },
            },
            ro({
              name: 'items',
              type: 'array',
              label: 'Продукти и количества',
              labels: { singular: 'Продукт', plural: 'Продукти' },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: {
                    path: '@/components/admin/RowLabel#RowLabel',
                    clientProps: { field: 'title', fallback: 'Продукт' },
                  },
                },
              },
              fields: [
                { name: 'product', type: 'relationship', relationTo: 'products', label: 'Продукт' },
                { name: 'title', type: 'text', label: 'Име (към момента на заявката)' },
                { name: 'url', type: 'text', label: 'Адрес' },
                { name: 'quantity', type: 'number', label: 'Количество' },
              ],
            } as Field),
            ro({
              name: 'itemsSummary',
              type: 'text',
              label: 'Продукти / бройки',
              admin: { description: 'Брой продукти / общо бройки — за колоната в списъка.' },
            } as Field),
            ro({ name: 'otherProducts', type: 'textarea', label: 'Други продукти или изисквания' } as Field),
          ],
        },
        {
          label: 'Подробности',
          fields: [
            ro({ name: 'purposes', type: 'select', hasMany: true, label: 'За какво ще се ползват', options: opts(PURPOSES) } as Field),
            ro({ name: 'timeframe', type: 'select', label: 'Кога ви трябват', options: opts(TIMEFRAMES) } as Field),
            ro({ name: 'budget', type: 'text', label: 'Ориентировъчен бюджет' } as Field),
            ro({ name: 'procurement', type: 'select', label: 'Начин на възлагане', options: opts(PROCUREMENT) } as Field),
            ro({ name: 'documents', type: 'select', hasMany: true, label: 'Нужни документи', options: opts(DOCUMENTS) } as Field),
            ro({ name: 'deliveryTo', type: 'text', label: 'Доставка до' } as Field),
            ro({ name: 'consultation', type: 'select', label: 'Консултация или монтаж', options: opts(CONSULTATION) } as Field),
            ro({ name: 'attachment', type: 'upload', relationTo: 'quote-files', label: 'Прикачен файл' } as Field),
            ro({ name: 'details', type: 'textarea', label: 'Допълнителна информация' } as Field),
            ro({ name: 'consent', type: 'checkbox', label: 'Дал е съгласие за обработка на данните' } as Field),
          ],
        },
        {
          label: 'Технически',
          description: 'За проверка за спам. Не се показва на клиента и не влиза в имейла до него.',
          fields: [
            ro({ name: 'ip', type: 'text', label: 'IP адрес' } as Field),
            ro({ name: 'userAgent', type: 'text', label: 'Браузър' } as Field),
            ro({ name: 'mailLog', type: 'textarea', label: 'Изпращане на имейлите' } as Field),
          ],
        },
      ],
    },
  ],
}
