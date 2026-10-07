import type { CollectionConfig } from 'payload'

import { hiddenFor, isAdmin, reqHasRole } from '../lib/access'
import { DiceFileError, parseDiceXml } from '../lib/dice/parse'
import { fetchDiceXml, planSync, runSync, type DiceSettings } from '../lib/dice/sync'

/**
 * „Синхронизации с dice" — лог на всяко пускане (`task-dice-xml-sinhronizaciya.md`).
 * Само за четене и само за администратора; пазят се последните 90.
 *
 * Пътищата на бутоните в „Връзка с dice.bg":
 *   POST /api/dice-syncs/check — какво БИ се сменило, без запис;
 *   POST /api/dice-syncs/run   — истинската синхронизация.
 */
export const DiceSyncs: CollectionConfig = {
  slug: 'dice-syncs',
  labels: { singular: 'Синхронизация с dice', plural: 'Синхронизации с dice' },
  admin: {
    group: 'Продажби',
    hidden: hiddenFor('admin'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'trigger', 'updated', 'notFoundCount', 'errorCount'],
  },
  defaultSort: '-createdAt',
  access: { read: isAdmin, create: () => false, update: () => false, delete: isAdmin },
  endpoints: [
    {
      path: '/check',
      method: 'post',
      handler: async (req) => {
        if (!reqHasRole(req, 'admin')) return Response.json({ error: 'Само за администратор.' }, { status: 403 })
        const s = (await req.payload.findGlobal({ slug: 'dice-sync', depth: 0, overrideAccess: true })) as DiceSettings
        if (!s.url?.trim()) {
          return Response.json({ error: 'Няма адрес на XML. Попълнете го и натиснете „Запази".' }, { status: 400 })
        }
        try {
          const plan = await planSync(req.payload, parseDiceXml(await fetchDiceXml(s.url.trim())), s)
          const { updates, ...rest } = plan
          return Response.json({ ...rest, toUpdate: new Set(updates.map((u) => u.id)).size })
        } catch (e) {
          return Response.json({ error: (e as Error).message }, { status: e instanceof DiceFileError ? 400 : 500 })
        }
      },
    },
    {
      path: '/run',
      method: 'post',
      handler: async (req) => {
        if (!reqHasRole(req, 'admin')) return Response.json({ error: 'Само за администратор.' }, { status: 403 })
        const r = await runSync(req.payload, {
          trigger: 'ръчно',
          user: (req.user as { email?: string } | null)?.email ?? null,
        })
        return Response.json({ result: r.result, message: r.message, logId: r.logId })
      },
    },
  ],
  fields: [
    { name: 'title', type: 'text', label: 'Синхронизация' },
    {
      type: 'row',
      fields: [
        { name: 'trigger', type: 'text', label: 'Как', admin: { width: '33%' } },
        { name: 'user', type: 'text', label: 'От', admin: { width: '33%' } },
        {
          name: 'result',
          type: 'select',
          label: 'Резултат',
          options: [
            { label: 'Успешна', value: 'ok' },
            { label: 'С грешки при отделни продукти', value: 'partial' },
            { label: 'Спряна без промени', value: 'aborted' },
            { label: 'Грешка', value: 'error' },
          ],
          admin: { width: '34%' },
        },
      ],
    },
    { name: 'summary', type: 'textarea', label: 'Обобщение' },
    {
      type: 'row',
      fields: [
        { name: 'updated', type: 'number', label: 'Обновени', admin: { width: '25%' } },
        { name: 'unchanged', type: 'number', label: 'Без промяна', admin: { width: '25%' } },
        { name: 'notFoundCount', type: 'number', label: 'Ненамерени', admin: { width: '25%' } },
        { name: 'errorCount', type: 'number', label: 'Грешки', admin: { width: '25%' } },
      ],
    },
    { name: 'changes', type: 'textarea', label: 'Промени (продукт — поле: старо → ново)' },
    { name: 'errors', type: 'textarea', label: 'Грешки' },
    { name: 'notFound', type: 'textarea', label: 'Ненамерени в сайта (редове от файла, само EcoFlow)' },
    { name: 'missingInFile', type: 'textarea', label: 'Наши продукти, които липсват във файла' },
  ],
}
