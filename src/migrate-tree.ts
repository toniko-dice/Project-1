/**
 * Еднократно пренареждане към дървото на три нива.
 *
 * Пуска се с:  npm run migrate:tree
 *
 * Прави четирите неща, които `seed-categories.ts` нарочно не прави, защото
 * той НИЩО НЕ ТРИЕ и нищо не мести:
 *
 *  1. Премества продуктите от старите категории на първия seed към
 *     съответните им категории от дървото.
 *  2. Изтрива старите категории — но само след като са останали празни и
 *     никой панел или точка в менюто не сочи към тях.
 *  3. Връзва „Виж всички" в панелите и точките в хедъра към КАТЕГОРИЯ и
 *     маха ръчно изписаните адреси (те сочеха несъществуващи страници).
 *  4. Преизчислява адресите, записани в базата (банери, промо карти,
 *     бутони в сравнителните таблици) по новото правило за адресите.
 *
 * ПОВТОРЯЕМ: второ пускане не намира какво да мести и изписва „нищо ново".
 * Нищо не се трие, ако проверката не мине — вместо това се изписва защо.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { categoryPath, productPath } from './lib/urls'

const payload = await getPayload({ config })
const сух = process.argv.includes('--dry-run')

/* ─────────── какво къде отива ─────────── */

/**
 * Продуктите от старите категории — по адрес на продукта, защото една стара
 * категория се разпада на няколко нови: „Домашни батерии" държеше и
 * DELTA Pro Ultra X (серия DELTA Pro), и двата PowerOcean.
 */
const ПРОДУКТИ: Record<string, string> = {
  'delta-pro-ultra-x': 'delta-pro-seriya',
  'powerocean-dc-fit': 'powerocean',
  'powerocean-plus': 'powerocean',
  'rapid-pro-power-bank': 'vanshni-baterii-rapid',
  'rapid-magnetic-5000': 'vanshni-baterii-rapid',
  'ecoflow-wave-3-klimatik': 'wave-klimatici',
  'smart-home-panel-2': 'umen-dom',
}

/** Категориите от първия seed, които дървото вече не съдържа. */
const ЗА_ТРИЕНЕ = [
  'domashni-baterii',
  'vanshni-baterii',
  'generatori',
  'klimatici',
  'inteligenten-dom',
]

/**
 * Стар адрес на категория → адрес в дървото.
 *
 * Ляво са слъговете, изписани на ръка в seed-а; вдясно — категорията, която
 * ги замества. Не е преименуване: „Портативни соларни панели" стана
 * „Сгъваеми панели", а „Соларен генератор" — „Комплекти с електроцентрала".
 */
const ПРЕЗАПИС: Record<string, string> = {
  'delta-seriya': 'delta-seriya',
  'river-seriya': 'river-seriya',
  'trail-seriya': 'trail-seriya',
  'stream-seriya': 'stream-seriya',
  'solaren-generator': 'komplekti-s-elektrocentrala',
  'portativni-solarni-paneli': 'sgavaemi-paneli',
  'montajni-solarni-paneli': 'stacionarni-paneli',
  'inteligenten-dom': 'umen-dom',
  'vanshni-baterii': 'vanshni-baterii-rapid',
  // Старите категории, които се трият — адресите им водят към заместника.
  'domashni-baterii': 'powerocean',
  klimatici: 'wave-klimatici',
  aksesoari: 'aksesoari',
  'portativni-elektrocentrali': 'portativni-elektrocentrali',
  'domashni-sistemi': 'domashni-sistemi',
  'solarni-paneli': 'solarni-paneli',
  'umni-ustroystva': 'umni-ustroystva',
  komplekti: 'komplekti',
  powerocean: 'powerocean',
  'mikroinvertori-i-montazh': 'mikroinvertori-i-montazh',
}

/** Точките в хедъра: по стар адрес или по надпис. */
const ТОЧКИ: Record<string, string> = {
  '/power-stations': 'portativni-elektrocentrali',
  '/categories/domashni-sistemi': 'domashni-sistemi',
  '/categories/solarni-paneli': 'solarni-paneli',
  '/categories/umni-ustroystva': 'umni-ustroystva',
  '/categories/komplekti': 'komplekti',
}

