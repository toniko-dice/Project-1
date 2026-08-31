import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages\` ADD \`_order\` text;`)
  await db.run(sql`CREATE INDEX \`pages__order_idx\` ON \`pages\` (\`_order\`);`)
  await db.run(sql`ALTER TABLE \`_pages_v\` ADD \`version__order\` text;`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version__order_idx\` ON \`_pages_v\` (\`version__order\`);`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`_order\` text;`)
  await db.run(sql`CREATE INDEX \`products__order_idx\` ON \`products\` (\`_order\`);`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`_order\` text;`)
  await db.run(sql`CREATE INDEX \`categories__order_idx\` ON \`categories\` (\`_order\`);`)
  await db.run(sql`ALTER TABLE \`menu_panels\` ADD \`_order\` text;`)
  await db.run(sql`CREATE INDEX \`menu_panels__order_idx\` ON \`menu_panels\` (\`_order\`);`)
  await db.run(sql`ALTER TABLE \`testimonials\` ADD \`_order\` text;`)
  await db.run(sql`CREATE INDEX \`testimonials__order_idx\` ON \`testimonials\` (\`_order\`);`)
  await db.run(sql`ALTER TABLE \`awards\` ADD \`_order\` text;`)
  await db.run(sql`CREATE INDEX \`awards__order_idx\` ON \`awards\` (\`_order\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`pages__order_idx\`;`)
  await db.run(sql`ALTER TABLE \`pages\` DROP COLUMN \`_order\`;`)
  await db.run(sql`DROP INDEX \`_pages_v_version_version__order_idx\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v\` DROP COLUMN \`version__order\`;`)
  await db.run(sql`DROP INDEX \`products__order_idx\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`_order\`;`)
  await db.run(sql`DROP INDEX \`categories__order_idx\`;`)
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`_order\`;`)
  await db.run(sql`DROP INDEX \`menu_panels__order_idx\`;`)
  await db.run(sql`ALTER TABLE \`menu_panels\` DROP COLUMN \`_order\`;`)
  await db.run(sql`DROP INDEX \`testimonials__order_idx\`;`)
  await db.run(sql`ALTER TABLE \`testimonials\` DROP COLUMN \`_order\`;`)
  await db.run(sql`DROP INDEX \`awards__order_idx\`;`)
  await db.run(sql`ALTER TABLE \`awards\` DROP COLUMN \`_order\`;`)
}
