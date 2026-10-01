import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/*
  Едно поле „Категории" вместо „Категория" + „Покажи и в".

  - `categories.full_title` — пътят на категорията („Домашни и балконски
    системи › Power Kits"); по него падащите менюта различават еднаквите
    имена. Попълва се тук за съществуващите, после — от куката.
  - „Категории" на всеки продукт = [`category`, ...`alsoInCategories`] без
    повторения, в този ред. Връзката „много" живее в `products_rels` (път
    `categories`) — колона вече има, затова генераторът не вижда промяна и
    данните се пренасят на ръка. Същото за ВСИЧКИ версии
    (`_products_v_rels`, път `version.categories`): админът отваря продукта
    от последната версия и без това „Категории" би излязло празно, а
    записът — отказан.
  - Старите редове `alsoInCategories` се трият. `category` остава —
    скрито копие на първата (CLAUDE.md, „Категории").

  Само `ALTER TABLE ... ADD` — нищо не се пресъздава и външните ключове не
  са засегнати (т. 7).
*/

type Ред = { parent_id: number; categories_id: number }

/** [основна, ...допълнителни] за всеки родител, без повторения. */
const сглоби = (основни: { id: number; cat: number | null }[], допълнителни: Ред[]) => {
  const поРодител = new Map<number, number[]>()
  for (const { id, cat } of основни) поРодител.set(id, cat === null ? [] : [cat])
  for (const р of допълнителни) {
    const списък = поРодител.get(р.parent_id)
    if (списък && !списък.includes(р.categories_id)) списък.push(р.categories_id)
  }
  return поРодител
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`categories\` ADD \`full_title\` text;`)

  /* ─── пътят на категориите ─── */
  const кат = (await db.all(sql`SELECT id, title, parent_id FROM categories`)) as {
    id: number
    title: string
    parent_id: number | null
  }[]
  const поId = new Map(кат.map((c) => [c.id, c]))
  for (const c of кат) {
    const имена = [c.title]
    const видяни = new Set([c.id])
    let p = c.parent_id
    while (p !== null && !видяни.has(p) && поId.has(p)) {
      видяни.add(p)
      имена.unshift(поId.get(p)!.title)
      p = поId.get(p)!.parent_id
    }
    await db.run(sql`UPDATE categories SET full_title = ${имена.join(' › ')} WHERE id = ${c.id}`)
  }

  /* ─── продуктите ─── */
  const продукти = (await db.all(
    sql`SELECT id, category_id AS cat FROM products`,
  )) as { id: number; cat: number | null }[]
  const покажиИв = (await db.all(
    sql`SELECT parent_id, categories_id FROM products_rels
        WHERE path = 'alsoInCategories' AND categories_id IS NOT NULL ORDER BY parent_id, "order"`,
  )) as Ред[]
  let редове = 0
  for (const [parent, списък] of сглоби(продукти, покажиИв)) {
    for (const [i, cat] of списък.entries()) {
      await db.run(
        sql`INSERT INTO products_rels ("order", parent_id, path, categories_id)
            VALUES (${i + 1}, ${parent}, 'categories', ${cat})`,
      )
      редове += 1
    }
  }
  await db.run(sql`DELETE FROM products_rels WHERE path = 'alsoInCategories'`)

  /* ─── версиите ─── */
  const версии = (await db.all(
    sql`SELECT id, version_category_id AS cat FROM _products_v`,
  )) as { id: number; cat: number | null }[]
  const покажиИвВ = (await db.all(
    sql`SELECT parent_id, categories_id FROM _products_v_rels
        WHERE path = 'version.alsoInCategories' AND categories_id IS NOT NULL ORDER BY parent_id, "order"`,
  )) as Ред[]
  let редовеВ = 0
  for (const [parent, списък] of сглоби(версии, покажиИвВ)) {
    for (const [i, cat] of списък.entries()) {
      await db.run(
        sql`INSERT INTO _products_v_rels ("order", parent_id, path, categories_id)
            VALUES (${i + 1}, ${parent}, 'version.categories', ${cat})`,
      )
      редовеВ += 1
    }
  }
  await db.run(sql`DELETE FROM _products_v_rels WHERE path = 'version.alsoInCategories'`)

  /* ─── проверката: продукт без „Категории" не бива да има ─── */
  const празни = (await db.all(
    sql`SELECT p.id FROM products p
        WHERE NOT EXISTS (SELECT 1 FROM products_rels r WHERE r.parent_id = p.id AND r.path = 'categories')`,
  )) as { id: number }[]
  payload.logger.info(
    `„Категории": ${редове} реда за ${продукти.length} продукта, ${редовеВ} за ${версии.length} версии; ` +
      `пренесени „Покажи и в": ${покажиИв.length}; продукти без категория: ${празни.length}`,
  )
  if (празни.length) {
    throw new Error(`Продукти без „Категории" след миграцията: ${празни.map((p) => p.id).join(', ')}`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  /* „Покажи и в" = всичко след първата; основната остава в `category`. */
  for (const [таблица, от, към] of [
    ['products_rels', 'categories', 'alsoInCategories'],
    ['_products_v_rels', 'version.categories', 'version.alsoInCategories'],
  ] as const) {
    const редове = (await db.all(
      sql.raw(
        `SELECT parent_id, categories_id, "order" FROM ${таблица} WHERE path = '${от}' AND "order" > 1`,
      ),
    )) as { parent_id: number; categories_id: number; order: number }[]
    for (const р of редове) {
      await db.run(
        sql.raw(
          `INSERT INTO ${таблица} ("order", parent_id, path, categories_id) VALUES (${р.order - 1}, ${р.parent_id}, '${към}', ${р.categories_id})`,
        ),
      )
    }
    await db.run(sql.raw(`DELETE FROM ${таблица} WHERE path = '${от}'`))
  }
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`full_title\`;`)
}
