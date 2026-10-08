import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages\` ADD \`legal\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`imported_at\` text;`)
  await db.run(sql`ALTER TABLE \`pages\` ADD \`noindex\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` ADD \`version_legal\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` ADD \`version_imported_at\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` ADD \`version_noindex\` integer DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`legal\`;`)
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`imported_at\`;`)
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`noindex\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` DROP COLUMN \`version_legal\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` DROP COLUMN \`version_imported_at\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` DROP COLUMN \`version_noindex\`;`)
}
