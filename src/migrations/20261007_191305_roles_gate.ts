import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`users\` ADD \`role\` text DEFAULT 'editor' NOT NULL;`)
  // Съществуващите потребители стават администратори — никой не губи достъп (task-roli-potrebiteli.md).
  await db.run(sql`UPDATE \`users\` SET \`role\` = 'admin';`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`gate_locked\` integer DEFAULT true;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`gate_last_change\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`role\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`gate_locked\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`gate_last_change\`;`)
}
