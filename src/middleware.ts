import { NextResponse, type NextRequest } from 'next/server'

/**
 * Един адрес на страница — всичко останало е 301.
 *
 * 1. **Вид на адреса.** Наклонена черта накрая и главни букви → 301 към
 *    чистия адрес (`/kategorii/Kabeli/` → `/kategorii/kabeli`). Чертата се
 *    маха тук, а не от Next: неговото пренасочване е 308 и е изключено със
 *    `skipTrailingSlashRedirect` в `next.config.ts`.
 * 2. **По правило.** Разделите `/products/…` и `/categories/…` се смениха
 *    с `/kategorii/…`; разпознават се по началото на пътя, без заявка.
 * 3. **По каталога.** Записано пренасочване (смяна на категория или адрес),
 *    продукт под чужда категория, подсерия — `/api/kanon` знае каноничния
 *    адрес. Отговорът се кешира 5 минути с таговете на каталога.
 *
 * Плюс: адрес на категория С ПАРАМЕТРИ (филтри, раздел) получава
 * `X-Robots-Tag: noindex, follow`. Canonical сочи чистия адрес, но
 * комбинациите от филтри не бива да се индексират. Заглавие, а не
 * `<meta>`: страниците са статични и не виждат параметрите на сървъра.
 *
 * Middleware, а не `next.config`: каталогът се мени, докато сайтът върви,
 * а `redirects()` в конфигурацията се чете веднъж при старт.
 *
 * 301 навсякъде (до 2 октомври 2026 — 308). За търсачките двете са едно и
 * също; 301 е по-познатото и собственикът го поиска изрично.
 */

/** Пътищата, за които се пита каталогът — не за всяка снимка и скрипт. */
const ВЪЗМОЖНИ = ['/products/', '/categories/', '/kategorii/', '/power-stations']

export const config = {
  // Всичко без файловете (с разширение) и вътрешните на Next.
  matcher: ['/((?!_next/|.*\\.[A-Za-z0-9]+$).*)'],
}

const пренасочи = (request: NextRequest, path: string, search: string, status = 301) =>
  NextResponse.redirect(new URL(path + (path.includes('?') ? '' : search), request.url), status)

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const служебен = pathname.startsWith('/api/') || pathname === '/api' || pathname.startsWith('/admin')

  /* ── 1. Наклонена черта накрая ── */
  if (pathname.length > 1 && pathname.endsWith('/')) {
    const чист = pathname.replace(/\/+$/, '') || '/'
    // API-то с 308: 301 превръща POST в GET.
    return пренасочи(request, чист, search, служебен ? 308 : 301)
  }

  /* ── Главни букви (само латиница; %D0%B0 е кодирана кирилица и не се пипа) ── */
  if (!служебен) {
    const малки = pathname.replace(/%[0-9A-Fa-f]{2}|[A-Z]/g, (m) => (m.length === 3 ? m : m.toLowerCase()))
    if (малки !== pathname) return пренасочи(request, малки, search)
  }

  /*
    Адрес с един сегмент (`/biznes`) — също пита каталога: записано в
    „Пренасочвания" отива с 301. Отговорът се кешира по адрес (5 минути),
    затова страниците `/oferta-za-firmi`, `/rakovodstvo-…` питат веднъж.
  */
  const единСегмент = !служебен && /^\/[^/]+$/.test(pathname)
  if (!единСегмент && !ВЪЗМОЖНИ.some((p) => pathname === p || pathname.startsWith(p))) return NextResponse.next()

  /*
    Каталогът има предимство: той знае, че
    `/categories/domashni-baterii` вече е `/kategorii/powerocean`, а
    правилото по-долу би го пратило на несъществуваща страница.
  */
  const каноничен = await каноничнияАдрес(request, pathname)
  if (каноничен) return пренасочи(request, каноничен, search)

  if (pathname === '/power-stations') {
    return пренасочи(request, '/kategorii/portativni-elektrocentrali', search)
  }

  if (pathname.startsWith('/categories/')) {
    return пренасочи(request, pathname.replace('/categories/', '/kategorii/'), search)
  }

  /*
    Продуктът вече е под серията си. `/api/kanon` я знае — направо там,
    с един скок. Непознат продукт отива на `/kategorii/produkt/<slug>`,
    който казва 404 (или намира чернова, ако бъде публикувана).
  */
  if (pathname.startsWith('/products/')) {
    const slug = pathname.slice('/products/'.length)
    if (slug) {
      const резервен = `/kategorii/produkt/${slug}`
      return пренасочи(request, (await каноничнияАдрес(request, резервен)) ?? резервен, search)
    }
  }

  const response = NextResponse.next()
  if (search && pathname.startsWith('/kategorii/')) {
    response.headers.set('X-Robots-Tag', 'noindex, follow')
  }
  return response
}

/**
 * Каноничният адрес за пътя, ако е различен — от `/api/kanon`.
 *
 * Middleware върви в Edge, където базата не е достъпна. Отговорът се
 * кешира от Next между заявките, с таговете, които чистят куките при всеки
 * запис в админа (`src/lib/revalidate.ts`).
 */
const каноничнияАдрес = async (request: NextRequest, pathname: string): Promise<string | null> => {
  try {
    const url = new URL(`/api/kanon?path=${encodeURIComponent(pathname)}`, request.nextUrl.origin)
    const r = await fetch(url, {
      next: { revalidate: 300, tags: ['redirects', 'product', 'category'] },
    })
    if (!r.ok) return null
    const data = (await r.json()) as { to?: string | null }
    return data.to && data.to !== pathname ? data.to : null
  } catch {
    // Пренасочването е удобство; при проблем страницата продължава нормално.
    return null
  }
}
