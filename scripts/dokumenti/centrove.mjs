/**
 * task-dokumenti-lipsvashti.md — пълните списъци на центровете за сваляне на EcoFlow
 * (www.ecoflow.com/<регион>/support/download/index) → content/dokumenti/centrove.json.
 *
 *   node scripts/dokumenti/centrove.mjs [регион …]      (по подразбиране: eu us uk ca au)
 *
 * API-то (api-a.ecoflow.com/…/downloadInfo/v2) връща празно без заглавките на сайта —
 * затова страницата се отваря в Chrome (playwright-core), първата заявка на страницата
 * се хваща и се повтаря със същите заглавки за всички страници (size=100, type 1–3).
 * Глобалният адрес (/support/download/index) пренасочва към eu. Регион без хваната
 * заявка се пробва до 3 пъти. Записите — по адрес на файла, с регионите, където са.
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright-core'

const REGIONI = process.argv.slice(2).length ? process.argv.slice(2) : ['eu', 'us', 'uk', 'ca', 'au']
const OUT = path.join(import.meta.dirname, '..', '..', 'content', 'dokumenti', 'centrove.json')
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'

const browser = await chromium.launch({ executablePath: CHROME, headless: true })

async function region(reg) {
  const ctx = await browser.newContext()
  const p = await ctx.newPage()
  let api = null
  p.on('request', (r) => {
    if (!api && r.url().includes('downloadInfo/v2')) api = { url: r.url(), headers: r.headers() }
  })
  try {
    await p.goto(`https://www.ecoflow.com/${reg}/support/download/index`, { waitUntil: 'networkidle', timeout: 90_000 }).catch(() => {})
    if (!api) return null
    const zapisi = []
    for (const type of [1, 2, 3]) {
      for (let page = 1; page < 60; page++) {
        const u = api.url
          .replace(/([?&])page=\d+/, `$1page=${page}`)
          .replace(/([?&])size=\d+/, '$1size=100')
          .replace(/([?&])type=\d+/, `$1type=${type}`)
        const j = await (await p.request.get(u, { headers: api.headers })).json().catch(() => null)
        const c = j?.data?.content || []
        zapisi.push(...c)
        if (c.length < 100) break
      }
    }
    return zapisi
  } finally {
    await ctx.close()
  }
}

const po_adres = new Map()
for (const reg of REGIONI) {
  let z = null
  for (let opit = 1; opit <= 3 && !z; opit++) z = await region(reg)
  if (!z) {
    console.log(`✗ ${reg}: страницата не направи заявка към списъка`)
    continue
  }
  console.log(`✓ ${reg}: ${z.length} записа`)
  for (const x of z) {
    const adres = (x.fileUrl || '').trim()
    const k = adres || x.title.trim()
    const e = po_adres.get(k) || { zaglavie: x.title.trim(), adres, vid: x.classify, ezik: x.lang, data: (x.updateTime || '').slice(0, 10), regioni: [] }
    if (!e.regioni.includes(reg)) e.regioni.push(reg)
    po_adres.set(k, e)
  }
}
await browser.close()
const vsichki = [...po_adres.values()].sort((a, b) => a.zaglavie.localeCompare(b.zaglavie))
writeFileSync(OUT, JSON.stringify({ sabrano: new Date().toISOString().slice(0, 10), regioni: REGIONI, zapisi: vsichki }, null, 1) + '\n')
console.log(`${vsichki.length} уникални → ${path.relative(process.cwd(), OUT)}`)
