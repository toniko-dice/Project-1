import type { GlobalAfterChangeHook, GlobalConfig } from 'payload'

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
      'Всеки ден в избрания час сайтът тегли XML файла на dice.bg и обновява цената, старата цена, наличността и броя на продуктите (по SKU, после по баркод). Нищо друго не се пипа; продукти не се създават и не се трият.',
  },
  access: { read: isAdmin, update: isAdmin },
  hooks: { afterChange: [прагът] },
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
          name: 'enabled',
          type: 'checkbox',
          label: 'Включена',
          defaultValue: false,
          admin: { width: '33%', description: 'Автоматичното пускане по график. Бутоните работят и без нея.' },
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
    { name: 'url', type: 'text', label: 'Адрес на XML', admin: { description: 'Пълният адрес, който дава dice.bg.' } },
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
    // Служебни — пишат се от синхронизацията.
    { name: 'lastMatched', type: 'number', admin: { hidden: true } },
    { name: 'lastAutoDate', type: 'text', admin: { hidden: true } },
    { name: 'backupDone', type: 'checkbox', admin: { hidden: true } },
  ],
}
