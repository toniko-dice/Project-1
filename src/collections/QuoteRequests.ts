import type { CollectionBeforeChangeHook, CollectionConfig, Field } from 'payload'

import { absoluteUrl } from '../lib/site-url'
import { productPath } from '../lib/urls'

import {
  CLIENT_TYPES,
  CONSULTATION,
  DOCUMENTS,
  PROCUREMENT,
  PURPOSES,
  MAX_QTY,
  STATUSES,
  TIMEFRAMES,
} from '../lib/quote/options'

/** Само за четене: номерът, IP, браузърът и това, което се пресмята. Всичко друго се редактира. */
const ro = <T extends Field>(f: T): T => ({ ...f, admin: { ...(f.admin ?? {}), readOnly: true } }) as T

type Item = {
  id?: string | null
  product?: number | { id: number } | null
  quantity?: number | null
  title?: string | null
  url?: string | null
  sku?: string | null
  ean?: string | null
  image?: number | { id: number } | null
}

const productId = (p: Item['product']) => (typeof p === 'object' ? p?.id : p) ?? null

/**
 * При редакция от админа:
 * - редът пази СНИМКАТА НА ДАННИТЕ от заявката — име, адрес, SKU, EAN,
 *   снимка — каквото е поискал клиентът, дори продуктът после да се
 *   промени или скрие. Наново се взимат само за добавен ред или за ред със
 *   сменен продукт; количеството — между 1 и 9999; ред без продукт отпада;
 * - „Продукти / бройки" се пресмята;
 * - „Последна промяна от {потребител} на {дата}" — само при запис от
 *   влязъл потребител (записът от формата е без потребител).
 *
 * Имейли НЕ се пращат: пращат се само от `POST /api/oferta`, при
 * създаването — тук няма нищо, което да ги вика.
 */
const onEdit: CollectionBeforeChangeHook = async ({ data, req, operation, originalDoc }) => {
  if (operation !== 'update') return data

  if (Array.isArray(data.items)) {
    const items = (data.items as Item[]).filter((i) => i.product)
    // Предишният продукт на всеки ред (по id на реда) — непроменен ред пази снимката си.
    const before = new Map(((originalDoc?.items ?? []) as Item[]).map((i) => [i.id, productId(i.product)]))
    const нови = items.filter((i) => !i.id || before.get(i.id) !== productId(i.product))
    const ids = нови.map((i) => productId(i.product)!)
    const found = ids.length
      ? await req.payload.find({
          collection: 'products',
          where: { id: { in: ids } },
          depth: 0,
          pagination: false,
          // Виртуалните полета за адреса се четат от `category` — виж CLAUDE.md, т. 22.
          select: {
            title: true,
            slug: true,
            sku: true,
            ean: true,
            image: true,
            category: true,
            categorySlug: true,
            categoryParentSlug: true,
            categoryGrandparentSlug: true,
          },
          req,
        })
      : { docs: [] }
    const byId = new Map(found.docs.map((p) => [p.id, p]))
    data.items = items.map((i) => {
      const q = Math.min(Math.max(Math.round(Number(i.quantity) || 1), 1), MAX_QTY)
      const p = нови.includes(i) ? byId.get(productId(i.product)!) : undefined
      if (!p) return { ...i, quantity: q }
      return {
        ...i,
        quantity: q,
        title: p.title,
        url: absoluteUrl(productPath(p as never)),
        sku: p.sku ?? null,
        ean: p.ean ?? null,
        image: (p.image as number | null | undefined) ?? null,
      }
    })
    const total = (data.items as Item[]).reduce((s, i) => s + Number(i.quantity), 0)
    data.itemsSummary = `${(data.items as Item[]).length} / ${total}`
  }

  if (req.user) {
    const кога = new Date().toLocaleString('bg-BG', { timeZone: 'Europe/Sofia', dateStyle: 'short', timeStyle: 'short' })
    data.lastChange = `Последна промяна от ${(req.user as { email?: string }).email ?? 'админ'} на ${кога}`
  }
  return data
}

const opts = (o: { value: string; label: string }[]) => o.map(({ value, label }) => ({ value, label }))

