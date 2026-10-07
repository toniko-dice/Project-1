import { APIError, type CollectionBeforeChangeHook, type CollectionBeforeDeleteHook, type CollectionConfig, type PayloadRequest, type Where } from 'payload'

import { hiddenFor, isAdmin, ROLE_OPTIONS, roleOf, userHasRole } from '../lib/access'
import { absoluteUrl } from '../lib/site-url'

const ПОСЛЕДЕН = 'Трябва да остане поне един администратор.'

const брой = async (req: PayloadRequest, without?: number | string) => {
  const where: Where = { role: { equals: 'admin' } }
  if (without !== undefined) where.id = { not_equals: without }
  return (await req.payload.count({ collection: 'users', where, req, overrideAccess: true })).totalDocs
}

/**
 * Последният администратор остава администратор; никой не сменя сам
 * собствената си роля (полето е само за админа, а тук и срещу себе си).
 */
const пазиРолята: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req }) => {
  if (operation !== 'update' || !originalDoc || data.role === undefined || data.role === originalDoc.role) return data
  if (req.user && String(req.user.id) === String(originalDoc.id)) {
    throw new APIError('Не можете да смените собствената си роля.', 403, undefined, true)
  }
  if (originalDoc.role === 'admin' && (await брой(req, originalDoc.id)) === 0) {
    throw new APIError(ПОСЛЕДЕН, 400, undefined, true)
  }
  return data
}

const пазиПоследния: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const doc = await req.payload.findByID({ collection: 'users', id, depth: 0, req, overrideAccess: true })
  if (doc?.role === 'admin' && (await брой(req, id)) === 0) throw new APIError(ПОСЛЕДЕН, 400, undefined, true)
}

/** Собственият запис — за всеки влязъл; всички — за администратора. */
const самоСебеСи = ({ req }: { req: PayloadRequest }) => {
  if (!req.user) return false
  if (userHasRole(req.user, 'admin')) return true
  return { id: { equals: req.user.id } }
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Потребител', plural: 'Потребители' },
  admin: {
    useAsTitle: 'email',
    group: 'Настройки',
    defaultColumns: ['email', 'name', 'role', 'position'],
    // Редакторът и продажбите стигат до профила си през „Акаунт" (горе вдясно).
    hidden: hiddenFor('admin'),
  },
  auth: {
    /*
      Писмото за забравена парола — с ПЪЛЕН адрес. Без `serverURL` в
      конфигурацията Payload пише относителен линк (`/admin/reset/…`), който
      в пощенската програма не води никъде; при заключен сайт това е
      единственият път обратно (`task-zaklyuchen-dostap.md`, т. 4).
    */
    forgotPassword: {
      generateEmailSubject: () => 'EcoFlow България — нова парола',
      generateEmailHTML: (args) => {
        const url = absoluteUrl(`/admin/reset/${args?.token ?? ''}`)
        return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111">
<p>Здравейте,</p>
<p>Получихме заявка за нова парола за вход в сайта и админа на EcoFlow България.</p>
<p><a href="${url}" style="display:inline-block;background:#000;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Задайте нова парола</a></p>
<p style="color:#555;font-size:13px">Ако бутонът не работи, отворете: ${url}<br>Ако не сте искали нова парола, пренебрегнете това писмо — старата остава.</p>
</div>`
      },
    },
  },
  access: {
    // Всяка роля влиза в админа; без роля (стар или повреден запис) — не.
    admin: ({ req }) => roleOf(req.user) !== null,
    read: самоСебеСи,
    create: isAdmin,
    update: самоСебеСи,
    delete: isAdmin,
  },
  hooks: { beforeChange: [пазиРолята], beforeDelete: [пазиПоследния] },
  fields: [
    {
      name: 'role',
      type: 'select',
      label: 'Роля',
      required: true,
      defaultValue: 'editor',
      options: ROLE_OPTIONS,
      saveToJWT: true,
      access: {
        // Вижда я всеки (и в собствения профил); сменя я само администраторът.
        create: ({ req }) => userHasRole(req.user, 'admin'),
        update: ({ req, id }) => userHasRole(req.user, 'admin') && String(req.user?.id) !== String(id),
      },
      admin: {
        position: 'sidebar',
        description:
          'Администратор — всичко, вкл. потребители, архиви и изтриване. Редактор — продукти, страници, менюта, медия, настройки; без продажби, без изтриване. Продажби — заявки и оферти; продуктите само ги вижда.',
      },
    },
    { name: 'name', type: 'text', label: 'Име' },
    // „Изготвил: {име}, {длъжност}" в офертите — по подразбиране от потребителя, който ги създава.
    { name: 'position', type: 'text', label: 'Длъжност' },
  ],
}
