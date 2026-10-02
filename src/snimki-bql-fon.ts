/**
 * Продуктовите снимки с бял фон — копия за ръчна обработка.
 *
 * Пуска се с:  npm run snimki:bql-fon
 *
 * Минава през основната снимка и галерията на всеки продукт (това, което
 * излиза в картите, менюто и галерията; секциите — сцени и инфографики —
 * не се гледат) и копира оригиналите с бял фон в `content/snimki-bql-fon/`,
 * а почти белите — в `proveri/`. Собственикът ги прави PNG с прозрачен фон
 * и ги връща в `content/snimki/` под същото име с `.png`; вносът ги слага
 * на мястото на старите (виж `task-snimki-siv-fon.md`).
 *
 * Гледа се ОРИГИНАЛЪТ от `media/`, не преоразмереното копие: размерите са
 * webp с друга компресия и бял ръб от 1 px би излязъл сив.
 *
 * Повторяем: папката се пише наново всеки път. `content/snimki/` не се пипа.
 */
import config from '@payload-config'
import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'
import sharp from 'sharp'

const ROOT = process.cwd()
const MEDIA = path.join(ROOT, 'media')
const OUT = path.join(ROOT, 'content', 'snimki-bql-fon')
const PROVERI = path.join(OUT, 'proveri')

type Вид = 'бял' | 'за проверка' | 'прозрачна' | 'друг' | 'липсва'

type Страна = { mean: [number, number, number]; бели: number; светли: number }

/**
 * Ивицата по краищата: ~2% от по-късата страна, поне 2 px. За всяка от
 * четирите страни — средното по R, G, B, делът на пикселите ≥ 240 по трите
 * канала („бели") и ≥ 220 („светли").
 */
const страни = (data: Buffer, w: number, h: number, ch: number) => {
  const d = Math.max(2, Math.round(Math.min(w, h) * 0.02))
  const сума = () => ({ r: 0, g: 0, b: 0, n: 0, бели: 0, светли: 0 })
  const s = { горе: сума(), долу: сума(), ляво: сума(), дясно: сума() }
  const добави = (t: ReturnType<typeof сума>, i: number) => {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    t.r += r
    t.g += g
    t.b += b
    t.n += 1
    if (r >= 240 && g >= 240 && b >= 240) t.бели += 1
    if (r >= 220 && g >= 220 && b >= 220) t.светли += 1
  }
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * ch
      if (y < d) добави(s.горе, i)
      else if (y >= h - d) добави(s.долу, i)
      if (x < d) добави(s.ляво, i)
      else if (x >= w - d) добави(s.дясно, i)
    }
  }
  const крайно = (t: ReturnType<typeof сума>): Страна => ({
    mean: [t.r / t.n, t.g / t.n, t.b / t.n],
    бели: t.бели / t.n,
    светли: t.светли / t.n,
  })
  const всички = Object.values(s).reduce((a, t) => ({
    r: a.r + t.r,
    g: a.g + t.g,
    b: a.b + t.b,
    n: a.n + t.n,
    бели: a.бели + t.бели,
    светли: a.светли + t.светли,
  }))
  return { всички: крайно(всички), поотделно: Object.values(s).map(крайно) }
}

const бяла = (s: Страна) => Math.min(...s.mean) >= 245 && s.бели >= 0.95
const светла = (s: Страна) => Math.min(...s.mean) >= 225 && s.светли >= 0.85

/** Видът на фона на един файл — прозрачна, бял, за проверка или друг. */
const разпознай = async (file: string): Promise<{ вид: Вид; w: number; h: number; format: string }> => {
  const img = sharp(file, { limitInputPixels: 1_000_000_000 })
  const meta = await img.metadata()
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels: ch } = info
  const рез = { w, h, format: meta.format ?? '?' }

  /* Прозрачна: има alpha и поне един ъгъл (3×3 px) е прозрачен. */
  if (meta.hasAlpha) {
    const ъгли = [
      [0, 0],
      [w - 3, 0],
      [0, h - 3],
      [w - 3, h - 3],
    ]
    const прозрачен = ъгли.some(([x0, y0]) => {
      for (let y = y0; y < y0 + 3; y += 1) {
        for (let x = x0; x < x0 + 3; x += 1) {
          if (data[(y * w + x) * ch + 3] < 250) return true
        }
      }
      return false
    })
    if (прозрачен) return { вид: 'прозрачна', ...рез }
  }

  const { всички, поотделно } = страни(data, w, h, ch)
  if (бяла(всички)) return { вид: 'бял', ...рез }

  /*
    Почти бял — сянка в долния край, светлосив фон, бял само от 2–3 страни:
    поне две страни са напълно бели, или поне три са светли.
  */
  const бели = поотделно.filter(бяла).length
  const светли = поотделно.filter(светла).length
  if (бели >= 2 || светли >= 3) return { вид: 'за проверка', ...рез }
  return { вид: 'друг', ...рез }
}

