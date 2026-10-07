import { buildNavItems } from '@/lib/menu'
import type { MenuSection } from '@/components/HeaderNav'
import { getGlobal } from '@/lib/payload'

/**
 * Картите на мега менюто — `GET /api/menyu` → `{ "<ключ на подточката>": секции }`.
 *
 * Не са в HTML-а на страниците (`task-mobilna-optimizaciya.md`, т. 1):
 * там бяха ~77 KB на всяка страница, а трябват само на компютър, когато се
 * отвори менюто. `HeaderNav` ги тегли веднъж, след като страницата е готова.
 *
 * Четенията вътре са кеширани с таговете (`src/lib/payload.ts`) и изтичат
 * при всеки запис в админа — затова тук няма втори кеш: менюто е винаги
 * същото като в админа, както преди.
 */
export const GET = async (): Promise<Response> => {
  const items = await buildNavItems(await getGlobal('header'))
  const sections: Record<string, MenuSection[]> = {}
  for (const item of items) {
    for (const group of item.groups) {
      for (const entry of group.entries) sections[entry.key] = entry.sections
    }
  }
  return Response.json(sections, { headers: { 'Cache-Control': 'no-store' } })
}
