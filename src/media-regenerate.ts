/**
 * Дописва липсващите размери на вече качените снимки.
 *
 * Пуска се с:  npm run media:regenerate
 *
 * Нов размер в `Media.ts` важи само за качените СЛЕД него — старите файлове
 * нямат нито файла, нито записа. Този скрипт минава през Медия, прави
 * липсващите размери ОТ ОРИГИНАЛА на диска и попълва записа.
 *
 * Оригиналът не се пипа: чете се, не се презаписва. Нищо ново не се качва
 * в Медия — само се добавят файлове с размери до вече съществуващите.
 *
 * Повторяем: втори път не прави нищо. С `--force` пресъздава и наличните
 * (например след смяна на качеството на размер).
 */
import config from '@payload-config'
import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'
import sharp from 'sharp'

const payload = await getPayload({ config })

const force = process.argv.includes('--force')
const MEDIA_DIR = path.resolve(process.cwd(), 'media')

/* Размерите, както са описани в колекцията — един източник на истината. */
const sizes = payload.collections.media.config.upload.imageSizes ?? []
if (!sizes.length) {
  console.error('✗ В „Медия" няма описани размери.')
  process.exit(1)
}

const exists = async (p: string) => {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

type SizeRecord = {
  filename: string
  width: number
  height: number
  mimeType: string
  filesize: number
}

const docs = await payload.find({ collection: 'media', depth: 0, pagination: false, limit: 0 })

let touched = 0
let created = 0
let skippedNoFile = 0
const failures: string[] = []

for (const doc of docs.docs) {
  if (!doc.filename || !doc.mimeType?.startsWith('image/')) continue

  const original = path.join(MEDIA_DIR, doc.filename)
  if (!(await exists(original))) {
    skippedNoFile += 1
    console.warn(`  ⚠ липсва файлът на ${doc.filename} — пропуснат`)
    continue
  }

  const currentSizes = (doc.sizes ?? {}) as Record<string, { filename?: string | null } | undefined>
  const добавени: Record<string, SizeRecord> = {}

  for (const size of sizes) {
    if (!force && currentSizes[size.name]?.filename) continue

    /*
      Решението „прави ли се този размер" е на Payload, не наше: размер с
      ширина И височина се пропуска, когато оригиналът е по-малък и от
      двете (иначе би се разтегнал). Тук се повтаря същото условие.
    */
    const { width: targetW, height: targetH, withoutEnlargement } = size
    const w = doc.width ?? 0
    const h = doc.height ?? 0
    if (
      targetW &&
      targetH &&
      withoutEnlargement === undefined &&
      w < targetW &&
      h < targetH
    ) {
      continue
    }
    if (withoutEnlargement === undefined && (!targetW || !targetH)) {
      if ((targetW && w < targetW) || (targetH && h < targetH)) continue
    }

    try {
      let pipeline = sharp(original).rotate().resize({
        width: targetW ?? undefined,
        height: targetH ?? undefined,
        position: size.position,
        fit: size.fit,
        withoutEnlargement,
      })

      const format = size.formatOptions?.format
      if (format) pipeline = pipeline.toFormat(format, size.formatOptions?.options)

      const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })

      const stem = path.basename(doc.filename, path.extname(doc.filename))
      const name = `${stem}-${info.width}x${info.height}.${info.format}`
      const out = path.join(MEDIA_DIR, name)

      // Файлът може да съществува от по-ранно пускане — презаписва се само при --force.
      if (force || !(await exists(out))) await fs.writeFile(out, data)

      добавени[size.name] = {
        filename: name,
        width: info.width,
        height: info.height,
        mimeType: `image/${info.format}`,
        filesize: data.length,
      }
      created += 1
    } catch (e) {
      failures.push(`${doc.filename} → ${size.name}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  if (!Object.keys(добавени).length) continue

  /*
    Записва се САМО картата на размерите. Файлът не се подава — иначе
    Payload би качил снимката наново и би презаписал оригинала.
  */
  await payload.update({
    collection: 'media',
    id: doc.id,
    data: { sizes: { ...(doc.sizes ?? {}), ...добавени } } as never,
    depth: 0,
  })
  touched += 1
  console.log(`  · ${doc.filename}: ${Object.keys(добавени).join(', ')}`)
}

console.log('')
console.log(`✓ Прегледани файлове: ${docs.docs.length}`)
console.log(`✓ Обновени записи: ${touched} (нови размери: ${created})`)
if (skippedNoFile) console.log(`⚠ Без файл на диска: ${skippedNoFile}`)
if (failures.length) {
  console.log(`⚠ Неуспешни: ${failures.length}`)
  for (const f of failures) console.log(`   ${f}`)
}
console.log('')

process.exit(0)
