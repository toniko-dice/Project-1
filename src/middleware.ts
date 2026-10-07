import { NextResponse, type NextRequest } from 'next/server'

import { GATE_TAG, gateMode, isOpenPath, isSignedImage, isValidToken, LOGIN_PATH, signImagePath } from '@/lib/gate'

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
 *
 * 0. **Заключен достъп** (`task-zaklyuchen-dostap.md`) — преди всичко
 *    друго: без валиден вход в админа сайтът, `/admin`, снимките и
 *    `sitemap.xml` водят към `/vhod`, а `/api/*` дава 401. Правилата са в
 *    `src/lib/gate.ts`.
 */

/** Пътищата, за които се пита каталогът — не за всяка снимка и скрипт. */
const ВЪЗМОЖНИ = ['/products/', '/categories/', '/kategorii/', '/power-stations']

export const config = {
  /*
    Всичко, освен статичните файлове на Next: заключването трябва да
    хване и снимките (`/api/media/file/…`), и `sitemap.xml`. Пренасочванията
    по-долу пак гледат само адреси без разширение.
  */
  matcher: ['/((?!_next/static/|_next/webpack-hmr|favicon\\.ico).*)'],
}

const пренасочи = (request: NextRequest, path: string, search: string, status = 301) =>
  NextResponse.redirect(new URL(path + (path.includes('?') ? '' : search), request.url), status)

const НЕ_ИНДЕКСИРАЙ = 'noindex, nofollow'

/**
 * Заключено ли е — от `/api/zaklyuchvane`, кеширано 10 s (таг `site-gate`,
 * изчиства го записът на „Общи настройки"). Грешка при четене на продукция
 * = заключено: по-добре временно затворен сайт, отколкото отворен по грешка.
 */
const заключен = async (request: NextRequest): Promise<boolean> => {
  const mode = gateMode()
  if (mode !== 'setting') return mode === 'on'
  try {
    const r = await fetch(new URL('/api/zaklyuchvane', request.nextUrl.origin), {
      next: { revalidate: 10, tags: [GATE_TAG] },
    })
    if (!r.ok) return true
    return ((await r.json()) as { locked?: boolean }).locked !== false
  } catch {
    return true
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  /*
    Вътрешните питания на самия middleware — без проверки, иначе питането
    за заключването минава пак оттук и се върти безкрайно, а `/api/kanon`
    (без бисквитка) би получил 401 и пренасочванията биха спрели.
  */
  if (pathname === '/api/zaklyuchvane' || pathname === '/api/kanon') return NextResponse.next()
  if (!(await заключен(request))) return пренасочвания(request)

  // robots.txt докато е заключено — нищо за обхождане.
  if (pathname === '/robots.txt') {
    return new NextResponse('User-agent: *\nDisallow: /\n', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': НЕ_ИНДЕКСИРАЙ },
    })
  }

  // Вътрешното теглене на снимка от `/_next/image` — с подписа, сложен по-долу.
  if (pathname.startsWith('/api/media/file/') && (await isSignedImage(pathname, request.nextUrl.searchParams.get('gk')))) {
    return NextResponse.next()
  }

  const влязъл = await isValidToken(request.cookies.get('payload-token')?.value)

  // Влязъл иска оптимизирана снимка от Медия — подписва адреса за вътрешното теглене.
  if (влязъл && pathname === '/_next/image') {
    const src = request.nextUrl.searchParams.get('url') ?? ''
    if (src.startsWith('/api/media/file/')) {
      const inner = new URL(src, request.url)
      inner.searchParams.set('gk', await signImagePath(inner.pathname))
      const url = request.nextUrl.clone()
      url.searchParams.set('url', inner.pathname + inner.search)
      const rewrite = NextResponse.rewrite(url)
      rewrite.headers.set('X-Robots-Tag', НЕ_ИНДЕКСИРАЙ)
      return rewrite
    }
  }

  if (!isOpenPath(pathname) && !влязъл) {
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Сайтът е заключен. Влезте с акаунта си за админа.' },
        { status: 401, headers: { 'X-Robots-Tag': НЕ_ИНДЕКСИРАЙ } },
      )
    }
    const url = new URL(LOGIN_PATH, request.url)
    url.search = ''
    url.searchParams.set('next', pathname + search)
    // Временно (307): адресът е същият, щом сайтът се отключи.
    const redirect = NextResponse.redirect(url, 307)
    redirect.headers.set('X-Robots-Tag', НЕ_ИНДЕКСИРАЙ)
    return redirect
  }

  const response = await пренасочвания(request)
  response.headers.set('X-Robots-Tag', НЕ_ИНДЕКСИРАЙ)
  return response
}

async function пренасочвания(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl
  // Файловете (снимки, sitemap.xml, robots.txt) и вътрешните на Next — без пренасочвания, както преди.
  if (pathname.startsWith('/_next/') || /\.[A-Za-z0-9]+$/.test(pathname)) return NextResponse.next()
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
