/**
 * Контактната форма (`/kontakti`) — полетата, проверките и статусите.
 *
 * Едно място за браузъра и за `POST /api/kontakti`: формата показва
 * същите грешки, които сървърът би върнал (както `src/lib/quote/options.ts`).
 */

export type ContactPayload = {
  name: string
  phone: string
  email: string
  message: string
  consent: boolean
}

export type ContactErrors = Partial<Record<keyof ContactPayload | 'captcha', string>>

export const MESSAGE_MIN = 10
export const MESSAGE_MAX = 5000

/** Цифри, интервали и „+", 6–20 знака. */
export const validContactPhone = (s: string) => /^[+\d ]{6,20}$/.test(s.trim()) && /\d{6,}/.test(s.replace(/\D/g, ''))

export const validEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())

export const validateContact = (p: ContactPayload): ContactErrors => {
  const e: ContactErrors = {}
  if (!p.name.trim()) e.name = 'Въведете име.'
  else if (p.name.trim().length > 120) e.name = 'Името е твърде дълго.'
  if (!p.phone.trim()) e.phone = 'Въведете телефон.'
  else if (!validContactPhone(p.phone)) e.phone = 'Само цифри, интервали и „+“ — от 6 до 20 знака, напр. +359 88 123 4567.'
  if (!p.email.trim()) e.email = 'Въведете имейл.'
  else if (!validEmail(p.email)) e.email = 'Имейлът не изглежда правилен, напр. ime@primer.bg.'
  const n = p.message.trim().length
  if (!n) e.message = 'Напишете съобщение.'
  else if (n < MESSAGE_MIN) e.message = `Съобщението е твърде кратко — поне ${MESSAGE_MIN} знака.`
  else if (n > MESSAGE_MAX) e.message = `Съобщението е твърде дълго — до ${MESSAGE_MAX} знака.`
  if (!p.consent) e.consent = 'Нужно е съгласието ви, за да ви отговорим.'
  return e
}

/** Статусите в „Съобщения" — цветни хапчета в списъка, като при „Нови заявки". */
export const MESSAGE_STATUSES = [
  { value: 'new', label: 'Ново', color: '#e8590c' },
  { value: 'answered', label: 'Отговорено', color: '#2b8a3e' },
  { value: 'archived', label: 'Архив', color: '#868e96' },
] as const
