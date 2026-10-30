/**
 * Етап 5 на `task-dokumenti.md` — преводите: проверка и български PDF.
 *
 *   node scripts/dokumenti/prevod-pdf.mjs [<папка с документите>] [id …] [--samo-proverka]
 *
 * За всеки id от `content/dokumenti/prevodi/spisak.json`, за който има превод
 * (`content/dokumenti/prevodi/<id>.md`; без id — всички такива):
 *  1. проверка (формат — `content/dokumenti/prevodi/FORMAT.md`) срещу
 *     `<папка>/prevodi-en/<id>.en.md` и `<папка>/izvlecheni/<id>.txt`:
 *     числата, броят на предупрежденията, останал английски, покритието;
 *     фигурите (`figuri.py proveri`): същите в двата файла, всяка фигура на оригинала
 *     е в превода (или изрично изключена) — изрязват се в `<папка>/figuri/<id>/`;
 *  2. само ако мине — PDF по `scripts/dokumenti/shablon.html` с инсталирания Chrome
 *     (playwright-core) → `<папка>/<bg_fail>`; после PDF-ът се чете обратно
 *     (`pdftotext`): отваря се, има кирилица, няма счупени знаци;
 *  3. `<папка>/prevodi-gotovi.json` — готовите (за вноса, `src/import-dokumenti.ts`).
 * Изход с код 1, ако някой не мине (той не влиза в prevodi-gotovi.json).
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { marked } from 'marked'
import { chromium } from 'playwright-core'

const ROOT = path.join(import.meta.dirname, '..', '..')
// Без зачертаване: „~" в спецификациите (120V~20A … 220V~16A) не е Markdown.
marked.use({ tokenizer: { del: () => undefined } })
const args = process.argv.slice(2)
const САМО_ПРОВЕРКА = args.includes('--samo-proverka')
const поз = args.filter((a) => !a.startsWith('--'))
const BASE = поз[0] && !/^[a-z0-9-]+$/.test(поз[0]) ? поз.shift() : path.join(ROOT, 'content', 'dokumenti')
// Преводите и английският текст — може от worktree (PREVODI_DIR, PREVODI_EN_DIR); PDF-ите — в BASE.
const PREVODI = process.env.PREVODI_DIR || path.join(ROOT, 'content', 'dokumenti', 'prevodi')
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
const spisak = JSON.parse(readFileSync(path.join(PREVODI, 'spisak.json'), 'utf8'))
const задачи = (поз.length ? поз.map((id) => spisak.find((x) => x.id === id) ?? стоп(`няма „${id}" в spisak.json`)) : spisak)
  .filter((x) => existsSync(path.join(PREVODI, `${x.id}.md`)))
function стоп(m) { console.error(m); process.exit(1) }

const ВИД_BG = {
  'Ръководство за потребителя': 'Ръководство за потребителя',
  'Кратко ръководство (Quick Start)': 'Кратко ръководство',
  'Инструкции за безопасност': 'Инструкции за безопасност',
  'Ръководство за монтаж': 'Ръководство за монтаж',
  Друго: 'Документ',
}
// „Друго" — по заглавието (същото като в src/import-dokumenti.ts).
const видBg = (vid, заглавие) =>
  vid === 'Друго' && /What's in the Box/i.test(заглавие) ? 'Съдържание на опаковката'
    : vid === 'Друго' && /App User Manual/i.test(заглавие) ? 'Ръководство за приложението'
      : (ВИД_BG[vid] ?? 'Документ')
const БЛОКОВЕ = { danger: 'ОПАСНОСТ', warning: 'ПРЕДУПРЕЖДЕНИЕ', caution: 'ВНИМАНИЕ', note: 'ЗАБЕЛЕЖКА', tip: 'СЪВЕТ' }

// Името — същото като в src/import-dokumenti.ts (име / общоИме): заглавието на превода = на оригинала.
const име = (t) =>
  t
    .replace(/\.pdf$/i, '')
    .replace(/[_\s-]+(User Manual|User manual|Quick Start Guide|QSG|Safety Instructions?|Installation Guide|What's in the Box|Handleiding|Руководство пользователя)(?=$|[^A-Za-z]).*$/i, '')
    .replace(/\s*\((EN|RU|NL)\)\s*$/, '')
    .replace(/\bEcoFLow\b/g, 'EcoFlow')
    .replace(/_/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
const общоИме = (заглавия) => {
  const имена = [...new Set(заглавия.map(име))]
  if (имена.length < 2) return имена[0] ?? ''
  const думи = имена.map((n) => n.split(' '))
  const еднакви = (k) => думи.every((d) => k(d) === k(думи[0]))
  let нач = 0
  while (нач < думи[0].length && еднакви((d) => d[нач])) нач++
  let край = 0
  while (край < думи[0].length - нач && еднакви((d) => d[d.length - 1 - край])) край++
  const среди = думи.map((d) => d.slice(нач, d.length - край).join(' '))
  if (среди.some((x) => !x)) return имена.join(' / ')
  return [...думи[0].slice(0, нач), среди.join('/'), ...думи[0].slice(думи[0].length - край)].join(' ')
}

// ── Проверката ──────────────────────────────────────────────────────────────
const EN_ДУМИ = new Set('the and to of is with not for this that be or are your by from when use do if before can will it as on in please'.split(' '))
const ДРУГИ = [
  'und der die das nicht mit ist sie für von zu den des ein eine bei dem oder wenn auf werden sich',
  'le la les et des du une un pas est pour dans que vous ne avec sur ce au produit lorsque',
  'il di che non per con una della del sono gli da prodotto quando questo',
  'el los las y que no por con una para se su es producto cuando este',
  'de het een en van niet met voor op dat te bij u wordt als',
].map((s) => new Set(s.split(' ')))
const думи = (t) => t.toLowerCase().match(/[a-zà-ÿäöüß']+/g) ?? []
const еАнглийско = (t) => {
  const w = думи(t)
  if (w.length < 6) return false
  const en = w.filter((x) => EN_ДУМИ.has(x)).length
  return en >= 2 && ДРУГИ.every((s) => w.filter((x) => s.has(x)).length < en)
}
// NFKC: лигатурите в PDF-ите („ﬁ") → „fi".
const норм = (t) => t.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const шингли = (t, n = 4) => {
  const w = норм(t).split(' ').filter(Boolean)
  const s = new Set()
  for (let i = 0; i + n <= w.length; i++) s.add(w.slice(i, i + n).join(' '))
  return s
}
const числа = (t) => new Set(t.replace(/^:::figure .*$/gm, '').match(/\d+(?:[.,]\d+)*/g) ?? [])
const блокове = (t) => {
  const c = {}
  for (const m of t.matchAll(/^:::(\w+)\s*$/gm)) c[m[1]] = (c[m[1]] ?? 0) + 1
  return c
}
// Без кода, редовете на блоковете, адресите и мерните единици след число („59.1 in“ — инчове, не английско „in“).
const безБлоковеИКод = (t) =>
  t.replace(/`[^`]*`/g, '').replace(/^:::\w*\s*$/gm, '').replace(/https?:\/\/\S+/g, '').replace(/(\d)\s?(in|ft|lbs?|oz)\b\.?/gi, '$1')

function провери(x) {
  const грешки = []
  const bgF = path.join(PREVODI, `${x.id}.md`)
  const enF = path.join(process.env.PREVODI_EN_DIR || path.join(BASE, 'prevodi-en'), `${x.id}.en.md`)
  const izF = path.join(BASE, 'izvlecheni', `${x.id}.txt`)
  if (!existsSync(enF)) return [`няма ${path.relative(BASE, enF)}`]
  const bg = readFileSync(bgF, 'utf8')
  const en = readFileSync(enF, 'utf8')
  // 1. Числата.
  const чбг = числа(bg)
  const липсват = [...числа(en)].filter((n) => !чбг.has(n))
  if (липсват.length) грешки.push(`числа от оригинала липсват в превода: ${липсват.slice(0, 20).join(', ')}${липсват.length > 20 ? ' …' : ''}`)
  // 2. Предупрежденията.
  const бе = блокове(en)
  const бб = блокове(bg)
  for (const k of new Set([...Object.keys(бе), ...Object.keys(бб)])) {
    if (!(k in БЛОКОВЕ)) грешки.push(`непознат блок „:::${k}"`)
    else if ((бе[k] ?? 0) !== (бб[k] ?? 0)) грешки.push(`блокове „${k}": оригинал ${бе[k] ?? 0}, превод ${бб[k] ?? 0}`)
  }
  if ((bg.match(/^:::/gm) ?? []).length % 2) грешки.push('незатворен блок „:::"')
  // 3. Английски в превода (изречение с ≥2 честа английска дума).
  const англ = безБлоковеИКод(bg)
    .split(/(?<=[.!?:;])\s+|\n+/)
    .filter((s) => думи(s).filter((w) => EN_ДУМИ.has(w)).length >= 2)
  if (англ.length) грешки.push(`английски текст в превода (${англ.length}): ${англ.slice(0, 3).map((s) => `„${s.trim().slice(0, 80)}"`).join('; ')}`)
  // 4. Покритието: английските изречения от извлечения текст — в .en.md (по 4 думи).
  if (existsSync(izF)) {
    const enШ = шингли(en)
    const изр = readFileSync(izF, 'utf8')
      .replace(/^=== стр\. \d+ ===$/gm, '')
      .split(/(?<=[.!?])\s+|\n\s*\n/)
      .filter(еАнглийско)
    const непокрити = изр.filter((s) => {
      const ш = [...шингли(s)]
      return ш.length && ш.filter((q) => enШ.has(q)).length / ш.length < 0.7
    })
    const покритие = изр.length ? 1 - непокрити.length / изр.length : 1
    // Едно непокрито изречение се допуска (плакатите: 15 езика, слети в един „абзац").
    if (покритие < 0.9 && непокрити.length > 1) грешки.push(`.en.md покрива ${Math.round(покритие * 100)}% от английските изречения (${изр.length}); липсват напр.: ${непокрити.slice(0, 3).map((s) => `„${s.trim().replace(/\s+/g, ' ').slice(0, 80)}"`).join('; ')}`)
  }
  // 5. Фигурите — броят и областите им съвпадат с оригинала; изрязват се.
  // Скритите (документи за продукти, които ги няма) — засега с препратки към оригинала.
  if (x.skrit) return грешки
  const ф = spawnSync('python', [path.join(import.meta.dirname, 'figuri.py'), 'proveri', x.id, bgF, enF, '--papka', BASE], { encoding: 'utf8' })
  let фиг
  try { фиг = JSON.parse(ф.stdout.trim().split('\n').pop()) } catch { грешки.push(`figuri.py: ${(ф.stderr || ф.stdout).trim().slice(-300)}`) }
  if (фиг) {
    грешки.push(...фиг.problemi)
    фигури.set(x.id, фиг)
  }
  return грешки
}
const фигури = new Map()

// ── HTML и PDF ──────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const ШАБЛОН = readFileSync(path.join(import.meta.dirname, 'shablon.html'), 'utf8')
const ЛОГО = `data:image/png;base64,${readFileSync(path.join(import.meta.dirname, 'ecoflow-logo.png')).toString('base64')}`

const ТИП = { '.png': 'image/png', '.jpg': 'image/jpeg' }
function тяло(md, фиг) {
  // Блоковете → <div class="notice …"> с надписа; съдържанието им — Markdown.
  // Фигурата → <figure>: изрязаната картинка, под нея подписът (първият ред) и легендата.
  // split с групи: [текст, вид, параметри, вътре, '' (затварящото), '', текст, …]
  const части = md.split(/^:::(\w*)([^\n]*)$/m)
  let html = marked.parse(части[0])
  let n = 0
  for (let i = 1; i < части.length; i += 3) {
    const вид = части[i]
    const т = части[i + 2] ?? ''
    if (вид === 'figure') {
      const f = фиг.figuri[n++]
      const src = `data:${ТИП[path.extname(f.fail)]};base64,${readFileSync(f.fail).toString('base64')}`
      const [подпис, ...легенда] = т.trim().split('\n')
      html += `<figure class="figura"><img src="${src}" style="width:${f.shirina}%" alt=""><figcaption>${marked.parseInline(подпис)}</figcaption>${легенда.length ? `<div class="legenda">${marked.parse(легенда.join('\n'))}</div>` : ''}</figure>`
    } else {
      html += вид ? `<div class="notice notice-${вид}"><div class="notice-label">${БЛОКОВЕ[вид]}</div>${marked.parse(т)}</div>` : marked.parse(т)
    }
  }
  // Препратките към оригинала (скритите, още без фигури) — по-бледо.
  html = html.replace(/\((вижте фиг\.[^)]*)\)/g, '<span class="fig">($1)</span>')
  // Котви за съдържанието.
  let к = 0
  html = html.replace(/<h1>/g, () => `<h1 id="r${++к}">`)
  return html
}

