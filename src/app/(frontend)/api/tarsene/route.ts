import { productCardData } from '@/lib/media'
import { searchProducts } from '@/lib/payload'

/**
 * Падащият списък под лентата за търсене.
 *
 * `GET /api/tarsene?q=<текст>` → до шест продукта, готови за карта.
 *
 * Адресите се сглобяват тук, през `productCardData` → `productPath` —
 * същият помощник, който ползват картите в менюто и в категорията.
 * Клиентът получава готов адрес и не знае нищо за устройството на
 * категориите (виж CLAUDE.md, т. 19).
 *
 * Самото четене е кеширано за десет секунди с тага `product`
 * (`searchProducts`), затова тук няма втори кеш: бързото писане в полето
 * праща по една заявка на всеки 250 ms и те попадат в същия кеш.
 */

/** Колкото показва падащият списък. */
const DROPDOWN = 6

export const GET = async (request: Request): Promise<Response> => {
  const q = new URL(request.url).searchParams.get('q') ?? ''

  const found = await searchProducts(q)
  const results = found
    .slice(0, DROPDOWN)
    .map((product) => productCardData(product, {}, 'thumbnail'))

  return Response.json(
    { q, total: found.length, results },
    // Междинните кешове нямат работа тук — резултатът зависи от базата.
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
