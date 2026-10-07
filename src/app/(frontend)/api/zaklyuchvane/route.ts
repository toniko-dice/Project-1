import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Дали сайтът е заключен — за middleware-а (`src/lib/gate.ts`).
 *
 * `GET /api/zaklyuchvane` → `{ locked: true | false }`. Middleware-ът го
 * кешира 10 s с тага `site-gate`; записът на „Общи настройки" го изчиства
 * веднага. Отговорът казва само „да/не" — затова пътят е отворен и при
 * заключен сайт.
 */
export const GET = async (): Promise<Response> => {
  const payload = await getPayload({ config })
  const s = (await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })) as {
    gate?: { locked?: boolean | null } | null
  }
  // Празна стойност (нов сървър, преди първия запис) значи заключено — по подразбиране.
  return Response.json({ locked: s.gate?.locked !== false }, { headers: { 'Cache-Control': 'no-store' } })
}
