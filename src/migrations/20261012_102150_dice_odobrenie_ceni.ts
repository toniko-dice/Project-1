import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`price_approvals\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`product_title\` text,
  	\`product_id\` integer,
  	\`sku\` text,
  	\`current_price\` numeric,
  	\`new_price\` numeric,
  	\`current_compare\` numeric,
  	\`new_compare\` numeric,
  	\`change_pct\` numeric,
  	\`change_abs\` numeric,
  	\`level\` text,
  	\`xml_date\` text,
  	\`change_abs_pct\` numeric,
  	\`warn\` integer,
  	\`status\` text DEFAULT 'pending',
  	\`decided_by\` text,
  	\`decided_at\` text,
  	\`batch\` text,
  	\`note\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`price_approvals_product_idx\` ON \`price_approvals\` (\`product_id\`);`)
  await db.run(sql`CREATE INDEX \`price_approvals_change_abs_pct_idx\` ON \`price_approvals\` (\`change_abs_pct\`);`)
  await db.run(sql`CREATE INDEX \`price_approvals_status_idx\` ON \`price_approvals\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`price_approvals_updated_at_idx\` ON \`price_approvals\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`price_approvals_created_at_idx\` ON \`price_approvals\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`price_history\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`product_id\` integer,
  	\`product_title\` text,
  	\`sku\` text,
  	\`price_old\` numeric,
  	\`price_new\` numeric,
  	\`compare_old\` numeric,
  	\`compare_new\` numeric,
  	\`changed_price\` integer,
  	\`changed_compare\` integer,
  	\`source\` text,
  	\`user\` text,
  	\`batch\` text,
  	\`approval_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`approval_id\`) REFERENCES \`price_approvals\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`price_history_product_idx\` ON \`price_history\` (\`product_id\`);`)
  await db.run(sql`CREATE INDEX \`price_history_batch_idx\` ON \`price_history\` (\`batch\`);`)
  await db.run(sql`CREATE INDEX \`price_history_approval_idx\` ON \`price_history\` (\`approval_id\`);`)
  await db.run(sql`CREATE INDEX \`price_history_updated_at_idx\` ON \`price_history\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`price_history_created_at_idx\` ON \`price_history\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`dice_syncs\` ADD \`price_batch\` text;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`price_approvals_id\` integer REFERENCES price_approvals(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`price_history_id\` integer REFERENCES price_history(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_price_approvals_id_idx\` ON \`payload_locked_documents_rels\` (\`price_approvals_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_price_history_id_idx\` ON \`payload_locked_documents_rels\` (\`price_history_id\`);`)
  await db.run(sql`ALTER TABLE \`dice_sync\` ADD \`mode\` text DEFAULT 'test';`)
  await db.run(sql`ALTER TABLE \`dice_sync\` ADD \`mode_changed\` text;`)
  await db.run(sql`ALTER TABLE \`dice_sync\` ADD \`test_xml\` text;`)
  await db.run(sql`ALTER TABLE \`dice_sync\` ADD \`test_file_name\` text;`)
  await db.run(sql`ALTER TABLE \`dice_sync\` ADD \`test_file_at\` text;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE \`price_approvals\`;`)
  await db.run(sql`DROP TABLE \`price_history\`;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`quote_requests_id\` integer,
  	\`contact_messages_id\` integer,
  	\`offers_id\` integer,
  	\`dice_syncs_id\` integer,
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
  	FOREIGN KEY (\`contact_messages_id\`) REFERENCES \`contact_messages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`offers_id\`) REFERENCES \`offers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`dice_syncs_id\`) REFERENCES \`dice_syncs\`(\`id\`) ON UPDATE no action ON DELETE cascade,
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
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "quote_requests_id", "contact_messages_id", "offers_id", "dice_syncs_id", "quote_files_id", "pages_id", "products_id", "categories_id", "attributes_id", "menu_panels_id", "media_id", "testimonials_id", "awards_id", "subscribers_id", "backups_id", "users_id", "redirects_id") SELECT "id", "order", "parent_id", "path", "quote_requests_id", "contact_messages_id", "offers_id", "dice_syncs_id", "quote_files_id", "pages_id", "products_id", "categories_id", "attributes_id", "menu_panels_id", "media_id", "testimonials_id", "awards_id", "subscribers_id", "backups_id", "users_id", "redirects_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_quote_requests_id_idx\` ON \`payload_locked_documents_rels\` (\`quote_requests_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_contact_messages_id_idx\` ON \`payload_locked_documents_rels\` (\`contact_messages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_offers_id_idx\` ON \`payload_locked_documents_rels\` (\`offers_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_dice_syncs_id_idx\` ON \`payload_locked_documents_rels\` (\`dice_syncs_id\`);`)
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
  await db.run(sql`ALTER TABLE \`dice_syncs\` DROP COLUMN \`price_batch\`;`)
  await db.run(sql`ALTER TABLE \`dice_sync\` DROP COLUMN \`mode\`;`)
  await db.run(sql`ALTER TABLE \`dice_sync\` DROP COLUMN \`mode_changed\`;`)
  await db.run(sql`ALTER TABLE \`dice_sync\` DROP COLUMN \`test_xml\`;`)
  await db.run(sql`ALTER TABLE \`dice_sync\` DROP COLUMN \`test_file_name\`;`)
  await db.run(sql`ALTER TABLE \`dice_sync\` DROP COLUMN \`test_file_at\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
