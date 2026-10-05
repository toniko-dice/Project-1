import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * „Оригинално име" в Медия — само за справка, откъде е дошла снимката
 * (`task-snimki-imena.md`). Попълва го `npm run snimki:imena` при смяната.
 * Само нова колона; нищо не се пресъздава.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` ADD \`original_name\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`original_name\`;`)
}
