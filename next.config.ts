import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'

import { isLocalSiteUrl } from './src/lib/site-url'

const nextConfig: NextConfig = {
  /*
    Наклонената черта накрая се маха в `src/middleware.ts` с 301. Собственото
    пренасочване на Next е 308 и стига преди middleware-а — затова е
    изключено тук.
  */
  skipTrailingSlashRedirect: true,
  /*
    `svg-captcha` чете шрифта си по път до файла в собствената си папка
    (`__dirname`) — пакетиран от Turbopack, пътят не съществува.
  */
  serverExternalPackages: ['svg-captcha', '@react-pdf/renderer'],
  images: {
    formats: ['image/avif', 'image/webp'],

    /*
      Адресите от Медия носят параметър `?v=<време на промяна>`, за да се
      сменят при презаписване или изрязване на снимка (виж `src/lib/media.ts`).

      Без тази настройка Next отхвърля локални адреси с параметър.

      ВНИМАНИЕ: `search` тук се пропуска нарочно. Payload проверява
      `pattern.search !== url.search`, тоест `search: ''` би изисквало
      адресът да е БЕЗ параметър — точно обратното на нужното. Липсващият
      `search` разрешава всякакви параметри.

      Вторият ред запазва поведението по подразбиране за всичко останало:
      локални снимки без параметър.
    */
    localPatterns: [{ pathname: '/api/media/**' }, { pathname: '/**', search: '' }],
  },
}

/*
  Билд за продукция без истински адрес на сайта би записал localhost в
  robots.txt, sitemap, canonical, og:url и JSON-LD — Google щеше да
  индексира адреси, които не съществуват. Затова билдът спира.

  `npm run build:local` (ALLOW_LOCAL_SITE_URL=1) е САМО за проверка на
  локалната машина — никога за качване на сървъра.
*/
const провериАдреса = () => {
  const url = process.env.NEXT_PUBLIC_SITE_URL
  if (!isLocalSiteUrl(url) || process.env.ALLOW_LOCAL_SITE_URL === '1') return
  throw new Error(
    `NEXT_PUBLIC_SITE_URL е ${url ? `„${url}"` : 'празен'} — за продукция трябва истинският адрес ` +
      '(напр. https://bg-ecoflow.com). Задайте го в .env. За проверка на локалната машина: npm run build:local.',
  )
}

const config = (phase: string) => {
  if (phase === PHASE_PRODUCTION_BUILD) провериАдреса()
  return withPayload(nextConfig, { devBundleServerPackages: false })
}

export default config
