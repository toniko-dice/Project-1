import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`contact_messages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`status\` text DEFAULT 'new' NOT NULL,
  	\`notes\` text,
  	\`name\` text NOT NULL,
  	\`phone\` text,
  	\`email\` text NOT NULL,
  	\`message\` text NOT NULL,
  	\`consent\` integer,
  	\`page\` text,
  	\`ip\` text,
  	\`user_agent\` text,
  	\`mail_log\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`contact_messages_status_idx\` ON \`contact_messages\` (\`status\`);`)
  await db.run(sql`CREATE INDEX \`contact_messages_updated_at_idx\` ON \`contact_messages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`contact_messages_created_at_idx\` ON \`contact_messages\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`info_pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`faq_title\` text DEFAULT 'Често задавани въпроси',
  	\`faq_intro\` text DEFAULT 'Отговори на най-честите въпроси за продуктите EcoFlow. Не намирате отговор? [Пишете ни](/kontakti).',
  	\`faq_meta_title\` text DEFAULT 'Често задавани въпроси за EcoFlow | EcoFlow България',
  	\`faq_meta_description\` text DEFAULT 'Отговори на въпросите за портативните електроцентрали, соларните панели и домашните системи EcoFlow — зареждане, капацитет, гаранция и употреба.',
  	\`contact_title\` text DEFAULT 'Контакти',
  	\`contact_intro\` text DEFAULT 'Имате въпрос за продукт, гаранция или поръчка? Пишете ни и ще ви отговорим.',
  	\`contact_success\` text DEFAULT 'Благодарим! Съобщението ви е изпратено. Ще ви отговорим на {имейл} възможно най-скоро.',
  	\`contact_meta_title\` text DEFAULT 'Контакти | EcoFlow България',
  	\`contact_meta_description\` text DEFAULT 'Свържете се с ДИ СИ 2008 — официалния представител на EcoFlow за България. Форма за контакт, имейл, адреси и работно време на магазините.',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`__new_offer_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`company_name\` text DEFAULT 'ДИ СИ 2008 ООД',
  	\`company_eik\` text DEFAULT '200110465',
  	\`company_vat_number\` text DEFAULT 'BG200110465',
  	\`company_address\` text DEFAULT 'гр. Асеновград, ул. Драгоман 13',
  	\`company_mol\` text DEFAULT 'Антон Божанов',
  	\`company_phone\` text,
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
  	\`defaults_note\` text DEFAULT 'Настоящата оферта не е данъчен документ. Цените са в евро с включен ДДС.',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`INSERT INTO \`__new_offer_settings\`("id", "company_name", "company_eik", "company_vat_number", "company_address", "company_mol", "company_phone", "company_email", "company_website", "bank_iban", "bank_bic", "bank_bank_name", "defaults_validity_days", "defaults_vat_rate", "defaults_payment", "defaults_payment_other", "defaults_delivery_time", "defaults_delivery_terms", "defaults_warranty", "defaults_note", "updated_at", "created_at") SELECT "id", "company_name", "company_eik", "company_vat_number", "company_address", "company_mol", "company_phone", "company_email", "company_website", "bank_iban", "bank_bic", "bank_bank_name", "defaults_validity_days", "defaults_vat_rate", "defaults_payment", "defaults_payment_other", "defaults_delivery_time", "defaults_delivery_terms", "defaults_warranty", "defaults_note", "updated_at", "created_at" FROM \`offer_settings\`;`)
  await db.run(sql`DROP TABLE \`offer_settings\`;`)
  await db.run(sql`ALTER TABLE \`__new_offer_settings\` RENAME TO \`offer_settings\`;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`contact_messages_id\` integer REFERENCES contact_messages(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_contact_messages_id_idx\` ON \`payload_locked_documents_rels\` (\`contact_messages_id\`);`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE \`contact_messages\`;`)
  await db.run(sql`DROP TABLE \`info_pages\`;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`quote_requests_id\` integer,
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
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "quote_requests_id", "offers_id", "dice_syncs_id", "quote_files_id", "pages_id", "products_id", "categories_id", "attributes_id", "menu_panels_id", "media_id", "testimonials_id", "awards_id", "subscribers_id", "backups_id", "users_id", "redirects_id") SELECT "id", "order", "parent_id", "path", "quote_requests_id", "offers_id", "dice_syncs_id", "quote_files_id", "pages_id", "products_id", "categories_id", "attributes_id", "menu_panels_id", "media_id", "testimonials_id", "awards_id", "subscribers_id", "backups_id", "users_id", "redirects_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_quote_requests_id_idx\` ON \`payload_locked_documents_rels\` (\`quote_requests_id\`);`)
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
  await db.run(sql`CREATE TABLE \`__new_offer_settings\` (
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
  	\`defaults_note\` text DEFAULT 'Настоящата оферта не е данъчен документ. Цените са в евро с включен ДДС.',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`INSERT INTO \`__new_offer_settings\`("id", "company_name", "company_eik", "company_vat_number", "company_address", "company_mol", "company_phone", "company_email", "company_website", "bank_iban", "bank_bic", "bank_bank_name", "defaults_validity_days", "defaults_vat_rate", "defaults_payment", "defaults_payment_other", "defaults_delivery_time", "defaults_delivery_terms", "defaults_warranty", "defaults_note", "updated_at", "created_at") SELECT "id", "company_name", "company_eik", "company_vat_number", "company_address", "company_mol", "company_phone", "company_email", "company_website", "bank_iban", "bank_bic", "bank_bank_name", "defaults_validity_days", "defaults_vat_rate", "defaults_payment", "defaults_payment_other", "defaults_delivery_time", "defaults_delivery_terms", "defaults_warranty", "defaults_note", "updated_at", "created_at" FROM \`offer_settings\`;`)
  await db.run(sql`DROP TABLE \`offer_settings\`;`)
  await db.run(sql`ALTER TABLE \`__new_offer_settings\` RENAME TO \`offer_settings\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