function страница(x, md, съдържание) {
  const заглавие = `${видBg(x.vid, x.zaglavia[0])} — ${общоИме(x.zaglavia)}`
  const html = тяло(md, фигури.get(x.id))
  const раздели = [...html.matchAll(/<h1 id="(r\d+)">(.*?)<\/h1>/g)]
  const toc = съдържание && раздели.length >= 2
    ? `<nav class="toc"><div class="toc-title">Съдържание</div><ul>${раздели.map((m) => `<li><a href="#${m[1]}">${m[2]}</a></li>`).join('')}</ul></nav>`
    : ''
  // Името на файла на EcoFlow — както е; версията е на отделен ред горе (отпечатаната в PDF-а).
  const оригинал = x.zaglavia[0]
  return {
    заглавие,
    html: ШАБЛОН
      .replace('{{title}}', () => esc(заглавие))
      .replace('{{logo}}', () => ЛОГО)
      .replace('{{zaglavie}}', () => esc(заглавие))
      .replace('{{produkti}}', () => esc(x.produkti_imena.join(', ') || общоИме(x.zaglavia)))
      .replace('{{versiya}}', () => x.versiya ? `Версия на оригинала: V${esc(x.versiya)}` : 'Версия на оригинала: не е посочена')
      .replace('{{original}}', () => esc(оригинал))
      .replace(/\{\{adres\}\}/g, () => esc(x.adres))
      .replace('{{sadarzhanie}}', () => toc)
      .replace('{{tyalo}}', () => html),
  }
}

