import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // CLAUDE.md, т. 7: ключовете се изключват ПЪРВИ и се включват ПОСЛЕДНИ.
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`pages_blocks_page_hero\` (
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
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_page_hero_order_idx\` ON \`pages_blocks_page_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_page_hero_parent_id_idx\` ON \`pages_blocks_page_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_page_hero_path_idx\` ON \`pages_blocks_page_hero\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_page_hero_image_idx\` ON \`pages_blocks_page_hero\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_page_hero_image_mobile_idx\` ON \`pages_blocks_page_hero\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_anchor_nav\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_anchor_nav_order_idx\` ON \`pages_blocks_anchor_nav\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_anchor_nav_parent_id_idx\` ON \`pages_blocks_anchor_nav\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_anchor_nav_path_idx\` ON \`pages_blocks_anchor_nav\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_content_slider_slides\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`image_alt\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_content_slider\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_slider_slides_order_idx\` ON \`pages_blocks_content_slider_slides\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_slider_slides_parent_id_idx\` ON \`pages_blocks_content_slider_slides\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_slider_slides_image_idx\` ON \`pages_blocks_content_slider_slides\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_slider_slides_image_mobile_idx\` ON \`pages_blocks_content_slider_slides\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_content_slider\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`body\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_slider_order_idx\` ON \`pages_blocks_content_slider\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_slider_parent_id_idx\` ON \`pages_blocks_content_slider\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_content_slider_path_idx\` ON \`pages_blocks_content_slider\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_accordion_image_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_accordion_image\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_image_items_order_idx\` ON \`pages_blocks_accordion_image_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_image_items_parent_id_idx\` ON \`pages_blocks_accordion_image_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_accordion_image\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`image_alt\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_image_order_idx\` ON \`pages_blocks_accordion_image\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_image_parent_id_idx\` ON \`pages_blocks_accordion_image\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_image_path_idx\` ON \`pages_blocks_accordion_image\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_image_image_idx\` ON \`pages_blocks_accordion_image\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_image_image_mobile_idx\` ON \`pages_blocks_accordion_image\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_split_banner\` (
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
  	\`cta_label\` text DEFAULT 'Разгледайте',
  	\`cta_link\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_split_banner_order_idx\` ON \`pages_blocks_split_banner\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_split_banner_parent_id_idx\` ON \`pages_blocks_split_banner\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_split_banner_path_idx\` ON \`pages_blocks_split_banner\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_split_banner_image_idx\` ON \`pages_blocks_split_banner\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_split_banner_image_mobile_idx\` ON \`pages_blocks_split_banner\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_runtime_compare_products\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`product_id\` integer,
  	\`spec_line\` text,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_runtime_compare\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_runtime_compare_products_order_idx\` ON \`pages_blocks_runtime_compare_products\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_runtime_compare_products_parent_id_idx\` ON \`pages_blocks_runtime_compare_products\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_runtime_compare_products_product_idx\` ON \`pages_blocks_runtime_compare_products\` (\`product_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_runtime_compare_rows_values\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_runtime_compare_rows\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_runtime_compare_rows_values_order_idx\` ON \`pages_blocks_runtime_compare_rows_values\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_runtime_compare_rows_values_parent_id_idx\` ON \`pages_blocks_runtime_compare_rows_values\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_runtime_compare_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_runtime_compare\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_runtime_compare_rows_order_idx\` ON \`pages_blocks_runtime_compare_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_runtime_compare_rows_parent_id_idx\` ON \`pages_blocks_runtime_compare_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_runtime_compare\` (
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
  await db.run(sql`CREATE INDEX \`pages_blocks_runtime_compare_order_idx\` ON \`pages_blocks_runtime_compare\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_runtime_compare_parent_id_idx\` ON \`pages_blocks_runtime_compare\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_runtime_compare_path_idx\` ON \`pages_blocks_runtime_compare\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_image_with_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`image_alt\` text,
  	\`heading\` text,
  	\`subheading\` text,
  	\`body\` text,
  	\`product_id\` integer,
  	\`cta_label\` text DEFAULT 'Купи сега',
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_image_with_text_order_idx\` ON \`pages_blocks_image_with_text\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_image_with_text_parent_id_idx\` ON \`pages_blocks_image_with_text\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_image_with_text_path_idx\` ON \`pages_blocks_image_with_text\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_image_with_text_image_idx\` ON \`pages_blocks_image_with_text\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_image_with_text_image_mobile_idx\` ON \`pages_blocks_image_with_text\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_image_with_text_product_idx\` ON \`pages_blocks_image_with_text\` (\`product_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_faq_block_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`answer\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_faq_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_block_items_order_idx\` ON \`pages_blocks_faq_block_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_block_items_parent_id_idx\` ON \`pages_blocks_faq_block_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_faq_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text DEFAULT 'Често задавани въпроси',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_block_order_idx\` ON \`pages_blocks_faq_block\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_block_parent_id_idx\` ON \`pages_blocks_faq_block\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_faq_block_path_idx\` ON \`pages_blocks_faq_block\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_legal_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`text\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_legal_text_order_idx\` ON \`pages_blocks_legal_text\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_legal_text_parent_id_idx\` ON \`pages_blocks_legal_text\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_legal_text_path_idx\` ON \`pages_blocks_legal_text\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_page_hero\` (
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
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_page_hero_order_idx\` ON \`_pages_v_blocks_page_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_page_hero_parent_id_idx\` ON \`_pages_v_blocks_page_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_page_hero_path_idx\` ON \`_pages_v_blocks_page_hero\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_page_hero_image_idx\` ON \`_pages_v_blocks_page_hero\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_page_hero_image_mobile_idx\` ON \`_pages_v_blocks_page_hero\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_anchor_nav\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_anchor_nav_order_idx\` ON \`_pages_v_blocks_anchor_nav\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_anchor_nav_parent_id_idx\` ON \`_pages_v_blocks_anchor_nav\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_anchor_nav_path_idx\` ON \`_pages_v_blocks_anchor_nav\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_content_slider_slides\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`image_alt\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_content_slider\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_slider_slides_order_idx\` ON \`_pages_v_blocks_content_slider_slides\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_slider_slides_parent_id_idx\` ON \`_pages_v_blocks_content_slider_slides\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_slider_slides_image_idx\` ON \`_pages_v_blocks_content_slider_slides\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_slider_slides_image_mobile_idx\` ON \`_pages_v_blocks_content_slider_slides\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_content_slider\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`body\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_slider_order_idx\` ON \`_pages_v_blocks_content_slider\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_slider_parent_id_idx\` ON \`_pages_v_blocks_content_slider\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_content_slider_path_idx\` ON \`_pages_v_blocks_content_slider\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_accordion_image_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_accordion_image\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_accordion_image_items_order_idx\` ON \`_pages_v_blocks_accordion_image_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_accordion_image_items_parent_id_idx\` ON \`_pages_v_blocks_accordion_image_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_accordion_image\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
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
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_accordion_image_order_idx\` ON \`_pages_v_blocks_accordion_image\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_accordion_image_parent_id_idx\` ON \`_pages_v_blocks_accordion_image\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_accordion_image_path_idx\` ON \`_pages_v_blocks_accordion_image\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_accordion_image_image_idx\` ON \`_pages_v_blocks_accordion_image\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_accordion_image_image_mobile_idx\` ON \`_pages_v_blocks_accordion_image\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_split_banner\` (
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
  	\`cta_label\` text DEFAULT 'Разгледайте',
  	\`cta_link\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_split_banner_order_idx\` ON \`_pages_v_blocks_split_banner\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_split_banner_parent_id_idx\` ON \`_pages_v_blocks_split_banner\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_split_banner_path_idx\` ON \`_pages_v_blocks_split_banner\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_split_banner_image_idx\` ON \`_pages_v_blocks_split_banner\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_split_banner_image_mobile_idx\` ON \`_pages_v_blocks_split_banner\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_runtime_compare_products\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`product_id\` integer,
  	\`spec_line\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_runtime_compare\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_runtime_compare_products_order_idx\` ON \`_pages_v_blocks_runtime_compare_products\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_runtime_compare_products_parent_id_idx\` ON \`_pages_v_blocks_runtime_compare_products\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_runtime_compare_products_product_idx\` ON \`_pages_v_blocks_runtime_compare_products\` (\`product_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_runtime_compare_rows_values\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_runtime_compare_rows\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_runtime_compare_rows_values_order_idx\` ON \`_pages_v_blocks_runtime_compare_rows_values\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_runtime_compare_rows_values_parent_id_idx\` ON \`_pages_v_blocks_runtime_compare_rows_values\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_runtime_compare_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_runtime_compare\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_runtime_compare_rows_order_idx\` ON \`_pages_v_blocks_runtime_compare_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_runtime_compare_rows_parent_id_idx\` ON \`_pages_v_blocks_runtime_compare_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_runtime_compare\` (
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
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_runtime_compare_order_idx\` ON \`_pages_v_blocks_runtime_compare\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_runtime_compare_parent_id_idx\` ON \`_pages_v_blocks_runtime_compare\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_runtime_compare_path_idx\` ON \`_pages_v_blocks_runtime_compare\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_image_with_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`image_alt\` text,
  	\`heading\` text,
  	\`subheading\` text,
  	\`body\` text,
  	\`product_id\` integer,
  	\`cta_label\` text DEFAULT 'Купи сега',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_image_with_text_order_idx\` ON \`_pages_v_blocks_image_with_text\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_image_with_text_parent_id_idx\` ON \`_pages_v_blocks_image_with_text\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_image_with_text_path_idx\` ON \`_pages_v_blocks_image_with_text\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_image_with_text_image_idx\` ON \`_pages_v_blocks_image_with_text\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_image_with_text_image_mobile_idx\` ON \`_pages_v_blocks_image_with_text\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_image_with_text_product_idx\` ON \`_pages_v_blocks_image_with_text\` (\`product_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_faq_block_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`answer\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_faq_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_block_items_order_idx\` ON \`_pages_v_blocks_faq_block_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_block_items_parent_id_idx\` ON \`_pages_v_blocks_faq_block_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_faq_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text DEFAULT 'Често задавани въпроси',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_block_order_idx\` ON \`_pages_v_blocks_faq_block\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_block_parent_id_idx\` ON \`_pages_v_blocks_faq_block\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_faq_block_path_idx\` ON \`_pages_v_blocks_faq_block\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_legal_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`text\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_legal_text_order_idx\` ON \`_pages_v_blocks_legal_text\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_legal_text_parent_id_idx\` ON \`_pages_v_blocks_legal_text\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_legal_text_path_idx\` ON \`_pages_v_blocks_legal_text\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_page_hero\` (
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
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_page_hero_order_idx\` ON \`categories_blocks_page_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_page_hero_parent_id_idx\` ON \`categories_blocks_page_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_page_hero_path_idx\` ON \`categories_blocks_page_hero\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_page_hero_image_idx\` ON \`categories_blocks_page_hero\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_page_hero_image_mobile_idx\` ON \`categories_blocks_page_hero\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_anchor_nav\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_anchor_nav_order_idx\` ON \`categories_blocks_anchor_nav\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_anchor_nav_parent_id_idx\` ON \`categories_blocks_anchor_nav\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_anchor_nav_path_idx\` ON \`categories_blocks_anchor_nav\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_content_slider_slides\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`image_alt\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_content_slider\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_content_slider_slides_order_idx\` ON \`categories_blocks_content_slider_slides\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_content_slider_slides_parent_id_idx\` ON \`categories_blocks_content_slider_slides\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_content_slider_slides_image_idx\` ON \`categories_blocks_content_slider_slides\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_content_slider_slides_image_mobile_idx\` ON \`categories_blocks_content_slider_slides\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_content_slider\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`body\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_content_slider_order_idx\` ON \`categories_blocks_content_slider\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_content_slider_parent_id_idx\` ON \`categories_blocks_content_slider\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_content_slider_path_idx\` ON \`categories_blocks_content_slider\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_accordion_image_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_accordion_image\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_accordion_image_items_order_idx\` ON \`categories_blocks_accordion_image_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_accordion_image_items_parent_id_idx\` ON \`categories_blocks_accordion_image_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_accordion_image\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`image_alt\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_accordion_image_order_idx\` ON \`categories_blocks_accordion_image\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_accordion_image_parent_id_idx\` ON \`categories_blocks_accordion_image\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_accordion_image_path_idx\` ON \`categories_blocks_accordion_image\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_accordion_image_image_idx\` ON \`categories_blocks_accordion_image\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_accordion_image_image_mobile_idx\` ON \`categories_blocks_accordion_image\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_split_banner\` (
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
  	\`cta_label\` text DEFAULT 'Разгледайте',
  	\`cta_link\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_split_banner_order_idx\` ON \`categories_blocks_split_banner\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_split_banner_parent_id_idx\` ON \`categories_blocks_split_banner\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_split_banner_path_idx\` ON \`categories_blocks_split_banner\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_split_banner_image_idx\` ON \`categories_blocks_split_banner\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_split_banner_image_mobile_idx\` ON \`categories_blocks_split_banner\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_runtime_compare_products\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`product_id\` integer,
  	\`spec_line\` text,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_runtime_compare\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_runtime_compare_products_order_idx\` ON \`categories_blocks_runtime_compare_products\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_runtime_compare_products_parent_id_idx\` ON \`categories_blocks_runtime_compare_products\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_runtime_compare_products_product_idx\` ON \`categories_blocks_runtime_compare_products\` (\`product_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_runtime_compare_rows_values\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_runtime_compare_rows\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_runtime_compare_rows_values_order_idx\` ON \`categories_blocks_runtime_compare_rows_values\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_runtime_compare_rows_values_parent_id_idx\` ON \`categories_blocks_runtime_compare_rows_values\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_runtime_compare_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_runtime_compare\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_runtime_compare_rows_order_idx\` ON \`categories_blocks_runtime_compare_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_runtime_compare_rows_parent_id_idx\` ON \`categories_blocks_runtime_compare_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_runtime_compare\` (
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
  await db.run(sql`CREATE INDEX \`categories_blocks_runtime_compare_order_idx\` ON \`categories_blocks_runtime_compare\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_runtime_compare_parent_id_idx\` ON \`categories_blocks_runtime_compare\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_runtime_compare_path_idx\` ON \`categories_blocks_runtime_compare\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_image_with_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`image_alt\` text,
  	\`heading\` text,
  	\`subheading\` text,
  	\`body\` text,
  	\`product_id\` integer,
  	\`cta_label\` text DEFAULT 'Купи сега',
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_image_with_text_order_idx\` ON \`categories_blocks_image_with_text\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_image_with_text_parent_id_idx\` ON \`categories_blocks_image_with_text\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_image_with_text_path_idx\` ON \`categories_blocks_image_with_text\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_image_with_text_image_idx\` ON \`categories_blocks_image_with_text\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_image_with_text_image_mobile_idx\` ON \`categories_blocks_image_with_text\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_image_with_text_product_idx\` ON \`categories_blocks_image_with_text\` (\`product_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_faq_block_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`answer\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_faq_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_faq_block_items_order_idx\` ON \`categories_blocks_faq_block_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_faq_block_items_parent_id_idx\` ON \`categories_blocks_faq_block_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_faq_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`heading\` text DEFAULT 'Често задавани въпроси',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_faq_block_order_idx\` ON \`categories_blocks_faq_block\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_faq_block_parent_id_idx\` ON \`categories_blocks_faq_block\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_faq_block_path_idx\` ON \`categories_blocks_faq_block\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_legal_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
  	\`text\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_legal_text_order_idx\` ON \`categories_blocks_legal_text\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_legal_text_parent_id_idx\` ON \`categories_blocks_legal_text\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_legal_text_path_idx\` ON \`categories_blocks_legal_text\` (\`_path\`);`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_category_strip\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_product_carousel\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_product_carousel\` ADD \`from_category_id\` integer REFERENCES categories(id);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_product_carousel_from_category_idx\` ON \`pages_blocks_product_carousel\` (\`from_category_id\`);`)
  await db.run(sql`ALTER TABLE \`pages_blocks_banner_carousel\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_banner_product_row\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_promo_cards\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_wide_banner\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_benefits_grid\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_testimonials_block\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_logo_wall\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_category_strip\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_product_carousel\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_product_carousel\` ADD \`from_category_id\` integer REFERENCES categories(id);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_product_carousel_from_category_idx\` ON \`_pages_v_blocks_product_carousel\` (\`from_category_id\`);`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_banner_carousel\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_banner_product_row\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_promo_cards\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wide_banner\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_benefits_grid\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_testimonials_block\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_logo_wall\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_hero_banner\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_category_strip\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_product_carousel\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_product_carousel\` ADD \`from_category_id\` integer REFERENCES categories(id);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_product_carousel_from_category_idx\` ON \`categories_blocks_product_carousel\` (\`from_category_id\`);`)
  await db.run(sql`ALTER TABLE \`categories_blocks_banner_carousel\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_banner_product_row\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_promo_cards\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_wide_banner\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_benefits_grid\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_testimonials_block\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_logo_wall\` ADD \`anchor_label\` text;`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`guide_link_page_id\` integer REFERENCES pages(id);`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`guide_link_label\` text;`)
  await db.run(sql`CREATE INDEX \`categories_guide_link_guide_link_page_idx\` ON \`categories\` (\`guide_link_page_id\`);`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // CLAUDE.md, т. 7: ключовете се изключват ПЪРВИ и се включват ПОСЛЕДНИ.
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE \`pages_blocks_page_hero\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_anchor_nav\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_content_slider_slides\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_content_slider\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_accordion_image_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_accordion_image\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_split_banner\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_runtime_compare_products\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_runtime_compare_rows_values\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_runtime_compare_rows\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_runtime_compare\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_image_with_text\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_faq_block_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_faq_block\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_legal_text\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_page_hero\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_anchor_nav\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_content_slider_slides\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_content_slider\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_accordion_image_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_accordion_image\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_split_banner\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_runtime_compare_products\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_runtime_compare_rows_values\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_runtime_compare_rows\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_runtime_compare\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_image_with_text\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_faq_block_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_faq_block\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_legal_text\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_page_hero\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_anchor_nav\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_content_slider_slides\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_content_slider\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_accordion_image_items\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_accordion_image\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_split_banner\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_runtime_compare_products\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_runtime_compare_rows_values\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_runtime_compare_rows\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_runtime_compare\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_image_with_text\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_faq_block_items\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_faq_block\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_legal_text\`;`)
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_product_carousel\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`section_title\` text,
  	\`subtitle\` text,
  	\`card_style\` text DEFAULT 'image',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_pages_blocks_product_carousel\`("_order", "_parent_id", "_path", "id", "hidden", "section_title", "subtitle", "card_style", "block_name") SELECT "_order", "_parent_id", "_path", "id", "hidden", "section_title", "subtitle", "card_style", "block_name" FROM \`pages_blocks_product_carousel\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_product_carousel\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_product_carousel\` RENAME TO \`pages_blocks_product_carousel\`;`)
  await db.run(sql`CREATE INDEX \`pages_blocks_product_carousel_order_idx\` ON \`pages_blocks_product_carousel\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_product_carousel_parent_id_idx\` ON \`pages_blocks_product_carousel\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_product_carousel_path_idx\` ON \`pages_blocks_product_carousel\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_product_carousel\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`section_title\` text,
  	\`subtitle\` text,
  	\`card_style\` text DEFAULT 'image',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__pages_v_blocks_product_carousel\`("_order", "_parent_id", "_path", "id", "hidden", "section_title", "subtitle", "card_style", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "hidden", "section_title", "subtitle", "card_style", "_uuid", "block_name" FROM \`_pages_v_blocks_product_carousel\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_product_carousel\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_blocks_product_carousel\` RENAME TO \`_pages_v_blocks_product_carousel\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_product_carousel_order_idx\` ON \`_pages_v_blocks_product_carousel\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_product_carousel_parent_id_idx\` ON \`_pages_v_blocks_product_carousel\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_product_carousel_path_idx\` ON \`_pages_v_blocks_product_carousel\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`__new_categories_blocks_product_carousel\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`section_title\` text,
  	\`subtitle\` text,
  	\`card_style\` text DEFAULT 'image',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_categories_blocks_product_carousel\`("_order", "_parent_id", "_path", "id", "hidden", "section_title", "subtitle", "card_style", "block_name") SELECT "_order", "_parent_id", "_path", "id", "hidden", "section_title", "subtitle", "card_style", "block_name" FROM \`categories_blocks_product_carousel\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_product_carousel\`;`)
  await db.run(sql`ALTER TABLE \`__new_categories_blocks_product_carousel\` RENAME TO \`categories_blocks_product_carousel\`;`)
  await db.run(sql`CREATE INDEX \`categories_blocks_product_carousel_order_idx\` ON \`categories_blocks_product_carousel\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_product_carousel_parent_id_idx\` ON \`categories_blocks_product_carousel\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_product_carousel_path_idx\` ON \`categories_blocks_product_carousel\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`__new_categories\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`full_title\` text,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`parent_id\` integer,
  	\`show_in_strip\` integer DEFAULT false,
  	\`strip_badge\` text,
  	\`filters\` integer DEFAULT false,
  	\`icon_id\` integer,
  	\`hero_image_id\` integer,
  	\`hero_tagline\` text,
  	\`banner_id\` integer,
  	\`description\` text,
  	\`below_list\` text,
  	\`accessories_page_h1\` text,
  	\`accessories_page_meta_title\` text,
  	\`accessories_page_meta_description\` text,
  	\`accessories_page_intro\` text,
  	\`accessories_page_outro\` text,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`noindex\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`icon_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`hero_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`banner_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_categories\`("id", "_order", "full_title", "title", "slug", "parent_id", "show_in_strip", "strip_badge", "filters", "icon_id", "hero_image_id", "hero_tagline", "banner_id", "description", "below_list", "accessories_page_h1", "accessories_page_meta_title", "accessories_page_meta_description", "accessories_page_intro", "accessories_page_outro", "meta_title", "meta_description", "noindex", "updated_at", "created_at") SELECT "id", "_order", "full_title", "title", "slug", "parent_id", "show_in_strip", "strip_badge", "filters", "icon_id", "hero_image_id", "hero_tagline", "banner_id", "description", "below_list", "accessories_page_h1", "accessories_page_meta_title", "accessories_page_meta_description", "accessories_page_intro", "accessories_page_outro", "meta_title", "meta_description", "noindex", "updated_at", "created_at" FROM \`categories\`;`)
  await db.run(sql`DROP TABLE \`categories\`;`)
  await db.run(sql`ALTER TABLE \`__new_categories\` RENAME TO \`categories\`;`)
  await db.run(sql`CREATE INDEX \`categories__order_idx\` ON \`categories\` (\`_order\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`categories_slug_idx\` ON \`categories\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`categories_parent_idx\` ON \`categories\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_icon_idx\` ON \`categories\` (\`icon_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_hero_image_idx\` ON \`categories\` (\`hero_image_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_banner_idx\` ON \`categories\` (\`banner_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_updated_at_idx\` ON \`categories\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`categories_created_at_idx\` ON \`categories\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_category_strip\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_banner_carousel\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_banner_product_row\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_promo_cards\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_wide_banner\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_benefits_grid\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_testimonials_block\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_logo_wall\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_category_strip\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_banner_carousel\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_banner_product_row\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_promo_cards\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wide_banner\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_benefits_grid\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_testimonials_block\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_logo_wall\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_hero_banner\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_category_strip\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_banner_carousel\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_banner_product_row\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_promo_cards\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_wide_banner\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_benefits_grid\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_testimonials_block\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_logo_wall\` DROP COLUMN \`anchor_label\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
