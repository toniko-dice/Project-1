import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` ADD \`ean2\` text;`)
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_ean2\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`ean2\`;`)
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_ean2\`;`)
}
