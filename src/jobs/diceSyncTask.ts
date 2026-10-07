import type { TaskConfig } from 'payload'

import { днес, runSync, type DiceSettings } from '../lib/dice/sync'

/**
 * Синхронизация с dice.bg по график (`task-dice-xml-sinhronizaciya.md`, т. 6).
 *
 * Задачата се пуска всеки час и сама решава дали е моментът: включена
 * връзка, часът от настройките (българско време) и още не е пускана днес.
 * Така часът се сменя от админа, без нов график. Само на продукция —
 * локално се ползват бутоните. Три опита за файла, през 5 минути.
 */
export const diceSyncTask: TaskConfig<'diceSync'> = {
  slug: 'diceSync',
  label: 'Синхронизация с dice.bg',
  schedule: [{ cron: '0 0 * * * *', queue: 'nightly' }],
  handler: async ({ req }) => {
    if (process.env.NODE_ENV !== 'production') return { output: {} }
    const s = (await req.payload.findGlobal({ slug: 'dice-sync', depth: 0, overrideAccess: true })) as DiceSettings
    const час = Number(
      new Date().toLocaleString('en-GB', { timeZone: 'Europe/Sofia', hour: '2-digit', hour12: false }),
    )
    if (!s.enabled || !s.url || час !== (s.hour ?? 6) || s.lastAutoDate === днес()) return { output: {} }
    const r = await runSync(req.payload, { trigger: 'автоматично', attempts: 3 })
    req.payload.logger.info(`dice.bg: ${r.message}`)
    return { output: {} }
  },
}
