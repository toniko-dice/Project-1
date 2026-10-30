import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { EmailAdapter, SendEmailOptions } from 'payload'

/**
 * Пощата „само в лог" (`task-kachvane-server.md`, т. 5) — докато на сървъра
 * няма SMTP. Писмата НЕ се пращат: всяко се записва в `mail-log/` (HTML,
 * текст и JSON с получателите и темата) и ред в лога на сървъра
 * (journald). Формите работят както обикновено — заявката се записва,
 * пощата „минава".
 *
 * Включва се с `EMAIL_MODE=log` в `.env`, или само по себе си, когато няма
 * `SMTP_HOST`. Папката е извън git.
 */
export const MAIL_LOG_DIR = path.resolve(/* turbopackIgnore: true */ process.cwd(), 'mail-log')

const адреси = (v: SendEmailOptions['to']): string[] =>
  (Array.isArray(v) ? v : v ? [v] : []).map((a) => (typeof a === 'string' ? a : `${a.name ?? ''} <${a.address}>`.trim()))

export const mailLogAdapter =
  (from: { name: string; address: string }): EmailAdapter =>
  ({ payload }) => ({
    name: 'mail-log',
    defaultFromName: from.name,
    defaultFromAddress: from.address,
    sendEmail: async (message) => {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      const base = path.join(/* turbopackIgnore: true */ MAIL_LOG_DIR, stamp)
      await mkdir(MAIL_LOG_DIR, { recursive: true })
      const meta = {
        from: message.from ?? `${from.name} <${from.address}>`,
        to: адреси(message.to),
        cc: адреси(message.cc),
        replyTo: адреси(message.replyTo as SendEmailOptions['to']),
        subject: message.subject ?? '',
        attachments: ((message.attachments ?? []) as { filename?: string }[]).map((a) => a.filename ?? '(файл)'),
      }
      await writeFile(`${base}.json`, JSON.stringify(meta, null, 2))
      if (message.html) await writeFile(`${base}.html`, String(message.html))
      if (message.text) await writeFile(`${base}.txt`, String(message.text))
      payload.logger.info(`Имейл (не е изпратен — режим „лог"): до ${meta.to.join(', ')} — „${meta.subject}" → mail-log/${stamp}.*`)
      return { messageId: `mail-log-${stamp}` }
    },
  })
