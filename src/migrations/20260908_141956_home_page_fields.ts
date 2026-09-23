import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`pages_blocks_banner_carousel_cards_buttons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`url\` text,
  	\`style\` text DEFAULT 'white',
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_banner_carousel_cards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_carousel_cards_buttons_order_idx\` ON \`pages_blocks_banner_carousel_cards_buttons\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_carousel_cards_buttons_parent_id_idx\` ON \`pages_blocks_banner_carousel_cards_buttons\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_banner_carousel_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`tag\` text,
  	\`heading\` text,
  	\`subheading\` text,
  	\`text_theme\` text DEFAULT 'light',
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_banner_carousel\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_carousel_cards_order_idx\` ON \`pages_blocks_banner_carousel_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_carousel_cards_parent_id_idx\` ON \`pages_blocks_banner_carousel_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_carousel_cards_image_idx\` ON \`pages_blocks_banner_carousel_cards\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_banner_carousel\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`heading\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_carousel_order_idx\` ON \`pages_blocks_banner_carousel\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_carousel_parent_id_idx\` ON \`pages_blocks_banner_carousel\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_carousel_path_idx\` ON \`pages_blocks_banner_carousel\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_banner_carousel_cards_buttons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`url\` text,
  	\`style\` text DEFAULT 'white',
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_banner_carousel_cards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_carousel_cards_buttons_order_idx\` ON \`_pages_v_blocks_banner_carousel_cards_buttons\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_carousel_cards_buttons_parent_id_idx\` ON \`_pages_v_blocks_banner_carousel_cards_buttons\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_banner_carousel_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`tag\` text,
  	\`heading\` text,
  	\`subheading\` text,
  	\`text_theme\` text DEFAULT 'light',
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_banner_carousel\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_carousel_cards_order_idx\` ON \`_pages_v_blocks_banner_carousel_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_carousel_cards_parent_id_idx\` ON \`_pages_v_blocks_banner_carousel_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_carousel_cards_image_idx\` ON \`_pages_v_blocks_banner_carousel_cards\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_banner_carousel\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`heading\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_carousel_order_idx\` ON \`_pages_v_blocks_banner_carousel\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_carousel_parent_id_idx\` ON \`_pages_v_blocks_banner_carousel\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_carousel_path_idx\` ON \`_pages_v_blocks_banner_carousel\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`subscribers\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`email\` text NOT NULL,
  	\`subscribed_at\` text,
  	\`status\` text DEFAULT 'active',
  	\`source\` text,
  	\`consent\` integer DEFAULT false,
  	\`note\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`subscribers_email_idx\` ON \`subscribers\` (\`email\`);`)
  await db.run(sql`CREATE INDEX \`subscribers_updated_at_idx\` ON \`subscribers\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`subscribers_created_at_idx\` ON \`subscribers\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_banner_product_row\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_pages_blocks_banner_product_row\`("_order", "_parent_id", "_path", "id", "hidden", "section_title", "show_banner", "banner_eyebrow", "banner_eyebrow_color", "banner_heading", "banner_subheading", "banner_price_note", "banner_image_id", "banner_video_id", "banner_cta_label", "banner_cta_url", "banner_cta_new_tab", "banner_cta_style", "banner_theme", "show_more_tile", "more_tile_label", "more_tile_url", "more_tile_image_id", "more_tile_description", "more_tile_secondary_label", "more_tile_secondary_url", "block_name") SELECT "_order", "_parent_id", "_path", "id", NULL, "section_title", "show_banner", "banner_eyebrow", NULL, "banner_heading", "banner_subheading", "banner_price_note", "banner_image_id", NULL, "banner_cta_label", "banner_cta_url", "banner_cta_new_tab", NULL, "banner_theme", "show_more_tile", "more_tile_label", "more_tile_url", "more_tile_image_id", "more_tile_description", NULL, NULL, "block_name" FROM \`pages_blocks_banner_product_row\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_banner_product_row\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_banner_product_row\` RENAME TO \`pages_blocks_banner_product_row\`;`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_product_row_order_idx\` ON \`pages_blocks_banner_product_row\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_product_row_parent_id_idx\` ON \`pages_blocks_banner_product_row\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_product_row_path_idx\` ON \`pages_blocks_banner_product_row\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_product_row_banner_banner_image_idx\` ON \`pages_blocks_banner_product_row\` (\`banner_image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_product_row_banner_banner_video_idx\` ON \`pages_blocks_banner_product_row\` (\`banner_video_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_product_row_more_tile_more_tile_imag_idx\` ON \`pages_blocks_banner_product_row\` (\`more_tile_image_id\`);`)
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_banner_product_row\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
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
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`banner_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`banner_video_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`more_tile_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__pages_v_blocks_banner_product_row\`("_order", "_parent_id", "_path", "id", "hidden", "section_title", "show_banner", "banner_eyebrow", "banner_eyebrow_color", "banner_heading", "banner_subheading", "banner_price_note", "banner_image_id", "banner_video_id", "banner_cta_label", "banner_cta_url", "banner_cta_new_tab", "banner_cta_style", "banner_theme", "show_more_tile", "more_tile_label", "more_tile_url", "more_tile_image_id", "more_tile_description", "more_tile_secondary_label", "more_tile_secondary_url", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", NULL, "section_title", "show_banner", "banner_eyebrow", NULL, "banner_heading", "banner_subheading", "banner_price_note", "banner_image_id", NULL, "banner_cta_label", "banner_cta_url", "banner_cta_new_tab", NULL, "banner_theme", "show_more_tile", "more_tile_label", "more_tile_url", "more_tile_image_id", "more_tile_description", NULL, NULL, "_uuid", "block_name" FROM \`_pages_v_blocks_banner_product_row\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_banner_product_row\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_blocks_banner_product_row\` RENAME TO \`_pages_v_blocks_banner_product_row\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_order_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_parent_id_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_path_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_banner_banner_image_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`banner_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_banner_banner_video_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`banner_video_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_more_tile_more_tile_i_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`more_tile_image_id\`);`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` ADD \`autoplay_seconds\` numeric DEFAULT 6;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` ADD \`cta_style\` text DEFAULT 'light';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_category_strip\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_product_carousel\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_promo_cards_cards\` ADD \`cta_style\` text DEFAULT 'light';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_promo_cards\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_wide_banner\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_wide_banner\` ADD \`section_title\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_wide_banner\` ADD \`eyebrow\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_wide_banner\` ADD \`eyebrow_color\` text DEFAULT 'white';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_wide_banner\` ADD \`price_note\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_wide_banner\` ADD \`cta_style\` text DEFAULT 'light';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_benefits_grid\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_testimonials_block\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_logo_wall\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` ADD \`autoplay_seconds\` numeric DEFAULT 6;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` ADD \`cta_style\` text DEFAULT 'light';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_category_strip\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_product_carousel\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_promo_cards_cards\` ADD \`cta_style\` text DEFAULT 'light';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_promo_cards\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wide_banner\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wide_banner\` ADD \`section_title\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wide_banner\` ADD \`eyebrow\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wide_banner\` ADD \`eyebrow_color\` text DEFAULT 'white';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wide_banner\` ADD \`price_note\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wide_banner\` ADD \`cta_style\` text DEFAULT 'light';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_benefits_grid\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_testimonials_block\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_logo_wall\` ADD \`hidden\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`rating\` numeric;`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`review_count\` numeric;`)
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_rating\` numeric;`)
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_review_count\` numeric;`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`strip_badge\` text;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`subscribers_id\` integer REFERENCES subscribers(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_subscribers_id_idx\` ON \`payload_locked_documents_rels\` (\`subscribers_id\`);`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`newsletter_consent_text\` text DEFAULT 'Съгласен съм да получавам новини и оферти от EcoFlow България. Мога да се отпиша по всяко време.';`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE \`pages_blocks_banner_carousel_cards_buttons\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_banner_carousel_cards\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_banner_carousel\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_banner_carousel_cards_buttons\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_banner_carousel_cards\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_banner_carousel\`;`)
  await db.run(sql`DROP TABLE \`subscribers\`;`)
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_banner_product_row\` (
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
  await db.run(sql`INSERT INTO \`__new_pages_blocks_banner_product_row\`("_order", "_parent_id", "_path", "id", "section_title", "show_banner", "banner_eyebrow", "banner_heading", "banner_subheading", "banner_price_note", "banner_image_id", "banner_cta_label", "banner_cta_url", "banner_cta_new_tab", "banner_theme", "show_more_tile", "more_tile_label", "more_tile_description", "more_tile_image_id", "more_tile_url", "block_name") SELECT "_order", "_parent_id", "_path", "id", "section_title", "show_banner", "banner_eyebrow", "banner_heading", "banner_subheading", "banner_price_note", "banner_image_id", "banner_cta_label", "banner_cta_url", "banner_cta_new_tab", "banner_theme", "show_more_tile", "more_tile_label", "more_tile_description", "more_tile_image_id", "more_tile_url", "block_name" FROM \`pages_blocks_banner_product_row\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_banner_product_row\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_banner_product_row\` RENAME TO \`pages_blocks_banner_product_row\`;`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_product_row_order_idx\` ON \`pages_blocks_banner_product_row\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_product_row_parent_id_idx\` ON \`pages_blocks_banner_product_row\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_product_row_path_idx\` ON \`pages_blocks_banner_product_row\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_product_row_banner_banner_image_idx\` ON \`pages_blocks_banner_product_row\` (\`banner_image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_product_row_more_tile_more_tile_imag_idx\` ON \`pages_blocks_banner_product_row\` (\`more_tile_image_id\`);`)
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_banner_product_row\` (
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
  await db.run(sql`INSERT INTO \`__new__pages_v_blocks_banner_product_row\`("_order", "_parent_id", "_path", "id", "section_title", "show_banner", "banner_eyebrow", "banner_heading", "banner_subheading", "banner_price_note", "banner_image_id", "banner_cta_label", "banner_cta_url", "banner_cta_new_tab", "banner_theme", "show_more_tile", "more_tile_label", "more_tile_description", "more_tile_image_id", "more_tile_url", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "section_title", "show_banner", "banner_eyebrow", "banner_heading", "banner_subheading", "banner_price_note", "banner_image_id", "banner_cta_label", "banner_cta_url", "banner_cta_new_tab", "banner_theme", "show_more_tile", "more_tile_label", "more_tile_description", "more_tile_image_id", "more_tile_url", "_uuid", "block_name" FROM \`_pages_v_blocks_banner_product_row\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_banner_product_row\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_blocks_banner_product_row\` RENAME TO \`_pages_v_blocks_banner_product_row\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_order_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_parent_id_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_path_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_banner_banner_image_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`banner_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_more_tile_more_tile_i_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`more_tile_image_id\`);`)
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
  	FOREIGN KEY (\`backups_id\`) REFERENCES \`backups\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "pages_id", "products_id", "categories_id", "menu_panels_id", "media_id", "testimonials_id", "awards_id", "backups_id", "users_id") SELECT "id", "order", "parent_id", "path", "pages_id", "products_id", "categories_id", "menu_panels_id", "media_id", "testimonials_id", "awards_id", "backups_id", "users_id" FROM \`payload_locked_documents_rels\`;`)
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
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_backups_id_idx\` ON \`payload_locked_documents_rels\` (\`backups_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` DROP COLUMN \`autoplay_seconds\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` DROP COLUMN \`cta_style\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_category_strip\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_product_carousel\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_promo_cards_cards\` DROP COLUMN \`cta_style\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_promo_cards\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_wide_banner\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_wide_banner\` DROP COLUMN \`section_title\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_wide_banner\` DROP COLUMN \`eyebrow\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_wide_banner\` DROP COLUMN \`eyebrow_color\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_wide_banner\` DROP COLUMN \`price_note\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_wide_banner\` DROP COLUMN \`cta_style\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_benefits_grid\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_testimonials_block\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_logo_wall\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` DROP COLUMN \`autoplay_seconds\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` DROP COLUMN \`cta_style\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_category_strip\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_product_carousel\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_promo_cards_cards\` DROP COLUMN \`cta_style\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_promo_cards\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wide_banner\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wide_banner\` DROP COLUMN \`section_title\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wide_banner\` DROP COLUMN \`eyebrow\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wide_banner\` DROP COLUMN \`eyebrow_color\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wide_banner\` DROP COLUMN \`price_note\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wide_banner\` DROP COLUMN \`cta_style\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_benefits_grid\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_testimonials_block\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_logo_wall\` DROP COLUMN \`hidden\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`rating\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`review_count\`;`)
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_rating\`;`)
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_review_count\`;`)
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`strip_badge\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`newsletter_consent_text\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
