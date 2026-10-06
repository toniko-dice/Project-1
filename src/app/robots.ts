import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@/lib/site-url'

/**
 * `robots.txt`.
 *
 * Затворени са админът и API-то — те нямат какво да дадат на търсачка.
 * `/api/media/` е ИЗРИЧНО отворено (`Allow` преди `Disallow`): оттам идват
 * всички снимки, а до 6 октомври 2026 `Disallow: /api/` спираше и тях —
 * Google не виждаше нито една снимка на сайта.
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
    rules: [{ userAgent: '*', allow: ['/', '/api/media/'], disallow: ['/admin', '/api/'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
