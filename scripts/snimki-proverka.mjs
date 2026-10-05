/**
 * Проверка, че нито една снимка на сайта не е 404 или празна
 * (`task-snimki-imena.md`, т. 5).
 *
 *   npm run snimki:proverka            срещу http://localhost:3000
 *   SITE=http://localhost:3100 npm run snimki:proverka
 *
 * Обхожда началната и всички адреси от sitemap.xml и събира от HTML-а:
 * `<img src/srcset>`, `<source srcset>`, `og:image`, `image` в JSON-LD,
 * CSS `url(…)` и `<image:loc>` от картата на сайта. Всяка снимка се
 * тегли веднъж (GET) — трябва 200 и непразно тяло.
 *
 * `/_next/image?url=…` се свежда до файла в Медия плюс ЕДИН вариант на
 * преобразувателя за файл — иначе всяка ширина от srcset (до 16) би
 * пуснала прекодиране и проверката би натоварила сървъра за нищо.
 */
const SITE = (process.env.SITE || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

const декодирай = (s) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'")

const наСайта = (u) => {
  try {
    const url = new URL(декодирай(u), SITE + '/')
    // Адресите в sitemap/OG са с адреса на сайта от настройката — проверява се локалният.
    return SITE + url.pathname + url.search
  } catch {
    return null
  }
}

const поПартиди = async (задачи, n = 4) => {
  let i = 0
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < задачи.length) await задачи[i++]()
    }),
  )
}

const sitemap = await (await fetch(`${SITE}/sitemap.xml`)).text()
const страници = ['/', ...[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])]
  .map(наСайта)
  .filter(Boolean)
const уникални = [...new Set(страници)]

/** снимка → първата страница, на която е видяна */
const снимки = new Map()
const добави = (u, страница) => {
  if (!u || u.startsWith('data:')) return
  const a = наСайта(u.trim())
  if (a && !снимки.has(a)) снимки.set(a, страница)
}
for (const m of sitemap.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)) добави(m[1], '/sitemap.xml')

const грешки = []
await поПартиди(
  уникални.map((страница) => async () => {
    // Dev сървърът понякога връща 500 при паралелни заявки (кешът се пише,
    // докато се чете) — един повторен опит след секунда.
    let r = await fetch(страница)
    if (r.status >= 500) {
      await new Promise((ок) => setTimeout(ок, 1000))
      r = await fetch(страница)
    }
    if (!r.ok) {
      грешки.push(`${страница}: страницата връща ${r.status}`)
      return
    }
    const html = await r.text()
    const път = new URL(страница).pathname
    for (const m of html.matchAll(/<(?:img|source)\b[^>]*>/g)) {
      const таг = m[0]
      const src = таг.match(/\ssrc="([^"]+)"/)?.[1]
      if (src) добави(src, път)
      const srcset = таг.match(/\s(?:srcset|srcSet)="([^"]+)"/)?.[1]
      for (const част of srcset ? декодирай(srcset).split(',') : []) добави(част.trim().split(/\s+/)[0], път)
    }
    for (const m of html.matchAll(/<link\b[^>]*imagesrcset="([^"]+)"[^>]*>/g)) {
      for (const част of декодирай(m[1]).split(',')) добави(част.trim().split(/\s+/)[0], път)
    }
    for (const m of html.matchAll(/<meta\b[^>]*(?:property|name)="(?:og:image|twitter:image)"[^>]*content="([^"]+)"/g)) {
      добави(m[1], път)
    }
    for (const m of html.matchAll(/url\((?:&quot;|["'])?([^"')&]+)(?:&quot;|["'])?\)/g)) {
      if (/\.(jpe?g|png|webp|avif|gif|svg)|\/api\/media\//i.test(m[1])) добави(m[1], път)
    }
    for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
      const обходи = (x) => {
        if (Array.isArray(x)) return x.forEach(обходи)
        if (!x || typeof x !== 'object') return
        for (const [k, v] of Object.entries(x)) {
          if (k === 'image' || k === 'logo') {
            for (const и of Array.isArray(v) ? v : [v]) добави(typeof и === 'string' ? и : и?.url, път)
          } else обходи(v)
        }
      }
      try {
        обходи(JSON.parse(m[1]))
      } catch {
        грешки.push(`${път}: JSON-LD не се чете`)
      }
    }
  }),
)

/* /_next/image → файлът в Медия + един вариант на преобразувателя за файл */
const заПроверка = new Map()
const видяниИзточници = new Set()
for (const [u, страница] of снимки) {
  const url = new URL(u)
  if (url.pathname === '/_next/image') {
    const източник = url.searchParams.get('url')
    if (източник) {
      const a = наСайта(източник)
      if (a && !заПроверка.has(a)) заПроверка.set(a, страница)
      if (!видяниИзточници.has(източник)) {
        видяниИзточници.add(източник)
        заПроверка.set(u, страница)
      }
    }
    continue
  }
  if (!заПроверка.has(u)) заПроверка.set(u, страница)
}

let добри = 0
await поПартиди(
  [...заПроверка].map(([u, страница]) => async () => {
    try {
      const r = await fetch(u, { headers: { Accept: 'image/avif,image/webp,*/*' } })
      const тяло = Buffer.from(await r.arrayBuffer())
      if (r.status !== 200) грешки.push(`${r.status}  ${u}  (на ${страница})`)
      else if (!тяло.length) грешки.push(`празна  ${u}  (на ${страница})`)
      else добри += 1
    } catch (e) {
      грешки.push(`грешка ${e.message}  ${u}  (на ${страница})`)
    }
  }),
)

console.log(`\nПРОВЕРКА НА СНИМКИТЕ — ${SITE}`)
console.log(`Страници: ${уникални.length}`)
console.log(`Снимки: ${заПроверка.size} проверени (${видяниИзточници.size} през /_next/image), ${добри} наред`)
console.log(`Грешки: ${грешки.length}`)
for (const г of грешки) console.log(`  ✗ ${г}`)
process.exit(грешки.length ? 1 : 0)
