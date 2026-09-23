/**
 * Създава дървото на категориите и менюто по `content/kategorii.md`.
 *
 * Пуска се с:  payload run src/seed-categories.ts
 *
 * ЧЕТЕ ДИРЕКТНО .md ФАЙЛА, не негово JSON копие. Копието щеше да е втори
 * източник на истината и първото разминаване между двата щеше да мине
 * незабелязано. Форматът е прост и стабилен: `Име | slug | бележка`.
 *
 * СКРИПТЪТ Е ПОВТОРЯЕМ. Второ пускане не създава нищо и не променя нищо —
 * изписва „нищо ново". Категория със същия адрес се обновява само по
 * заглавие, родител, подредба и „в лентата". Полетата, които собственикът
 * попълва ръчно — снимки, описание, SEO — не се пипат.
 *
 * НИЩО НЕ СЕ ТРИЕ. Категориите и точките в менюто, които не са в дървото,
 * остават и се изписват в края, за да реши собственикът какво с тях.
 */
import config from '@payload-config'
import fs from 'fs/promises'
import path from 'path'
import { pathToFileURL } from 'url'
import { getPayload } from 'payload'

/*
  Ключовете за подредбата се генерират от имплементацията на Payload, а не
  от собствена. Модулът не се изнася през `exports` на пакета, затова се
  зарежда по път — същото както в `backfill-order.ts`. Ако ключовете се
  разминат с тези от админа, влаченето започва да дава странни резултати.
*/
const fractionalIndexing = path.resolve(
  process.cwd(),
  'node_modules/payload/dist/config/orderable/fractional-indexing.js',
)

const { generateNKeysBetween } = (await import(pathToFileURL(fractionalIndexing).href)) as {
  generateNKeysBetween: (a: string | null, b: string | null, n: number) => string[]
}

const payload = await getPayload({ config })

/* ─────────── четене на дървото ─────────── */

type Възел = { title: string; slug: string; note?: string; вЛентата?: boolean }
type Главна = Възел & { subs: Възел[] }

/*
  Третото поле е бележка, но при главните категории там стои маркерът
  „в лентата". Той казва дали категорията да се показва в лентата с икони —
  НЕ е описание. Записан като подзаглавие, излизаше под заглавието на
  категорийната страница като „в лентата".
*/
const МАРКЕР_ЛЕНТА = 'в лентата'

const разбий = (ред: string): Възел | null => {
  const части = ред.split('|').map((x) => x.trim())
  if (части.length < 2 || !части[0] || !части[1]) return null

  const трето = части[2] || ''
  const вЛентата = трето.toLowerCase().includes(МАРКЕР_ЛЕНТА)

  return {
    title: части[0],
    slug: части[1],
    note: вЛентата ? undefined : трето || undefined,
    вЛентата,
  }
}