const всички = await payload.find({ collection: 'categories', pagination: false, depth: 0 })
const поSlug = new Map(всички.docs.map((c) => [c.slug, c]))

const дневник: string[] = []
const чакат: string[] = []
const кажи = (ред: string) => {
  дневник.push(ред)
  console.log(ред)
}

/** Категорията по адрес, или бележка в дневника, ако я няма. */
const катПоSlug = (slug: string, защо: string) => {
  const c = поSlug.get(slug)
  if (!c) чакат.push(`${защо}: няма категория „${slug}"`)
  return c ?? null
}

/* ─────────── 1. продуктите от старите категории ─────────── */

console.log('\nПРОДУКТИ')
let преместени = 0

for (const [slug, целSlug] of Object.entries(ПРОДУКТИ)) {
  const намерен = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    draft: true,
  })
  const продукт = намерен.docs[0]
  if (!продукт) continue

  const цел = катПоSlug(целSlug, `продукт ${slug}`)
  if (!цел) continue

  const сегашна = typeof продукт.category === 'number' ? продукт.category : продукт.category?.id
  if (сегашна === цел.id) continue

  const старо = всички.docs.find((c) => c.id === сегашна)?.slug ?? '—'
  кажи(`  · ${продукт.title}: ${старо} → ${целSlug}`)

  if (!сух) {
    /*
      Статусът се пази, както при вноса: публикуван продукт остава
      публикуван, за да не изчезне от сайта заради преместване.
    */
    await payload.update({
      collection: 'products',
      id: продукт.id,
      data: { category: цел.id, _status: продукт._status ?? 'published' } as never,
      draft: продукт._status !== 'published',
      depth: 0,
    })
  }
  преместени += 1
}

if (!преместени) console.log('  · нищо за местене')

/* ─────────── 2. старите категории ─────────── */

console.log('\nСТАРИ КАТЕГОРИИ')
let изтрити = 0

for (const slug of ЗА_ТРИЕНЕ) {
  const кат = поSlug.get(slug)
  if (!кат) continue

  const продукти = await payload.count({
    collection: 'products',
    where: { category: { equals: кат.id } },
  })
  const панели = await payload.count({
    collection: 'menu-panels',
    where: { category: { equals: кат.id } },
  })
  const деца = await payload.count({
    collection: 'categories',
    where: { parent: { equals: кат.id } },
  })

  if (продукти.totalDocs || панели.totalDocs || деца.totalDocs) {
    кажи(
      `  ✗ ${кат.title} (${slug}) НЕ е изтрита: продукти ${продукти.totalDocs}, панели ${панели.totalDocs}, подкатегории ${деца.totalDocs}`,
    )
    continue
  }

  кажи(`  − изтрита: ${кат.title} (${slug})`)
  if (!сух) await payload.delete({ collection: 'categories', id: кат.id, depth: 0 })
  изтрити += 1
}

if (!изтрити) console.log('  · нищо за триене')

/* ─────────── 3. „Виж всички" и точките в менюто ─────────── */

console.log('\nМЕНЮ')
let панелиОбновени = 0

const панели = await payload.find({ collection: 'menu-panels', pagination: false, depth: 0 })

