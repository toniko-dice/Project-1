import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products_blocks_comparison_table\` ADD \`intro\` text;`)
  await db.run(sql`ALTER TABLE \`_products_v_blocks_comparison_table\` ADD \`intro\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products_blocks_comparison_table\` DROP COLUMN \`intro\`;`)
  await db.run(sql`ALTER TABLE \`_products_v_blocks_comparison_table\` DROP COLUMN \`intro\`;`)
}
