/**
 * Внасяне на ЕДИН продукт от папка със съдържание.
 *
 * Пуска се с:  npm run import:product <slug>
 * Например:    npm run import:product delta-3-classic
 *
 * С `--no-download` не сваля нищо — ползва само файловете на диска и вече
 * качените в Медия.
 *
 * Логиката е в `src/import-product-core.ts` — същата, която ползва и
 * `npm run import:all`. Тук са само аргументът, обобщението и изходният
 * код. Две реализации значеха, че групóвият внос един ден ще внася по друг
 * начин от единичния, а разликата ще се забележи чак в базата.
 *
 * Продуктът се създава като ЧЕРНОВА. Вече публикуван продукт се обновява и
 * публикува направо — виж ядрото.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { ImportError, importProduct, revalidateServer } from './import-product-core'

const die = (message: string): never => {
  console.error(`\n✗ ${message}\n`)
  process.exit(1)
}

// `payload run` подава своите аргументи, затова взимаме първия, който
// не е път до скрипт и не е служебна дума.
const slug = process.argv
  .slice(2)
  .find((a) => !a.endsWith('.ts') && !a.endsWith('.js') && a !== 'run' && !a.startsWith('-'))

if (!slug) {
  die('Липсва адрес на продукта.\n  Пример: npm run import:product delta-3-classic')
}

// Изключва свалянето: ползват се само файловете на диска и вече качените.
const noDownload = process.argv.includes('--no-download')

const payload = await getPayload({ config })

let result
try {
  result = await importProduct(payload, slug!, { noDownload })
} catch (err) {
  if (err instanceof ImportError) die(err.message)
  throw err
}

/* ─────────── обобщение ─────────── */

console.log('')
if (result.downloaded) console.log(`✓ Свалени снимки: ${result.downloaded}`)
console.log(
  `✓ Качени нови изображения: ${result.uploadedNew} (пропуснати вече съществуващи: ${result.reusedExisting})`,
)
console.log(`✓ Продукт: ${result.title} — ${result.action}`)
if (result.publishError) console.log(`  ✗ ${result.publishError.split('\n')[0]}`)
console.log(`✓ Галерия: ${result.gallery} снимки (първата е основната)`)
console.log(`✓ Спецификации: ${result.specGroups} групи`)
console.log(`✓ Секции: ${result.sections}`)
if (result.linkedProducts.length) {
  console.log(
    `✓ Сравнителна таблица: колони, вързани към продукт — ${result.linkedProducts.join(', ')}`,
  )
}
if (result.unlinkedProducts.length) {
  console.log(
    `  · колони без продукт в каталога (остават с ръчното име): ${result.unlinkedProducts.join(', ')}`,
  )
}

if (result.failedDownloads.length) {
  console.log(
    `⚠ Не се свалиха: ${result.failedDownloads.length} — ${result.failedDownloads.join(', ')}`,
  )
}

if (result.missingFiles.length) {
  console.log(`⚠ Липсващи файлове: ${result.missingFiles.length} — ${result.missingFiles.join(', ')}`)
}

console.log('')
if (result.published) {
  console.log(`Продуктът е публикуван; ${await revalidateServer()}`)
} else {
  console.log('Продуктът е ЧЕРНОВА и още не се вижда на сайта.')
  console.log('Отворете го в админа, прегледайте го и натиснете „Публикувай".')
}
console.log('')

process.exit(0)
