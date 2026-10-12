import type { MetadataRoute } from 'next'

/**
 * Манифестът (`/manifest.webmanifest`) — иконата „EF" за Android и
 * „Добави към началния екран" (`task-favicon-i-wave-baterija.md`).
 * Иконите са в `public/`; favicon-ът, SVG-то и иконата за iPhone са до
 * този файл (`favicon.ico`, `icon.svg`, `apple-icon.png`) — Next ги слага
 * в `<head>` на всяка страница сам. Изходните файлове — `content/favicon/`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EcoFlow България',
    short_name: 'EcoFlow',
    start_url: '/',
    display: 'browser',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
