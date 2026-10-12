import { APIError, type GlobalAfterChangeHook, type GlobalBeforeChangeHook, type GlobalConfig } from 'payload'

import { hiddenFor, isAdmin } from '../lib/access'
import { DEFAULT_LAST_PIECE, recomputeLastPiece } from '../lib/dice/last-piece'
import { expireEverything } from '../lib/revalidate'

/** Нов праг за „Последна бройка" → пресмята всички продукти наведнъж. */
const прагът: GlobalAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const нов = doc.lastPieceThreshold ?? DEFAULT_LAST_PIECE
  if (нов !== (previousDoc?.lastPieceThreshold ?? DEFAULT_LAST_PIECE)) {
    await recomputeLastPiece(req.payload, нов)
    expireEverything()
  }
  return doc
}

/**
 * Към „Автоматичен" — само без чакащи цени и с адрес на XML
 * (`task-dice-odobrenie-ceni.md`, т. 1). Смяната на режима се записва —
 * кой и кога.
 */
const режимът: GlobalBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const нов = data.mode ?? originalDoc?.mode ?? 'test'
  const стар = originalDoc?.mode ?? 'test'
  if (нов === стар) return data
  if (нов === 'auto') {
    const url = (data.url ?? originalDoc?.url ?? '').trim()
    if (!url) throw new APIError('За автоматичен режим е нужен адрес на XML.', 400, undefined, true)
    const { totalDocs } = await req.payload.count({
      collection: 'price-approvals',
      where: { status: { equals: 'pending' } },
      overrideAccess: true,
      req,
    })
    if (totalDocs > 0) {
      throw new APIError(
        `Има ${totalDocs} цени, които чакат одобрение. Одобрете или откажете ги преди да включите автоматичния режим.`,
        400,
        undefined,
        true,
      )
    }
  }
  const кой = (req.user as { email?: string } | null)?.email ?? 'система'
  const кога = new Date().toLocaleString('bg-BG', { timeZone: 'Europe/Sofia' })
  data.modeChanged = `${нов === 'auto' ? 'Автоматичен' : 'Тестов'} — от ${кой}, ${кога}`
  return data
}

/**
 * „Връзка с dice.bg" — автоматично обновяване на цена, стара цена,
 * наличност и брой от XML файла на магазина (`task-dice-xml-sinhronizaciya.md`).
 * Само за администратора. Логът на всяко пускане е в „Синхронизации с dice".
 */
export const DiceSync: GlobalConfig = {
  slug: 'dice-sync',
  label: 'Връзка с dice.bg',
  admin: {
    group: 'Продажби',
    hidden: hiddenFor('admin'),
    description:
      'XML файлът на dice.bg обновява цената, зачертаната цена, наличността и броя на продуктите (по код на dice = SKU, после по баркод). „Тестов" режим: цените чакат в „Цени за одобрение", наличностите се обновяват веднага, пуска се само с бутона. „Автоматичен": всеки ден в избрания час — всичко само.',
  },
  access: { read: isAdmin, update: isAdmin },
  hooks: { beforeChange: [режимът], afterChange: [прагът] },
  fields: [
    {
      name: 'actions',
      type: 'ui',
      admin: { components: { Field: '@/components/admin/DiceSyncActions#DiceSyncActions' } },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'mode',
          type: 'select',
          label: 'Режим',
          defaultValue: 'test',
          options: [
            { label: 'Тестов — цените чакат одобрение', value: 'test' },
            { label: 'Автоматичен — всеки ден, всичко само', value: 'auto' },
          ],
          admin: {
            width: '33%',
            description: 'Тестов: без график, само с бутона. Автоматичен: иска адрес на XML и нула чакащи цени.',
          },
        },
        {
          name: 'hour',
          type: 'number',
          label: 'Час на синхронизация (0–23)',
          defaultValue: 6,
          min: 0,
          max: 23,
          admin: { width: '33%', step: 1, description: 'По българско време. След нощното опресняване на файла.' },
        },
        {
          name: 'lastPieceThreshold',
          type: 'number',
          label: 'Етикет „Последна бройка" при брой ≤',
          defaultValue: DEFAULT_LAST_PIECE,
          min: 0,
          admin: { width: '34%', step: 1, description: '0 — етикетът е изключен.' },
        },
      ],
    },
    { name: 'modeChanged', type: 'text', label: 'Последна смяна на режима', admin: { readOnly: true } },
    { name: 'url', type: 'text', label: 'Адрес на XML', admin: { description: 'Пълният адрес, който дава dice.bg.' } },
    {
      name: 'testFile',
      type: 'ui',
      admin: { components: { Field: '@/components/admin/DiceTestFile#DiceTestFile' } },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'updatePrice',
          type: 'checkbox',
          label: 'Обновявай цената (и старата цена)',
          defaultValue: true,
          admin: { width: '50%' },
        },
        {
          name: 'updateAvailability',
          type: 'checkbox',
          label: 'Обновявай наличността (и броя)',
          defaultValue: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'reportEmail',
      type: 'email',
      label: 'Имейл за отчет',
      defaultValue: 'anton@dice.bg',
      admin: { description: 'Отчет след всяко пускане с промени или грешки. Празно — без имейл.' },
    },
    { name: 'lastRun', type: 'textarea', label: 'Последна синхронизация', admin: { readOnly: true } },
    /*
      Качен XML за тест — вместо адреса, докато файлът не е онлайн. Пише се
      от `POST /api/dice-syncs/upload`, маха се с `/clear-upload`.
    */
    /*
      Формата на админа не ги пише (`update: false`) — иначе „Запази" след
      качването връща старите стойности и маха файла; самият XML не се праща
      и в браузъра. Пишат ги само пътищата (с `overrideAccess`).
    */
    { name: 'testXml', type: 'textarea', access: { read: () => false, update: () => false }, admin: { hidden: true } },
    { name: 'testFileName', type: 'text', access: { update: () => false }, admin: { hidden: true } },
    { name: 'testFileAt', type: 'text', access: { update: () => false }, admin: { hidden: true } },
    /*
      Старата отметка „Включена" — заменена от „Режим" (автоматичен = по
      график). Колоната остава; не се чете.
    */
    { name: 'enabled', type: 'checkbox', defaultValue: false, admin: { hidden: true } },
    // Служебни — пишат се от синхронизацията.
    { name: 'lastMatched', type: 'number', admin: { hidden: true } },
    { name: 'lastAutoDate', type: 'text', admin: { hidden: true } },
    { name: 'backupDone', type: 'checkbox', admin: { hidden: true } },
  ],
}
