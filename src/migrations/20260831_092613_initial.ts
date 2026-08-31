import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_hero_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`heading\` text,
  	\`subheading\` text,
  	\`note\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`cta_label\` text DEFAULT 'Разгледай',
  	\`cta_url\` text,
  	\`cta_new_tab\` integer DEFAULT false,
  	\`align\` text DEFAULT 'left',
  	\`theme\` text DEFAULT 'dark',
  	\`overlay\` text DEFAULT 'medium',
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_order_idx\` ON \`pages_blocks_hero_banner\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_parent_id_idx\` ON \`pages_blocks_hero_banner\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_path_idx\` ON \`pages_blocks_hero_banner\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_image_idx\` ON \`pages_blocks_hero_banner\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_image_mobile_idx\` ON \`pages_blocks_hero_banner\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_category_strip\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_category_strip_order_idx\` ON \`pages_blocks_category_strip\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_category_strip_parent_id_idx\` ON \`pages_blocks_category_strip\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_category_strip_path_idx\` ON \`pages_blocks_category_strip\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_product_carousel\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`section_title\` text,
  	\`subtitle\` text,
  	\`card_style\` text DEFAULT 'image',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_product_carousel_order_idx\` ON \`pages_blocks_product_carousel\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_product_carousel_parent_id_idx\` ON \`pages_blocks_product_carousel\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_product_carousel_path_idx\` ON \`pages_blocks_product_carousel\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_banner_product_row\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`section_title\` text,
  	\`show_banner\` integer DEFAULT true,
  	\`banner_eyebrow\` text,
  	\`banner_heading\` text,
  	\`banner_subheading\` text,
  	\`banner_price_note\` text,
  	\`banner_image_id\` integer,
  	\`banner_cta_label\` text DEFAULT 'Разгледай',
  	\`banner_cta_url\` text,
  	\`banner_cta_new_tab\` integer DEFAULT false,
  	\`banner_theme\` text DEFAULT 'dark',
  	\`show_more_tile\` integer DEFAULT true,
  	\`more_tile_label\` text DEFAULT 'Виж още',
  	\`more_tile_description\` text,
  	\`more_tile_image_id\` integer,
  	\`more_tile_url\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`banner_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`more_tile_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_product_row_order_idx\` ON \`pages_blocks_banner_product_row\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_product_row_parent_id_idx\` ON \`pages_blocks_banner_product_row\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_product_row_path_idx\` ON \`pages_blocks_banner_product_row\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_product_row_banner_banner_image_idx\` ON \`pages_blocks_banner_product_row\` (\`banner_image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_product_row_more_tile_more_tile_imag_idx\` ON \`pages_blocks_banner_product_row\` (\`more_tile_image_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_promo_cards_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`description\` text,
  	\`image_id\` integer,
  	\`cta_label\` text DEFAULT 'Разгледай',
  	\`cta_url\` text,
  	\`cta_new_tab\` integer DEFAULT false,
  	\`theme\` text DEFAULT 'dark',
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_promo_cards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_promo_cards_cards_order_idx\` ON \`pages_blocks_promo_cards_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_promo_cards_cards_parent_id_idx\` ON \`pages_blocks_promo_cards_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_promo_cards_cards_image_idx\` ON \`pages_blocks_promo_cards_cards\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_promo_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`section_title\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_promo_cards_order_idx\` ON \`pages_blocks_promo_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_promo_cards_parent_id_idx\` ON \`pages_blocks_promo_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_promo_cards_path_idx\` ON \`pages_blocks_promo_cards\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_wide_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`subheading\` text,
  	\`image_id\` integer,
  	\`cta_label\` text DEFAULT 'Разгледай',
  	\`cta_url\` text,
  	\`cta_new_tab\` integer DEFAULT false,
  	\`align\` text DEFAULT 'left',
  	\`theme\` text DEFAULT 'dark',
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_wide_banner_order_idx\` ON \`pages_blocks_wide_banner\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_wide_banner_parent_id_idx\` ON \`pages_blocks_wide_banner\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_wide_banner_path_idx\` ON \`pages_blocks_wide_banner\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_wide_banner_image_idx\` ON \`pages_blocks_wide_banner\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_benefits_grid_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text DEFAULT 'shield',
  	\`title\` text,
  	\`description\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_benefits_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_benefits_grid_items_order_idx\` ON \`pages_blocks_benefits_grid_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_benefits_grid_items_parent_id_idx\` ON \`pages_blocks_benefits_grid_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_benefits_grid\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`section_title\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_benefits_grid_order_idx\` ON \`pages_blocks_benefits_grid\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_benefits_grid_parent_id_idx\` ON \`pages_blocks_benefits_grid\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_benefits_grid_path_idx\` ON \`pages_blocks_benefits_grid\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_testimonials_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`section_title\` text DEFAULT 'Истински отзиви. Истинска мощност.',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_testimonials_block_order_idx\` ON \`pages_blocks_testimonials_block\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_testimonials_block_parent_id_idx\` ON \`pages_blocks_testimonials_block\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_testimonials_block_path_idx\` ON \`pages_blocks_testimonials_block\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_logo_wall\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`section_title\` text DEFAULT 'Отличени от',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_logo_wall_order_idx\` ON \`pages_blocks_logo_wall\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_logo_wall_parent_id_idx\` ON \`pages_blocks_logo_wall\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_logo_wall_path_idx\` ON \`pages_blocks_logo_wall\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`slug\` text,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`meta_image_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_slug_idx\` ON \`pages\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`pages_meta_image_idx\` ON \`pages\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_updated_at_idx\` ON \`pages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`pages_created_at_idx\` ON \`pages\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`pages__status_idx\` ON \`pages\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`pages_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`categories_id\` integer,
  	\`products_id\` integer,
  	\`testimonials_id\` integer,
  	\`awards_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`testimonials_id\`) REFERENCES \`testimonials\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`awards_id\`) REFERENCES \`awards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_rels_order_idx\` ON \`pages_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_parent_idx\` ON \`pages_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_path_idx\` ON \`pages_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_categories_id_idx\` ON \`pages_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_products_id_idx\` ON \`pages_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_testimonials_id_idx\` ON \`pages_rels\` (\`testimonials_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_awards_id_idx\` ON \`pages_rels\` (\`awards_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`heading\` text,
  	\`subheading\` text,
  	\`note\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`cta_label\` text DEFAULT 'Разгледай',
  	\`cta_url\` text,
  	\`cta_new_tab\` integer DEFAULT false,
  	\`align\` text DEFAULT 'left',
  	\`theme\` text DEFAULT 'dark',
  	\`overlay\` text DEFAULT 'medium',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_order_idx\` ON \`_pages_v_blocks_hero_banner\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_parent_id_idx\` ON \`_pages_v_blocks_hero_banner\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_path_idx\` ON \`_pages_v_blocks_hero_banner\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_image_idx\` ON \`_pages_v_blocks_hero_banner\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_image_mobile_idx\` ON \`_pages_v_blocks_hero_banner\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_category_strip\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_category_strip_order_idx\` ON \`_pages_v_blocks_category_strip\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_category_strip_parent_id_idx\` ON \`_pages_v_blocks_category_strip\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_category_strip_path_idx\` ON \`_pages_v_blocks_category_strip\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_product_carousel\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`section_title\` text,
  	\`subtitle\` text,
  	\`card_style\` text DEFAULT 'image',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_product_carousel_order_idx\` ON \`_pages_v_blocks_product_carousel\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_product_carousel_parent_id_idx\` ON \`_pages_v_blocks_product_carousel\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_product_carousel_path_idx\` ON \`_pages_v_blocks_product_carousel\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_banner_product_row\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`section_title\` text,
  	\`show_banner\` integer DEFAULT true,
  	\`banner_eyebrow\` text,
  	\`banner_heading\` text,
  	\`banner_subheading\` text,
  	\`banner_price_note\` text,
  	\`banner_image_id\` integer,
  	\`banner_cta_label\` text DEFAULT 'Разгледай',
  	\`banner_cta_url\` text,
  	\`banner_cta_new_tab\` integer DEFAULT false,
  	\`banner_theme\` text DEFAULT 'dark',
  	\`show_more_tile\` integer DEFAULT true,
  	\`more_tile_label\` text DEFAULT 'Виж още',
  	\`more_tile_description\` text,
  	\`more_tile_image_id\` integer,
  	\`more_tile_url\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`banner_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`more_tile_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_order_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_parent_id_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_path_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_banner_banner_image_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`banner_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_more_tile_more_tile_i_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`more_tile_image_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_promo_cards_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`description\` text,
  	\`image_id\` integer,
  	\`cta_label\` text DEFAULT 'Разгледай',
  	\`cta_url\` text,
  	\`cta_new_tab\` integer DEFAULT false,
  	\`theme\` text DEFAULT 'dark',
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_promo_cards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_promo_cards_cards_order_idx\` ON \`_pages_v_blocks_promo_cards_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_promo_cards_cards_parent_id_idx\` ON \`_pages_v_blocks_promo_cards_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_promo_cards_cards_image_idx\` ON \`_pages_v_blocks_promo_cards_cards\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_promo_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`section_title\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_promo_cards_order_idx\` ON \`_pages_v_blocks_promo_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_promo_cards_parent_id_idx\` ON \`_pages_v_blocks_promo_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_promo_cards_path_idx\` ON \`_pages_v_blocks_promo_cards\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_wide_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`subheading\` text,
  	\`image_id\` integer,
  	\`cta_label\` text DEFAULT 'Разгледай',
  	\`cta_url\` text,
  	\`cta_new_tab\` integer DEFAULT false,
  	\`align\` text DEFAULT 'left',
  	\`theme\` text DEFAULT 'dark',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_wide_banner_order_idx\` ON \`_pages_v_blocks_wide_banner\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_wide_banner_parent_id_idx\` ON \`_pages_v_blocks_wide_banner\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_wide_banner_path_idx\` ON \`_pages_v_blocks_wide_banner\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_wide_banner_image_idx\` ON \`_pages_v_blocks_wide_banner\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_benefits_grid_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`icon\` text DEFAULT 'shield',
  	\`title\` text,
  	\`description\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_benefits_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_benefits_grid_items_order_idx\` ON \`_pages_v_blocks_benefits_grid_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_benefits_grid_items_parent_id_idx\` ON \`_pages_v_blocks_benefits_grid_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_benefits_grid\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`section_title\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_benefits_grid_order_idx\` ON \`_pages_v_blocks_benefits_grid\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_benefits_grid_parent_id_idx\` ON \`_pages_v_blocks_benefits_grid\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_benefits_grid_path_idx\` ON \`_pages_v_blocks_benefits_grid\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_testimonials_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`section_title\` text DEFAULT 'Истински отзиви. Истинска мощност.',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_testimonials_block_order_idx\` ON \`_pages_v_blocks_testimonials_block\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_testimonials_block_parent_id_idx\` ON \`_pages_v_blocks_testimonials_block\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_testimonials_block_path_idx\` ON \`_pages_v_blocks_testimonials_block\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_logo_wall\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`section_title\` text DEFAULT 'Отличени от',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_logo_wall_order_idx\` ON \`_pages_v_blocks_logo_wall\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_logo_wall_parent_id_idx\` ON \`_pages_v_blocks_logo_wall\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_logo_wall_path_idx\` ON \`_pages_v_blocks_logo_wall\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_slug\` text,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_meta_image_id\` integer,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_parent_idx\` ON \`_pages_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_slug_idx\` ON \`_pages_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_meta_image_idx\` ON \`_pages_v\` (\`version_meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_updated_at_idx\` ON \`_pages_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_created_at_idx\` ON \`_pages_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version__status_idx\` ON \`_pages_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_created_at_idx\` ON \`_pages_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_updated_at_idx\` ON \`_pages_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_latest_idx\` ON \`_pages_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`categories_id\` integer,
  	\`products_id\` integer,
  	\`testimonials_id\` integer,
  	\`awards_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`testimonials_id\`) REFERENCES \`testimonials\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`awards_id\`) REFERENCES \`awards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_order_idx\` ON \`_pages_v_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_parent_idx\` ON \`_pages_v_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_path_idx\` ON \`_pages_v_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_categories_id_idx\` ON \`_pages_v_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_products_id_idx\` ON \`_pages_v_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_testimonials_id_idx\` ON \`_pages_v_rels\` (\`testimonials_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_awards_id_idx\` ON \`_pages_v_rels\` (\`awards_id\`);`)
  await db.run(sql`CREATE TABLE \`products_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_gallery_order_idx\` ON \`products_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_gallery_parent_id_idx\` ON \`products_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_gallery_image_idx\` ON \`products_gallery\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`products_specs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_specs_order_idx\` ON \`products_specs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_specs_parent_id_idx\` ON \`products_specs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`category_id\` integer NOT NULL,
  	\`tagline\` text,
  	\`badge\` text DEFAULT 'none',
  	\`price\` numeric NOT NULL,
  	\`compare_at_price\` numeric,
  	\`external_url\` text NOT NULL,
  	\`cta_label\` text DEFAULT 'Купи сега',
  	\`availability\` text DEFAULT 'in-stock',
  	\`image_id\` integer NOT NULL,
  	\`description\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`products_slug_idx\` ON \`products\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`products_category_idx\` ON \`products\` (\`category_id\`);`)
  await db.run(sql`CREATE INDEX \`products_image_idx\` ON \`products\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`products_updated_at_idx\` ON \`products\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`products_created_at_idx\` ON \`products\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`categories\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`parent_id\` integer,
  	\`order\` numeric DEFAULT 0,
  	\`show_in_strip\` integer DEFAULT false,
  	\`icon_id\` integer,
  	\`hero_image_id\` integer,
  	\`hero_tagline\` text,
  	\`description\` text,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`icon_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`hero_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`categories_slug_idx\` ON \`categories\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`categories_parent_idx\` ON \`categories\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_icon_idx\` ON \`categories\` (\`icon_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_hero_image_idx\` ON \`categories\` (\`hero_image_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_updated_at_idx\` ON \`categories\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`categories_created_at_idx\` ON \`categories\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`menu_panels_sections_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text NOT NULL,
  	\`spec_line\` text,
  	\`url\` text,
  	\`label\` text,
  	\`ribbon\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`menu_panels_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_cards_order_idx\` ON \`menu_panels_sections_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_cards_parent_id_idx\` ON \`menu_panels_sections_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_cards_image_idx\` ON \`menu_panels_sections_cards\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`menu_panels_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text NOT NULL,
  	\`view_all_label\` text DEFAULT 'Виж всички',
  	\`view_all_url\` text,
  	\`featured_image_id\` integer,
  	\`featured_title\` text,
  	\`featured_spec_line\` text,
  	\`featured_url\` text,
  	\`featured_label\` text,
  	\`featured_ribbon\` text,
  	\`show_view_all_tile\` integer DEFAULT true,
  	\`view_all_tile_url\` text,
  	FOREIGN KEY (\`featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`menu_panels\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_order_idx\` ON \`menu_panels_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_parent_id_idx\` ON \`menu_panels_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_featured_featured_image_idx\` ON \`menu_panels_sections\` (\`featured_image_id\`);`)
  await db.run(sql`CREATE TABLE \`menu_panels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`menu_panels_slug_idx\` ON \`menu_panels\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_updated_at_idx\` ON \`menu_panels\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_created_at_idx\` ON \`menu_panels\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric,
  	\`sizes_thumbnail_url\` text,
  	\`sizes_thumbnail_width\` numeric,
  	\`sizes_thumbnail_height\` numeric,
  	\`sizes_thumbnail_mime_type\` text,
  	\`sizes_thumbnail_filesize\` numeric,
  	\`sizes_thumbnail_filename\` text,
  	\`sizes_card_url\` text,
  	\`sizes_card_width\` numeric,
  	\`sizes_card_height\` numeric,
  	\`sizes_card_mime_type\` text,
  	\`sizes_card_filesize\` numeric,
  	\`sizes_card_filename\` text,
  	\`sizes_banner_url\` text,
  	\`sizes_banner_width\` numeric,
  	\`sizes_banner_height\` numeric,
  	\`sizes_banner_mime_type\` text,
  	\`sizes_banner_filesize\` numeric,
  	\`sizes_banner_filename\` text,
  	\`sizes_wide_url\` text,
  	\`sizes_wide_width\` numeric,
  	\`sizes_wide_height\` numeric,
  	\`sizes_wide_mime_type\` text,
  	\`sizes_wide_filesize\` numeric,
  	\`sizes_wide_filename\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_thumbnail_sizes_thumbnail_filename_idx\` ON \`media\` (\`sizes_thumbnail_filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_card_sizes_card_filename_idx\` ON \`media\` (\`sizes_card_filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_banner_sizes_banner_filename_idx\` ON \`media\` (\`sizes_banner_filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_wide_sizes_wide_filename_idx\` ON \`media\` (\`sizes_wide_filename\`);`)
  await db.run(sql`CREATE TABLE \`testimonials\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`author\` text NOT NULL,
  	\`location\` text,
  	\`quote\` text NOT NULL,
  	\`image_id\` integer,
  	\`rating\` numeric DEFAULT 5,
  	\`link\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`testimonials_image_idx\` ON \`testimonials\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`testimonials_updated_at_idx\` ON \`testimonials\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`testimonials_created_at_idx\` ON \`testimonials\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`awards\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`logo_id\` integer NOT NULL,
  	\`url\` text,
  	\`order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`awards_logo_idx\` ON \`awards\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`awards_updated_at_idx\` ON \`awards\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`awards_created_at_idx\` ON \`awards\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
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
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`menu_panels_id\`) REFERENCES \`menu_panels\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`testimonials_id\`) REFERENCES \`testimonials\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`awards_id\`) REFERENCES \`awards\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
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
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`header_items_groups_entries\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`panel_id\` integer NOT NULL,
  	FOREIGN KEY (\`panel_id\`) REFERENCES \`menu_panels\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`header_items_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`header_items_groups_entries_order_idx\` ON \`header_items_groups_entries\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`header_items_groups_entries_parent_id_idx\` ON \`header_items_groups_entries\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`header_items_groups_entries_panel_idx\` ON \`header_items_groups_entries\` (\`panel_id\`);`)
  await db.run(sql`CREATE TABLE \`header_items_groups\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text NOT NULL,
  	\`default_open\` integer DEFAULT false,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`header_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`header_items_groups_order_idx\` ON \`header_items_groups\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`header_items_groups_parent_id_idx\` ON \`header_items_groups\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`header_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`url\` text,
  	\`badge\` text DEFAULT 'none',
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`header\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`header_items_order_idx\` ON \`header_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`header_items_parent_id_idx\` ON \`header_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`header\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`top_left_label\` text,
  	\`top_left_url\` text,
  	\`top_promo_text\` text,
  	\`top_promo_url\` text,
  	\`region_label\` text DEFAULT 'България (Български / € EUR)',
  	\`logo_id\` integer,
  	\`logo_suffix\` text DEFAULT 'МАГАЗИН',
  	\`logo_tagline\` text,
  	\`search_enabled\` integer DEFAULT true,
  	\`cta_label\` text DEFAULT 'Към магазина',
  	\`cta_url\` text,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`header_logo_idx\` ON \`header\` (\`logo_id\`);`)
  await db.run(sql`CREATE TABLE \`footer_columns_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer_columns\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`footer_columns_links_order_idx\` ON \`footer_columns_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`footer_columns_links_parent_id_idx\` ON \`footer_columns_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`footer_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`footer_columns_order_idx\` ON \`footer_columns\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`footer_columns_parent_id_idx\` ON \`footer_columns\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`footer_social\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`platform\` text NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`footer_social_order_idx\` ON \`footer_social\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`footer_social_parent_id_idx\` ON \`footer_social\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`footer_legal_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`footer_legal_links_order_idx\` ON \`footer_legal_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`footer_legal_links_parent_id_idx\` ON \`footer_legal_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`footer\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`newsletter_enabled\` integer DEFAULT true,
  	\`newsletter_heading\` text,
  	\`newsletter_text\` text,
  	\`copyright\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`design\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`brand\` text,
  	\`brand_dark\` text,
  	\`page\` text,
  	\`surface\` text,
  	\`topbar\` text,
  	\`tile\` text,
  	\`tile_hover\` text,
  	\`nav_hover\` text,
  	\`nav_active\` text,
  	\`ink\` text,
  	\`ink_muted\` text,
  	\`line\` text,
  	\`line_strong\` text,
  	\`night\` text,
  	\`night_soft\` text,
  	\`accent\` text,
  	\`info\` text,
  	\`alert\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`site_settings\` (
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
  await db.run(sql`CREATE INDEX \`site_settings_logo_idx\` ON \`site_settings\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`site_settings_logo_dark_idx\` ON \`site_settings\` (\`logo_dark_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_hero_banner\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_category_strip\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_product_carousel\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_banner_product_row\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_promo_cards_cards\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_promo_cards\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_wide_banner\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_benefits_grid_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_benefits_grid\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_testimonials_block\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_logo_wall\`;`)
  await db.run(sql`DROP TABLE \`pages\`;`)
  await db.run(sql`DROP TABLE \`pages_rels\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero_banner\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_category_strip\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_product_carousel\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_banner_product_row\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_promo_cards_cards\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_promo_cards\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_wide_banner\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_benefits_grid_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_benefits_grid\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_testimonials_block\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_logo_wall\`;`)
  await db.run(sql`DROP TABLE \`_pages_v\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_rels\`;`)
  await db.run(sql`DROP TABLE \`products_gallery\`;`)
  await db.run(sql`DROP TABLE \`products_specs\`;`)
  await db.run(sql`DROP TABLE \`products\`;`)
  await db.run(sql`DROP TABLE \`categories\`;`)
  await db.run(sql`DROP TABLE \`menu_panels_sections_cards\`;`)
  await db.run(sql`DROP TABLE \`menu_panels_sections\`;`)
  await db.run(sql`DROP TABLE \`menu_panels\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`testimonials\`;`)
  await db.run(sql`DROP TABLE \`awards\`;`)
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
  await db.run(sql`DROP TABLE \`header_items_groups_entries\`;`)
  await db.run(sql`DROP TABLE \`header_items_groups\`;`)
  await db.run(sql`DROP TABLE \`header_items\`;`)
  await db.run(sql`DROP TABLE \`header\`;`)
  await db.run(sql`DROP TABLE \`footer_columns_links\`;`)
  await db.run(sql`DROP TABLE \`footer_columns\`;`)
  await db.run(sql`DROP TABLE \`footer_social\`;`)
  await db.run(sql`DROP TABLE \`footer_legal_links\`;`)
  await db.run(sql`DROP TABLE \`footer\`;`)
  await db.run(sql`DROP TABLE \`design\`;`)
  await db.run(sql`DROP TABLE \`site_settings\`;`)
}
