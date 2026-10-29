import type { Access, CollectionConfig } from 'payload'

import { isAdmin, isEditor } from '../lib/access'
import { DOCUMENT_KINDS, DOCUMENT_LANGUAGES } from '../lib/documents'
import { revalidateAll, revalidateAllOnDelete } from '../lib/revalidate'

/**
 * „Документи" — ръководствата на EcoFlow (`task-dokumenti.md`): официалните на
 * български, преводите на ДИ СИ 2008 и оригиналите. PDF файл + връзка към
 * продуктите → раздел „Документи" на продуктовата страница и `/dokumenti`.
 *
 * Правилото: официален BG > превод > оригинал (`src/lib/documents.ts`).
 * Документ за продукт, който го няма в сайта → „Скрит" (не се трие).
 *
 * Файловете — в `media/dokumenti/`: така влизат в архивите, `db:svali` и
 * `db:kachi` заедно с Медия. Адресът — `/api/documents/file/<име>.pdf`
 * (разрешен в robots.txt и без `noindex` в nginx).
 */
const viditeliChetat: Access = ({ req }) => (req.user ? true : { hidden: { not_equals: true } })

export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'Документ', plural: 'Документи' },
  orderable: true,
  defaultSort: '_order',
  admin: {
    group: 'Съдържание',
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'language', 'products', 'hidden'],
    listSearchableFields: ['title', 'sourceTitle'],
    description:
      'Ръководствата на EcoFlow. Първо се показват официалните на български, после преводите, после оригиналите. Документ за продукт, който го няма в сайта — „Скрит" (не се трие).',
  },
  access: { read: viditeliChetat, create: isEditor, update: isEditor, delete: isAdmin },
  hooks: { afterChange: [revalidateAll], afterDelete: [revalidateAllOnDelete] },
  upload: {
    staticDir: 'media/dokumenti',
    mimeTypes: ['application/pdf'],
    imageSizes: [],
    disableLocalStorage: false,
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Заглавие (на български)' },
    {
      type: 'row',
      fields: [
        { name: 'kind', type: 'select', required: true, label: 'Вид', options: [...DOCUMENT_KINDS], admin: { width: '50%' } },
        { name: 'language', type: 'select', required: true, label: 'Език', options: [...DOCUMENT_LANGUAGES], admin: { width: '50%' } },
      ],
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'Продукти',
      admin: { description: 'Документът се показва в раздел „Документи" на всеки от тях.' },
    },
    {
      name: 'original',
      type: 'relationship',
      relationTo: 'documents',
      label: 'Оригинал',
      admin: { description: 'Само за преводите — оригиналният документ на EcoFlow.', condition: (d) => d?.language === 'bg-prevod' },
    },
    {
      type: 'row',
      fields: [
        { name: 'version', type: 'text', label: 'Версия на източника', admin: { width: '33%' } },
        { name: 'sourceDate', type: 'text', label: 'Дата на източника', admin: { width: '33%' } },
        { name: 'sourceLanguage', type: 'text', label: 'Език на оригинала', admin: { width: '34%', description: 'EN, многоезичен…' } },
      ],
    },
    { name: 'sourceTitle', type: 'text', label: 'Заглавие при EcoFlow' },
    { name: 'sourceUrl', type: 'text', label: 'Адрес на източника' },
    {
      name: 'sha256',
      type: 'text',
      index: true,
      label: 'SHA-256 на файла',
      admin: { readOnly: true, position: 'sidebar', description: 'За вноса — един файл не се качва два пъти.' },
    },
    {
      name: 'hidden',
      type: 'checkbox',
      label: 'Скрит',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Не се вижда на сайта (продуктът го няма), остава тук.' },
    },
  ],
}
