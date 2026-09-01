import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` ADD \`meta_title\` text;`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`meta_description\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`meta_title\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`meta_description\`;`)
}
