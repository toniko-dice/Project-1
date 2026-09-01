import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` ADD \`sku\` text;`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`brand\` text DEFAULT 'EcoFlow';`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`ean\` text;`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`barcode_internal\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`sku\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`brand\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`ean\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`barcode_internal\`;`)
}
