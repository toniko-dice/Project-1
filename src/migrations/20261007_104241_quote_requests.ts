import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`quote_requests_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`product_id\` integer,
  	\`title\` text,
  	\`url\` text,
  	\`quantity\` numeric,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`quote_requests\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`quote_requests_items_order_idx\` ON \`quote_requests_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`quote_requests_items_parent_id_idx\` ON \`quote_requests_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`quote_requests_items_product_idx\` ON \`quote_requests_items\` (\`product_id\`);`)
  await db.run(sql`CREATE TABLE \`quote_requests_purposes\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`quote_requests\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`quote_requests_purposes_order_idx\` ON \`quote_requests_purposes\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`quote_requests_purposes_parent_idx\` ON \`quote_requests_purposes\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`quote_requests_documents\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`quote_requests\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`quote_requests_documents_order_idx\` ON \`quote_requests_documents\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`quote_requests_documents_parent_idx\` ON \`quote_requests_documents\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`quote_requests\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`number\` text,
  	\`status\` text DEFAULT 'new' NOT NULL,
  	\`notes\` text,
  	\`client_type\` text,
  	\`organization\` text,
  	\`eik\` text,
  	\`city\` text,
  	\`contact_name\` text,
  	\`position\` text,
  	\`email\` text,
  	\`phone\` text,
  	\`items_summary\` text,
  	\`other_products\` text,
  	\`timeframe\` text,
  	\`budget\` text,
  	\`procurement\` text,
  	\`delivery_to\` text,
  	\`consultation\` text,
  	\`attachment_id\` integer,
  	\`details\` text,
  	\`consent\` integer,
  	\`ip\` text,
  	\`user_agent\` text,
  	\`mail_log\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`attachment_id\`) REFERENCES \`quote_files\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`quote_requests_number_idx\` ON \`quote_requests\` (\`number\`);`)
  await db.run(sql`CREATE INDEX \`quote_requests_status_idx\` ON \`quote_requests\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`quote_requests_organization_idx\` ON \`quote_requests\` (\`organization\`);`)
  await db.run(sql`CREATE INDEX \`quote_requests_eik_idx\` ON \`quote_requests\` (\`eik\`);`)
  await db.run(sql`CREATE INDEX \`quote_requests_email_idx\` ON \`quote_requests\` (\`email\`);`)
  await db.run(sql`CREATE INDEX \`quote_requests_attachment_idx\` ON \`quote_requests\` (\`attachment_id\`);`)
  await db.run(sql`CREATE INDEX \`quote_requests_updated_at_idx\` ON \`quote_requests\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`quote_requests_created_at_idx\` ON \`quote_requests\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`quote_files\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric
  );
  `)
  await db.run(sql`CREATE INDEX \`quote_files_updated_at_idx\` ON \`quote_files\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`quote_files_created_at_idx\` ON \`quote_files\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`quote_files_filename_idx\` ON \`quote_files\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_page_intro\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`body\` text,
  	\`cta_label\` text,
  	\`cta_url\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_page_intro_order_idx\` ON \`pages_blocks_page_intro\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_page_intro_parent_id_idx\` ON \`pages_blocks_page_intro\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_page_intro_path_idx\` ON \`pages_blocks_page_intro\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_quote_form_tabs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`category_id\` integer,
  	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_quote_form\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_form_tabs_order_idx\` ON \`pages_blocks_quote_form_tabs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_form_tabs_parent_id_idx\` ON \`pages_blocks_quote_form_tabs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_form_tabs_category_idx\` ON \`pages_blocks_quote_form_tabs\` (\`category_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_quote_form\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`form_anchor\` text DEFAULT 'zayavka',
  	\`heading\` text DEFAULT 'Заявка за оферта',
  	\`intro\` text DEFAULT 'Попълнете данните на организацията и изберете продуктите. Полетата със * са задължителни.',
  	\`privacy_url\` text DEFAULT '/poveritelnost',
  	\`below\` text DEFAULT 'Предпочитате да говорим? Обадете се на {телефон} или пишете на {имейл}.',
  	\`success_title\` text DEFAULT 'Благодарим! Заявка № {номер} е получена.',
  	\`success_text\` text DEFAULT 'Ще ви изпратим оферта в максимално кратък срок. Благодарим ви за доверието!',
  	\`success_copy\` text DEFAULT 'Копие на заявката е изпратено на {имейл}.',
  	\`success_button\` text DEFAULT 'Към началната страница',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_form_order_idx\` ON \`pages_blocks_quote_form\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_form_parent_id_idx\` ON \`pages_blocks_quote_form\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_form_path_idx\` ON \`pages_blocks_quote_form\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_page_intro\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`body\` text,
  	\`cta_label\` text,
  	\`cta_url\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_page_intro_order_idx\` ON \`_pages_v_blocks_page_intro\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_page_intro_parent_id_idx\` ON \`_pages_v_blocks_page_intro\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_page_intro_path_idx\` ON \`_pages_v_blocks_page_intro\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_quote_form_tabs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`category_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_quote_form\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_quote_form_tabs_order_idx\` ON \`_pages_v_blocks_quote_form_tabs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_quote_form_tabs_parent_id_idx\` ON \`_pages_v_blocks_quote_form_tabs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_quote_form_tabs_category_idx\` ON \`_pages_v_blocks_quote_form_tabs\` (\`category_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_quote_form\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`form_anchor\` text DEFAULT 'zayavka',
  	\`heading\` text DEFAULT 'Заявка за оферта',
  	\`intro\` text DEFAULT 'Попълнете данните на организацията и изберете продуктите. Полетата със * са задължителни.',
  	\`privacy_url\` text DEFAULT '/poveritelnost',
  	\`below\` text DEFAULT 'Предпочитате да говорим? Обадете се на {телефон} или пишете на {имейл}.',
  	\`success_title\` text DEFAULT 'Благодарим! Заявка № {номер} е получена.',
  	\`success_text\` text DEFAULT 'Ще ви изпратим оферта в максимално кратък срок. Благодарим ви за доверието!',
  	\`success_copy\` text DEFAULT 'Копие на заявката е изпратено на {имейл}.',
  	\`success_button\` text DEFAULT 'Към началната страница',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_quote_form_order_idx\` ON \`_pages_v_blocks_quote_form\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_quote_form_parent_id_idx\` ON \`_pages_v_blocks_quote_form\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_quote_form_path_idx\` ON \`_pages_v_blocks_quote_form\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_page_intro\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`body\` text,
  	\`cta_label\` text,
  	\`cta_url\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_page_intro_order_idx\` ON \`categories_blocks_page_intro\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_page_intro_parent_id_idx\` ON \`categories_blocks_page_intro\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_page_intro_path_idx\` ON \`categories_blocks_page_intro\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_quote_form_tabs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`category_id\` integer,
  	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_quote_form\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_quote_form_tabs_order_idx\` ON \`categories_blocks_quote_form_tabs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_quote_form_tabs_parent_id_idx\` ON \`categories_blocks_quote_form_tabs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_quote_form_tabs_category_idx\` ON \`categories_blocks_quote_form_tabs\` (\`category_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_quote_form\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`form_anchor\` text DEFAULT 'zayavka',
  	\`heading\` text DEFAULT 'Заявка за оферта',
  	\`intro\` text DEFAULT 'Попълнете данните на организацията и изберете продуктите. Полетата със * са задължителни.',
  	\`privacy_url\` text DEFAULT '/poveritelnost',
  	\`below\` text DEFAULT 'Предпочитате да говорим? Обадете се на {телефон} или пишете на {имейл}.',
  	\`success_title\` text DEFAULT 'Благодарим! Заявка № {номер} е получена.',
  	\`success_text\` text DEFAULT 'Ще ви изпратим оферта в максимално кратък срок. Благодарим ви за доверието!',
  	\`success_copy\` text DEFAULT 'Копие на заявката е изпратено на {имейл}.',
  	\`success_button\` text DEFAULT 'Към началната страница',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_quote_form_order_idx\` ON \`categories_blocks_quote_form\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_quote_form_parent_id_idx\` ON \`categories_blocks_quote_form\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_quote_form_path_idx\` ON \`categories_blocks_quote_form\` (\`_path\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`quote_requests_id\` integer REFERENCES quote_requests(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`quote_files_id\` integer REFERENCES quote_files(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_quote_requests_id_idx\` ON \`payload_locked_documents_rels\` (\`quote_requests_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_quote_files_id_idx\` ON \`payload_locked_documents_rels\` (\`quote_files_id\`);`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE \`quote_requests_items\`;`)
  await db.run(sql`DROP TABLE \`quote_requests_purposes\`;`)
  await db.run(sql`DROP TABLE \`quote_requests_documents\`;`)
  await db.run(sql`DROP TABLE \`quote_requests\`;`)
  await db.run(sql`DROP TABLE \`quote_files\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_page_intro\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_quote_form_tabs\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_quote_form\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_page_intro\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_quote_form_tabs\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_quote_form\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_page_intro\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_quote_form_tabs\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_quote_form\`;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
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
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "pages_id", "products_id", "categories_id", "attributes_id", "menu_panels_id", "media_id", "testimonials_id", "awards_id", "subscribers_id", "backups_id", "users_id", "redirects_id") SELECT "id", "order", "parent_id", "path", "pages_id", "products_id", "categories_id", "attributes_id", "menu_panels_id", "media_id", "testimonials_id", "awards_id", "subscribers_id", "backups_id", "users_id", "redirects_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
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
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
