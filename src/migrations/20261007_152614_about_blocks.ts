import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`pages_blocks_company_stats_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`label\` text,
  	\`count_to\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_company_stats\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_company_stats_stats_order_idx\` ON \`pages_blocks_company_stats_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_company_stats_stats_parent_id_idx\` ON \`pages_blocks_company_stats_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_company_stats_locations\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`x\` numeric,
  	\`y\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_company_stats\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_company_stats_locations_order_idx\` ON \`pages_blocks_company_stats_locations\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_company_stats_locations_parent_id_idx\` ON \`pages_blocks_company_stats_locations\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_company_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`body\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`image_alt\` text,
  	\`map_image_id\` integer,
  	\`map_image_mobile_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`map_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`map_image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_company_stats_order_idx\` ON \`pages_blocks_company_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_company_stats_parent_id_idx\` ON \`pages_blocks_company_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_company_stats_path_idx\` ON \`pages_blocks_company_stats\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_company_stats_image_idx\` ON \`pages_blocks_company_stats\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_company_stats_image_mobile_idx\` ON \`pages_blocks_company_stats\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_company_stats_map_image_idx\` ON \`pages_blocks_company_stats\` (\`map_image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_company_stats_map_image_mobile_idx\` ON \`pages_blocks_company_stats\` (\`map_image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_product_tabs_tabs_products\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`product_id\` integer,
  	\`spec_line\` text,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_product_tabs_tabs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_product_tabs_tabs_products_order_idx\` ON \`pages_blocks_product_tabs_tabs_products\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_product_tabs_tabs_products_parent_id_idx\` ON \`pages_blocks_product_tabs_tabs_products\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_product_tabs_tabs_products_product_idx\` ON \`pages_blocks_product_tabs_tabs_products\` (\`product_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_product_tabs_tabs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`heading\` text,
  	\`body\` text,
  	\`cta_label\` text DEFAULT 'Научете повече',
  	\`cta_link\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`image_alt\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_product_tabs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_product_tabs_tabs_order_idx\` ON \`pages_blocks_product_tabs_tabs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_product_tabs_tabs_parent_id_idx\` ON \`pages_blocks_product_tabs_tabs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_product_tabs_tabs_image_idx\` ON \`pages_blocks_product_tabs_tabs\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_product_tabs_tabs_image_mobile_idx\` ON \`pages_blocks_product_tabs_tabs\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_product_tabs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_product_tabs_order_idx\` ON \`pages_blocks_product_tabs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_product_tabs_parent_id_idx\` ON \`pages_blocks_product_tabs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_product_tabs_path_idx\` ON \`pages_blocks_product_tabs\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_awards_marquee_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`subtitle\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_awards_marquee\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_awards_marquee_items_order_idx\` ON \`pages_blocks_awards_marquee_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_awards_marquee_items_parent_id_idx\` ON \`pages_blocks_awards_marquee_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_awards_marquee_items_image_idx\` ON \`pages_blocks_awards_marquee_items\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_awards_marquee\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_awards_marquee_order_idx\` ON \`pages_blocks_awards_marquee\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_awards_marquee_parent_id_idx\` ON \`pages_blocks_awards_marquee\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_awards_marquee_path_idx\` ON \`pages_blocks_awards_marquee\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_text_section_buttons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`link\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_text_section\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_text_section_buttons_order_idx\` ON \`pages_blocks_text_section_buttons\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_text_section_buttons_parent_id_idx\` ON \`pages_blocks_text_section_buttons\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_text_section\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`theme\` text DEFAULT 'light',
  	\`heading_level\` text DEFAULT 'h2',
  	\`image_position\` text DEFAULT 'below',
  	\`heading\` text,
  	\`body\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`image_alt\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_text_section_order_idx\` ON \`pages_blocks_text_section\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_text_section_parent_id_idx\` ON \`pages_blocks_text_section\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_text_section_path_idx\` ON \`pages_blocks_text_section\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_text_section_image_idx\` ON \`pages_blocks_text_section\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_text_section_image_mobile_idx\` ON \`pages_blocks_text_section\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_press_quotes_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`quote\` text,
  	\`source\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_press_quotes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_press_quotes_items_order_idx\` ON \`pages_blocks_press_quotes_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_press_quotes_items_parent_id_idx\` ON \`pages_blocks_press_quotes_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_press_quotes_items_image_idx\` ON \`pages_blocks_press_quotes_items\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_press_quotes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_press_quotes_order_idx\` ON \`pages_blocks_press_quotes\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_press_quotes_parent_id_idx\` ON \`pages_blocks_press_quotes\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_press_quotes_path_idx\` ON \`pages_blocks_press_quotes\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_company_stats_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`label\` text,
  	\`count_to\` numeric,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_company_stats\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_company_stats_stats_order_idx\` ON \`_pages_v_blocks_company_stats_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_company_stats_stats_parent_id_idx\` ON \`_pages_v_blocks_company_stats_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_company_stats_locations\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`x\` numeric,
  	\`y\` numeric,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_company_stats\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_company_stats_locations_order_idx\` ON \`_pages_v_blocks_company_stats_locations\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_company_stats_locations_parent_id_idx\` ON \`_pages_v_blocks_company_stats_locations\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_company_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`body\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`image_alt\` text,
  	\`map_image_id\` integer,
  	\`map_image_mobile_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`map_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`map_image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_company_stats_order_idx\` ON \`_pages_v_blocks_company_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_company_stats_parent_id_idx\` ON \`_pages_v_blocks_company_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_company_stats_path_idx\` ON \`_pages_v_blocks_company_stats\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_company_stats_image_idx\` ON \`_pages_v_blocks_company_stats\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_company_stats_image_mobile_idx\` ON \`_pages_v_blocks_company_stats\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_company_stats_map_image_idx\` ON \`_pages_v_blocks_company_stats\` (\`map_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_company_stats_map_image_mobile_idx\` ON \`_pages_v_blocks_company_stats\` (\`map_image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_product_tabs_tabs_products\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`product_id\` integer,
  	\`spec_line\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_product_tabs_tabs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_product_tabs_tabs_products_order_idx\` ON \`_pages_v_blocks_product_tabs_tabs_products\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_product_tabs_tabs_products_parent_id_idx\` ON \`_pages_v_blocks_product_tabs_tabs_products\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_product_tabs_tabs_products_product_idx\` ON \`_pages_v_blocks_product_tabs_tabs_products\` (\`product_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_product_tabs_tabs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`heading\` text,
  	\`body\` text,
  	\`cta_label\` text DEFAULT 'Научете повече',
  	\`cta_link\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`image_alt\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_product_tabs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_product_tabs_tabs_order_idx\` ON \`_pages_v_blocks_product_tabs_tabs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_product_tabs_tabs_parent_id_idx\` ON \`_pages_v_blocks_product_tabs_tabs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_product_tabs_tabs_image_idx\` ON \`_pages_v_blocks_product_tabs_tabs\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_product_tabs_tabs_image_mobile_idx\` ON \`_pages_v_blocks_product_tabs_tabs\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_product_tabs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_product_tabs_order_idx\` ON \`_pages_v_blocks_product_tabs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_product_tabs_parent_id_idx\` ON \`_pages_v_blocks_product_tabs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_product_tabs_path_idx\` ON \`_pages_v_blocks_product_tabs\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_awards_marquee_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`subtitle\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_awards_marquee\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_awards_marquee_items_order_idx\` ON \`_pages_v_blocks_awards_marquee_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_awards_marquee_items_parent_id_idx\` ON \`_pages_v_blocks_awards_marquee_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_awards_marquee_items_image_idx\` ON \`_pages_v_blocks_awards_marquee_items\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_awards_marquee\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_awards_marquee_order_idx\` ON \`_pages_v_blocks_awards_marquee\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_awards_marquee_parent_id_idx\` ON \`_pages_v_blocks_awards_marquee\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_awards_marquee_path_idx\` ON \`_pages_v_blocks_awards_marquee\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_text_section_buttons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`link\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_text_section\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_text_section_buttons_order_idx\` ON \`_pages_v_blocks_text_section_buttons\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_text_section_buttons_parent_id_idx\` ON \`_pages_v_blocks_text_section_buttons\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_text_section\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`theme\` text DEFAULT 'light',
  	\`heading_level\` text DEFAULT 'h2',
  	\`image_position\` text DEFAULT 'below',
  	\`heading\` text,
  	\`body\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`image_alt\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_text_section_order_idx\` ON \`_pages_v_blocks_text_section\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_text_section_parent_id_idx\` ON \`_pages_v_blocks_text_section\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_text_section_path_idx\` ON \`_pages_v_blocks_text_section\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_text_section_image_idx\` ON \`_pages_v_blocks_text_section\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_text_section_image_mobile_idx\` ON \`_pages_v_blocks_text_section\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_press_quotes_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`quote\` text,
  	\`source\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_press_quotes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_press_quotes_items_order_idx\` ON \`_pages_v_blocks_press_quotes_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_press_quotes_items_parent_id_idx\` ON \`_pages_v_blocks_press_quotes_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_press_quotes_items_image_idx\` ON \`_pages_v_blocks_press_quotes_items\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_press_quotes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_press_quotes_order_idx\` ON \`_pages_v_blocks_press_quotes\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_press_quotes_parent_id_idx\` ON \`_pages_v_blocks_press_quotes\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_press_quotes_path_idx\` ON \`_pages_v_blocks_press_quotes\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_company_stats_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`label\` text,
  	\`count_to\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_company_stats\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_company_stats_stats_order_idx\` ON \`categories_blocks_company_stats_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_company_stats_stats_parent_id_idx\` ON \`categories_blocks_company_stats_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_company_stats_locations\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`x\` numeric,
  	\`y\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_company_stats\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_company_stats_locations_order_idx\` ON \`categories_blocks_company_stats_locations\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_company_stats_locations_parent_id_idx\` ON \`categories_blocks_company_stats_locations\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_company_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`body\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`image_alt\` text,
  	\`map_image_id\` integer,
  	\`map_image_mobile_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`map_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`map_image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_company_stats_order_idx\` ON \`categories_blocks_company_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_company_stats_parent_id_idx\` ON \`categories_blocks_company_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_company_stats_path_idx\` ON \`categories_blocks_company_stats\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_company_stats_image_idx\` ON \`categories_blocks_company_stats\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_company_stats_image_mobile_idx\` ON \`categories_blocks_company_stats\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_company_stats_map_image_idx\` ON \`categories_blocks_company_stats\` (\`map_image_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_company_stats_map_image_mobile_idx\` ON \`categories_blocks_company_stats\` (\`map_image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_product_tabs_tabs_products\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`product_id\` integer,
  	\`spec_line\` text,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_product_tabs_tabs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_product_tabs_tabs_products_order_idx\` ON \`categories_blocks_product_tabs_tabs_products\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_product_tabs_tabs_products_parent_id_idx\` ON \`categories_blocks_product_tabs_tabs_products\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_product_tabs_tabs_products_product_idx\` ON \`categories_blocks_product_tabs_tabs_products\` (\`product_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_product_tabs_tabs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`heading\` text,
  	\`body\` text,
  	\`cta_label\` text DEFAULT 'Научете повече',
  	\`cta_link\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`image_alt\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_product_tabs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_product_tabs_tabs_order_idx\` ON \`categories_blocks_product_tabs_tabs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_product_tabs_tabs_parent_id_idx\` ON \`categories_blocks_product_tabs_tabs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_product_tabs_tabs_image_idx\` ON \`categories_blocks_product_tabs_tabs\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_product_tabs_tabs_image_mobile_idx\` ON \`categories_blocks_product_tabs_tabs\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_product_tabs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_product_tabs_order_idx\` ON \`categories_blocks_product_tabs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_product_tabs_parent_id_idx\` ON \`categories_blocks_product_tabs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_product_tabs_path_idx\` ON \`categories_blocks_product_tabs\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_awards_marquee_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`subtitle\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_awards_marquee\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_awards_marquee_items_order_idx\` ON \`categories_blocks_awards_marquee_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_awards_marquee_items_parent_id_idx\` ON \`categories_blocks_awards_marquee_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_awards_marquee_items_image_idx\` ON \`categories_blocks_awards_marquee_items\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_awards_marquee\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_awards_marquee_order_idx\` ON \`categories_blocks_awards_marquee\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_awards_marquee_parent_id_idx\` ON \`categories_blocks_awards_marquee\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_awards_marquee_path_idx\` ON \`categories_blocks_awards_marquee\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_text_section_buttons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`link\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_text_section\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_text_section_buttons_order_idx\` ON \`categories_blocks_text_section_buttons\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_text_section_buttons_parent_id_idx\` ON \`categories_blocks_text_section_buttons\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_text_section\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`theme\` text DEFAULT 'light',
  	\`heading_level\` text DEFAULT 'h2',
  	\`image_position\` text DEFAULT 'below',
  	\`heading\` text,
  	\`body\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`image_alt\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_text_section_order_idx\` ON \`categories_blocks_text_section\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_text_section_parent_id_idx\` ON \`categories_blocks_text_section\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_text_section_path_idx\` ON \`categories_blocks_text_section\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_text_section_image_idx\` ON \`categories_blocks_text_section\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_text_section_image_mobile_idx\` ON \`categories_blocks_text_section\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_press_quotes_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`quote\` text,
  	\`source\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_press_quotes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_press_quotes_items_order_idx\` ON \`categories_blocks_press_quotes_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_press_quotes_items_parent_id_idx\` ON \`categories_blocks_press_quotes_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_press_quotes_items_image_idx\` ON \`categories_blocks_press_quotes_items\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_press_quotes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_press_quotes_order_idx\` ON \`categories_blocks_press_quotes\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_press_quotes_parent_id_idx\` ON \`categories_blocks_press_quotes\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_press_quotes_path_idx\` ON \`categories_blocks_press_quotes\` (\`_path\`);`)
  await db.run(sql`ALTER TABLE \`pages_blocks_wide_banner\` ADD \`image_mobile_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_wide_banner_image_mobile_idx\` ON \`pages_blocks_wide_banner\` (\`image_mobile_id\`);`)
  await db.run(sql`ALTER TABLE \`pages_blocks_page_hero\` ADD \`tone\` text DEFAULT 'dark-top';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wide_banner\` ADD \`image_mobile_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_wide_banner_image_mobile_idx\` ON \`_pages_v_blocks_wide_banner\` (\`image_mobile_id\`);`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_page_hero\` ADD \`tone\` text DEFAULT 'dark-top';`)
  await db.run(sql`ALTER TABLE \`categories_blocks_wide_banner\` ADD \`image_mobile_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_wide_banner_image_mobile_idx\` ON \`categories_blocks_wide_banner\` (\`image_mobile_id\`);`)
  await db.run(sql`ALTER TABLE \`categories_blocks_page_hero\` ADD \`tone\` text DEFAULT 'dark-top';`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE \`pages_blocks_company_stats_stats\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_company_stats_locations\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_company_stats\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_product_tabs_tabs_products\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_product_tabs_tabs\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_product_tabs\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_awards_marquee_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_awards_marquee\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_text_section_buttons\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_text_section\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_press_quotes_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_press_quotes\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_company_stats_stats\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_company_stats_locations\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_company_stats\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_product_tabs_tabs_products\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_product_tabs_tabs\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_product_tabs\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_awards_marquee_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_awards_marquee\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_text_section_buttons\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_text_section\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_press_quotes_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_press_quotes\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_company_stats_stats\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_company_stats_locations\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_company_stats\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_product_tabs_tabs_products\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_product_tabs_tabs\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_product_tabs\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_awards_marquee_items\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_awards_marquee\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_text_section_buttons\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_text_section\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_press_quotes_items\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_press_quotes\`;`)
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_wide_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`section_title\` text,
  	\`eyebrow\` text,
  	\`eyebrow_color\` text DEFAULT 'white',
  	\`heading\` text,
  	\`subheading\` text,
  	\`price_note\` text,
  	\`image_id\` integer,
  	\`cta_label\` text DEFAULT 'Разгледай',
  	\`cta_url\` text,
  	\`cta_new_tab\` integer DEFAULT false,
  	\`cta_style\` text DEFAULT 'light',
  	\`align\` text DEFAULT 'left',
  	\`theme\` text DEFAULT 'dark',
  	\`overlay\` text DEFAULT 'gradient',
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_pages_blocks_wide_banner\`("_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "section_title", "eyebrow", "eyebrow_color", "heading", "subheading", "price_note", "image_id", "cta_label", "cta_url", "cta_new_tab", "cta_style", "align", "theme", "overlay", "block_name") SELECT "_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "section_title", "eyebrow", "eyebrow_color", "heading", "subheading", "price_note", "image_id", "cta_label", "cta_url", "cta_new_tab", "cta_style", "align", "theme", "overlay", "block_name" FROM \`pages_blocks_wide_banner\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_wide_banner\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_wide_banner\` RENAME TO \`pages_blocks_wide_banner\`;`)
  await db.run(sql`CREATE INDEX \`pages_blocks_wide_banner_order_idx\` ON \`pages_blocks_wide_banner\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_wide_banner_parent_id_idx\` ON \`pages_blocks_wide_banner\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_wide_banner_path_idx\` ON \`pages_blocks_wide_banner\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_wide_banner_image_idx\` ON \`pages_blocks_wide_banner\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_wide_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`section_title\` text,
  	\`eyebrow\` text,
  	\`eyebrow_color\` text DEFAULT 'white',
  	\`heading\` text,
  	\`subheading\` text,
  	\`price_note\` text,
  	\`image_id\` integer,
  	\`cta_label\` text DEFAULT 'Разгледай',
  	\`cta_url\` text,
  	\`cta_new_tab\` integer DEFAULT false,
  	\`cta_style\` text DEFAULT 'light',
  	\`align\` text DEFAULT 'left',
  	\`theme\` text DEFAULT 'dark',
  	\`overlay\` text DEFAULT 'gradient',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__pages_v_blocks_wide_banner\`("_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "section_title", "eyebrow", "eyebrow_color", "heading", "subheading", "price_note", "image_id", "cta_label", "cta_url", "cta_new_tab", "cta_style", "align", "theme", "overlay", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "section_title", "eyebrow", "eyebrow_color", "heading", "subheading", "price_note", "image_id", "cta_label", "cta_url", "cta_new_tab", "cta_style", "align", "theme", "overlay", "_uuid", "block_name" FROM \`_pages_v_blocks_wide_banner\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_wide_banner\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_blocks_wide_banner\` RENAME TO \`_pages_v_blocks_wide_banner\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_wide_banner_order_idx\` ON \`_pages_v_blocks_wide_banner\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_wide_banner_parent_id_idx\` ON \`_pages_v_blocks_wide_banner\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_wide_banner_path_idx\` ON \`_pages_v_blocks_wide_banner\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_wide_banner_image_idx\` ON \`_pages_v_blocks_wide_banner\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_categories_blocks_wide_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`section_title\` text,
  	\`eyebrow\` text,
  	\`eyebrow_color\` text DEFAULT 'white',
  	\`heading\` text,
  	\`subheading\` text,
  	\`price_note\` text,
  	\`image_id\` integer,
  	\`cta_label\` text DEFAULT 'Разгледай',
  	\`cta_url\` text,
  	\`cta_new_tab\` integer DEFAULT false,
  	\`cta_style\` text DEFAULT 'light',
  	\`align\` text DEFAULT 'left',
  	\`theme\` text DEFAULT 'dark',
  	\`overlay\` text DEFAULT 'gradient',
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_categories_blocks_wide_banner\`("_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "section_title", "eyebrow", "eyebrow_color", "heading", "subheading", "price_note", "image_id", "cta_label", "cta_url", "cta_new_tab", "cta_style", "align", "theme", "overlay", "block_name") SELECT "_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "section_title", "eyebrow", "eyebrow_color", "heading", "subheading", "price_note", "image_id", "cta_label", "cta_url", "cta_new_tab", "cta_style", "align", "theme", "overlay", "block_name" FROM \`categories_blocks_wide_banner\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_wide_banner\`;`)
  await db.run(sql`ALTER TABLE \`__new_categories_blocks_wide_banner\` RENAME TO \`categories_blocks_wide_banner\`;`)
  await db.run(sql`CREATE INDEX \`categories_blocks_wide_banner_order_idx\` ON \`categories_blocks_wide_banner\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_wide_banner_parent_id_idx\` ON \`categories_blocks_wide_banner\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_wide_banner_path_idx\` ON \`categories_blocks_wide_banner\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_wide_banner_image_idx\` ON \`categories_blocks_wide_banner\` (\`image_id\`);`)
  await db.run(sql`ALTER TABLE \`pages_blocks_page_hero\` DROP COLUMN \`tone\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_page_hero\` DROP COLUMN \`tone\`;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_page_hero\` DROP COLUMN \`tone\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
