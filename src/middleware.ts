import { NextResponse, type NextRequest } from 'next/server'

/**
 * Старите адреси водят към новите — 308, постоянно.
 *
 * Два вида:
 *
 * 1. **По правило.** Целите раздели `/products/…` и `/categories/…` се
 *    смениха с `/kategorii/…`. Тези се разпознават по началото на пътя и
 *    се пращат на `/kategorii/…`, без заявка към базата.
 * 2. **По запис.** Смяна на категория или на адрес на продукт сменя
 *    адреса му. Тогава куките в `src/lib/revalidate.ts` записват реда в
 *    колекция „Пренасочвания" и той се търси тук.
 *
 * Middleware, а не `next.config`: списъкът от базата се мени, докато
 * сайтът върви, а `redirects()` в конфигурацията се чете веднъж при старт.
 *
 * Проверката минава само през пътищата, които могат да са стари — всичко
 * останало излиза веднага, без работа.
 */

/** Търси се запис само за тези начала — не за всяка снимка и скрипт. */
const ВЪЗМОЖНИ = ['/products/', '/categories/', '/kategorii/', '/power-stations']

export const config = {
  matcher: ['/products/:path*', '/categories/:path*', '/kategorii/:path*', '/power-stations'],
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (!ВЪЗМОЖНИ.some((p) => pathname === p || pathname.startsWith(p))) return NextResponse.next()

  /*
    Записаните пренасочвания имат предимство: те знаят, че
    `/categories/domashni-baterii` вече е `/kategorii/powerocean`, а
    правилото по-долу би го пратило на несъществуваща страница.
  */
  const записано = await запис(request, pathname)
  if (записано) return NextResponse.redirect(new URL(записано + search, request.url), 308)

  if (pathname === '/power-stations') {
    return NextResponse.redirect(
      new URL('/kategorii/portativni-elektrocentrali' + search, request.url),
      308,
    )
  }

  if (pathname.startsWith('/categories/')) {
    return NextResponse.redirect(
      new URL(pathname.replace('/categories/', '/kategorii/') + search, request.url),
      308,
    )
  }

  /*
    Продуктът вече е под серията си и тя не се знае тук. Самата страница
    `/kategorii/produkt/<slug>` намира продукта по адрес и пренасочва към
    правилния — един скок повече, но без заявка към базата в middleware.
  */
  if (pathname.startsWith('/products/')) {
    const slug = pathname.slice('/products/'.length).replace(/\/$/, '')
    if (slug) {
      return NextResponse.redirect(new URL(`/kategorii/produkt/${slug}${search}`, request.url), 308)
    }
  }

  return NextResponse.next()
}

/**
 * Записаното пренасочване за този път, ако има такова.
 *
 * Чете се през REST API-то на Payload, защото middleware върви в Edge
 * средата, където базата не е достъпна. Заявката е по индексирано поле и
 * се кешира от Next между заявките.
 */
const запис = async (request: NextRequest, pathname: string): Promise<string | null> => {
  try {
    const url = new URL(
      `/api/redirects?where[from][equals]=${encodeURIComponent(pathname)}&limit=1&depth=0`,
      request.nextUrl.origin,
    )
    const r = await fetch(url, { next: { revalidate: 300, tags: ['redirects'] } })
    if (!r.ok) return null

    const data = (await r.json()) as { docs?: { to?: string }[] }
    const to = data.docs?.[0]?.to
    return to && to !== pathname ? to : null
  } catch {
    // Пренасочването е удобство; при проблем страницата продължава нормално.
    return null
  }
}
