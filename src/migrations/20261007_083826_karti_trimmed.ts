import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_product_carousel\` ADD \`card_theme\` text DEFAULT 'light';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_banner_product_row\` ADD \`banner_product_id\` integer REFERENCES products(id);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_banner_product_row_banner_banner_product_idx\` ON \`pages_blocks_banner_product_row\` (\`banner_product_id\`);`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_product_carousel\` ADD \`card_theme\` text DEFAULT 'light';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_banner_product_row\` ADD \`banner_product_id\` integer REFERENCES products(id);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_banner_banner_product_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`banner_product_id\`);`)
  await db.run(sql`ALTER TABLE \`categories_blocks_product_carousel\` ADD \`card_theme\` text DEFAULT 'light';`)
  await db.run(sql`ALTER TABLE \`categories_blocks_banner_product_row\` ADD \`banner_product_id\` integer REFERENCES products(id);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_product_row_banner_banner_produ_idx\` ON \`categories_blocks_banner_product_row\` (\`banner_product_id\`);`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`trimmed_filename\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`trimmed_width\` numeric;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`trimmed_height\` numeric;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_banner_product_row\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
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
  await db.run(sql`INSERT INTO \`__new_pages_blocks_banner_product_row\`("_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "section_title", "show_banner", "banner_eyebrow", "banner_eyebrow_color", "banner_heading", "banner_subheading", "banner_price_note", "banner_image_id", "banner_video_id", "banner_cta_label", "banner_cta_url", "banner_cta_new_tab", "banner_cta_style", "banner_theme", "show_more_tile", "more_tile_label", "more_tile_url", "more_tile_image_id", "more_tile_description", "more_tile_secondary_label", "more_tile_secondary_url", "block_name") SELECT "_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "section_title", "show_banner", "banner_eyebrow", "banner_eyebrow_color", "banner_heading", "banner_subheading", "banner_price_note", "banner_image_id", "banner_video_id", "banner_cta_label", "banner_cta_url", "banner_cta_new_tab", "banner_cta_style", "banner_theme", "show_more_tile", "more_tile_label", "more_tile_url", "more_tile_image_id", "more_tile_description", "more_tile_secondary_label", "more_tile_secondary_url", "block_name" FROM \`pages_blocks_banner_product_row\`;`)
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
  	\`anchor_label\` text,
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
  await db.run(sql`INSERT INTO \`__new__pages_v_blocks_banner_product_row\`("_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "section_title", "show_banner", "banner_eyebrow", "banner_eyebrow_color", "banner_heading", "banner_subheading", "banner_price_note", "banner_image_id", "banner_video_id", "banner_cta_label", "banner_cta_url", "banner_cta_new_tab", "banner_cta_style", "banner_theme", "show_more_tile", "more_tile_label", "more_tile_url", "more_tile_image_id", "more_tile_description", "more_tile_secondary_label", "more_tile_secondary_url", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "section_title", "show_banner", "banner_eyebrow", "banner_eyebrow_color", "banner_heading", "banner_subheading", "banner_price_note", "banner_image_id", "banner_video_id", "banner_cta_label", "banner_cta_url", "banner_cta_new_tab", "banner_cta_style", "banner_theme", "show_more_tile", "more_tile_label", "more_tile_url", "more_tile_image_id", "more_tile_description", "more_tile_secondary_label", "more_tile_secondary_url", "_uuid", "block_name" FROM \`_pages_v_blocks_banner_product_row\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_banner_product_row\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_blocks_banner_product_row\` RENAME TO \`_pages_v_blocks_banner_product_row\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_order_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_parent_id_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_path_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_banner_banner_image_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`banner_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_banner_banner_video_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`banner_video_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_banner_product_row_more_tile_more_tile_i_idx\` ON \`_pages_v_blocks_banner_product_row\` (\`more_tile_image_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_categories_blocks_banner_product_row\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`anchor_label\` text,
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
  await db.run(sql`INSERT INTO \`__new_categories_blocks_banner_product_row\`("_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "section_title", "show_banner", "banner_eyebrow", "banner_eyebrow_color", "banner_heading", "banner_subheading", "banner_price_note", "banner_image_id", "banner_video_id", "banner_cta_label", "banner_cta_url", "banner_cta_new_tab", "banner_cta_style", "banner_theme", "show_more_tile", "more_tile_label", "more_tile_url", "more_tile_image_id", "more_tile_description", "more_tile_secondary_label", "more_tile_secondary_url", "block_name") SELECT "_order", "_parent_id", "_path", "id", "hidden", "anchor_label", "section_title", "show_banner", "banner_eyebrow", "banner_eyebrow_color", "banner_heading", "banner_subheading", "banner_price_note", "banner_image_id", "banner_video_id", "banner_cta_label", "banner_cta_url", "banner_cta_new_tab", "banner_cta_style", "banner_theme", "show_more_tile", "more_tile_label", "more_tile_url", "more_tile_image_id", "more_tile_description", "more_tile_secondary_label", "more_tile_secondary_url", "block_name" FROM \`categories_blocks_banner_product_row\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_banner_product_row\`;`)
  await db.run(sql`ALTER TABLE \`__new_categories_blocks_banner_product_row\` RENAME TO \`categories_blocks_banner_product_row\`;`)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_product_row_order_idx\` ON \`categories_blocks_banner_product_row\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_product_row_parent_id_idx\` ON \`categories_blocks_banner_product_row\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_product_row_path_idx\` ON \`categories_blocks_banner_product_row\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_product_row_banner_banner_image_idx\` ON \`categories_blocks_banner_product_row\` (\`banner_image_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_product_row_banner_banner_video_idx\` ON \`categories_blocks_banner_product_row\` (\`banner_video_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_banner_product_row_more_tile_more_tile_idx\` ON \`categories_blocks_banner_product_row\` (\`more_tile_image_id\`);`)
  await db.run(sql`ALTER TABLE \`pages_blocks_product_carousel\` DROP COLUMN \`card_theme\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_product_carousel\` DROP COLUMN \`card_theme\`;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_product_carousel\` DROP COLUMN \`card_theme\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`trimmed_filename\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`trimmed_width\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`trimmed_height\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
