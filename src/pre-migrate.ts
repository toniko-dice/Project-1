/**
 * Архив преди миграция.
 *
 * Не се пуска ръчно — вика се от `npm run migrate` преди `payload migrate`.
 *
 * Ако архивът се провали, скриптът излиза с грешка и веригата в
 * package.json спира, тоест миграцията НЕ се пуска. Целта е „забравих да
 * направя архив" да стане невъзможно.
 *
 * Архивът е само на базата (`includeMedia: false`) — снимките не се
 * променят от миграция, а пълният архив би отнел минута при всяка.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { createBackup } from './lib/backup'

const stamp = new Date().toLocaleString('bg-BG', { dateStyle: 'short', timeStyle: 'short' })

try {
  const payload = await getPayload({ config })

  const { doc } = await createBackup(payload, {
    label: `Автоматично преди миграция ${stamp}`,
    includeMedia: false,
    protected: true,
  })

  const kb = Math.round((doc.filesize ?? 0) / 1024)
  console.log(`✓ Архив преди миграция: ${doc.label} (${kb} KB, защитен)`)
  process.exit(0)
} catch (err) {
  console.error('')
  console.error('✗ АРХИВЪТ СЕ ПРОВАЛИ — миграцията НЕ се пуска.')
  console.error(`  ${(err as Error).message}`)
  console.error('')
  console.error('  Оправете причината или, ако наистина искате да продължите')
  console.error('  без архив, пуснете „payload migrate" директно — на своя отговорност.')
  console.error('')
  process.exit(1)
}
