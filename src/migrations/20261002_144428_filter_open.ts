import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * „Отворен по подразбиране" на всеки ред от „Подредба на филтрите".
 * Само нова колона; редът на редовете не се пипа. Включена е само на
 * „Наличност" (`task-filtri-otvoreni.md`) — Цена и Категория, които
 * досега бяха отворени в кода, стават затворени.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`filter_order_items\` ADD \`open\` integer DEFAULT false;`)
  await db.run(sql`UPDATE \`filter_order_items\` SET \`open\` = 0;`)
  await db.run(
    sql`UPDATE \`filter_order_items\` SET \`open\` = 1 WHERE \`type\` = 'builtin' AND \`builtin\` = 'nalichnost';`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`filter_order_items\` DROP COLUMN \`open\`;`)
}
