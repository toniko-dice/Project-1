import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
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
  await db.run(sql`ALTER TABLE \`offers\` ADD \`general_discount\` numeric;`)
  await db.run(sql`ALTER TABLE \`_offers_v\` ADD \`version_general_discount\` numeric;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
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
  	\`defaults_note\` text DEFAULT 'Настоящата оферта не е данъчен документ. Цените са в евро.',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`INSERT INTO \`__new_offer_settings\`("id", "company_name", "company_eik", "company_vat_number", "company_address", "company_mol", "company_phone", "company_email", "company_website", "bank_iban", "bank_bic", "bank_bank_name", "defaults_validity_days", "defaults_vat_rate", "defaults_payment", "defaults_payment_other", "defaults_delivery_time", "defaults_delivery_terms", "defaults_warranty", "defaults_note", "updated_at", "created_at") SELECT "id", "company_name", "company_eik", "company_vat_number", "company_address", "company_mol", "company_phone", "company_email", "company_website", "bank_iban", "bank_bic", "bank_bank_name", "defaults_validity_days", "defaults_vat_rate", "defaults_payment", "defaults_payment_other", "defaults_delivery_time", "defaults_delivery_terms", "defaults_warranty", "defaults_note", "updated_at", "created_at" FROM \`offer_settings\`;`)
  await db.run(sql`DROP TABLE \`offer_settings\`;`)
  await db.run(sql`ALTER TABLE \`__new_offer_settings\` RENAME TO \`offer_settings\`;`)
  await db.run(sql`ALTER TABLE \`offers\` DROP COLUMN \`general_discount\`;`)
  await db.run(sql`ALTER TABLE \`_offers_v\` DROP COLUMN \`version_general_discount\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
