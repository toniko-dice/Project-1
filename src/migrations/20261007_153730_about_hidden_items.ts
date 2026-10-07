import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_awards_marquee_items\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_press_quotes_items\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_awards_marquee_items\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_press_quotes_items\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_awards_marquee_items\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_press_quotes_items\` ADD \`hidden\` integer DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_awards_marquee_items\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_press_quotes_items\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_awards_marquee_items\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_press_quotes_items\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_awards_marquee_items\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_press_quotes_items\` DROP COLUMN \`hidden\`;`)
}
