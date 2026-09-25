import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`products_blocks_in_the_box_groups_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`name\` text,
  	\`qty\` numeric DEFAULT 1,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_in_the_box_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_in_the_box_groups_items_order_idx\` ON \`products_blocks_in_the_box_groups_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_in_the_box_groups_items_parent_id_idx\` ON \`products_blocks_in_the_box_groups_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_in_the_box_groups_items_image_idx\` ON \`products_blocks_in_the_box_groups_items\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_in_the_box_groups\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_in_the_box\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_in_the_box_groups_order_idx\` ON \`products_blocks_in_the_box_groups\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_in_the_box_groups_parent_id_idx\` ON \`products_blocks_in_the_box_groups\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_in_the_box_groups_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`name\` text,
  	\`qty\` numeric DEFAULT 1,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v_blocks_in_the_box_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_in_the_box_groups_items_order_idx\` ON \`_products_v_blocks_in_the_box_groups_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_in_the_box_groups_items_parent_id_idx\` ON \`_products_v_blocks_in_the_box_groups_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_in_the_box_groups_items_image_idx\` ON \`_products_v_blocks_in_the_box_groups_items\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_in_the_box_groups\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v_blocks_in_the_box\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_in_the_box_groups_order_idx\` ON \`_products_v_blocks_in_the_box_groups\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_in_the_box_groups_parent_id_idx\` ON \`_products_v_blocks_in_the_box_groups\` (\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`products_blocks_in_the_box\` ADD \`default_group\` numeric;`)
  await db.run(sql`ALTER TABLE \`_products_v_blocks_in_the_box\` ADD \`default_group\` numeric;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE \`products_blocks_in_the_box_groups_items\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_in_the_box_groups\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_in_the_box_groups_items\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_in_the_box_groups\`;`)
  await db.run(sql`ALTER TABLE \`products_blocks_in_the_box\` DROP COLUMN \`default_group\`;`)
  await db.run(sql`ALTER TABLE \`_products_v_blocks_in_the_box\` DROP COLUMN \`default_group\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