const payload = await getPayload({ config })

const продукти = await payload.find({
  collection: 'products',
  pagination: false,
  depth: 1,
  select: { slug: true, image: true, gallery: true },
  sort: ['_order', 'title'],
})

/** Файл в Медия → продуктите и позициите му (1 = главна). */
const употреба = new Map<string, { id: number; места: string[] }>()
for (const p of продукти.docs) {
  const снимки = [p.image, ...(p.gallery ?? []).map((g) => g.image)]
  const видяни = new Set<number>()
  let позиция = 0
  for (const m of снимки) {
    if (!m || typeof m === 'number' || !m.filename) continue
    позиция += 1
    if (видяни.has(m.id)) continue
    видяни.add(m.id)
    const u = употреба.get(m.filename) ?? { id: m.id, места: [] }
    u.места.push(`${p.slug} (${позиция})`)
    употреба.set(m.filename, u)
  }
}

await fs.rm(OUT, { recursive: true, force: true })
await fs.mkdir(PROVERI, { recursive: true })

const редове: { file: string; места: string[]; w: number; h: number; format: string; вид: Вид }[] = []
const брой: Record<Вид, number> = { бял: 0, 'за проверка': 0, прозрачна: 0, друг: 0, липсва: 0 }

for (const [file, u] of употреба) {
  const src = path.join(MEDIA, file)
  try {
    await fs.access(src)
  } catch {
    брой.липсва += 1
    console.warn(`  ⚠ ${file}: няма го в media/`)
    continue
  }
  try {
    const р = await разпознай(src)
    брой[р.вид] += 1
    if (р.вид === 'бял' || р.вид === 'за проверка') {
      await fs.copyFile(src, path.join(р.вид === 'бял' ? OUT : PROVERI, file))
      редове.push({ file, места: u.места, ...р })
    }
  } catch (e) {
    брой.липсва += 1
    console.warn(`  ⚠ ${file}: не се чете (${(e as Error).message})`)
  }
}

const таблица = (вид: Вид) =>
  редове
    .filter((r) => r.вид === вид)
    .map(
      (r) =>
        `| ${вид === 'за проверка' ? `proveri/${r.file}` : r.file} | ${r.места.join(', ')} | ${r.w}×${r.h} | ${r.format} | ${вид} |`,
    )
    .join('\n')

const заглавие = '| файл | продукт (позиция в галерията, 1 = главна) | размер | формат | вид |\n|---|---|---|---|---|'

await fs.writeFile(
  path.join(OUT, 'spisak.md'),
  `# Снимки с бял фон

Файлът се пише наново при всяко пускане на \`npm run snimki:bql-fon\`.

- С бял фон: **${брой.бял}** (в тази папка)
- За проверка: **${брой['за проверка']}** (в \`proveri/\` — почти бял фон: сянка, светлосив, бял само от 2–3 страни)
- Прегледани снимки: ${употреба.size} (прозрачни: ${брой.прозрачна}, други: ${брой.друг}${брой.липсва ? `, липсващи: ${брой.липсва}` : ''})

Обработете снимките: **прозрачен фон, формат PNG**. Името е същото, само
разширението става \`.png\` (например \`61566_1.webp\` → \`61566_1.png\`).
Продуктът е центриран, без да се изрязва. Мека сянка под продукта може да
остане (полупрозрачна). Готовите файлове сложете в \`content/snimki/\` и
кажете на Code да пусне замяната.

## С бял фон

${заглавие}
${таблица('бял')}

## За проверка

${заглавие}
${таблица('за проверка')}
`,
)

console.log(`\nСНИМКИ С БЯЛ ФОН — content/snimki-bql-fon/`)
console.log(`Прегледани: ${употреба.size} (основни и галерии на ${продукти.docs.length} продукта)`)
console.log(`  с бял фон:     ${брой.бял}`)
console.log(`  за проверка:   ${брой['за проверка']}  (proveri/)`)
console.log(`  пропуснати:    ${брой.прозрачна + брой.друг}  (прозрачни ${брой.прозрачна}, други ${брой.друг})`)
if (брой.липсва) console.log(`  липсващи/нечетими: ${брой.липсва}`)
process.exit(0)
