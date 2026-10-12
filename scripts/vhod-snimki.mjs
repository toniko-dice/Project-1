/**
 * Снимките на `/vhod` (`task-vhod-dizayn.md`) — от наредените електроцентрали
 * на EcoFlow в Медия (`media/za-ecoflow-elektrocentrali.webp`, 2880 × 1200).
 *
 *   ecoflow-vhod.webp      — ширина 2560, q82, цялата снимка;
 *   ecoflow-vhod-mob.webp  — 675 × 1200, q80, изрязана около 22 % по
 *                            хоризонтала (DELTA и RIVER вляво горе), без
 *                            увеличаване.
 *
 * Старите файлове се местят в `public/vhod/staro/` (не се трият) — само
 * при първото пускане; повторното само прави снимките наново.
 *
 *   node scripts/vhod-snimki.mjs
 */
import { existsSync, mkdirSync, renameSync, statSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'media', 'za-ecoflow-elektrocentrali.webp')
const OUT = path.join(ROOT, 'public', 'vhod')
const STARO = path.join(OUT, 'staro')
const ЦЕНТЪР_ТЕЛЕФОН = 0.22

if (!existsSync(SRC)) throw new Error(`Няма ${SRC}`)

mkdirSync(STARO, { recursive: true })
for (const f of ['ecoflow-vhod.webp', 'ecoflow-vhod-mob.webp']) {
  const стар = path.join(OUT, f)
  if (existsSync(стар) && !existsSync(path.join(STARO, f))) {
    renameSync(стар, path.join(STARO, f))
    console.log(`преместен: ${f} → staro/`)
  }
}

const { width, height } = await sharp(SRC).metadata()

await sharp(SRC)
  .resize({ width: 2560, withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile(path.join(OUT, 'ecoflow-vhod.webp'))

// Вертикална 9:16 — цялата височина, без увеличаване; центърът около 22 %.
const h = Math.min(height, 1200)
const w = Math.round((h * 675) / 1200)
const мащаб = h / height
const широчина = Math.round(width * мащаб)
const ляво = Math.max(0, Math.min(широчина - w, Math.round(широчина * ЦЕНТЪР_ТЕЛЕФОН - w / 2)))
await sharp(SRC)
  .resize({ height: h, withoutEnlargement: true })
  .extract({ left: ляво, top: 0, width: w, height: h })
  .webp({ quality: 80 })
  .toFile(path.join(OUT, 'ecoflow-vhod-mob.webp'))

for (const f of ['ecoflow-vhod.webp', 'ecoflow-vhod-mob.webp']) {
  const m = await sharp(path.join(OUT, f)).metadata()
  console.log(`${f}: ${m.width} × ${m.height}, ${Math.round(statSync(path.join(OUT, f)).size / 1024)} KB`)
}
