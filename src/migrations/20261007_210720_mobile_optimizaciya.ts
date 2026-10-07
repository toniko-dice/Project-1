import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`header_mobile_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`header\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`header_mobile_links_order_idx\` ON \`header_mobile_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`header_mobile_links_parent_id_idx\` ON \`header_mobile_links\` (\`_parent_id\`);`)
  /*
    Първите бързи линкове в мобилното меню (`task-mobilna-optimizaciya.md`,
    т. 3). Оттук нататък са на собственика — „Меню (хедър)" → „Мобилно меню".
  */
  for (const [order, label, url] of [
    [1, 'Оферта за фирми', '/oferta-za-firmi'],
    [2, 'Гаранционни условия', '/garanciya'],
    [3, 'За EcoFlow', '/za-ecoflow'],
  ] as const) {
    await db.run(sql`INSERT INTO \`header_mobile_links\` (\`_order\`, \`_parent_id\`, \`id\`, \`label\`, \`url\`)
      SELECT ${order}, \`id\`, lower(hex(randomblob(12))), ${label}, ${url} FROM \`header\` ORDER BY \`id\` LIMIT 1;`)
  }
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_mobile_url\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_mobile_width\` numeric;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_mobile_height\` numeric;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_mobile_mime_type\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_mobile_filesize\` numeric;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_mobile_filename\` text;`)
  await db.run(sql`CREATE INDEX \`media_sizes_mobile_sizes_mobile_filename_idx\` ON \`media\` (\`sizes_mobile_filename\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`header_mobile_links\`;`)
  await db.run(sql`DROP INDEX \`media_sizes_mobile_sizes_mobile_filename_idx\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_mobile_url\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_mobile_width\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_mobile_height\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_mobile_mime_type\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_mobile_filesize\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_mobile_filename\`;`)
}