/**
 * „Нови заявки" — заявките за оферта от `/oferta-za-firmi`.
 *
 * Редактира се всичко освен номера, датата, IP и браузъра (`onEdit`).
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
      'Заявките от страницата „Оферта за фирми". Всичко се редактира (клиентът може да е сбъркал) — освен номера, датата, IP и браузъра. Промените не пращат имейли.',
  },
  defaultSort: '-createdAt',
  // История на промените — „Версии" в записа; всяка носи и „Последна промяна от…".
  versions: { maxPerDoc: 100 },
  hooks: { beforeChange: [onEdit] },
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
    ro({
      name: 'lastChange',
      type: 'text',
      label: 'Последна промяна',
      admin: {
        position: 'sidebar',
        description: 'Попълва се сам при запис от админа. Промените не пращат имейли.',
      },
    } as Field),
    {
      name: 'createOffer',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '@/components/admin/CreateOfferButton#CreateOfferButton' } },
    },
    {
      name: 'offers',
      type: 'join',
      collection: 'offers',
      on: 'quoteRequest',
      label: 'Оферти',
      admin: { position: 'sidebar', defaultColumns: ['number', 'status', 'date'] },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Организация и контакт',
          fields: [
            { name: 'clientType', type: 'select', label: 'Тип клиент', options: opts(CLIENT_TYPES) },
            { name: 'organization', type: 'text', label: 'Организация', index: true },
            { name: 'eik', type: 'text', label: 'ЕИК / БУЛСТАТ', index: true },
            { name: 'city', type: 'text', label: 'Град / община' },
            { name: 'contactName', type: 'text', label: 'Име и фамилия' },
            { name: 'position', type: 'text', label: 'Длъжност' },
            { name: 'email', type: 'email', label: 'Имейл', index: true },
            { name: 'phone', type: 'text', label: 'Телефон' },
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
            {
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
                {
                  type: 'row',
                  fields: [
                    { name: 'product', type: 'relationship', relationTo: 'products', label: 'Продукт', admin: { width: '70%' } },
                    { name: 'quantity', type: 'number', label: 'Количество', min: 1, max: MAX_QTY, admin: { width: '30%', step: 1 } },
                  ],
                },
                ro({ name: 'title', type: 'text', label: 'Име (към момента на заявката)' } as Field),
                {
                  type: 'row',
                  fields: [
                    ro({ name: 'sku', type: 'text', label: 'SKU', admin: { width: '33%' } } as Field),
                    ro({ name: 'ean', type: 'text', label: 'EAN', admin: { width: '33%' } } as Field),
                    ro({ name: 'image', type: 'upload', relationTo: 'media', label: 'Снимка', admin: { width: '34%' } } as Field),
                  ],
                },
                ro({ name: 'url', type: 'text', label: 'Адрес на продукта' } as Field),
              ],
            },
            ro({
              name: 'itemsSummary',
              type: 'text',
              label: 'Продукти / бройки',
              admin: { description: 'Брой продукти / общо бройки — за колоната в списъка.' },
            } as Field),
            { name: 'otherProducts', type: 'textarea', label: 'Други продукти или изисквания' },
          ],
        },
        {
          label: 'Подробности',
          fields: [
            { name: 'purposes', type: 'select', hasMany: true, label: 'За какво ще се ползват', options: opts(PURPOSES) },
            { name: 'timeframe', type: 'select', label: 'Кога ви трябват', options: opts(TIMEFRAMES) },
            { name: 'budget', type: 'text', label: 'Ориентировъчен бюджет' },
            { name: 'procurement', type: 'select', label: 'Начин на възлагане', options: opts(PROCUREMENT) },
            { name: 'documents', type: 'select', hasMany: true, label: 'Нужни документи', options: opts(DOCUMENTS) },
            { name: 'deliveryTo', type: 'text', label: 'Доставка до' },
            { name: 'consultation', type: 'select', label: 'Консултация или монтаж', options: opts(CONSULTATION) },
            { name: 'attachment', type: 'upload', relationTo: 'quote-files', label: 'Прикачен файл' },
            { name: 'details', type: 'textarea', label: 'Допълнителна информация' },
            { name: 'consent', type: 'checkbox', label: 'Дал е съгласие за обработка на данните' },
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
