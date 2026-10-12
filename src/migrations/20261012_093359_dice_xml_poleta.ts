import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`dice_syncs\` ADD \`warnings\` text;`)
  await db.run(sql`ALTER TABLE \`dice_syncs\` ADD \`skipped\` text;`)
  await db.run(sql`ALTER TABLE \`dice_syncs\` ADD \`irregular\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`dice_syncs\` DROP COLUMN \`warnings\`;`)
  await db.run(sql`ALTER TABLE \`dice_syncs\` DROP COLUMN \`skipped\`;`)
  await db.run(sql`ALTER TABLE \`dice_syncs\` DROP COLUMN \`irregular\`;`)
}
