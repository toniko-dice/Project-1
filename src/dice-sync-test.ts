/**
 * Проверка на нощната синхронизация с dice.bg, без да се чака нощта
 * (`task-deploy-proverka-i-dice-avto.md`, т. 2.5).
 *
 * Показва проверките, които прави задачата по график (`diceSyncTask`) —
 * режим, адрес, час по българско време, „още не днес" — и пуска `runSync`
 * със СЪЩИТЕ параметри като нея: „автоматично", 3 опита за файла, само от
 * адреса (не качен файл). Режимът за това пускане е „Автоматичен"
 * (`forceMode`) — настройката в админа НЕ се пипа и `lastAutoDate` не се
 * пише, затова истинското нощно пускане не се прескача.
 *
 * Пише в базата: цени, стара цена, наличност и брой (един пакет `С-…` —
 * връща се с „Върни цените от тази синхронизация"). Пуска се на сървъра:
 *
 *   npm run na-sarvara dice:test-po-grafik      (с архив преди това)
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { днес, runSync, type DiceSettings } from './lib/dice/sync'

const payload = await getPayload({ config })
const s = (await payload.findGlobal({ slug: 'dice-sync', depth: 0, overrideAccess: true })) as DiceSettings
const час = Number(new Date().toLocaleString('en-GB', { timeZone: 'Europe/Sofia', hour: '2-digit', hour12: false }))

console.log('Проверките на графика (задача diceSync, всеки час; опашката се пуска на 5 минути):')
console.log(`  режим: ${s.mode === 'auto' ? 'Автоматичен' : 'Тестов'}${s.mode === 'auto' ? ' ✓' : ' — нощем НЕ би тръгнала'}`)
console.log(`  адрес: ${s.url || '— (няма)'}`)
console.log(`  час: настройка ${s.hour ?? 6}, сега ${час} (Europe/Sofia)`)
console.log(`  последно нощно пускане: ${s.lastAutoDate || '— (никога)'}, днес ${днес()}`)
console.log('\nПускане сега — като нощното, в режим „Автоматичен" само за това пускане…')

const r = await runSync(payload, {
  trigger: 'автоматично',
  attempts: 3,
  useUpload: false,
  forceMode: 'auto',
  user: 'проверка на нощния път',
})
console.log(`\nРезултат: ${r.result} — ${r.message}`)
if (r.priceBatch) console.log(`Пакет с цените: ${r.priceBatch}`)
console.log(`Запис в „Синхронизации с dice": № ${r.logId}`)
if (r.plan?.changes.length) {
  console.log(`\nПромени (${r.plan.changes.length}):`)
  for (const c of r.plan.changes) console.log(`  ${c.product} — ${c.field}: ${c.old} → ${c.new}`)
}
process.exit(r.result === 'error' ? 1 : 0)
