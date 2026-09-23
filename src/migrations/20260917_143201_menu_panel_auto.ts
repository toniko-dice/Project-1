import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
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
  await db.run(sql`INSERT INTO \`__new_menu_panels\`("id", "_order", "title", "slug", "mode", "category_id", "updated_at", "created_at") SELECT "id", "_order", "title", "slug", NULL, NULL, "updated_at", "created_at" FROM \`menu_panels\`;`)
  await db.run(sql`DROP TABLE \`menu_panels\`;`)
  await db.run(sql`ALTER TABLE \`__new_menu_panels\` RENAME TO \`menu_panels\`;`)

  /*
    СЪЩЕСТВУВАЩИТЕ ПАНЕЛИ СА РЪЧНИ.

    Стойността по подразбиране „auto" е за НОВИТЕ панели. Всички панели
    отпреди тази миграция са попълвани на ръка и нямат категория. Оставени
    с празен режим, секциите им биха се скрили в админа (виждат се само
    при „manual"), а собственикът би заварил двайсет панела без съдържание.
  */
  await db.run(sql`UPDATE \`menu_panels\` SET \`mode\` = 'manual' WHERE \`mode\` IS NULL;`)

  await db.run(sql`CREATE INDEX \`menu_panels__order_idx\` ON \`menu_panels\` (\`_order\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`menu_panels_slug_idx\` ON \`menu_panels\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_category_idx\` ON \`menu_panels\` (\`category_id\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_updated_at_idx\` ON \`menu_panels\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_created_at_idx\` ON \`menu_panels\` (\`created_at\`);`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
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
  await db.run(sql`CREATE TABLE \`__new_menu_panels_sections_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text NOT NULL,
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
  	\`heading\` text NOT NULL,
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