const pdftotext = (f) => spawnSync('pdftotext', ['-enc', 'UTF-8', f, '-'], { encoding: 'utf8' })

const готовиF = path.join(BASE, 'prevodi-gotovi.json')
const готови = existsSync(готовиF) ? JSON.parse(readFileSync(готовиF, 'utf8')) : {}
const неминали = []
let browser
for (const x of задачи) {
  const грешки = провери(x)
  if (грешки.length) {
    неминали.push(x.id)
    delete готови[x.id]
    console.log(`✗ ${x.id}\n    ${грешки.join('\n    ')}`)
    continue
  }
  if (САМО_ПРОВЕРКА) { console.log(`✓ ${x.id} — проверката мина`); continue }
  browser ??= await chromium.launch({ executablePath: CHROME, headless: true })
  const md = readFileSync(path.join(PREVODI, `${x.id}.md`), 'utf8')
  const out = path.join(BASE, x.bg_fail)
  mkdirSync(path.dirname(out), { recursive: true })
  const печат = async (съдържание) => {
    const { заглавие, html } = страница(x, md, съдържание)
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.pdf({
      path: out, format: 'A4', printBackground: true, displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `<div style="font:7.5px Arial,sans-serif;color:#777;width:100%;padding:0 14mm;display:flex;justify-content:space-between"><span>${esc(заглавие)} · превод на ДИ СИ 2008 ООД</span><span>стр. <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
      margin: { top: '14mm', bottom: '16mm', left: '14mm', right: '14mm' },
    })
    await page.close()
    return pdftotext(out)
  }
  let r = await печат(false)
  let стр = (r.stdout.match(/\f/g) ?? []).length
  if (стр > 4) { r = await печат(true); стр = (r.stdout.match(/\f/g) ?? []).length }
  // Обратно четене: отваря се, кирилица, без счупени знаци.
  const букви = r.stdout.match(/\p{L}/gu) ?? []
  const кир = букви.filter((c) => /\p{Script=Cyrillic}/u.test(c)).length
  if (r.status !== 0 || !стр || кир / Math.max(1, букви.length) < 0.5 || r.stdout.includes('\uFFFD')) {
    неминали.push(x.id)
    delete готови[x.id]
    console.log(`✗ ${x.id} — PDF-ът не се чете както трябва (код ${r.status}, стр. ${стр}, кирилица ${Math.round((кир / Math.max(1, букви.length)) * 100)}%)`)
    continue
  }
  const ф = фигури.get(x.id) ?? { figuri: [], kandidati: 0, izkliucheni: 0 }
  готови[x.id] = {
    bg_fail: x.bg_fail,
    original: x.original,
    sha256: createHash('sha256').update(readFileSync(out)).digest('hex'),
    stranici: стр,
    figuri: ф.figuri.length,
  }
  console.log(`✓ ${x.id} — ${стр} стр., фигури ${ф.figuri.length} (в оригинала ${ф.kandidati} области, изключени ${ф.izkliucheni}) → ${x.bg_fail}`)
}
await browser?.close()
if (!САМО_ПРОВЕРКА) writeFileSync(готовиF, JSON.stringify(готови, null, 2) + '\n')
console.log(`готови: ${задачи.length - неминали.length}/${задачи.length}${неминали.length ? `; не минаха: ${неминали.join(', ')}` : ''}`)
process.exit(неминали.length ? 1 : 0)
