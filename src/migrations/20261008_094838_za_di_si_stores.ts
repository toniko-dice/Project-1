import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_stores_stores_hours_days\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` text NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages_blocks_stores_stores_hours\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_stores_stores_hours_days_order_idx\` ON \`pages_blocks_stores_stores_hours_days\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_stores_stores_hours_days_parent_idx\` ON \`pages_blocks_stores_stores_hours_days\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_stores_stores_hours\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`opens\` text,
  	\`closes\` text,
  	\`closed\` integer,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_stores_stores\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_stores_stores_hours_order_idx\` ON \`pages_blocks_stores_stores_hours\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_stores_stores_hours_parent_id_idx\` ON \`pages_blocks_stores_stores_hours\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_stores_stores\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`street\` text,
  	\`city\` text,
  	\`map_url\` text,
  	\`phone\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_stores\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_stores_stores_order_idx\` ON \`pages_blocks_stores_stores\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_stores_stores_parent_id_idx\` ON \`pages_blocks_stores_stores\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_stores\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`note\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_stores_order_idx\` ON \`pages_blocks_stores\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_stores_parent_id_idx\` ON \`pages_blocks_stores\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_stores_path_idx\` ON \`pages_blocks_stores\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_stores_stores_hours_days\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v_blocks_stores_stores_hours\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_stores_stores_hours_days_order_idx\` ON \`_pages_v_blocks_stores_stores_hours_days\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_stores_stores_hours_days_parent_idx\` ON \`_pages_v_blocks_stores_stores_hours_days\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_stores_stores_hours\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`opens\` text,
  	\`closes\` text,
  	\`closed\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_stores_stores\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_stores_stores_hours_order_idx\` ON \`_pages_v_blocks_stores_stores_hours\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_stores_stores_hours_parent_id_idx\` ON \`_pages_v_blocks_stores_stores_hours\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_stores_stores\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`street\` text,
  	\`city\` text,
  	\`map_url\` text,
  	\`phone\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_stores\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_stores_stores_order_idx\` ON \`_pages_v_blocks_stores_stores\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_stores_stores_parent_id_idx\` ON \`_pages_v_blocks_stores_stores\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_stores\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`note\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_stores_order_idx\` ON \`_pages_v_blocks_stores\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_stores_parent_id_idx\` ON \`_pages_v_blocks_stores\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_stores_path_idx\` ON \`_pages_v_blocks_stores\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_stores_stores_hours_days\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` text NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`categories_blocks_stores_stores_hours\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_stores_stores_hours_days_order_idx\` ON \`categories_blocks_stores_stores_hours_days\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_stores_stores_hours_days_parent_idx\` ON \`categories_blocks_stores_stores_hours_days\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_stores_stores_hours\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`opens\` text,
  	\`closes\` text,
  	\`closed\` integer,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_stores_stores\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_stores_stores_hours_order_idx\` ON \`categories_blocks_stores_stores_hours\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_stores_stores_hours_parent_id_idx\` ON \`categories_blocks_stores_stores_hours\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_stores_stores\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`street\` text NOT NULL,
  	\`city\` text NOT NULL,
  	\`map_url\` text,
  	\`phone\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_stores\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_stores_stores_order_idx\` ON \`categories_blocks_stores_stores\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_stores_stores_parent_id_idx\` ON \`categories_blocks_stores_stores\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_stores\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`note\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_stores_order_idx\` ON \`categories_blocks_stores\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_stores_parent_id_idx\` ON \`categories_blocks_stores\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_stores_path_idx\` ON \`categories_blocks_stores\` (\`_path\`);`)
  await db.run(sql`ALTER TABLE \`pages_blocks_company_stats\` ADD \`variant\` text DEFAULT 'story';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_company_stats\` ADD \`theme\` text DEFAULT 'dark';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_company_stats\` ADD \`variant\` text DEFAULT 'story';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_company_stats\` ADD \`theme\` text DEFAULT 'dark';`)
  await db.run(sql`ALTER TABLE \`categories_blocks_company_stats\` ADD \`variant\` text DEFAULT 'story';`)
  await db.run(sql`ALTER TABLE \`categories_blocks_company_stats\` ADD \`theme\` text DEFAULT 'dark';`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`legal_name\` text;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`alternate_name\` text;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`vat_id\` text;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`founding_year\` numeric;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`address_street\` text;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`address_city\` text;`)
  /*
    Данните за фирмата в „Общи настройки" → „Контакти" → „Фирмата за
    търсачките" — от dice.bg/aboutus, потвърдени от собственика
    (`task-stranica-za-di-si-2008.md`). Попълват се само празните.
  */
  await db.run(sql`UPDATE \`site_settings\` SET
    \`legal_name\` = COALESCE(\`legal_name\`, 'ДИ СИ 2008 ООД'),
    \`alternate_name\` = COALESCE(\`alternate_name\`, 'Dice.bg'),
    \`vat_id\` = COALESCE(\`vat_id\`, 'BG200110465'),
    \`founding_year\` = COALESCE(\`founding_year\`, 2007),
    \`address_street\` = COALESCE(\`address_street\`, 'ул. „Драгоман“ 13'),
    \`address_city\` = COALESCE(\`address_city\`, 'Асеновград');`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_stores_stores_hours_days\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_stores_stores_hours\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_stores_stores\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_stores\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_stores_stores_hours_days\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_stores_stores_hours\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_stores_stores\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_stores\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_stores_stores_hours_days\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_stores_stores_hours\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_stores_stores\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_stores\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_company_stats\` DROP COLUMN \`variant\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_company_stats\` DROP COLUMN \`theme\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_company_stats\` DROP COLUMN \`variant\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_company_stats\` DROP COLUMN \`theme\`;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_company_stats\` DROP COLUMN \`variant\`;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_company_stats\` DROP COLUMN \`theme\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`legal_name\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`alternate_name\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`vat_id\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`founding_year\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`address_street\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`address_city\`;`)
}
