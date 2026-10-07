/**
 * CAPTCHA на формата за оферта — без външни услуги и без бисквитки.
 *
 * Картинката е SVG от `svg-captcha`. Отговорът НЕ се праща на браузъра:
 * браузърът получава подписан жетон (HMAC с `PAYLOAD_SECRET`) с номер,
 * време на издаване и отпечатък на отговора. Сървърът проверява подписа,
 * срока (10 минути), отговора (без значение главни/малки) и че жетонът не
 * е ползван. Ползваните се пазят в паметта на процеса до изтичането им.
 *
 * Жетонът носи и времето на издаване — от него е проверката „по-малко от
 * 3 секунди от зареждането до изпращането", без да се вярва на браузъра.
 *
 * Сървърен модул.
 */
import { createHmac, randomUUID, timingSafeEqual } from 'crypto'
import svgCaptcha from 'svg-captcha'

export const CAPTCHA_TTL_MS = 10 * 60 * 1000
/** По-бързо от това човек не попълва формата. */
export const MIN_FILL_MS = 3000

const secret = () => process.env.PAYLOAD_SECRET || 'dev-secret'
const sign = (s: string) => createHmac('sha256', secret()).update(s).digest('base64url')
const answerHash = (id: string, text: string) => sign(`${id}:${text.trim().toLowerCase()}`)

/*
  Ползваните жетони — на `globalThis`, защото в режим за разработка Next
  държи всеки път (route) в собствен модул и обикновена променлива би била
  отделна за картинката и за изпращането.
*/
const g = globalThis as unknown as { __quoteCaptchaUsed?: Map<string, number> }
const used = (g.__quoteCaptchaUsed ??= new Map())

const cleanUsed = (now: number) => {
  for (const [id, exp] of used) if (exp < now) used.delete(id)
}

/** Нова картинка и жетонът към нея. */
export const newCaptcha = (): { token: string; svg: string } => {
  const c = svgCaptcha.create({
    size: 6,
    // Без знаци, които се бъркат: 0/O/o, 1/l/I, 5/S…
    ignoreChars: '0oO1lIi5sS2zZuUvVwWcCkKpPxX9g',
    noise: 3,
    color: true,
    background: '#f5f5f5',
    width: 180,
    height: 56,
    fontSize: 52,
  })
  const id = randomUUID()
  const body = Buffer.from(JSON.stringify({ id, iat: Date.now(), h: answerHash(id, c.text) })).toString(
    'base64url',
  )
  return { token: `${body}.${sign(body)}`, svg: c.data }
}

export type CaptchaCheck = 'ok' | 'invalid' | 'expired' | 'used' | 'wrong' | 'too-fast'

/** Проверява и — при успех — изгаря жетона. */
export const checkCaptcha = (token: string, answer: string): CaptchaCheck => {
  const [body, sig] = token.split('.')
  if (!body || !sig) return 'invalid'
  const expected = Buffer.from(sign(body))
  const got = Buffer.from(sig)
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return 'invalid'

  let data: { id: string; iat: number; h: string }
  try {
    data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return 'invalid'
  }
  const now = Date.now()
  cleanUsed(now)
  if (now - data.iat > CAPTCHA_TTL_MS) return 'expired'
  if (used.has(data.id)) return 'used'
  if (now - data.iat < MIN_FILL_MS) return 'too-fast'
  // Всеки опит изгаря жетона — грешен отговор иска нов код.
  used.set(data.id, data.iat + CAPTCHA_TTL_MS)
  return answerHash(data.id, answer) === data.h ? 'ok' : 'wrong'
}
