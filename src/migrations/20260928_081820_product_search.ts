import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` ADD \`search_text\` text;`)
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_search_text\` text;`)

  /*
    Попълване на новата колона за вече съществуващите продукти.

    Куката `fillSearchText` важи само занапред — без това търсачката не
    намира нито един от досегашните двайсет и един продукта, а нищо в
    интерфейса не го подсказва. Затова е тук, а не в отделен скрипт: нещо,
    което трябва да се пусне веднъж и лесно се забравя, не бива да е
    отделна стъпка.

    Свеждането до малки букви е в JavaScript, а НЕ с `lower()` на SQLite —
    неговото знае само латиница и „КАПАЦИТЕТ" би останало с главни букви.
    Точно заради това има отделна колона (виж `src/lib/search.ts`).

    Списъкът с полета е преписан, а не внесен от `src/lib/search.ts`.
    Миграцията описва състоянието към този момент; по-късна промяна в
    полетата за търсене не бива да мени какво е направила тази миграция.
  */
  const rows = await db.all<{
    id: number
    title: string | null
    tagline: string | null
    slug: string | null
    sku: string | null
    ean: string | null
    ean2: string | null
  }>(sql`SELECT \`id\`, \`title\`, \`tagline\`, \`slug\`, \`sku\`, \`ean\`, \`ean2\` FROM \`products\`;`)

  for (const row of rows) {
    const text = [row.title, row.tagline, row.slug, row.sku, row.ean, row.ean2]
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()

    await db.run(sql`UPDATE \`products\` SET \`search_text\` = ${text} WHERE \`id\` = ${row.id};`)
  }

  payload.logger.info(`Текстът за търсене е попълнен за ${rows.length} продукта.`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`search_text\`;`)
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_search_text\`;`)
}
