import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Адресите в началната страница — през SQL, защото записът през Payload не минава.
 *
 * Началната страница има три празни задължителни снимки (блок „Широк
 * банер" и две промо карти). Payload проверява ЦЕЛИЯ документ при запис,
 * затова всеки запис в нея се отхвърля — включително преизчисляването на
 * адресите от `npm run migrate:tree` (виж т. 11 в CLAUDE.md).
 *
 * Тук се сменя само стойността на колоните с адреси — и в публикуваната
 * таблица, и в таблицата с версиите, за да не се върне старият адрес при
 * следващия запис от админа.
 *
 * `/categories/domashni-baterii` е категория, която вече не съществува:
 * съдържанието ѝ е в „PowerOcean" (виж `content/kategorii.md`).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    UPDATE \`pages_blocks_banner_product_row\`
    SET \`more_tile_url\` = '/kategorii/powerocean'
    WHERE \`more_tile_url\` = '/categories/domashni-baterii';
  `)
  await db.run(sql`
    UPDATE \`_pages_v_blocks_banner_product_row\`
    SET \`more_tile_url\` = '/kategorii/powerocean'
    WHERE \`more_tile_url\` = '/categories/domashni-baterii';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`
    UPDATE \`pages_blocks_banner_product_row\`
    SET \`more_tile_url\` = '/categories/domashni-baterii'
    WHERE \`more_tile_url\` = '/kategorii/powerocean';
  `)
  await db.run(sql`
    UPDATE \`_pages_v_blocks_banner_product_row\`
    SET \`more_tile_url\` = '/categories/domashni-baterii'
    WHERE \`more_tile_url\` = '/kategorii/powerocean';
  `)
}
