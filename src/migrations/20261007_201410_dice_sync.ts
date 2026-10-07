import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`dice_syncs\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`trigger\` text,
  	\`user\` text,
  	\`result\` text,
  	\`summary\` text,
  	\`updated\` numeric,
  	\`unchanged\` numeric,
  	\`not_found_count\` numeric,
  	\`error_count\` numeric,
  	\`changes\` text,
  	\`errors\` text,
  	\`not_found\` text,
  	\`missing_in_file\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`dice_syncs_updated_at_idx\` ON \`dice_syncs\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`dice_syncs_created_at_idx\` ON \`dice_syncs\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`dice_sync\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`enabled\` integer DEFAULT false,
  	\`hour\` numeric DEFAULT 6,
  	\`last_piece_threshold\` numeric DEFAULT 1,
  	\`url\` text,
  	\`update_price\` integer DEFAULT true,
  	\`update_availability\` integer DEFAULT true,
  	\`report_email\` text DEFAULT 'anton@dice.bg',
  	\`last_run\` text,
  	\`last_matched\` numeric,
  	\`last_auto_date\` text,
  	\`backup_done\` integer,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`ALTER TABLE \`products\` ADD \`stock_qty\` numeric;`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`hide_last_piece\` integer;`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`last_piece\` integer;`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`no_sync\` integer;`)
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_stock_qty\` numeric;`)
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_hide_last_piece\` integer;`)
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_last_piece\` integer;`)
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_no_sync\` integer;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`dice_syncs_id\` integer REFERENCES dice_syncs(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_dice_syncs_id_idx\` ON \`payload_locked_documents_rels\` (\`dice_syncs_id\`);`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE \`dice_syncs\`;`)
  await db.run(sql`DROP TABLE \`dice_sync\`;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`quote_requests_id\` integer,
  	\`offers_id\` integer,
  	\`quote_files_id\` integer,
  	\`pages_id\` integer,
  	\`products_id\` integer,
  	\`categories_id\` integer,
  	\`attributes_id\` integer,
  	\`menu_panels_id\` integer,
  	\`media_id\` integer,
  	\`testimonials_id\` integer,
  	\`awards_id\` integer,
  	\`subscribers_id\` integer,
  	\`backups_id\` integer,
  	\`users_id\` integer,
  	\`redirects_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`quote_requests_id\`) REFERENCES \`quote_requests\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`offers_id\`) REFERENCES \`offers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`quote_files_id\`) REFERENCES \`quote_files\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`attributes_id\`) REFERENCES \`attributes\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`menu_panels_id\`) REFERENCES \`menu_panels\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`testimonials_id\`) REFERENCES \`testimonials\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`awards_id\`) REFERENCES \`awards\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`subscribers_id\`) REFERENCES \`subscribers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`backups_id\`) REFERENCES \`backups\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`redirects_id\`) REFERENCES \`redirects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "quote_requests_id", "offers_id", "quote_files_id", "pages_id", "products_id", "categories_id", "attributes_id", "menu_panels_id", "media_id", "testimonials_id", "awards_id", "subscribers_id", "backups_id", "users_id", "redirects_id") SELECT "id", "order", "parent_id", "path", "quote_requests_id", "offers_id", "quote_files_id", "pages_id", "products_id", "categories_id", "attributes_id", "menu_panels_id", "media_id", "testimonials_id", "awards_id", "subscribers_id", "backups_id", "users_id", "redirects_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_quote_requests_id_idx\` ON \`payload_locked_documents_rels\` (\`quote_requests_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_offers_id_idx\` ON \`payload_locked_documents_rels\` (\`offers_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_quote_files_id_idx\` ON \`payload_locked_documents_rels\` (\`quote_files_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_products_id_idx\` ON \`payload_locked_documents_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_attributes_id_idx\` ON \`payload_locked_documents_rels\` (\`attributes_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_menu_panels_id_idx\` ON \`payload_locked_documents_rels\` (\`menu_panels_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_testimonials_id_idx\` ON \`payload_locked_documents_rels\` (\`testimonials_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_awards_id_idx\` ON \`payload_locked_documents_rels\` (\`awards_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_subscribers_id_idx\` ON \`payload_locked_documents_rels\` (\`subscribers_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_backups_id_idx\` ON \`payload_locked_documents_rels\` (\`backups_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_redirects_id_idx\` ON \`payload_locked_documents_rels\` (\`redirects_id\`);`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`stock_qty\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`hide_last_piece\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`last_piece\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`no_sync\`;`)
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_stock_qty\`;`)
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_hide_last_piece\`;`)
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_last_piece\`;`)
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_no_sync\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
