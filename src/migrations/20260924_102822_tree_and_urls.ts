import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`categories_blocks_hero_banner_slides\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`badge_image_id\` integer,
  	\`eyebrow\` text,
  	\`eyebrow_color\` text DEFAULT 'white',
  	\`heading\` text,
  	\`subheading\` text,
  	\`note\` text,
  	\`image_id\` integer,
  	\`image_mobile_id\` integer,
  	\`cta_label\` text DEFAULT 'Разгледай',
  	\`cta_url\` text,
  	\`cta_new_tab\` integer DEFAULT false,
  	\`cta_style\` text DEFAULT 'light',
  	\`align\` text DEFAULT 'left',
  	\`theme\` text DEFAULT 'dark',
  	\`overlay\` text DEFAULT 'none',
  	FOREIGN KEY (\`badge_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_hero_banner\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_hero_banner_slides_order_idx\` ON \`categories_blocks_hero_banner_slides\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_hero_banner_slides_parent_id_idx\` ON \`categories_blocks_hero_banner_slides\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_hero_banner_slides_badge_image_idx\` ON \`categories_blocks_hero_banner_slides\` (\`badge_image_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_hero_banner_slides_image_idx\` ON \`categories_blocks_hero_banner_slides\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_hero_banner_slides_image_mobile_idx\` ON \`categories_blocks_hero_banner_slides\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_hero_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`autoplay_seconds\` numeric DEFAULT 6,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_hero_banner_order_idx\` ON \`categories_blocks_hero_banner\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_hero_banner_parent_id_idx\` ON \`categories_blocks_hero_banner\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_hero_banner_path_idx\` ON \`categories_blocks_hero_banner\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_category_strip\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_category_strip_order_idx\` ON \`categories_blocks_category_strip\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_category_strip_parent_id_idx\` ON \`categories_blocks_category_strip\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_category_strip_path_idx\` ON \`categories_blocks_category_strip\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_product_carousel\` (
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
  await db.run(sql`CREATE INDEX \`categories_blocks_product_carousel_order_idx\` ON \`categories_blocks_product_carousel\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_product_carousel_parent_id_idx\` ON \`categories_blocks_product_carousel\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_product_carousel_path_idx\` ON \`categories_blocks_product_carousel\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_banner_carousel_cards_buttons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`url\` text,
  	\`style\` text DEFAULT 'white',
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_banner_carousel_cards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_carousel_cards_buttons_order_idx\` ON \`categories_blocks_banner_carousel_cards_buttons\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_carousel_cards_buttons_parent_id_idx\` ON \`categories_blocks_banner_carousel_cards_buttons\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_banner_carousel_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`tag\` text,
  	\`heading\` text,
  	\`subheading\` text,
  	\`text_theme\` text DEFAULT 'light',
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_banner_carousel\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_carousel_cards_order_idx\` ON \`categories_blocks_banner_carousel_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_carousel_cards_parent_id_idx\` ON \`categories_blocks_banner_carousel_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_carousel_cards_image_idx\` ON \`categories_blocks_banner_carousel_cards\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_banner_carousel\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`heading\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_carousel_order_idx\` ON \`categories_blocks_banner_carousel\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_carousel_parent_id_idx\` ON \`categories_blocks_banner_carousel\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_carousel_path_idx\` ON \`categories_blocks_banner_carousel\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_banner_product_row\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`section_title\` text,
  	\`show_banner\` integer DEFAULT true,
  	\`banner_eyebrow\` text,
  	\`banner_eyebrow_color\` text DEFAULT 'white',
  	\`banner_heading\` text,
  	\`banner_subheading\` text,
  	\`banner_price_note\` text,
  	\`banner_image_id\` integer,
  	\`banner_video_id\` integer,
  	\`banner_cta_label\` text DEFAULT 'Разгледай',
  	\`banner_cta_url\` text,
  	\`banner_cta_new_tab\` integer DEFAULT false,
  	\`banner_cta_style\` text DEFAULT 'light',
  	\`banner_theme\` text DEFAULT 'dark',
  	\`show_more_tile\` integer DEFAULT true,
  	\`more_tile_label\` text DEFAULT 'Виж всички',
  	\`more_tile_url\` text,
  	\`more_tile_image_id\` integer,
  	\`more_tile_description\` text,
  	\`more_tile_secondary_label\` text,
  	\`more_tile_secondary_url\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`banner_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`banner_video_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`more_tile_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_product_row_order_idx\` ON \`categories_blocks_banner_product_row\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_product_row_parent_id_idx\` ON \`categories_blocks_banner_product_row\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_product_row_path_idx\` ON \`categories_blocks_banner_product_row\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_product_row_banner_banner_image_idx\` ON \`categories_blocks_banner_product_row\` (\`banner_image_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_product_row_banner_banner_video_idx\` ON \`categories_blocks_banner_product_row\` (\`banner_video_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_product_row_more_tile_more_tile_idx\` ON \`categories_blocks_banner_product_row\` (\`more_tile_image_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_promo_cards_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`description\` text,
  	\`image_id\` integer,
  	\`cta_label\` text DEFAULT 'Разгледай',
  	\`cta_url\` text,
  	\`cta_new_tab\` integer DEFAULT false,
  	\`cta_style\` text DEFAULT 'light',
  	\`theme\` text DEFAULT 'dark',
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_promo_cards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_promo_cards_cards_order_idx\` ON \`categories_blocks_promo_cards_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_promo_cards_cards_parent_id_idx\` ON \`categories_blocks_promo_cards_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_promo_cards_cards_image_idx\` ON \`categories_blocks_promo_cards_cards\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_promo_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`section_title\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_promo_cards_order_idx\` ON \`categories_blocks_promo_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_promo_cards_parent_id_idx\` ON \`categories_blocks_promo_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_promo_cards_path_idx\` ON \`categories_blocks_promo_cards\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_wide_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
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
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_wide_banner_order_idx\` ON \`categories_blocks_wide_banner\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_wide_banner_parent_id_idx\` ON \`categories_blocks_wide_banner\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_wide_banner_path_idx\` ON \`categories_blocks_wide_banner\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_wide_banner_image_idx\` ON \`categories_blocks_wide_banner\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_benefits_grid_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text DEFAULT 'shield',
  	\`title\` text,
  	\`description\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories_blocks_benefits_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_benefits_grid_items_order_idx\` ON \`categories_blocks_benefits_grid_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_benefits_grid_items_parent_id_idx\` ON \`categories_blocks_benefits_grid_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_benefits_grid\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`section_title\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_benefits_grid_order_idx\` ON \`categories_blocks_benefits_grid\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_benefits_grid_parent_id_idx\` ON \`categories_blocks_benefits_grid\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_benefits_grid_path_idx\` ON \`categories_blocks_benefits_grid\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_testimonials_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`section_title\` text DEFAULT 'Истински отзиви. Истинска мощност.',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_testimonials_block_order_idx\` ON \`categories_blocks_testimonials_block\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_testimonials_block_parent_id_idx\` ON \`categories_blocks_testimonials_block\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_testimonials_block_path_idx\` ON \`categories_blocks_testimonials_block\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_logo_wall\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`section_title\` text DEFAULT 'Отличени от',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_logo_wall_order_idx\` ON \`categories_blocks_logo_wall\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_logo_wall_parent_id_idx\` ON \`categories_blocks_logo_wall\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_logo_wall_path_idx\` ON \`categories_blocks_logo_wall\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`categories_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`categories_id\` integer,
  	\`products_id\` integer,
  	\`testimonials_id\` integer,
  	\`awards_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`testimonials_id\`) REFERENCES \`testimonials\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`awards_id\`) REFERENCES \`awards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_rels_order_idx\` ON \`categories_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`categories_rels_parent_idx\` ON \`categories_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_rels_path_idx\` ON \`categories_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`categories_rels_categories_id_idx\` ON \`categories_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_rels_products_id_idx\` ON \`categories_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_rels_testimonials_id_idx\` ON \`categories_rels\` (\`testimonials_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_rels_awards_id_idx\` ON \`categories_rels\` (\`awards_id\`);`)
  await db.run(sql`CREATE TABLE \`redirects\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`from\` text NOT NULL,
  	\`to\` text NOT NULL,
  	\`reason\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`redirects_from_idx\` ON \`redirects\` (\`from\`);`)
  await db.run(sql`CREATE INDEX \`redirects_updated_at_idx\` ON \`redirects\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`redirects_created_at_idx\` ON \`redirects\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`products_blocks_related_products\` ADD \`mode\` text DEFAULT 'auto';`)
  await db.run(sql`ALTER TABLE \`products_rels\` ADD \`categories_id\` integer REFERENCES categories(id);`)
  await db.run(sql`CREATE INDEX \`products_rels_categories_id_idx\` ON \`products_rels\` (\`categories_id\`);`)
  await db.run(sql`ALTER TABLE \`_products_v_blocks_related_products\` ADD \`mode\` text DEFAULT 'auto';`)
  await db.run(sql`ALTER TABLE \`_products_v_rels\` ADD \`categories_id\` integer REFERENCES categories(id);`)
  await db.run(sql`CREATE INDEX \`_products_v_rels_categories_id_idx\` ON \`_products_v_rels\` (\`categories_id\`);`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`banner_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`noindex\` integer DEFAULT false;`)
  await db.run(sql`CREATE INDEX \`categories_banner_idx\` ON \`categories\` (\`banner_id\`);`)
  await db.run(sql`ALTER TABLE \`menu_panels_sections\` ADD \`view_all_category_id\` integer REFERENCES categories(id);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_view_all_category_idx\` ON \`menu_panels_sections\` (\`view_all_category_id\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`redirects_id\` integer REFERENCES redirects(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_redirects_id_idx\` ON \`payload_locked_documents_rels\` (\`redirects_id\`);`)
  await db.run(sql`ALTER TABLE \`header_items\` ADD \`category_id\` integer REFERENCES categories(id);`)
  await db.run(sql`CREATE INDEX \`header_items_category_idx\` ON \`header_items\` (\`category_id\`);`)

  /*
    Съществуващите блокове „Свързани продукти" са с ръчно избран списък.
    Новият режим по подразбиране е автоматичен — без този ред те биха
    останали с „auto" и биха показали друго съдържание.
  */
  await db.run(sql`UPDATE \`products_blocks_related_products\` SET \`mode\` = 'manual';`)
  await db.run(sql`UPDATE \`_products_v_blocks_related_products\` SET \`mode\` = 'manual';`)

  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE \`categories_blocks_hero_banner_slides\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_hero_banner\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_category_strip\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_product_carousel\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_banner_carousel_cards_buttons\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_banner_carousel_cards\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_banner_carousel\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_banner_product_row\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_promo_cards_cards\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_promo_cards\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_wide_banner\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_benefits_grid_items\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_benefits_grid\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_testimonials_block\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_logo_wall\`;`)
  await db.run(sql`DROP TABLE \`categories_rels\`;`)
  await db.run(sql`DROP TABLE \`redirects\`;`)
  await db.run(sql`CREATE TABLE \`__new_products_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`products_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_rels\`("id", "order", "parent_id", "path", "products_id") SELECT "id", "order", "parent_id", "path", "products_id" FROM \`products_rels\`;`)
  await db.run(sql`DROP TABLE \`products_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_rels\` RENAME TO \`products_rels\`;`)
  await db.run(sql`CREATE INDEX \`products_rels_order_idx\` ON \`products_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`products_rels_parent_idx\` ON \`products_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_rels_path_idx\` ON \`products_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`products_rels_products_id_idx\` ON \`products_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE TABLE \`__new__products_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`products_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__products_v_rels\`("id", "order", "parent_id", "path", "products_id") SELECT "id", "order", "parent_id", "path", "products_id" FROM \`_products_v_rels\`;`)
  await db.run(sql`DROP TABLE \`_products_v_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new__products_v_rels\` RENAME TO \`_products_v_rels\`;`)
  await db.run(sql`CREATE INDEX \`_products_v_rels_order_idx\` ON \`_products_v_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_rels_parent_idx\` ON \`_products_v_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_rels_path_idx\` ON \`_products_v_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_rels_products_id_idx\` ON \`_products_v_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_categories\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`parent_id\` integer,
  	\`show_in_strip\` integer DEFAULT false,
  	\`strip_badge\` text,
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
  await db.run(sql`INSERT INTO \`__new_categories\`("id", "_order", "title", "slug", "parent_id", "show_in_strip", "strip_badge", "icon_id", "hero_image_id", "hero_tagline", "description", "meta_title", "meta_description", "updated_at", "created_at") SELECT "id", "_order", "title", "slug", "parent_id", "show_in_strip", "strip_badge", "icon_id", "hero_image_id", "hero_tagline", "description", "meta_title", "meta_description", "updated_at", "created_at" FROM \`categories\`;`)
  await db.run(sql`DROP TABLE \`categories\`;`)
  await db.run(sql`ALTER TABLE \`__new_categories\` RENAME TO \`categories\`;`)
  await db.run(sql`CREATE INDEX \`categories__order_idx\` ON \`categories\` (\`_order\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`categories_slug_idx\` ON \`categories\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`categories_parent_idx\` ON \`categories\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_icon_idx\` ON \`categories\` (\`icon_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_hero_image_idx\` ON \`categories\` (\`hero_image_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_updated_at_idx\` ON \`categories\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`categories_created_at_idx\` ON \`categories\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`__new_menu_panels_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`view_all_label\` text DEFAULT 'Виж всички',
  	\`view_all_url\` text,
  	\`featured_product_id\` integer,
  	\`featured_image_id\` integer,
  	\`featured_title\` text,
  	\`featured_spec_line\` text,
  	\`featured_url\` text,
  	\`featured_label\` text,
  	\`featured_ribbon\` text,
  	\`show_view_all_tile\` integer DEFAULT true,
  	\`view_all_tile_url\` text,
  	FOREIGN KEY (\`featured_product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`menu_panels\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_menu_panels_sections\`("_order", "_parent_id", "id", "heading", "view_all_label", "view_all_url", "featured_product_id", "featured_image_id", "featured_title", "featured_spec_line", "featured_url", "featured_label", "featured_ribbon", "show_view_all_tile", "view_all_tile_url") SELECT "_order", "_parent_id", "id", "heading", "view_all_label", "view_all_url", "featured_product_id", "featured_image_id", "featured_title", "featured_spec_line", "featured_url", "featured_label", "featured_ribbon", "show_view_all_tile", "view_all_tile_url" FROM \`menu_panels_sections\`;`)
  await db.run(sql`DROP TABLE \`menu_panels_sections\`;`)
  await db.run(sql`ALTER TABLE \`__new_menu_panels_sections\` RENAME TO \`menu_panels_sections\`;`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_order_idx\` ON \`menu_panels_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_parent_id_idx\` ON \`menu_panels_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_featured_featured_product_idx\` ON \`menu_panels_sections\` (\`featured_product_id\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_sections_featured_featured_image_idx\` ON \`menu_panels_sections\` (\`featured_image_id\`);`)
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
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "pages_id", "products_id", "categories_id", "menu_panels_id", "media_id", "testimonials_id", "awards_id", "subscribers_id", "backups_id", "users_id") SELECT "id", "order", "parent_id", "path", "pages_id", "products_id", "categories_id", "menu_panels_id", "media_id", "testimonials_id", "awards_id", "subscribers_id", "backups_id", "users_id" FROM \`payload_locked_documents_rels\`;`)
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
  await db.run(sql`CREATE TABLE \`__new_header_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`url\` text,
  	\`badge\` text DEFAULT 'none',
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`header\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_header_items\`("_order", "_parent_id", "id", "label", "url", "badge") SELECT "_order", "_parent_id", "id", "label", "url", "badge" FROM \`header_items\`;`)
  await db.run(sql`DROP TABLE \`header_items\`;`)
  await db.run(sql`ALTER TABLE \`__new_header_items\` RENAME TO \`header_items\`;`)
  await db.run(sql`CREATE INDEX \`header_items_order_idx\` ON \`header_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`header_items_parent_id_idx\` ON \`header_items\` (\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`products_blocks_related_products\` DROP COLUMN \`mode\`;`)
  await db.run(sql`ALTER TABLE \`_products_v_blocks_related_products\` DROP COLUMN \`mode\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
