import type { CollectionConfig, Field } from 'payload'

import { MESSAGE_STATUSES } from '../lib/contact'
import { hiddenFor, isAdmin, isSales } from '../lib/access'

const ro = <T extends Field>(f: T): T => ({ ...f, admin: { ...(f.admin ?? {}), readOnly: true } }) as T

/**
 * „Съобщения" — от контактната форма на `/kontakti` (`task-futar.md`).
 *
 * Четат и редактират администраторът и продажбите, трие само
 * администраторът. Публично писане няма: формата пише през
 * `POST /api/kontakti`, който прави проверките (CAPTCHA, капан, честота) и
 * записва през локалното API.
 *
 * Броячът на новите до името в менюто — `CollectionNavBadge` (статус „Ново").
 */
export const ContactMessages: CollectionConfig = {
  slug: 'contact-messages',
  labels: { singular: 'Съобщение', plural: 'Съобщения' },
  admin: {
    hidden: hiddenFor('admin', 'sales'),
    group: 'Продажби',
    useAsTitle: 'name',
    defaultColumns: ['name', 'createdAt', 'email', 'phone', 'status'],
    listSearchableFields: ['name', 'email', 'phone', 'message'],
    description: 'Съобщенията от формата на страницата „Контакти". „Отговор" на писмото до support@dice.bg отива направо при клиента.',
  },
  defaultSort: '-createdAt',
  access: { read: isSales, create: () => false, update: isSales, delete: isAdmin },
  fields: [
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      defaultValue: 'new',
      required: true,
      index: true,
      options: MESSAGE_STATUSES.map(({ value, label }) => ({ value, label })),
      admin: {
        position: 'sidebar',
        components: { Cell: '@/components/admin/MessageStatusCell#MessageStatusCell' },
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Бележки',
      admin: { position: 'sidebar', description: 'Вътрешни — не се пращат на клиента.' },
    },
    ro({ name: 'name', type: 'text', label: 'Име', required: true } as Field),
    {
      type: 'row',
      fields: [
        ro({ name: 'phone', type: 'text', label: 'Телефон', admin: { width: '50%' } } as Field),
        ro({ name: 'email', type: 'email', label: 'Имейл', required: true, admin: { width: '50%' } } as Field),
      ],
    },
    ro({ name: 'message', type: 'textarea', label: 'Съобщение', required: true } as Field),
    ro({ name: 'consent', type: 'checkbox', label: 'Съгласие за обработка на личните данни' } as Field),
    {
      type: 'collapsible',
      label: 'Технически',
      admin: { initCollapsed: true },
      fields: [
        ro({ name: 'page', type: 'text', label: 'От страница' } as Field),
        ro({ name: 'ip', type: 'text', label: 'IP' } as Field),
        ro({ name: 'userAgent', type: 'text', label: 'Браузър' } as Field),
        ro({ name: 'mailLog', type: 'textarea', label: 'Изпращане на имейлите' } as Field),
      ],
    },
  ],
}
