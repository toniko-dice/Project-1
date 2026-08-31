import type { TaskConfig } from 'payload'

import { createBackup } from '../lib/backup'

/**
 * Ежедневен архив в 03:00.
 *
 * Форматът на cron тук е с шест полета — първото е секунди:
 *   секунди минути часове ден месец ден-от-седмицата
 *
 * Важно: графикът работи само докато сървърът върви. При локална разработка,
 * когато машината се изключва вечер, архивът просто няма да се направи —
 * затова ръчният бутон остава основният начин.
 */
export const dailyBackupTask: TaskConfig<'dailyBackup'> = {
  slug: 'dailyBackup',
  label: 'Ежедневен архив',
  schedule: [
    {
      cron: '0 0 3 * * *',
      queue: 'nightly',
    },
  ],
  handler: async ({ req }) => {
    const stamp = new Date().toLocaleString('bg-BG', { dateStyle: 'short', timeStyle: 'short' })
    const { doc, removed } = await createBackup(req.payload, {
      includeMedia: true,
      label: `Автоматичен архив ${stamp}`,
      trigger: 'по график',
    })

    req.payload.logger.info(
      `Автоматичен архив: ${doc.label}${removed ? ` (изтрити стари: ${removed})` : ''}`,
    )

    return { output: {} }
  },
}