for (const панел of панели.docs) {
  const секции = панел.sections ?? []
  if (!секции.length) continue

  let промяна = false
  const нови = secциите(секции)

  function secциите(списък: NonNullable<typeof панел.sections>) {
    return списък.map((секция) => {
      const текущо =
        typeof секция.viewAllCategory === 'number'
          ? секция.viewAllCategory
          : (секция.viewAllCategory?.id ?? null)
      if (текущо) return секция

      /* Адресът от seed-а: /categories/<slug> или /power-stations. */
      const адрес = секция.viewAllUrl ?? секция.viewAllTileUrl ?? ''
      const slug = адрес.replace(/^\/categories\//, '').replace(/^\//, '')
      const целSlug = ПРЕЗАПИС[slug] ?? (поSlug.has(slug) ? slug : null)
      const цел = целSlug ? поSlug.get(целSlug) : null

      if (!цел) {
        if (адрес) чакат.push(`панел „${панел.slug}", секция „${секция.heading}": адрес ${адрес}`)
        return секция
      }

      промяна = true
      кажи(`  · ${панел.slug} / ${секция.heading}: ${адрес || '—'} → ${цел.slug}`)
      // Ръчните адреси отпадат — категорията е източникът.
      return { ...секция, viewAllCategory: цел.id, viewAllUrl: null, viewAllTileUrl: null }
    })
  }

  if (!промяна) continue
  if (!сух) {
    await payload.update({
      collection: 'menu-panels',
      id: панел.id,
      data: { sections: нови } as never,
      depth: 0,
    })
  }
  панелиОбновени += 1
}

const header = await payload.findGlobal({ slug: 'header', depth: 0 })
type Точка = NonNullable<typeof header.items>[number]
let точкиОбновени = 0

const точки = (header.items ?? []).map((точка: Точка) => {
  const текущо = typeof точка.category === 'number' ? точка.category : (точка.category?.id ?? null)
  if (текущо) return точка

  const адрес = точка.url ?? ''
  const slug = адрес.replace(/^\/categories\//, '').replace(/^\//, '')
  const целSlug = ТОЧКИ[адрес] ?? ПРЕЗАПИС[slug] ?? (поSlug.has(slug) ? slug : null)
  const цел = целSlug ? поSlug.get(целSlug) : null

  if (!цел) {
    чакат.push(`точка „${точка.label}": адрес ${адрес || '—'} — изберете категория в админа`)
    return точка
  }

  точкиОбновени += 1
  кажи(`  · точка „${точка.label}": ${адрес || '—'} → ${цел.slug}`)
  return { ...точка, category: цел.id, url: null }
})

if (точкиОбновени && !сух) {
  await payload.updateGlobal({ slug: 'header', data: { items: точки } as never })
}

if (!панелиОбновени && !точкиОбновени) console.log('  · нищо за връзване')

/* ─────────── 3б. пренасочвания за старите адреси на категории ─────────── */

console.log('\nПРЕНАСОЧВАНИЯ')
let пренасочвания = 0

/**
 * Стар адрес на категория → новата ѝ страница.
 *
 * Не всичко може да се пренапише на място: началната страница например не
 * се записва, докато има празно задължително поле в друг блок. Линкът
 * продължава да работи през пренасочването, вместо да стане 404 — важи и
 * за линковете отвън, които вече сочат стария адрес.
 */
for (const [старо, ново] of Object.entries(ПРЕЗАПИС)) {
  if (старо === ново) continue
  const цел = поSlug.get(ново)
  if (!цел) continue

  for (const от of [`/categories/${старо}`, categoryPath(старо)]) {
    const има = await payload.count({ collection: 'redirects', where: { from: { equals: от } } })
    if (има.totalDocs) continue

    кажи(`  · ${от} → ${categoryPath(ново)}`)
    if (!сух) {
      await payload.create({
        collection: 'redirects',
        data: {
          from: от,
          to: categoryPath(ново),
          reason: `Категорията „${старо}" е заменена от „${ново}" при преминаването към дърво на три нива.`,
        },
      })
    }
    пренасочвания += 1
  }
}

if (!пренасочвания) console.log('  · нищо ново')

/* ─────────── 4. адресите, записани в текстови полета ─────────── */

console.log('\nЗАПИСАНИ АДРЕСИ')

const продукти = await payload.find({
  collection: 'products',
  pagination: false,
  depth: 1,
  draft: true,
})
const продуктПоSlug = new Map(продукти.docs.map((p) => [p.slug, p]))

/** Стар адрес → нов. Връща `null`, когато няма какво да се смени. */
const новАдрес = (адрес: unknown): string | null => {
  if (typeof адрес !== 'string') return null

  const продукт = адрес.match(/^\/products\/([a-z0-9-]+)\/?$/)
  if (продукт) {
    const p = продуктПоSlug.get(продукт[1])
    if (!p) {
      чакат.push(`адрес ${адрес}: няма такъв продукт`)
      return null
    }
    return productPath(p)
  }

  const кат = адрес.match(/^\/categories\/([a-z0-9-]+)\/?$/)
  if (кат) {
    const целSlug = ПРЕЗАПИС[кат[1]] ?? (поSlug.has(кат[1]) ? кат[1] : null)
    if (!целSlug) {
      чакат.push(`адрес ${адрес}: няма такава категория`)
      return null
    }
    return categoryPath(целSlug)
  }

  if (адрес === '/power-stations') return categoryPath('portativni-elektrocentrali')
  return null
}

/** Минава през цялото дърво на документа и сменя адресите в него. */
const обходи = (възел: unknown, докладвай: (от: string, до: string) => void): unknown => {
  if (Array.isArray(възел)) return възел.map((x) => обходи(x, докладвай))
  if (!възел || typeof възел !== 'object') return възел

  const изход: Record<string, unknown> = {}
  for (const [ключ, стойност] of Object.entries(възел as Record<string, unknown>)) {
    const адрес = /url$/i.test(ключ) ? новАдрес(стойност) : null
    if (адрес) {
      докладвай(стойност as string, адрес)
      изход[ключ] = адрес
    } else {
      изход[ключ] = обходи(стойност, докладвай)
    }
  }
  return изход
}

let документиСАдреси = 0

for (const колекция of ['pages', 'products'] as const) {
  const документи = await payload.find({
    collection: колекция,
    pagination: false,
    depth: 0,
    draft: true,
  })

  for (const документ of документи.docs) {
    const смени: string[] = []
    const поле = колекция === 'pages' ? 'layout' : 'sections'
    const данни = (документ as unknown as Record<string, unknown>)[поле]
    const нови = обходи(данни, (от, до) => смени.push(`${от} → ${до}`))

    if (!смени.length) continue

    if (!сух) {
      try {
        await payload.update({
          collection: колекция,
          id: документ.id,
          data: {
            [поле]: нови,
            ...(колекция === 'products' ? { _status: документ._status ?? 'published' } : {}),
          } as never,
          draft: документ._status !== 'published',
          depth: 0,
        })
      } catch (e) {
        /*
          Payload проверява ЦЕЛИЯ документ при запис. Едно празно
          задължително поле в друг блок отказва записа — виж т. 11 в
          CLAUDE.md. Адресите остават стари, а тук се изписва кое пречи.
        */
        чакат.push(
          `${колекция}/${документ.slug}: адресите НЕ са сменени — ${
            e instanceof Error ? e.message : String(e)
          }`,
        )
        continue
      }
    }

    документиСАдреси += 1
    кажи(`  · ${колекция}/${документ.slug}: ${смени.join(', ')}`)
  }
}

/* Глобалните (футър) и панелите също държат адреси. */
for (const глобал of ['footer', 'header'] as const) {
  const документ = await payload.findGlobal({ slug: глобал, depth: 0 })
  const смени: string[] = []
  const нови = обходи(документ, (от, до) => смени.push(`${от} → ${до}`))

  if (!смени.length) continue
  документиСАдреси += 1
  кажи(`  · глобал/${глобал}: ${смени.join(', ')}`)
  if (!сух) await payload.updateGlobal({ slug: глобал, data: нови as never })
}

for (const панел of await payload
  .find({ collection: 'menu-panels', pagination: false, depth: 0 })
  .then((r) => r.docs)) {
  const смени: string[] = []
  const нови = обходи(панел.sections ?? [], (от, до) => смени.push(`${от} → ${до}`))

  if (!смени.length) continue
  документиСАдреси += 1
  кажи(`  · панел/${панел.slug}: ${смени.length} адреса`)
  if (!сух) {
    await payload.update({
      collection: 'menu-panels',
      id: панел.id,
      data: { sections: нови } as never,
      depth: 0,
    })
  }
}

if (!документиСАдреси) console.log('  · нищо за преизчисляване')

/* ─────────── обобщение ─────────── */

console.log('')
if (сух) console.log('(--dry-run: нищо не е записано)')
console.log(
  `✓ Продукти: ${преместени} · Категории изтрити: ${изтрити} · Панели: ${панелиОбновени} · Точки: ${точкиОбновени} · Пренасочвания: ${пренасочвания} · Документи с адреси: ${документиСАдреси}`,
)

if (чакат.length) {
  console.log(`\n⚠ За решаване от админа (${чакат.length}):`)
  for (const ред of [...new Set(чакат)]) console.log(`  · ${ред}`)
}

if (!дневник.length) console.log('\n✓ Нищо ново — всичко вече отговаря на дървото.')
console.log('')

process.exit(0)
