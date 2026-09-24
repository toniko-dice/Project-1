import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/**
 * `robots.txt`.
 *
 * Затворени са админът и API-то — те нямат какво да дадат на търсачка, а
 * `/api/media/file/…` остава отворено, защото оттам идват снимките.
 *
 * `?sub=` не се забранява: canonical вече казва, че разделът е същата
 * страница, а забраната би попречила на Google да го прочете.
 *
 * Файлът стои в `src/app/`, а НЕ в групата `(frontend)`: в тази версия на
 * Next `robots.ts` се разпознава само в корена на `app`. Същото важи за
 * `sitemap.ts`, но там групата работи — затова двата файла са на различни
 * места. Проверено: в групата `/robots.txt` връща 404.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: new URL('/sitemap.xml', SITE_URL).toString(),
  }
}
