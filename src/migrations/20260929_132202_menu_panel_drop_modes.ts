import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/*
  Панелите в менюто без режими — втора стъпка: само маха.

  Първата (`menu_panel_products`) добави списъка `products` и го попълни.
  Тук отпадат `mode` и категорията на панела, голямата карта и малките
  карти. SQLite пресъздава `menu_panels_sections` и `menu_panels`.

  ПРЕГЛЕДАНО РЪЧНО (CLAUDE.md, т. 7 и т. 10):
  - Генераторът беше върнал `PRAGMA foreign_keys=ON` веднага след първата
    таблица, а `DROP TABLE menu_panels` идваше след това с включени ключове.
    Това щеше да изтрие секциите и списъците (`ON DELETE CASCADE`) и да
    занули точките в менюто (`header_items_groups_entries.panel_id`).
    OFF е първият ред, ON — последният, и в `up()`, и в `down()`.
  - `down()` четеше `mode`, `category_id` и `featured_*` от таблици, в
    които вече ги няма. Заменени са със стойности: панелите стават
    ръчни, голямата карта — празна.
*/

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE \`menu_panels_sections_cards\`;`)
  await db.run(sql`CREATE TABLE \`__new_menu_panels_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text NOT NULL,
  	\`view_all_category_id\` integer,
  	\`view_all_label\` text DEFAULT 'Виж всички',
  	\`view_all_url\` text,
  	\`accessories\` integer,
  	\`show_view_all_tile\` integer DEFAULT true,
  	\`view_all_tile_url\` text,
  	FOREIGN KEY (\`view_all_category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`menu_panels\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_menu_panels_sections\`("_order", "_parent_id", "id", "heading", "view_all_category_id", "view_all_label", "view_all_url", "accessories", "show_view_all_tile", "view_all_tile_url") SELECT "_order", "_parent_id", "id", "heading", "view_all_category_id", "view_all_label", "view_all_url", "accessories", "show_view_all_tile", "view_all_tile_url" FROM \`menu_panels_sections\`;`)
  await db.run(sql`DROP TABLE \`menu_panels_sections\`;`)
  await db.run(sql`ALTER TABLE \`__new_menu_panels_sections\` RENAME TO \`menu_panels_sections\`;`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_order_idx\` ON \`menu_panels_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_parent_id_idx\` ON \`menu_panels_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_view_all_category_idx\` ON \`menu_panels_sections\` (\`view_all_category_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_menu_panels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`INSERT INTO \`__new_menu_panels\`("id", "_order", "title", "slug", "updated_at", "created_at") SELECT "id", "_order", "title", "slug", "updated_at", "created_at" FROM \`menu_panels\`;`)
  await db.run(sql`DROP TABLE \`menu_panels\`;`)
  await db.run(sql`ALTER TABLE \`__new_menu_panels\` RENAME TO \`menu_panels\`;`)
  await db.run(sql`CREATE INDEX \`menu_panels__order_idx\` ON \`menu_panels\` (\`_order\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`menu_panels_slug_idx\` ON \`menu_panels\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_updated_at_idx\` ON \`menu_panels\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_created_at_idx\` ON \`menu_panels\` (\`created_at\`);`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`menu_panels_sections_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`product_id\` integer,
  	\`image_id\` integer,
  	\`title\` text,
  	\`spec_line\` text,
  	\`url\` text,
  	\`label\` text,
  	\`ribbon\` text,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`menu_panels_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_cards_order_idx\` ON \`menu_panels_sections_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_cards_parent_id_idx\` ON \`menu_panels_sections_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_cards_product_idx\` ON \`menu_panels_sections_cards\` (\`product_id\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_cards_image_idx\` ON \`menu_panels_sections_cards\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_menu_panels_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`view_all_category_id\` integer,
  	\`view_all_label\` text DEFAULT 'Виж всички',
  	\`view_all_url\` text,
  	\`accessories\` integer,
  	\`featured_product_id\` integer,
  	\`featured_image_id\` integer,
  	\`featured_title\` text,
  	\`featured_spec_line\` text,
  	\`featured_url\` text,
  	\`featured_label\` text,
  	\`featured_ribbon\` text,
  	\`show_view_all_tile\` integer DEFAULT true,
  	\`view_all_tile_url\` text,
  	FOREIGN KEY (\`view_all_category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`featured_product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`menu_panels\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_menu_panels_sections\`("_order", "_parent_id", "id", "heading", "view_all_category_id", "view_all_label", "view_all_url", "accessories", "featured_product_id", "featured_image_id", "featured_title", "featured_spec_line", "featured_url", "featured_label", "featured_ribbon", "show_view_all_tile", "view_all_tile_url") SELECT "_order", "_parent_id", "id", "heading", "view_all_category_id", "view_all_label", "view_all_url", "accessories", NULL, NULL, NULL, NULL, NULL, NULL, NULL, "show_view_all_tile", "view_all_tile_url" FROM \`menu_panels_sections\`;`)
  await db.run(sql`DROP TABLE \`menu_panels_sections\`;`)
  await db.run(sql`ALTER TABLE \`__new_menu_panels_sections\` RENAME TO \`menu_panels_sections\`;`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_order_idx\` ON \`menu_panels_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_parent_id_idx\` ON \`menu_panels_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_view_all_category_idx\` ON \`menu_panels_sections\` (\`view_all_category_id\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_featured_featured_product_idx\` ON \`menu_panels_sections\` (\`featured_product_id\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_featured_featured_image_idx\` ON \`menu_panels_sections\` (\`featured_image_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_menu_panels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`title\` text,
  	\`slug\` text NOT NULL,
  	\`mode\` text DEFAULT 'auto',
  	\`category_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_menu_panels\`("id", "_order", "title", "slug", "mode", "category_id", "updated_at", "created_at") SELECT "id", "_order", "title", "slug", 'manual', NULL, "updated_at", "created_at" FROM \`menu_panels\`;`)
  await db.run(sql`DROP TABLE \`menu_panels\`;`)
  await db.run(sql`ALTER TABLE \`__new_menu_panels\` RENAME TO \`menu_panels\`;`)
  await db.run(sql`CREATE INDEX \`menu_panels__order_idx\` ON \`menu_panels\` (\`_order\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`menu_panels_slug_idx\` ON \`menu_panels\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_category_idx\` ON \`menu_panels\` (\`category_id\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_updated_at_idx\` ON \`menu_panels\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_created_at_idx\` ON \`menu_panels\` (\`created_at\`);`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
