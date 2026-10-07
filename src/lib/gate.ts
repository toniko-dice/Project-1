import { jwtVerify } from 'jose'

/**
 * Заключен достъп (`task-zaklyuchen-dostap.md`) — правилата, без база.
 * Ползва ги `src/middleware.ts`; настройката идва от `/api/zaklyuchvane`.
 *
 * Входът е с потребителите на админа: валидна бисквитка `payload-token`
 * (JWT, подписан от Payload). Отделна парола няма.
 */

export const GATE_TAG = 'site-gate'
export const LOGIN_PATH = '/vhod'

/**
 * `SITE_GATE` в `.env`:
 * - `force-off` — отворено, каквото и да пише в админа (авариен ключ);
 * - `force-on` — заключването важи и при `npm run dev`;
 * - празно — на продукция решава отметката, при `next dev` е отворено.
 */
export type GateMode = 'off' | 'on' | 'setting'
export const gateMode = (): GateMode => {
  const v = process.env.SITE_GATE?.trim().toLowerCase()
  if (v === 'force-off') return 'off'
  if (v === 'force-on') return 'on'
  return process.env.NODE_ENV === 'production' ? 'setting' : 'off'
}

/** Отворени и при заключен сайт: входът, възстановяването на паролата, статичните файлове. */
const ОТВОРЕНИ = [
  /^\/vhod(\/.*)?$/,
  /^\/_next\/static\//,
  /^\/_next\/webpack-hmr/,
  /^\/favicon\.ico$/,
  /^\/api\/zaklyuchvane$/,
  // Каноничният адрес — пита го middleware-ът; казва само накъде води адрес.
  /^\/api\/kanon$/,
  /^\/api\/users\/(login|logout|forgot-password|reset-password|me|refresh-token)$/,
  /^\/admin\/forgot$/,
  /^\/admin\/reset\/[^/]+$/,
]
export const isOpenPath = (pathname: string) => ОТВОРЕНИ.some((r) => r.test(pathname))

/**
 * Ключът е същият, с който подписва Payload: първите 32 знака от SHA-256
 * на `PAYLOAD_SECRET` (`payload/dist/index.js`), като байтове.
 */
let ключ: Promise<Uint8Array> | null = null
const signingKey = () =>
  (ключ ??= (async () => {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(process.env.PAYLOAD_SECRET ?? ''))
    const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
    return new TextEncoder().encode(hex.slice(0, 32))
  })())

/** Валиден и неизтекъл вход (подписът и `exp` се проверяват от `jose`). */
export const isValidToken = async (token: string | undefined): Promise<boolean> => {
  if (!token || !process.env.PAYLOAD_SECRET) return false
  try {
    const { payload } = await jwtVerify(token, await signingKey(), { algorithms: ['HS256'] })
    return payload.collection === 'users'
  } catch {
    return false
  }
}

/** `next` след вход — само вътрешен адрес (`/…`, но не `//…` и не `/\…`). */
export const safeNext = (next: string | null | undefined): string => {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/'
  return next
}

/*
  Снимките през `/_next/image` при заключен сайт.

  Оптимизаторът на Next тегли `/api/media/file/…` ВЪТРЕШНО — заявка без
  заглавия и без бисквитката на посетителя — и заключването би я спряло
  (счупени снимки за влезлия). Затова, когато ВЛЯЗЪЛ потребител поиска
  `/_next/image`, middleware-ът добавя към адреса на снимката подпис
  `gk` (HMAC на пътя и деня с ключа от `PAYLOAD_SECRET`); вътрешното
  теглене с валиден подпис минава. Без вход подпис няма. Денят е в
  подписа, за да не се сменя адресът (и кешът на снимките) при всяка заявка.
*/
const ДЕН = 86_400_000
let hmacKey: Promise<CryptoKey> | null = null
const imageKey = () =>
  (hmacKey ??= crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`gate-image:${process.env.PAYLOAD_SECRET ?? ''}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  ))
const подпис = async (path: string, day: number) => {
  const sig = await crypto.subtle.sign('HMAC', await imageKey(), new TextEncoder().encode(`${path}|${day}`))
  return btoa(String.fromCharCode(...new Uint8Array(sig).slice(0, 18)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}
export const signImagePath = (path: string) => подпис(path, Math.floor(Date.now() / ДЕН))
export const isSignedImage = async (path: string, token: string | null) => {
  if (!token || !process.env.PAYLOAD_SECRET) return false
  const day = Math.floor(Date.now() / ДЕН)
  return token === (await подпис(path, day)) || token === (await подпис(path, day - 1))
}
