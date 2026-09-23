import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products_blocks_tabbed_showcase_tabs\` ADD \`caption\` text;`)
  await db.run(sql`ALTER TABLE \`products_blocks_tabbed_showcase\` ADD \`layout\` text DEFAULT 'side-panel';`)
  await db.run(sql`ALTER TABLE \`_products_v_blocks_tabbed_showcase_tabs\` ADD \`caption\` text;`)
  await db.run(sql`ALTER TABLE \`_products_v_blocks_tabbed_showcase\` ADD \`layout\` text DEFAULT 'side-panel';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products_blocks_tabbed_showcase_tabs\` DROP COLUMN \`caption\`;`)
  await db.run(sql`ALTER TABLE \`products_blocks_tabbed_showcase\` DROP COLUMN \`layout\`;`)
  await db.run(sql`ALTER TABLE \`_products_v_blocks_tabbed_showcase_tabs\` DROP COLUMN \`caption\`;`)
  await db.run(sql`ALTER TABLE \`_products_v_blocks_tabbed_showcase\` DROP COLUMN \`layout\`;`)
}
