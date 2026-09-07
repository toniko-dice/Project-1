import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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

export default withPayload(nextConfig, { devBundleServerPackages: false })
