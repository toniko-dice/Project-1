import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_product_carousel\` ADD \`arrangement\` text DEFAULT 'row';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_product_carousel\` ADD \`arrangement\` text DEFAULT 'row';`)
  await db.run(sql`ALTER TABLE \`categories_blocks_product_carousel\` ADD \`arrangement\` text DEFAULT 'row';`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_product_carousel\` DROP COLUMN \`arrangement\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_product_carousel\` DROP COLUMN \`arrangement\`;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_product_carousel\` DROP COLUMN \`arrangement\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
