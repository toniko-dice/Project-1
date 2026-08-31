import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_site_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`announcement_enabled\` integer DEFAULT true,
  	\`announcement_text\` text,
  	\`announcement_url\` text,
  	\`logo_id\` integer,
  	\`logo_dark_id\` integer,
  	\`brand_color\` text DEFAULT '#00A862',
  	\`shop_url\` text,
  	\`show_bgn_prices\` integer DEFAULT false,
  	\`company_name\` text,
  	\`vat_number\` text,
  	\`address\` text,
  	\`phone\` text,
  	\`email\` text,
  	\`distributor_notice\` text DEFAULT 'Официален дистрибутор на EcoFlow за България',
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`logo_dark_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_site_settings\`("id", "announcement_enabled", "announcement_text", "announcement_url", "logo_id", "logo_dark_id", "brand_color", "shop_url", "show_bgn_prices", "company_name", "vat_number", "address", "phone", "email", "distributor_notice", "updated_at", "created_at") SELECT "id", "announcement_enabled", "announcement_text", "announcement_url", "logo_id", "logo_dark_id", "brand_color", "shop_url", "show_bgn_prices", "company_name", "vat_number", "address", "phone", "email", "distributor_notice", "updated_at", "created_at" FROM \`site_settings\`;`)
  await db.run(sql`DROP TABLE \`site_settings\`;`)
  await db.run(sql`ALTER TABLE \`__new_site_settings\` RENAME TO \`site_settings\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`site_settings_logo_idx\` ON \`site_settings\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`site_settings_logo_dark_idx\` ON \`site_settings\` (\`logo_dark_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_site_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`announcement_enabled\` integer DEFAULT true,
  	\`announcement_text\` text,
  	\`announcement_url\` text,
  	\`logo_id\` integer,
  	\`logo_dark_id\` integer,
  	\`brand_color\` text DEFAULT '#00A862',
  	\`shop_url\` text,
  	\`show_bgn_prices\` integer DEFAULT true,
  	\`company_name\` text,
  	\`vat_number\` text,
  	\`address\` text,
  	\`phone\` text,
  	\`email\` text,
  	\`distributor_notice\` text DEFAULT 'Официален дистрибутор на EcoFlow за България',
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`logo_dark_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_site_settings\`("id", "announcement_enabled", "announcement_text", "announcement_url", "logo_id", "logo_dark_id", "brand_color", "shop_url", "show_bgn_prices", "company_name", "vat_number", "address", "phone", "email", "distributor_notice", "updated_at", "created_at") SELECT "id", "announcement_enabled", "announcement_text", "announcement_url", "logo_id", "logo_dark_id", "brand_color", "shop_url", "show_bgn_prices", "company_name", "vat_number", "address", "phone", "email", "distributor_notice", "updated_at", "created_at" FROM \`site_settings\`;`)
  await db.run(sql`DROP TABLE \`site_settings\`;`)
  await db.run(sql`ALTER TABLE \`__new_site_settings\` RENAME TO \`site_settings\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`site_settings_logo_idx\` ON \`site_settings\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`site_settings_logo_dark_idx\` ON \`site_settings\` (\`logo_dark_id\`);`)
}
