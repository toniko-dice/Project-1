/* Еднократно: плочката на началната и линкът от категорията към ръководството. */
import config from '@payload-config'
import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'

import { downloadFile, ORIGINALI_DIR, revalidateServer } from './import-product-core'

const dry = process.argv.includes('--dry-run')
const payload = await getPayload({ config })
const ИМЕ = 'vizhte-vsichki-elektrocentrali.png'
const URL = 'https://eu.ecoflow.com/cdn/shop/files/Frame_1612707420.png'
const ЛИНК = '/rakovodstvo-portativni-elektrocentrali'

/* снимката */
const dest = path.join(ORIGINALI_DIR, ИМЕ)
let mediaId: number | null = null
const има = await payload.find({ collection: 'media', where: { filename: { equals: ИМЕ } }, limit: 1, depth: 0 })
if (има.docs[0]) mediaId = има.docs[0].id
else if (!dry) {
  await downloadFile(URL, dest)
  const data = await fs.readFile(dest)
  const doc = await payload.create({
    collection: 'media',
    data: { alt: 'Портативни електроцентрали EcoFlow DELTA' },
    file: { data, name: ИМЕ, mimetype: 'image/png', size: data.length },
  })
  mediaId = doc.id
}
console.log(`снимка: ${mediaId ?? '(ще се свали)'}`)

/* началната */
const home = (await payload.find({ collection: 'pages', where: { slug: { equals: 'home' } }, limit: 1, depth: 0, draft: true })).docs[0]!
const posl = await payload.findVersions({ collection: 'pages', where: { parent: { equals: home.id } }, sort: '-updatedAt', limit: 1, depth: 0 })
console.log(`начална: статус ${home._status}, последна версия ${(posl.docs[0]?.version as { _status?: string })?._status}`)
const layout = (home.layout ?? []).map((b) => {
  if (b.blockType !== 'bannerProductRow' || b.sectionTitle !== 'Захранване на открито') return b
  console.log(`  „${b.sectionTitle}": плочка ${b.showMoreTile ? 'вкл' : 'изкл'} → вкл`)
  return {
    ...b,
    showMoreTile: true,
    moreTile: {
      ...b.moreTile,
      label: 'Вижте всички електроцентрали »',
      url: ЛИНК,
      image: mediaId,
      description: null,
      secondaryLabel: null,
      secondaryUrl: null,
    },
  }
})

/* категорията */
const page = (await payload.find({ collection: 'pages', where: { slug: { equals: ЛИНК.slice(1) } }, limit: 1, depth: 0 })).docs[0]!
const cat = (await payload.find({ collection: 'categories', where: { slug: { equals: 'portativni-elektrocentrali' } }, limit: 1, depth: 0 })).docs[0]!
console.log(`категория № ${cat.id} → страница № ${page.id}`)

if (!dry) {
  await payload.update({ collection: 'pages', id: home.id, data: { layout, _status: 'published' }, depth: 0 })
  await payload.update({
    collection: 'categories',
    id: cat.id,
    data: {
      guideLink: {
        page: page.id,
        label: 'Не знаете коя да изберете? Вижте ръководството за портативни електроцентрали →',
      },
    },
    depth: 0,
  })
  console.log(await revalidateServer())
}
process.exit(0)
