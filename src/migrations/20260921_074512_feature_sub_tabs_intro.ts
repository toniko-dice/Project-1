import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products_blocks_feature_section\` ADD \`subheading_position\` text DEFAULT 'above';`)
  await db.run(sql`ALTER TABLE \`products_blocks_tabbed_showcase\` ADD \`intro\` text;`)
  await db.run(sql`ALTER TABLE \`_products_v_blocks_feature_section\` ADD \`subheading_position\` text DEFAULT 'above';`)
  await db.run(sql`ALTER TABLE \`_products_v_blocks_tabbed_showcase\` ADD \`intro\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`products_blocks_feature_section\` DROP COLUMN \`subheading_position\`;`)
  await db.run(sql`ALTER TABLE \`products_blocks_tabbed_showcase\` DROP COLUMN \`intro\`;`)
  await db.run(sql`ALTER TABLE \`_products_v_blocks_feature_section\` DROP COLUMN \`subheading_position\`;`)
  await db.run(sql`ALTER TABLE \`_products_v_blocks_tabbed_showcase\` DROP COLUMN \`intro\`;`)
}
