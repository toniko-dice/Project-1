/**
 * Адресът на сайта — ЕДНА настройка за всеки пълен адрес: robots.txt,
 * sitemap, canonical, `og:url`, `og:image`, JSON-LD, хлебните трохи.
 *
 * Идва от `NEXT_PUBLIC_SITE_URL`. Преди всяко от седемте места го четеше
 * само и пазеше свой резервен `http://localhost:3000` — и точно той
 * излизаше в картата на сайта и в canonical. В продукция билдът спира, ако
 * адресът липсва или е localhost (`next.config.ts`).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')

/** Пълен адрес от път (`/kategorii/…`) или вече пълен адрес — непроменен. */
export const absoluteUrl = (path: string): string => new URL(path, `${SITE_URL}/`).toString()

/** Адресът е localhost / 127.0.0.1 — не става за продукция. */
export const isLocalSiteUrl = (url: string | undefined): boolean => {
  if (!url) return true
  try {
    const host = new URL(url).hostname
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host.endsWith('.localhost')
  } catch {
    return true
  }
}
