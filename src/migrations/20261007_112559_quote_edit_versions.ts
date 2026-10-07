import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`_quote_requests_v_version_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`product_id\` integer,
  	\`quantity\` numeric,
  	\`title\` text,
  	\`url\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_quote_requests_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_items_order_idx\` ON \`_quote_requests_v_version_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_items_parent_id_idx\` ON \`_quote_requests_v_version_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_items_product_idx\` ON \`_quote_requests_v_version_items\` (\`product_id\`);`)
  await db.run(sql`CREATE TABLE \`_quote_requests_v_version_purposes\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_quote_requests_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_purposes_order_idx\` ON \`_quote_requests_v_version_purposes\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_purposes_parent_idx\` ON \`_quote_requests_v_version_purposes\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_quote_requests_v_version_documents\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_quote_requests_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_documents_order_idx\` ON \`_quote_requests_v_version_documents\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_documents_parent_idx\` ON \`_quote_requests_v_version_documents\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_quote_requests_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_number\` text,
  	\`version_status\` text DEFAULT 'new' NOT NULL,
  	\`version_notes\` text,
  	\`version_last_change\` text,
  	\`version_client_type\` text,
  	\`version_organization\` text,
  	\`version_eik\` text,
  	\`version_city\` text,
  	\`version_contact_name\` text,
  	\`version_position\` text,
  	\`version_email\` text,
  	\`version_phone\` text,
  	\`version_items_summary\` text,
  	\`version_other_products\` text,
  	\`version_timeframe\` text,
  	\`version_budget\` text,
  	\`version_procurement\` text,
  	\`version_delivery_to\` text,
  	\`version_consultation\` text,
  	\`version_attachment_id\` integer,
  	\`version_details\` text,
  	\`version_consent\` integer,
  	\`version_ip\` text,
  	\`version_user_agent\` text,
  	\`version_mail_log\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`quote_requests\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_attachment_id\`) REFERENCES \`quote_files\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_parent_idx\` ON \`_quote_requests_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_version_number_idx\` ON \`_quote_requests_v\` (\`version_number\`);`)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_version_status_idx\` ON \`_quote_requests_v\` (\`version_status\`);`)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_version_organization_idx\` ON \`_quote_requests_v\` (\`version_organization\`);`)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_version_eik_idx\` ON \`_quote_requests_v\` (\`version_eik\`);`)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_version_email_idx\` ON \`_quote_requests_v\` (\`version_email\`);`)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_version_attachment_idx\` ON \`_quote_requests_v\` (\`version_attachment_id\`);`)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_version_updated_at_idx\` ON \`_quote_requests_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_version_created_at_idx\` ON \`_quote_requests_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_created_at_idx\` ON \`_quote_requests_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_updated_at_idx\` ON \`_quote_requests_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_quote_form\` (
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
  	\`below\` text,
  	\`success_title\` text DEFAULT 'Благодарим! Заявка № {номер} е получена.',
  	\`success_text\` text DEFAULT 'Ще ви изпратим оферта в максимално кратък срок. Благодарим ви за доверието!',
  	\`success_copy\` text DEFAULT 'Копие на заявката е изпратено на {имейл}.',
  	\`success_button\` text DEFAULT 'Към началната страница',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_pages_blocks_quote_form\`("_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "form_anchor", "heading", "intro", "privacy_url", "below", "success_title", "success_text", "success_copy", "success_button", "block_name") SELECT "_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "form_anchor", "heading", "intro", "privacy_url", "below", "success_title", "success_text", "success_copy", "success_button", "block_name" FROM \`pages_blocks_quote_form\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_quote_form\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_quote_form\` RENAME TO \`pages_blocks_quote_form\`;`)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_form_order_idx\` ON \`pages_blocks_quote_form\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_form_parent_id_idx\` ON \`pages_blocks_quote_form\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_form_path_idx\` ON \`pages_blocks_quote_form\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_quote_form\` (
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
  	\`below\` text,
  	\`success_title\` text DEFAULT 'Благодарим! Заявка № {номер} е получена.',
  	\`success_text\` text DEFAULT 'Ще ви изпратим оферта в максимално кратък срок. Благодарим ви за доверието!',
  	\`success_copy\` text DEFAULT 'Копие на заявката е изпратено на {имейл}.',
  	\`success_button\` text DEFAULT 'Към началната страница',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__pages_v_blocks_quote_form\`("_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "form_anchor", "heading", "intro", "privacy_url", "below", "success_title", "success_text", "success_copy", "success_button", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "form_anchor", "heading", "intro", "privacy_url", "below", "success_title", "success_text", "success_copy", "success_button", "_uuid", "block_name" FROM \`_pages_v_blocks_quote_form\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_quote_form\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_blocks_quote_form\` RENAME TO \`_pages_v_blocks_quote_form\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_quote_form_order_idx\` ON \`_pages_v_blocks_quote_form\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_quote_form_parent_id_idx\` ON \`_pages_v_blocks_quote_form\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_quote_form_path_idx\` ON \`_pages_v_blocks_quote_form\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`__new_categories_blocks_quote_form\` (
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
  	\`below\` text,
  	\`success_title\` text DEFAULT 'Благодарим! Заявка № {номер} е получена.',
  	\`success_text\` text DEFAULT 'Ще ви изпратим оферта в максимално кратък срок. Благодарим ви за доверието!',
  	\`success_copy\` text DEFAULT 'Копие на заявката е изпратено на {имейл}.',
  	\`success_button\` text DEFAULT 'Към началната страница',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_categories_blocks_quote_form\`("_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "form_anchor", "heading", "intro", "privacy_url", "below", "success_title", "success_text", "success_copy", "success_button", "block_name") SELECT "_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "form_anchor", "heading", "intro", "privacy_url", "below", "success_title", "success_text", "success_copy", "success_button", "block_name" FROM \`categories_blocks_quote_form\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_quote_form\`;`)
  await db.run(sql`ALTER TABLE \`__new_categories_blocks_quote_form\` RENAME TO \`categories_blocks_quote_form\`;`)
  await db.run(sql`CREATE INDEX \`categories_blocks_quote_form_order_idx\` ON \`categories_blocks_quote_form\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_quote_form_parent_id_idx\` ON \`categories_blocks_quote_form\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_quote_form_path_idx\` ON \`categories_blocks_quote_form\` (\`_path\`);`)
  await db.run(sql`ALTER TABLE \`quote_requests\` ADD \`last_change\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`trimmed_small\` text;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE \`_quote_requests_v_version_items\`;`)
  await db.run(sql`DROP TABLE \`_quote_requests_v_version_purposes\`;`)
  await db.run(sql`DROP TABLE \`_quote_requests_v_version_documents\`;`)
  await db.run(sql`DROP TABLE \`_quote_requests_v\`;`)
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_quote_form\` (
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
  await db.run(sql`INSERT INTO \`__new_pages_blocks_quote_form\`("_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "form_anchor", "heading", "intro", "privacy_url", "below", "success_title", "success_text", "success_copy", "success_button", "block_name") SELECT "_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "form_anchor", "heading", "intro", "privacy_url", "below", "success_title", "success_text", "success_copy", "success_button", "block_name" FROM \`pages_blocks_quote_form\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_quote_form\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_quote_form\` RENAME TO \`pages_blocks_quote_form\`;`)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_form_order_idx\` ON \`pages_blocks_quote_form\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_form_parent_id_idx\` ON \`pages_blocks_quote_form\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_quote_form_path_idx\` ON \`pages_blocks_quote_form\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_quote_form\` (
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
  await db.run(sql`INSERT INTO \`__new__pages_v_blocks_quote_form\`("_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "form_anchor", "heading", "intro", "privacy_url", "below", "success_title", "success_text", "success_copy", "success_button", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "form_anchor", "heading", "intro", "privacy_url", "below", "success_title", "success_text", "success_copy", "success_button", "_uuid", "block_name" FROM \`_pages_v_blocks_quote_form\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_quote_form\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_blocks_quote_form\` RENAME TO \`_pages_v_blocks_quote_form\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_quote_form_order_idx\` ON \`_pages_v_blocks_quote_form\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_quote_form_parent_id_idx\` ON \`_pages_v_blocks_quote_form\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_quote_form_path_idx\` ON \`_pages_v_blocks_quote_form\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`__new_categories_blocks_quote_form\` (
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
  await db.run(sql`INSERT INTO \`__new_categories_blocks_quote_form\`("_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "form_anchor", "heading", "intro", "privacy_url", "below", "success_title", "success_text", "success_copy", "success_button", "block_name") SELECT "_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "form_anchor", "heading", "intro", "privacy_url", "below", "success_title", "success_text", "success_copy", "success_button", "block_name" FROM \`categories_blocks_quote_form\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_quote_form\`;`)
  await db.run(sql`ALTER TABLE \`__new_categories_blocks_quote_form\` RENAME TO \`categories_blocks_quote_form\`;`)
  await db.run(sql`CREATE INDEX \`categories_blocks_quote_form_order_idx\` ON \`categories_blocks_quote_form\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_quote_form_parent_id_idx\` ON \`categories_blocks_quote_form\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_quote_form_path_idx\` ON \`categories_blocks_quote_form\` (\`_path\`);`)
  await db.run(sql`ALTER TABLE \`quote_requests\` DROP COLUMN \`last_change\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`trimmed_small\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
