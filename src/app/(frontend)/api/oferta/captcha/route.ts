import { newCaptcha } from '@/lib/quote/captcha'

/**
 * `GET /api/oferta/captcha` → нова картинка (SVG) и подписаният жетон към нея.
 * Отговорът не се кешира никъде — всяко искане е нов код.
 */
export const dynamic = 'force-dynamic'

export const GET = async (): Promise<Response> =>
  Response.json(newCaptcha(), { headers: { 'Cache-Control': 'no-store' } })
