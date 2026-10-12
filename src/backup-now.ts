/**
 * Архив на базата и медията сега — за `scripts/deploy.sh` и командите
 * `:server` (`task-kachvane-server.md`): същият като „Създай архив сега".
 *
 *   npx payload run src/backup-now.ts -- "етикет"
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { createBackup } from './lib/backup'

const label = process.argv.slice(2).find((a) => a !== '--') || 'Ръчен архив'
const payload = await getPayload({ config })
const { doc, removed } = await createBackup(payload, { label, trigger: 'ръчно' })
console.log(`архив № ${doc.id}: ${doc.label}${removed ? ` (изтрити стари: ${removed})` : ''}`)
process.exit(0)
