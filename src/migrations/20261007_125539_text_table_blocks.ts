import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`pages_blocks_rich_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`content\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_rich_text_order_idx\` ON \`pages_blocks_rich_text\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_rich_text_parent_id_idx\` ON \`pages_blocks_rich_text\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_rich_text_path_idx\` ON \`pages_blocks_rich_text\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_simple_table_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_simple_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_simple_table_columns_order_idx\` ON \`pages_blocks_simple_table_columns\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_simple_table_columns_parent_id_idx\` ON \`pages_blocks_simple_table_columns\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_simple_table_rows_cells\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_simple_table_rows\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_simple_table_rows_cells_order_idx\` ON \`pages_blocks_simple_table_rows_cells\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_simple_table_rows_cells_parent_id_idx\` ON \`pages_blocks_simple_table_rows_cells\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_simple_table_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_simple_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_simple_table_rows_order_idx\` ON \`pages_blocks_simple_table_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_simple_table_rows_parent_id_idx\` ON \`pages_blocks_simple_table_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_simple_table\` (
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
  await db.run(sql`CREATE INDEX \`pages_blocks_simple_table_order_idx\` ON \`pages_blocks_simple_table\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_simple_table_parent_id_idx\` ON \`pages_blocks_simple_table\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_simple_table_path_idx\` ON \`pages_blocks_simple_table\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_rich_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`content\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_rich_text_order_idx\` ON \`_pages_v_blocks_rich_text\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_rich_text_parent_id_idx\` ON \`_pages_v_blocks_rich_text\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_rich_text_path_idx\` ON \`_pages_v_blocks_rich_text\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_simple_table_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_simple_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_simple_table_columns_order_idx\` ON \`_pages_v_blocks_simple_table_columns\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_simple_table_columns_parent_id_idx\` ON \`_pages_v_blocks_simple_table_columns\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_simple_table_rows_cells\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_simple_table_rows\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_simple_table_rows_cells_order_idx\` ON \`_pages_v_blocks_simple_table_rows_cells\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_simple_table_rows_cells_parent_id_idx\` ON \`_pages_v_blocks_simple_table_rows_cells\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_simple_table_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_simple_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_simple_table_rows_order_idx\` ON \`_pages_v_blocks_simple_table_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_simple_table_rows_parent_id_idx\` ON \`_pages_v_blocks_simple_table_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_simple_table\` (
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
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_simple_table_order_idx\` ON \`_pages_v_blocks_simple_table\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_simple_table_parent_id_idx\` ON \`_pages_v_blocks_simple_table\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_simple_table_path_idx\` ON \`_pages_v_blocks_simple_table\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_rich_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`content\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_rich_text_order_idx\` ON \`categories_blocks_rich_text\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_rich_text_parent_id_idx\` ON \`categories_blocks_rich_text\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_rich_text_path_idx\` ON \`categories_blocks_rich_text\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_simple_table_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_simple_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_simple_table_columns_order_idx\` ON \`categories_blocks_simple_table_columns\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_simple_table_columns_parent_id_idx\` ON \`categories_blocks_simple_table_columns\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_simple_table_rows_cells\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_simple_table_rows\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_simple_table_rows_cells_order_idx\` ON \`categories_blocks_simple_table_rows_cells\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_simple_table_rows_cells_parent_id_idx\` ON \`categories_blocks_simple_table_rows_cells\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_simple_table_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_simple_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_simple_table_rows_order_idx\` ON \`categories_blocks_simple_table_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_simple_table_rows_parent_id_idx\` ON \`categories_blocks_simple_table_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_simple_table\` (
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
  await db.run(sql`CREATE INDEX \`categories_blocks_simple_table_order_idx\` ON \`categories_blocks_simple_table\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_simple_table_parent_id_idx\` ON \`categories_blocks_simple_table\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_simple_table_path_idx\` ON \`categories_blocks_simple_table\` (\`_path\`);`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE \`pages_blocks_rich_text\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_simple_table_columns\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_simple_table_rows_cells\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_simple_table_rows\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_simple_table\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_rich_text\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_simple_table_columns\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_simple_table_rows_cells\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_simple_table_rows\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_simple_table\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_rich_text\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_simple_table_columns\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_simple_table_rows_cells\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_simple_table_rows\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_simple_table\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
