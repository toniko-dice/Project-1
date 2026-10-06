import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * `task-seo-tehnichesko.md`: „Текст под списъка" на категорията (rich
 * text, т. 13) и „H1 на началната страница" в „Общи настройки" (т. 6).
 * Само нови колони — нищо не се пресъздава. `ADD … DEFAULT` попълва и
 * съществуващия ред на глобала, тоест H1 е там веднага.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`categories\` ADD \`below_list\` text;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`home_h1\` text DEFAULT 'EcoFlow България — портативни електроцентрали и соларни системи';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`below_list\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`home_h1\`;`)
}
