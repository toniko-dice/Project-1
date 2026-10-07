import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`offers_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`product_id\` integer,
  	\`title\` text,
  	\`sku\` text,
  	\`ean\` text,
  	\`image_id\` integer,
  	\`quantity\` numeric DEFAULT 1,
  	\`unit_price\` numeric,
  	\`discount\` numeric,
  	\`line_total\` numeric,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`offers\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`offers_items_order_idx\` ON \`offers_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`offers_items_parent_id_idx\` ON \`offers_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`offers_items_product_idx\` ON \`offers_items\` (\`product_id\`);`)
  await db.run(sql`CREATE INDEX \`offers_items_image_idx\` ON \`offers_items\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`offers\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`number\` text,
  	\`status\` text DEFAULT 'draft' NOT NULL,
  	\`quote_request_id\` integer,
  	\`request_number\` text,
  	\`date\` text,
  	\`valid_until\` text,
  	\`client_organization\` text,
  	\`client_eik\` text,
  	\`client_vat_number\` text,
  	\`client_address\` text,
  	\`client_contact_person\` text,
  	\`client_email\` text,
  	\`client_phone\` text,
  	\`terms_payment\` text,
  	\`terms_payment_other\` text,
  	\`terms_delivery_time\` text,
  	\`terms_delivery_terms\` text,
  	\`terms_warranty\` text,
  	\`terms_validity_days\` numeric,
  	\`terms_vat_rate\` numeric,
  	\`terms_note\` text,
  	\`prepared_by_name\` text,
  	\`prepared_by_position\` text,
  	\`sent_at\` text,
  	\`sent_to\` text,
  	\`send_log\` text,
  	\`totals_subtotal\` numeric,
  	\`totals_vat\` numeric,
  	\`totals_total\` numeric,
  	\`internal_notes\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`quote_request_id\`) REFERENCES \`quote_requests\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`offers_number_idx\` ON \`offers\` (\`number\`);`)
  await db.run(sql`CREATE INDEX \`offers_quote_request_idx\` ON \`offers\` (\`quote_request_id\`);`)
  await db.run(sql`CREATE INDEX \`offers_updated_at_idx\` ON \`offers\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`offers_created_at_idx\` ON \`offers\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`_offers_v_version_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`product_id\` integer,
  	\`title\` text,
  	\`sku\` text,
  	\`ean\` text,
  	\`image_id\` integer,
  	\`quantity\` numeric DEFAULT 1,
  	\`unit_price\` numeric,
  	\`discount\` numeric,
  	\`line_total\` numeric,
  	\`_uuid\` text,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_offers_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_offers_v_version_items_order_idx\` ON \`_offers_v_version_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_version_items_parent_id_idx\` ON \`_offers_v_version_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_version_items_product_idx\` ON \`_offers_v_version_items\` (\`product_id\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_version_items_image_idx\` ON \`_offers_v_version_items\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_offers_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_number\` text,
  	\`version_status\` text DEFAULT 'draft' NOT NULL,
  	\`version_quote_request_id\` integer,
  	\`version_request_number\` text,
  	\`version_date\` text,
  	\`version_valid_until\` text,
  	\`version_client_organization\` text,
  	\`version_client_eik\` text,
  	\`version_client_vat_number\` text,
  	\`version_client_address\` text,
  	\`version_client_contact_person\` text,
  	\`version_client_email\` text,
  	\`version_client_phone\` text,
  	\`version_terms_payment\` text,
  	\`version_terms_payment_other\` text,
  	\`version_terms_delivery_time\` text,
  	\`version_terms_delivery_terms\` text,
  	\`version_terms_warranty\` text,
  	\`version_terms_validity_days\` numeric,
  	\`version_terms_vat_rate\` numeric,
  	\`version_terms_note\` text,
  	\`version_prepared_by_name\` text,
  	\`version_prepared_by_position\` text,
  	\`version_sent_at\` text,
  	\`version_sent_to\` text,
  	\`version_send_log\` text,
  	\`version_totals_subtotal\` numeric,
  	\`version_totals_vat\` numeric,
  	\`version_totals_total\` numeric,
  	\`version_internal_notes\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`offers\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_quote_request_id\`) REFERENCES \`quote_requests\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_offers_v_parent_idx\` ON \`_offers_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_version_version_number_idx\` ON \`_offers_v\` (\`version_number\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_version_version_quote_request_idx\` ON \`_offers_v\` (\`version_quote_request_id\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_version_version_updated_at_idx\` ON \`_offers_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_version_version_created_at_idx\` ON \`_offers_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_created_at_idx\` ON \`_offers_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_offers_v_updated_at_idx\` ON \`_offers_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE TABLE \`offer_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`company_name\` text DEFAULT 'ДИ СИ 2008 ООД',
  	\`company_eik\` text DEFAULT '200110465',
  	\`company_vat_number\` text DEFAULT 'BG200110465',
  	\`company_address\` text DEFAULT 'гр. Асеновград, ул. Драгоман 13',
  	\`company_mol\` text DEFAULT 'Антон Божанов',
  	\`company_phone\` text DEFAULT '+359 879 437 744',
  	\`company_email\` text DEFAULT 'support@dice.bg',
  	\`company_website\` text DEFAULT 'bg-ecoflow.com',
  	\`bank_iban\` text DEFAULT 'BG15BPBI79421025115701',
  	\`bank_bic\` text DEFAULT 'BPBIBGSF',
  	\`bank_bank_name\` text DEFAULT 'Юробанк България (Пощенска банка)',
  	\`defaults_validity_days\` numeric DEFAULT 14,
  	\`defaults_vat_rate\` numeric DEFAULT 20,
  	\`defaults_payment\` text DEFAULT 'advance100',
  	\`defaults_payment_other\` text,
  	\`defaults_delivery_time\` text DEFAULT 'до 10 работни дни след получаване на плащането',
  	\`defaults_delivery_terms\` text DEFAULT 'Доставката е за сметка на клиента.',
  	\`defaults_warranty\` text DEFAULT 'Съгласно гаранционните условия на производителя: bg-ecoflow.com/garanciya',
  	\`defaults_note\` text DEFAULT 'Настоящата оферта не е данъчен документ. Цените са в евро.',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`ALTER TABLE \`quote_requests_items\` ADD \`sku\` text;`)
  await db.run(sql`ALTER TABLE \`quote_requests_items\` ADD \`ean\` text;`)
  await db.run(sql`ALTER TABLE \`quote_requests_items\` ADD \`image_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`quote_requests_items_image_idx\` ON \`quote_requests_items\` (\`image_id\`);`)
  await db.run(sql`ALTER TABLE \`_quote_requests_v_version_items\` ADD \`sku\` text;`)
  await db.run(sql`ALTER TABLE \`_quote_requests_v_version_items\` ADD \`ean\` text;`)
  await db.run(sql`ALTER TABLE \`_quote_requests_v_version_items\` ADD \`image_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_items_image_idx\` ON \`_quote_requests_v_version_items\` (\`image_id\`);`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`position\` text;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`offers_id\` integer REFERENCES offers(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_offers_id_idx\` ON \`payload_locked_documents_rels\` (\`offers_id\`);`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE \`offers_items\`;`)
  await db.run(sql`DROP TABLE \`offers\`;`)
  await db.run(sql`DROP TABLE \`_offers_v_version_items\`;`)
  await db.run(sql`DROP TABLE \`_offers_v\`;`)
  await db.run(sql`DROP TABLE \`offer_settings\`;`)
  await db.run(sql`CREATE TABLE \`__new_quote_requests_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`product_id\` integer,
  	\`quantity\` numeric,
  	\`title\` text,
  	\`url\` text,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`quote_requests\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_quote_requests_items\`("_order", "_parent_id", "id", "product_id", "quantity", "title", "url") SELECT "_order", "_parent_id", "id", "product_id", "quantity", "title", "url" FROM \`quote_requests_items\`;`)
  await db.run(sql`DROP TABLE \`quote_requests_items\`;`)
  await db.run(sql`ALTER TABLE \`__new_quote_requests_items\` RENAME TO \`quote_requests_items\`;`)
  await db.run(sql`CREATE INDEX \`quote_requests_items_order_idx\` ON \`quote_requests_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`quote_requests_items_parent_id_idx\` ON \`quote_requests_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`quote_requests_items_product_idx\` ON \`quote_requests_items\` (\`product_id\`);`)
  await db.run(sql`CREATE TABLE \`__new__quote_requests_v_version_items\` (
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
  await db.run(sql`INSERT INTO \`__new__quote_requests_v_version_items\`("_order", "_parent_id", "id", "product_id", "quantity", "title", "url", "_uuid") SELECT "_order", "_parent_id", "id", "product_id", "quantity", "title", "url", "_uuid" FROM \`_quote_requests_v_version_items\`;`)
  await db.run(sql`DROP TABLE \`_quote_requests_v_version_items\`;`)
  await db.run(sql`ALTER TABLE \`__new__quote_requests_v_version_items\` RENAME TO \`_quote_requests_v_version_items\`;`)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_items_order_idx\` ON \`_quote_requests_v_version_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_items_parent_id_idx\` ON \`_quote_requests_v_version_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_quote_requests_v_version_items_product_idx\` ON \`_quote_requests_v_version_items\` (\`product_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`quote_requests_id\` integer,
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
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "quote_requests_id", "quote_files_id", "pages_id", "products_id", "categories_id", "attributes_id", "menu_panels_id", "media_id", "testimonials_id", "awards_id", "subscribers_id", "backups_id", "users_id", "redirects_id") SELECT "id", "order", "parent_id", "path", "quote_requests_id", "quote_files_id", "pages_id", "products_id", "categories_id", "attributes_id", "menu_panels_id", "media_id", "testimonials_id", "awards_id", "subscribers_id", "backups_id", "users_id", "redirects_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_quote_requests_id_idx\` ON \`payload_locked_documents_rels\` (\`quote_requests_id\`);`)
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
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`position\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
