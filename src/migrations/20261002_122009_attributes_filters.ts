import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Атрибути за филтрите, отметката „Филтри отстрани" и текстовете на
 * страницата „Аксесоари за …".
 *
 * Само нови таблици и нови колони — нищо не се пресъздава, връзките на
 * съществуващите таблици не се пипат. `PRAGMA foreign_keys` стои първи и
 * последен и в двете посоки (т. 7 в CLAUDE.md).
 *
 * Отметката се включва за категориите с аксесоари: „Аксесоари", седемте
 * ѝ подкатегории и „Монтаж и кабели за панели". После е на собственика.
 */
const С_ФИЛТРИ = [
  'aksesoari',
  'dopalnitelni-baterii',
  'kabeli',
  'adapteri',
  'zaryadni-ustroystva',
  'vanshni-baterii',
  'chanti-i-kalafi',
  'drugi-aksesoari',
  'montazh-i-kabeli-za-paneli',
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`products_attributes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`attribute_id\` integer,
  	\`value\` text,
  	FOREIGN KEY (\`attribute_id\`) REFERENCES \`attributes\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_attributes_order_idx\` ON \`products_attributes\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_attributes_parent_id_idx\` ON \`products_attributes\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_attributes_attribute_idx\` ON \`products_attributes\` (\`attribute_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_version_attributes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`attribute_id\` integer,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`attribute_id\`) REFERENCES \`attributes\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_version_attributes_order_idx\` ON \`_products_v_version_attributes\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_attributes_parent_id_idx\` ON \`_products_v_version_attributes\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_attributes_attribute_idx\` ON \`_products_v_version_attributes\` (\`attribute_id\`);`)
  await db.run(sql`CREATE TABLE \`attributes\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`type\` text DEFAULT 'number' NOT NULL,
  	\`unit\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`attributes__order_idx\` ON \`attributes\` (\`_order\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`attributes_slug_idx\` ON \`attributes\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`attributes_updated_at_idx\` ON \`attributes\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`attributes_created_at_idx\` ON \`attributes\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`attributes_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`categories_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`attributes\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`attributes_rels_order_idx\` ON \`attributes_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`attributes_rels_parent_idx\` ON \`attributes_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`attributes_rels_path_idx\` ON \`attributes_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`attributes_rels_categories_id_idx\` ON \`attributes_rels\` (\`categories_id\`);`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`filters\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`accessories_page_h1\` text;`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`accessories_page_meta_title\` text;`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`accessories_page_meta_description\` text;`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`accessories_page_intro\` text;`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`accessories_page_outro\` text;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`attributes_id\` integer REFERENCES attributes(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_attributes_id_idx\` ON \`payload_locked_documents_rels\` (\`attributes_id\`);`)
  await db.run(sql`UPDATE \`categories\` SET \`filters\` = 1 WHERE \`slug\` IN (${sql.join(
    С_ФИЛТРИ.map((s) => sql`${s}`),
    sql`, `,
  )});`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE \`products_attributes\`;`)
  await db.run(sql`DROP TABLE \`_products_v_version_attributes\`;`)
  await db.run(sql`DROP TABLE \`attributes\`;`)
  await db.run(sql`DROP TABLE \`attributes_rels\`;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`products_id\` integer,
  	\`categories_id\` integer,
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
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "pages_id", "products_id", "categories_id", "menu_panels_id", "media_id", "testimonials_id", "awards_id", "subscribers_id", "backups_id", "users_id", "redirects_id") SELECT "id", "order", "parent_id", "path", "pages_id", "products_id", "categories_id", "menu_panels_id", "media_id", "testimonials_id", "awards_id", "subscribers_id", "backups_id", "users_id", "redirects_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_products_id_idx\` ON \`payload_locked_documents_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_menu_panels_id_idx\` ON \`payload_locked_documents_rels\` (\`menu_panels_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_testimonials_id_idx\` ON \`payload_locked_documents_rels\` (\`testimonials_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_awards_id_idx\` ON \`payload_locked_documents_rels\` (\`awards_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_subscribers_id_idx\` ON \`payload_locked_documents_rels\` (\`subscribers_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_backups_id_idx\` ON \`payload_locked_documents_rels\` (\`backups_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_redirects_id_idx\` ON \`payload_locked_documents_rels\` (\`redirects_id\`);`)
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`filters\`;`)
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`accessories_page_h1\`;`)
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`accessories_page_meta_title\`;`)
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`accessories_page_meta_description\`;`)
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`accessories_page_intro\`;`)
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`accessories_page_outro\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
