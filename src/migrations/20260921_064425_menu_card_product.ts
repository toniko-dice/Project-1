import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`ALTER TABLE \`menu_panels_sections_cards\` ADD \`product_id\` integer REFERENCES products(id);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_cards_product_idx\` ON \`menu_panels_sections_cards\` (\`product_id\`);`)
  await db.run(sql`ALTER TABLE \`menu_panels_sections\` ADD \`featured_product_id\` integer REFERENCES products(id);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_featured_featured_product_idx\` ON \`menu_panels_sections\` (\`featured_product_id\`);`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_menu_panels_sections_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`spec_line\` text,
  	\`url\` text,
  	\`label\` text,
  	\`ribbon\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`menu_panels_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_menu_panels_sections_cards\`("_order", "_parent_id", "id", "image_id", "title", "spec_line", "url", "label", "ribbon") SELECT "_order", "_parent_id", "id", "image_id", "title", "spec_line", "url", "label", "ribbon" FROM \`menu_panels_sections_cards\`;`)
  await db.run(sql`DROP TABLE \`menu_panels_sections_cards\`;`)
  await db.run(sql`ALTER TABLE \`__new_menu_panels_sections_cards\` RENAME TO \`menu_panels_sections_cards\`;`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_cards_order_idx\` ON \`menu_panels_sections_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_cards_parent_id_idx\` ON \`menu_panels_sections_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_cards_image_idx\` ON \`menu_panels_sections_cards\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_menu_panels_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`view_all_label\` text DEFAULT 'Виж всички',
  	\`view_all_url\` text,
  	\`featured_image_id\` integer,
  	\`featured_title\` text,
  	\`featured_spec_line\` text,
  	\`featured_url\` text,
  	\`featured_label\` text,
  	\`featured_ribbon\` text,
  	\`show_view_all_tile\` integer DEFAULT true,
  	\`view_all_tile_url\` text,
  	FOREIGN KEY (\`featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`menu_panels\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_menu_panels_sections\`("_order", "_parent_id", "id", "heading", "view_all_label", "view_all_url", "featured_image_id", "featured_title", "featured_spec_line", "featured_url", "featured_label", "featured_ribbon", "show_view_all_tile", "view_all_tile_url") SELECT "_order", "_parent_id", "id", "heading", "view_all_label", "view_all_url", "featured_image_id", "featured_title", "featured_spec_line", "featured_url", "featured_label", "featured_ribbon", "show_view_all_tile", "view_all_tile_url" FROM \`menu_panels_sections\`;`)
  await db.run(sql`DROP TABLE \`menu_panels_sections\`;`)
  await db.run(sql`ALTER TABLE \`__new_menu_panels_sections\` RENAME TO \`menu_panels_sections\`;`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_order_idx\` ON \`menu_panels_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_parent_id_idx\` ON \`menu_panels_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_featured_featured_image_idx\` ON \`menu_panels_sections\` (\`featured_image_id\`);`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
