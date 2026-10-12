import type { CollectionConfig } from 'payload'

import { hiddenFor, isAdmin, reqHasRole } from '../lib/access'
import { DiceFileError, parseDiceXml } from '../lib/dice/parse'
import { planSync, readDiceXml, runSync, type DiceSettings } from '../lib/dice/sync'

/**
 * „Синхронизации с dice" — лог на всяко пускане (`task-dice-xml-sinhronizaciya.md`).
 * Само за четене и само за администратора; пазят се последните 90.
 *
 * Пътищата на бутоните в „Връзка с dice.bg":
 *   POST /api/dice-syncs/check        — какво БИ се сменило, без запис;
 *   POST /api/dice-syncs/run          — истинската синхронизация;
 *   POST /api/dice-syncs/upload       — качен XML за тест (тялото е файлът,
 *                                       името — в `x-file-name`);
 *   POST /api/dice-syncs/clear-upload — маха качения файл (пак адресът).
 *
 * „Провери" и „Синхронизирай сега" ползват качения файл, ако има такъв.
 */
const ДО_MB = 10
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
        try {
          const { xml, source, upload } = await readDiceXml(s)
          const plan = await planSync(req.payload, parseDiceXml(xml), s, source, upload)
          const { updates, ...rest } = plan
          return Response.json({ ...rest, toUpdate: new Set(updates.map((u) => u.id)).size })
        } catch (e) {
          return Response.json({ error: (e as Error).message }, { status: e instanceof DiceFileError ? 400 : 500 })
        }
      },
    },
    {
      path: '/upload',
      method: 'post',
      handler: async (req) => {
        if (!reqHasRole(req, 'admin')) return Response.json({ error: 'Само за администратор.' }, { status: 403 })
        const xml = (await req.text?.()) ?? ''
        if (xml.length > ДО_MB * 1024 * 1024) return Response.json({ error: `Файлът е над ${ДО_MB} MB.` }, { status: 400 })
        // Пази се и негоден файл (празен, счупен) — с него се проверяват предпазителите.
        let warning = ''
        try {
          parseDiceXml(xml)
        } catch (e) {
          warning = (e as Error).message
        }
        const име = decodeURIComponent(req.headers.get('x-file-name') ?? 'dice.xml').slice(0, 200)
        const кога = new Date().toLocaleString('bg-BG', { timeZone: 'Europe/Sofia' })
        await req.payload.updateGlobal({
          slug: 'dice-sync',
          data: { testXml: xml, testFileName: име, testFileAt: кога },
          overrideAccess: true,
          depth: 0,
          req,
        })
        return Response.json({ name: име, at: кога, size: xml.length, warning })
      },
    },
    {
      path: '/clear-upload',
      method: 'post',
      handler: async (req) => {
        if (!reqHasRole(req, 'admin')) return Response.json({ error: 'Само за администратор.' }, { status: 403 })
        await req.payload.updateGlobal({
          slug: 'dice-sync',
          data: { testXml: '', testFileName: '', testFileAt: '' },
          overrideAccess: true,
          depth: 0,
          req,
        })
        return Response.json({ ok: true })
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
    {
      name: 'revertPrices',
      type: 'ui',
      admin: { components: { Field: '@/components/admin/PriceRevert#DiceSyncRevert' } },
    },
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
    { name: 'warnings', type: 'textarea', label: 'Предупреждения (продуктът е обновен)' },
    { name: 'skipped', type: 'textarea', label: 'Пропуснати редове (друг артикул в dice със същия EAN)' },
    { name: 'irregular', type: 'textarea', label: 'Нередности във файла на dice (за оправяне там)' },
    { name: 'notFound', type: 'textarea', label: 'Ненамерени в сайта (редове от файла, само EcoFlow)' },
    { name: 'missingInFile', type: 'textarea', label: 'Наши продукти, които липсват във файла' },
    {
      name: 'priceBatch',
      type: 'text',
      label: 'Пакет в „История на цените"',
      admin: { description: 'Само в автоматичен режим — цените, сменени при това пускане.' },
    },
  ],
}
