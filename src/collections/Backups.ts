import path from 'path'
import type { CollectionConfig } from 'payload'

import { createBackup, stageRestore, STORE_DIR } from '../lib/backup'
import { adminOnlyAccess, hiddenFor, reqHasRole } from '../lib/access'

export const Backups: CollectionConfig = {
  slug: 'backups',
  labels: { singular: 'Архив', plural: 'Архиви' },
  admin: {
    hidden: hiddenFor('admin'),
    useAsTitle: 'label',
    defaultColumns: ['label', 'trigger', 'protected', 'includesMedia', 'filesize', 'createdAt'],
    group: 'Настройки',
    description:
      'Пазят се последните 5 обикновени и последните 3 преди миграция. Защитените остават винаги. Бутонът „Създай архив сега“ е над списъка. Свалете копие на компютъра си — архивите тук лежат на същия диск и не пазят от отказ на хардуера.',
    components: {
      beforeListTable: ['@/components/admin/CreateBackupButton#CreateBackupButton'],
    },
  },
  // Достъпът е само за влезли потребители — архивът съдържа цялата база.
  access: { ...adminOnlyAccess },
  upload: {
    staticDir: STORE_DIR,
    mimeTypes: ['application/zip', 'application/x-zip-compressed'],
    disableLocalStorage: false,
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      label: 'Име',
      admin: { description: 'За какво е този архив. Напр. „Преди пренареждане на менюто“.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'trigger',
          type: 'select',
          label: 'Създаден',
          defaultValue: 'ръчно',
          admin: { width: '50%', readOnly: true },
          options: [
            { label: 'Ръчно', value: 'ръчно' },
            { label: 'По график', value: 'по график' },
            { label: 'Качен файл', value: 'качен' },
            { label: 'Преди миграция', value: 'преди миграция' },
          ],
        },
        {
          name: 'includesMedia',
          type: 'checkbox',
          label: 'Съдържа снимки',
          defaultValue: true,
          admin: { width: '25%', readOnly: true },
        },
        {
          name: 'mediaFiles',
          type: 'number',
          label: 'Брой снимки',
          admin: { width: '25%', readOnly: true },
        },
      ],
    },
    {
      name: 'protected',
      type: 'checkbox',
      label: 'Защитен от изтриване',
      defaultValue: false,
      admin: {
        description:
          'Пазят се последните 5 обикновени и последните 3 преди миграция. Защитените остават винаги.',
      },
    },
    { name: 'note', type: 'textarea', label: 'Бележка' },
    {
      name: 'restore',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/RestoreBackupButton#RestoreBackupButton',
        },
      },
    },
  ],
  endpoints: [
    {
      path: '/create-now',
      method: 'post',
      handler: async (req) => {
        if (!req.user) {
          return Response.json({ error: 'Нужен е вход.' }, { status: 401 })
        }
        if (!reqHasRole(req, 'admin')) {
          return Response.json({ error: 'Само за администратор.' }, { status: 403 })
        }

        let body: { label?: string; includeMedia?: boolean } = {}
        try {
          body = req.json ? ((await req.json()) as typeof body) : {}
        } catch {
          // Празно тяло е допустимо — ползват се стойностите по подразбиране.
        }

        try {
          const { doc, removed } = await createBackup(req.payload, {
            label: body.label,
            includeMedia: body.includeMedia ?? true,
            trigger: 'ръчно',
          })
          return Response.json({
            ok: true,
            id: doc.id,
            label: doc.label,
            removed,
          })
        } catch (err) {
          req.payload.logger.error(`Архивирането се провали: ${(err as Error).message}`)
          return Response.json({ error: (err as Error).message }, { status: 500 })
        }
      },
    },
    {
      path: '/:id/restore',
      method: 'post',
      handler: async (req) => {
        if (!req.user) {
          return Response.json({ error: 'Нужен е вход.' }, { status: 401 })
        }
        if (!reqHasRole(req, 'admin')) {
          return Response.json({ error: 'Само за администратор.' }, { status: 403 })
        }

        const id = req.routeParams?.id as string
        if (!id) return Response.json({ error: 'Липсва номер на архив.' }, { status: 400 })

        try {
          const doc = await req.payload.findByID({ collection: 'backups', id, depth: 0 })
          if (!doc?.filename) {
            return Response.json({ error: 'Архивът няма прикачен файл.' }, { status: 400 })
          }

          // Преди да пипаме каквото и да е, правим архив на текущото състояние.
          const safety = await createBackup(req.payload, {
            label: `Автоматично преди възстановяване на „${doc.label}“`,
            includeMedia: true,
            trigger: 'ръчно',
          })

          await stageRestore(path.join(STORE_DIR, doc.filename), {
            id: doc.id,
            label: doc.label,
          })

          return Response.json({
            ok: true,
            safetyBackupId: safety.doc.id,
            message:
              'Възстановяването е подготвено. Спрете сървъра и го пуснете отново, за да влезе в сила.',
          })
        } catch (err) {
          req.payload.logger.error(`Възстановяването се провали: ${(err as Error).message}`)
          return Response.json({ error: (err as Error).message }, { status: 500 })
        }
      },
    },
  ],
}