const прочети = async (): Promise<Главна[]> => {
  const файл = path.join(process.cwd(), 'content', 'kategorii.md')
  const текст = await fs.readFile(файл, 'utf-8')

  const дърво: Главна[] = []
  let текуща: Главна | null = null

  for (const ред of текст.split(/\r?\n/)) {
    // „## 1. Име | slug | бележка" — главна категория.
    const главна = ред.match(/^##\s+\d+\.\s+(.+)$/)
    if (главна) {
      const възел = разбий(главна[1])
      текуща = възел ? { ...възел, subs: [] } : null
      if (текуща) дърво.push(текуща)
      continue
    }

    /*
      Всяко друго заглавие затваря текущата категория. Иначе списъкът под
      „## Правила" в края на файла се вписва като подкатегории.
    */
    if (/^#{1,6}\s/.test(ред)) {
      текуща = null
      continue
    }

    const под = ред.match(/^-\s+(.+)$/)
    if (под && текуща) {
      const възел = разбий(под[1])
      if (възел) текуща.subs.push(възел)
    }
  }

  return дърво
}

const дърво = await прочети()
if (!дърво.length) {
  console.error('\n✗ В content/kategorii.md не е намерена нито една категория.\n')
  process.exit(1)
}

/** Плосък списък в реда, в който трябва да стоят в админа. */
const плоско: {
  title: string
  slug: string
  note?: string
  вЛентата?: boolean
  parentSlug: string | null
}[] = []
for (const главна of дърво) {
  плоско.push({ ...главна, parentSlug: null })
  for (const под of главна.subs) плоско.push({ ...под, parentSlug: главна.slug })
}

const вДървото = new Set(плоско.map((x) => x.slug))

console.log(`Дърво: ${дърво.length} главни, ${плоско.length - дърво.length} подкатегории.`)

/* ─────────── подредба ─────────── */

const всички = await payload.find({ collection: 'categories', pagination: false, depth: 0 })

/*
  Ключовете тръгват преди най-малкия ключ на категория ИЗВЪН дървото, за да
  застане дървото най-отгоре в списъка, без да размества останалите.

  Границата се смята от категориите извън дървото нарочно — тя не се мени
  между две пускания и затова ключовете излизат същите. Ако границата беше
  просто най-малкият ключ изобщо, второто пускане щеше да генерира други
  ключове и скриптът нямаше да е повторяем.
*/
const извънДървото = всички.docs
  .filter((c) => !вДървото.has(c.slug))
  .map((c) => (c as unknown as { _order?: string })._order)
  .filter((k): k is string => typeof k === 'string' && k.length > 0)
  .sort()

const граница = извънДървото[0] ?? null
const ключове = generateNKeysBetween(null, граница, плоско.length)

/* ─────────── създаване и обновяване ─────────── */

const поSlug = new Map(всички.docs.map((c) => [c.slug, c]))
const идПоSlug = new Map<string, number>(всички.docs.map((c) => [c.slug, c.id]))

let създадени = 0
let обновени = 0
const промени: string[] = []

for (const [i, възел] of плоско.entries()) {
  const родителId = възел.parentSlug ? идПоSlug.get(възел.parentSlug) ?? null : null
  // Маркерът от файла решава; подкатегориите нямат такъв.
  const вЛентата = Boolean(възел.вЛентата)
  const ключ = ключове[i]

  const съществуваща = поSlug.get(възел.slug) as
    | (Record<string, unknown> & { id: number; title: string; slug: string })
    | undefined

  if (!съществуваща) {
    const doc = await payload.create({
      collection: 'categories',
      data: {
        title: възел.title,
        slug: възел.slug,
        parent: родителId,
        showInStrip: вЛентата,
        // Бележката от файла влиза само при създаване — после е на собственика.
        ...(възел.note ? { heroTagline: възел.note } : {}),
        _order: ключ,
      } as never,
    })
    идПоSlug.set(възел.slug, doc.id)
    създадени += 1
    промени.push(`  + ${вЛентата ? '' : '  '}${възел.title} (${възел.slug})`)
    continue
  }

  идПоSlug.set(възел.slug, съществуваща.id)

  const текущРодител = съществуваща.parent
  const текущРодителId =
    typeof текущРодител === 'number' ? текущРодител : (текущРодител as { id?: number })?.id ?? null

  const разлики: string[] = []
  if (съществуваща.title !== възел.title) разлики.push('заглавие')
  if (текущРодителId !== родителId) разлики.push('родител')
  if (Boolean(съществуваща.showInStrip) !== вЛентата) разлики.push('в лентата')
  if ((съществуваща as { _order?: string })._order !== ключ) разлики.push('подредба')

  if (!разлики.length) continue

  await payload.update({
    collection: 'categories',
    id: съществуваща.id,
    data: {
      title: възел.title,
      parent: родителId,
      showInStrip: вЛентата,
      _order: ключ,
    } as never,
  })
  обновени += 1
  промени.push(`  ~ ${вЛентата ? '' : '  '}${възел.title} (${възел.slug}) — ${разлики.join(', ')}`)
}

/* ─────────── панели и точки в менюто ─────────── */

/*
  Менюто следва образеца „Електроцентрали": вляво по един таб на
  подкатегория, вдясно продуктите ѝ. Всеки таб е панел в автоматичен режим,
  вързан към подкатегорията си — продуктите се показват сами.

  „ЕЛЕКТРОЦЕНТРАЛИ" НЕ СЕ ПИПА. Точката с адрес /power-stations, панелите
  към нея и съдържанието им са образецът, не обект на промяна. Затова
  първата главна категория (portativni-elektrocentrali) се прескача изцяло —
  сериите ѝ вече са в образеца, направен на ръка.
*/
const ОБРАЗЕЦ = '/power-stations'
const ПОКРИТА_ОТ_ОБРАЗЕЦА = 'portativni-elektrocentrali'

const панели = await payload.find({ collection: 'menu-panels', pagination: false, depth: 0 })
const заетиSlug = new Set(панели.docs.map((p) => p.slug))

/** Автоматичният панел за дадена категория, ако вече съществува. */
const панелЗаКатегория = (categoryId: number) =>
  панели.docs.find((p) => {
    const c = p.category
    const id = typeof c === 'number' ? c : c?.id
    return p.mode !== 'manual' && id === categoryId
  })

/** Свободен адрес: подкатегорията, а при заето — с наставка. */
const свободенSlug = (искан: string) => {
  if (!заетиSlug.has(искан)) return искан
  let n = 2
  while (заетиSlug.has(`${искан}-${n}`)) n += 1
  return `${искан}-${n}`
}

let панелиСъздадени = 0
let панелиОбновени = 0
const панелиНаМейн = new Map<string, number[]>()
const наставки: string[] = []

for (const главна of дърво) {
  if (главна.slug === ПОКРИТА_ОТ_ОБРАЗЕЦА) continue

  const ids: number[] = []

  for (const под of главна.subs) {
    const категорияId = идПоSlug.get(под.slug)
    if (typeof категорияId !== 'number') continue

    const съществуващ = панелЗаКатегория(категорияId)
    if (съществуващ) {
      ids.push(съществуващ.id)
      continue
    }

    /*
      Адресът на панела е само идентификатор — URL-ът идва от категорията.
      Ако подкатегорията съвпада с ръчен панел на образеца (напр.
      stream-seriya, powerocean), ръчният остава, а автоматичният получава
      наставка.
    */
    const slug = свободенSlug(под.slug)
    if (slug !== под.slug) наставки.push(`${под.slug} → ${slug}`)

    const doc = await payload.create({
      collection: 'menu-panels',
      data: { title: под.title, slug, mode: 'auto', category: категорияId } as never,
    })
    заетиSlug.add(slug)
    панели.docs.push(doc)
    ids.push(doc.id)
    панелиСъздадени += 1
  }

  панелиНаМейн.set(главна.slug, ids)
}

/*
  Отпечатък на панела, който ПРЕДИШНАТА версия на този скрипт правеше за
  главна категория: ръчен, без категория, със slug на главната и една
  секция с картите-линкове към подкатегориите. Той вече не е таб, а
  документът остава — не се трие нищо.
*/
const еСтарМейнПанел = (panelId: number, главна: Главна) => {
  const p = панели.docs.find((x) => x.id === panelId)
  if (!p || p.slug !== главна.slug || p.mode !== 'manual' || p.category) return false
  const секции = p.sections ?? []
  return секции.length === 1 && секции[0]?.heading === главна.title
}

const header = await payload.findGlobal({ slug: 'header', depth: 0 })
type Вписване = { panel?: number | { id: number } | null; [k: string]: unknown }
type Група = { heading?: string | null; defaultOpen?: boolean | null; entries?: Вписване[] }
type Точка = { label?: string | null; url?: string | null; groups?: Група[]; [k: string]: unknown }
const точки = [...((header.items ?? []) as Точка[])]

const панелОт = (в: Вписване) => (typeof в.panel === 'number' ? в.panel : в.panel?.id ?? null)

let точкиСъздадени = 0
let точкиОбновени = 0

for (const главна of дърво) {
  if (главна.slug === ПОКРИТА_ОТ_ОБРАЗЕЦА) continue

  const адрес = `/categories/${главна.slug}`
  const автоПанели = панелиНаМейн.get(главна.slug) ?? []

  /*
    Точката се разпознава по адрес, по надпис ИЛИ по стария мейн панел,
    към който сочи. Третото хваща точка, която собственикът е преименувал
    и пренасочил („Аксесоари" → „Други продукти") — без него скриптът би
    създал втора, дублираща точка до нея.
  */
  const индекс = точки.findIndex(
    (t) =>
      t.url !== ОБРАЗЕЦ &&
      (t.url === адрес ||
        (t.label && t.label === главна.title) ||
        (t.groups ?? []).some((g) =>
          (g.entries ?? []).some((в) => {
            const id = панелОт(в)
            /*
              Стар мейн панел — за първото пускане след преименуване.
              Автоматичен панел на подкатегория — за всяко следващо: старият
              вече е махнат, а автоматичните остават и са надежден белег.
            */
            return id !== null && (еСтарМейнПанел(id, главна) || автоПанели.includes(id))
          }),
        )),
  )

  if (индекс < 0) {
    точки.push({
      label: главна.title,
      url: адрес,
      badge: 'none',
      groups: [
        {
          heading: главна.title,
          defaultOpen: true,
          entries: автоПанели.map((panel) => ({ panel })),
        },
      ],
    })
    точкиСъздадени += 1
    continue
  }

  const текуща = точки[индекс]
  const групи = [...(текуща.groups ?? [])]
  const група: Група = групи[0] ?? { heading: главна.title, defaultOpen: true, entries: [] }

  /*
    Табовете на собственика се пазят. Махат се само вписванията към стария
    мейн панел на този скрипт; автоматичните, които липсват, се добавят
    отзад в реда от файла.
  */
  const запазени = (група.entries ?? []).filter((в) => {
    const id = панелОт(в)
    return id === null || !еСтарМейнПанел(id, главна)
  })
  const налични = new Set(запазени.map(панелОт))
  const нови = автоПанели.filter((id) => !налични.has(id)).map((panel) => ({ panel }))

  /*
    Надписът и адресът на съществуваща точка са на собственика — той ги е
    сложил или сменил от админа. Скриптът само допълва табовете.
  */
  const новиВписвания = [...запазени, ...нови]
  const същите =
    JSON.stringify((група.entries ?? []).map(панелОт)) === JSON.stringify(новиВписвания.map(панелОт))

  if (същите) continue

  групи[0] = { ...група, heading: група.heading ?? главна.title, entries: новиВписвания }
  точки[индекс] = { ...текуща, groups: групи }
  точкиОбновени += 1
}

/*
  Без пренареждане. Редът на точките е на собственика — той го подрежда с
  влачене в админа. Новите точки се добавят най-отзад и той ги мести,
  където ги иска.
*/
const подредени = точки
const редътСеМени = false

if (точкиСъздадени || точкиОбновени || редътСеМени) {
  await payload.updateGlobal({ slug: 'header', data: { items: подредени } as never })
}

/* ─────────── лентата с категории на началната ─────────── */

/*
  Блокът „Лента с категории" държи собствен списък с връзки — полето
  `showInStrip` не се чете от рендера. Затова, за да се видят новите шест
  главни на началната, списъкът в блока трябва да се пренасочи.

  Записът минава през цялата страница и Payload проверява всичките ѝ
  блокове. Ако някой видим блок има празно задължително поле, записът се
  отказва — тогава просто се изписва защо, вместо скриптът да гръмне.
*/
let лентаСъобщение = 'лентата вече сочи новите категории'

const главниId = дърво.map((г) => идПоSlug.get(г.slug)).filter((x): x is number => typeof x === 'number')

const начална = await payload.find({
  collection: 'pages',
  where: { slug: { equals: 'home' } },
  limit: 1,
  depth: 0,
  draft: true,
})

const страница = начална.docs[0] as unknown as
  | { id: number; layout: { blockType: string; categories?: (number | { id: number })[] }[] }
  | undefined

if (!страница) {
  лентаСъобщение = 'няма начална страница'
} else {
  const текущи = (страница.layout ?? [])
    .filter((b) => b.blockType === 'categoryStrip')
    .flatMap((b) => (b.categories ?? []).map((c) => (typeof c === 'number' ? c : c.id)))

  if (текущи.join(',') === главниId.join(',')) {
    лентаСъобщение = 'лентата вече сочи новите категории'
  } else {
    const layout = страница.layout.map((b) =>
      b.blockType === 'categoryStrip' ? { ...b, categories: главниId } : b,
    )
    try {
      await payload.update({ collection: 'pages', id: страница.id, data: { layout } as never })
      лентаСъобщение = `пренасочена към ${главниId.length} главни категории`
    } catch (err) {
      const e = err as { data?: { errors?: { path?: string }[] } }
      const полета = (e.data?.errors ?? []).map((d) => d.path).join(', ')
      лентаСъобщение = `НЕ е пренасочена — началната не се записва заради празни задължителни полета: ${полета || 'неизвестни'}`
    }
  }
}

/* ─────────── обобщение ─────────── */

console.log('')
if (промени.length) {
  console.log('КАТЕГОРИИ')
  for (const ред of промени) console.log(ред)
  console.log('')
}
console.log(`Категории: създадени ${създадени}, обновени ${обновени}`)
console.log(`Панели в менюто: създадени ${панелиСъздадени}, обновени ${панелиОбновени}`)
if (наставки.length) {
  console.log(`  адреси с наставка (съвпадат с ръчен панел): ${наставки.join(', ')}`)
}
console.log(`Точки в менюто: създадени ${точкиСъздадени}, обновени ${точкиОбновени}${редътСеМени ? ', подредени' : ''}`)
console.log(`Лента с категории: ${лентаСъобщение}`)

const чака = лентаСъобщение.startsWith('НЕ е пренасочена')

if (
  !създадени &&
  !обновени &&
  !панелиСъздадени &&
  !панелиОбновени &&
  !точкиСъздадени &&
  !точкиОбновени &&
  !редътСеМени &&
  !чака
) {
  console.log('\n✓ Нищо ново — всичко вече отговаря на content/kategorii.md.')
} else if (чака) {
  // „Нищо ново" при чакаща лента би било лъжа — работата не е довършена.
  console.log('\n⚠ Категориите и менюто са готови, но лентата на началната чака.')
  console.log('  Попълнете полетата по-горе в админа и пуснете скрипта отново.')
}

/* ─────────── какво остава на собственика ─────────── */

const следФинал = await payload.find({ collection: 'categories', pagination: false, depth: 0 })
const чужди = следФинал.docs.filter((c) => !вДървото.has(c.slug))

if (чужди.length) {
  console.log('')
  console.log('КАТЕГОРИИ ИЗВЪН ДЪРВОТО — не са пипани, решете какво с тях:')
  for (const c of чужди) {
    const брой = await payload.count({
      collection: 'products',
      where: { category: { equals: c.id } },
    })
    const бележка = брой.totalDocs
      ? `${брой.totalDocs} продукта — преместете ги, преди да триете`
      : 'без продукти'
    console.log(`  · ${c.title} (${c.slug}) — ${бележка}`)
  }
}

const чуждиТочки = подредени.filter((t) => !t.url || !String(t.url).startsWith('/categories/'))
if (чуждиТочки.length) {
  console.log('')
  console.log('ТОЧКИ В МЕНЮТО ИЗВЪН ДЪРВОТО — остават както са:')
  for (const t of чуждиТочки) console.log(`  · ${t.label ?? '(без надпис)'} → ${t.url ?? '—'}`)
}

console.log('')
process.exit(0)
