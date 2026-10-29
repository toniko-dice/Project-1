/**
 * Етап 2 на `task-dokumenti.md` — официалните ръководства на EcoFlow на български
 * (manuals.ecoflow.com/eu/product/<slug>?lang=bg_BG) → PDF.
 *
 *   node scripts/dokumenti/bg-pdf.mjs [<папка за документите>] [slug …]
 *
 * С инсталирания Chrome (playwright-core, без свален браузър; CHROME_PATH за друг път).
 * Преди печат: проверка, че страницата е останала на bg_BG и е на кирилица; превъртане
 * до края (ленивите снимки), отваряне на сгънатото, скриване на менюто, страничното
 * съдържание, бисквитките и чата; най-горе — бележка с източника и датата.
 * A4, полета 12 мм. → <папка>/bg-oficialni/<slug>.pdf; повторно пускане презаписва.
 */
import { mkdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright-core'

const SLUGS = [
  'delta-3', 'delta-3-plus', 'delta-3-classic', 'delta-3-max', 'delta-3-max-plus',
  'delta-3-max-plus-smart-extra-battery', 'delta-3-ultra-plus', 'river-3-plus', 'river-3-plus-smart-extra-battery',
  'stream-pro-and-ultra', 'stream-ultra-x', 'stream-ac-pro', 'stream-max', 'stream-ac', 'wave-3',
  'alternator-charger-600', 'alternator-charger-plus-1000', 'single-axis-solar-tracker-2',
  '175w-rigid-solar-panel', '130w-rvmax-rigid-solar-panel', '400w-lightweight-solar-panel',
  '220w-lightweight-solar-panel', '160w-lightweight-solar-panel', '250w-rigid-solar-panel',
  '110w-lightweight-solar-panel', 'solar-panel-28w',
]
const [, , outArg, ...only] = process.argv
const OUT = path.join(outArg || path.join(import.meta.dirname, '..', '..', 'content', 'dokumenti'), 'bg-oficialni')
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
const DATA = new Date().toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric' }) // „29.10.2026 г.“

mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1200, height: 1600 }, locale: 'bg-BG' })
const greshki = []

for (const slug of only.length ? only : SLUGS) {
  const page = await ctx.newPage()
  try {
    const url = `https://manuals.ecoflow.com/eu/product/${slug}?lang=bg_BG`
    await page.goto(url, { waitUntil: 'networkidle', timeout: 90_000 })
    if (!page.url().includes('lang=bg_BG')) throw new Error(`пренасочено към ${page.url()} — няма български`)
    const кирилица = await page.evaluate(() => (document.body.innerText.match(/[а-яА-Я]/g) || []).length)
    if (кирилица < 2000) throw new Error(`само ${кирилица} кирилски букви`)

    // Ленивите снимки: превъртане до края на стъпки, после изчакване всички да се заредят.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 120))
      }
      window.scrollTo(0, 0)
    })
    await page.evaluate(async () => {
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager'))
      document.querySelectorAll('details').forEach((d) => (d.open = true))
      document.querySelectorAll('[aria-expanded="false"]').forEach((e) => e.click())
      await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 15000) }))))
    })
    await page.addStyleTag({
      content: `
        [class*="Header_"], [class*="Outline_content__"], [class*="Outline_fixMenu"], [class*="index_tablet_menu"],
        [id*="cmp"], [class*="cmp"], iframe, [class*="chat" i], [class*="cookie" i], [class*="BackTop"], [class*="backTop"],
        .ef-skrij { display: none !important; }
        html, body { background: #fff !important; }
        [class*="Layout_content"], [class*="Layout_Layout"], [class*="Outline_outline__"], main { width: 100% !important; max-width: none !important; margin: 0 !important; }
        [class*="Outline_outline__"] { padding: 0 !important; }
        img { max-width: 100% !important; height: auto !important; break-inside: avoid; }
        h1, h2, h3 { break-after: avoid; }
        .ef-izvor { font: 12px/1.45 Arial, sans-serif; color: #333; border: 1px solid #ccc; background: #f2f2f2; padding: 8px 12px; margin: 0 0 14px; }`,
    })
    await page.evaluate(({ url, data }) => {
      // Отстъпът за страничното меню (padding-left ~374px) — махнат; навигацията с иконите
      // (ЧЗВ, Приложение, Политика, Общност) — скрита; съдържанието — на цялата ширина.
      const колона = document.querySelector('[class*="Outline_outline__"]')
      for (let e = колона?.parentElement; e && e !== document.body; e = e.parentElement) {
        if (parseFloat(getComputedStyle(e).paddingLeft) > 100) e.style.setProperty('padding-left', '0', 'important')
      }
      document.querySelectorAll('.gridIcon').forEach((g) => { if (/ЧЗВ/.test(g.innerText)) g.classList.add('ef-skrij') })
      const d = document.createElement('div')
      d.className = 'ef-izvor'
      d.textContent = `Официално ръководство на EcoFlow на български език. Източник: ${url.replace('https://', '')}, свалено на ${data}`
      ;(document.querySelector('[class*="Layout_content"]') || document.body).prepend(d)
    }, { url, data: DATA })
    const file = path.join(OUT, `${slug}.pdf`)
    await page.pdf({ path: file, format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' } })
    console.log(`✓ ${slug} — ${кирилица} кирилски букви, ${Math.round(statSync(file).size / 1024)} KB`)
  } catch (e) {
    greshki.push(`${slug}: ${e.message}`)
    console.log(`✗ ${slug}: ${e.message}`)
  } finally {
    await page.close()
  }
}
await browser.close()
console.log(`готово, грешки: ${greshki.length}`)
greshki.forEach((g) => console.log('  ', g))
