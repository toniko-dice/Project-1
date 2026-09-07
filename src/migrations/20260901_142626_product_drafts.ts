import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  /*
    Външните ключове се изключват за ЦЯЛАТА функция.

    SQLite не може да променя колони — Payload прави нова таблица, копира
    редовете и трие старата. Ако при DROP TABLE ключовете са включени,
    всеки ред от другите таблици, който сочи натам, се изтрива по
    ON DELETE CASCADE.

    Точно това се случи тук: изтри 18 реда в pages_rels, 54 в
    _pages_v_rels и остави началната страница без продукти. OFF беше
    върнато на ON преди 14 от 15-те DROP-а.

    OFF е ПЪРВИЯТ ред, ON е ПОСЛЕДНИЯТ. Нищо между тях не пипа ключовете.
  */
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  /*
    РЪЧНА ПОПРАВКА в генерираната заявка за products.

    Генераторът написа SELECT "_status" FROM products, но колоната се
    създава едва с това преустройство — в старата таблица я няма и
    заявката се проваля.

    Вместо това съществуващите 16 продукта получават 'published', за да
    не изчезнат от сайта. Новите, внесени със скрипта, идват като чернови.
  */
  await db.run(sql`CREATE TABLE \`_products_v_version_highlights\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_version_highlights_order_idx\` ON \`_products_v_version_highlights\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_highlights_parent_id_idx\` ON \`_products_v_version_highlights\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_version_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_version_gallery_order_idx\` ON \`_products_v_version_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_gallery_parent_id_idx\` ON \`_products_v_version_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_gallery_image_idx\` ON \`_products_v_version_gallery\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_version_spec_groups_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v_version_spec_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_version_spec_groups_rows_order_idx\` ON \`_products_v_version_spec_groups_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_spec_groups_rows_parent_id_idx\` ON \`_products_v_version_spec_groups_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_version_spec_groups\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`group_label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_version_spec_groups_order_idx\` ON \`_products_v_version_spec_groups\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_spec_groups_parent_id_idx\` ON \`_products_v_version_spec_groups\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_version_specs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_version_specs_order_idx\` ON \`_products_v_version_specs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_specs_parent_id_idx\` ON \`_products_v_version_specs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_key_spec_strip_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v_blocks_key_spec_strip\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_key_spec_strip_items_order_idx\` ON \`_products_v_blocks_key_spec_strip_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_key_spec_strip_items_parent_id_idx\` ON \`_products_v_blocks_key_spec_strip_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_key_spec_strip\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_key_spec_strip_order_idx\` ON \`_products_v_blocks_key_spec_strip\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_key_spec_strip_parent_id_idx\` ON \`_products_v_blocks_key_spec_strip\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_key_spec_strip_path_idx\` ON \`_products_v_blocks_key_spec_strip\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_feature_section_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v_blocks_feature_section\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_feature_section_stats_order_idx\` ON \`_products_v_blocks_feature_section_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_feature_section_stats_parent_id_idx\` ON \`_products_v_blocks_feature_section_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_feature_section\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`subheading\` text,
  	\`body\` text,
  	\`image_id\` integer,
  	\`layout\` text DEFAULT 'image-right',
  	\`theme\` text DEFAULT 'light',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_feature_section_order_idx\` ON \`_products_v_blocks_feature_section\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_feature_section_parent_id_idx\` ON \`_products_v_blocks_feature_section\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_feature_section_path_idx\` ON \`_products_v_blocks_feature_section\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_feature_section_image_idx\` ON \`_products_v_blocks_feature_section\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_tabbed_showcase_tabs_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`icon_id\` integer,
  	\`label\` text,
  	\`sublabel\` text,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`icon_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v_blocks_tabbed_showcase_tabs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_tabbed_showcase_tabs_rows_order_idx\` ON \`_products_v_blocks_tabbed_showcase_tabs_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_tabbed_showcase_tabs_rows_parent_id_idx\` ON \`_products_v_blocks_tabbed_showcase_tabs_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_tabbed_showcase_tabs_rows_icon_idx\` ON \`_products_v_blocks_tabbed_showcase_tabs_rows\` (\`icon_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_tabbed_showcase_tabs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`image_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v_blocks_tabbed_showcase\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_tabbed_showcase_tabs_order_idx\` ON \`_products_v_blocks_tabbed_showcase_tabs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_tabbed_showcase_tabs_parent_id_idx\` ON \`_products_v_blocks_tabbed_showcase_tabs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_tabbed_showcase_tabs_image_idx\` ON \`_products_v_blocks_tabbed_showcase_tabs\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_tabbed_showcase\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_tabbed_showcase_order_idx\` ON \`_products_v_blocks_tabbed_showcase\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_tabbed_showcase_parent_id_idx\` ON \`_products_v_blocks_tabbed_showcase\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_tabbed_showcase_path_idx\` ON \`_products_v_blocks_tabbed_showcase\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_bundle_options_options\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`price\` numeric,
  	\`compare_price\` numeric,
  	\`external_url\` text,
  	\`product_id\` integer,
  	\`is_current\` integer DEFAULT false,
  	\`sold_out\` integer DEFAULT false,
  	\`_uuid\` text,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v_blocks_bundle_options\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_bundle_options_options_order_idx\` ON \`_products_v_blocks_bundle_options_options\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_bundle_options_options_parent_id_idx\` ON \`_products_v_blocks_bundle_options_options\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_bundle_options_options_product_idx\` ON \`_products_v_blocks_bundle_options_options\` (\`product_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_bundle_options\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text DEFAULT 'Варианти',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_bundle_options_order_idx\` ON \`_products_v_blocks_bundle_options\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_bundle_options_parent_id_idx\` ON \`_products_v_blocks_bundle_options\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_bundle_options_path_idx\` ON \`_products_v_blocks_bundle_options\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_comparison_table_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`product_id\` integer,
  	\`label\` text,
  	\`image_id\` integer,
  	\`tagline\` text,
  	\`price\` numeric,
  	\`compare_price\` numeric,
  	\`cta_label\` text DEFAULT 'Купи сега',
  	\`cta_url\` text,
  	\`highlight\` integer DEFAULT false,
  	\`_uuid\` text,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v_blocks_comparison_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_comparison_table_columns_order_idx\` ON \`_products_v_blocks_comparison_table_columns\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_comparison_table_columns_parent_id_idx\` ON \`_products_v_blocks_comparison_table_columns\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_comparison_table_columns_product_idx\` ON \`_products_v_blocks_comparison_table_columns\` (\`product_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_comparison_table_columns_image_idx\` ON \`_products_v_blocks_comparison_table_columns\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_comparison_table_rows_values\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v_blocks_comparison_table_rows\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_comparison_table_rows_values_order_idx\` ON \`_products_v_blocks_comparison_table_rows_values\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_comparison_table_rows_values_parent_id_idx\` ON \`_products_v_blocks_comparison_table_rows_values\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_comparison_table_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v_blocks_comparison_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_comparison_table_rows_order_idx\` ON \`_products_v_blocks_comparison_table_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_comparison_table_rows_parent_id_idx\` ON \`_products_v_blocks_comparison_table_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_comparison_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_comparison_table_order_idx\` ON \`_products_v_blocks_comparison_table\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_comparison_table_parent_id_idx\` ON \`_products_v_blocks_comparison_table\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_comparison_table_path_idx\` ON \`_products_v_blocks_comparison_table\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_in_the_box_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`name\` text,
  	\`qty\` numeric DEFAULT 1,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v_blocks_in_the_box\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_in_the_box_items_order_idx\` ON \`_products_v_blocks_in_the_box_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_in_the_box_items_parent_id_idx\` ON \`_products_v_blocks_in_the_box_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_in_the_box_items_image_idx\` ON \`_products_v_blocks_in_the_box_items\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_in_the_box\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text DEFAULT 'Какво има в кутията',
  	\`caption\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_in_the_box_order_idx\` ON \`_products_v_blocks_in_the_box\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_in_the_box_parent_id_idx\` ON \`_products_v_blocks_in_the_box\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_in_the_box_path_idx\` ON \`_products_v_blocks_in_the_box\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_spec_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text DEFAULT 'Спецификации',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_spec_table_order_idx\` ON \`_products_v_blocks_spec_table\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_spec_table_parent_id_idx\` ON \`_products_v_blocks_spec_table\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_spec_table_path_idx\` ON \`_products_v_blocks_spec_table\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_faq_block_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`answer\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v_blocks_faq_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_faq_block_items_order_idx\` ON \`_products_v_blocks_faq_block_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_faq_block_items_parent_id_idx\` ON \`_products_v_blocks_faq_block_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_faq_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text DEFAULT 'Често задавани въпроси',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_faq_block_order_idx\` ON \`_products_v_blocks_faq_block\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_faq_block_parent_id_idx\` ON \`_products_v_blocks_faq_block\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_faq_block_path_idx\` ON \`_products_v_blocks_faq_block\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_related_products\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text DEFAULT 'Може да ви заинтересува',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_related_products_order_idx\` ON \`_products_v_blocks_related_products\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_related_products_parent_id_idx\` ON \`_products_v_blocks_related_products\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_related_products_path_idx\` ON \`_products_v_blocks_related_products\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_footnotes_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v_blocks_footnotes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_footnotes_items_order_idx\` ON \`_products_v_blocks_footnotes_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_footnotes_items_parent_id_idx\` ON \`_products_v_blocks_footnotes_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_footnotes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_footnotes_order_idx\` ON \`_products_v_blocks_footnotes\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_footnotes_parent_id_idx\` ON \`_products_v_blocks_footnotes\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_footnotes_path_idx\` ON \`_products_v_blocks_footnotes\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_blocks_legal_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`body\` text,
  	\`collapsed\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_legal_text_order_idx\` ON \`_products_v_blocks_legal_text\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_legal_text_parent_id_idx\` ON \`_products_v_blocks_legal_text\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_blocks_legal_text_path_idx\` ON \`_products_v_blocks_legal_text\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`_products_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version__order\` text,
  	\`version_title\` text,
  	\`version_slug\` text,
  	\`version_sku\` text,
  	\`version_brand\` text DEFAULT 'EcoFlow',
  	\`version_ean\` text,
  	\`version_barcode_internal\` text,
  	\`version_category_id\` integer,
  	\`version_tagline\` text,
  	\`version_badge\` text DEFAULT 'none',
  	\`version_product_type\` text DEFAULT 'accessory',
  	\`version_price\` numeric,
  	\`version_compare_at_price\` numeric,
  	\`version_external_url\` text,
  	\`version_cta_label\` text DEFAULT 'Купи сега',
  	\`version_availability\` text DEFAULT 'in-stock',
  	\`version_image_id\` integer,
  	\`version_description\` text,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_parent_idx\` ON \`_products_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version__order_idx\` ON \`_products_v\` (\`version__order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_slug_idx\` ON \`_products_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_category_idx\` ON \`_products_v\` (\`version_category_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_image_idx\` ON \`_products_v\` (\`version_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_updated_at_idx\` ON \`_products_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version_created_at_idx\` ON \`_products_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_version_version__status_idx\` ON \`_products_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_created_at_idx\` ON \`_products_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_updated_at_idx\` ON \`_products_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_latest_idx\` ON \`_products_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`_products_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`products_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_products_v_rels_order_idx\` ON \`_products_v_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_rels_parent_idx\` ON \`_products_v_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_rels_path_idx\` ON \`_products_v_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`_products_v_rels_products_id_idx\` ON \`_products_v_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_highlights\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_highlights\`("_order", "_parent_id", "id", "title", "text") SELECT "_order", "_parent_id", "id", "title", "text" FROM \`products_highlights\`;`)
  await db.run(sql`DROP TABLE \`products_highlights\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_highlights\` RENAME TO \`products_highlights\`;`)
  await db.run(sql`CREATE INDEX \`products_highlights_order_idx\` ON \`products_highlights\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_highlights_parent_id_idx\` ON \`products_highlights\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_gallery\`("_order", "_parent_id", "id", "image_id") SELECT "_order", "_parent_id", "id", "image_id" FROM \`products_gallery\`;`)
  await db.run(sql`DROP TABLE \`products_gallery\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_gallery\` RENAME TO \`products_gallery\`;`)
  await db.run(sql`CREATE INDEX \`products_gallery_order_idx\` ON \`products_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_gallery_parent_id_idx\` ON \`products_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_gallery_image_idx\` ON \`products_gallery\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_spec_groups_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_spec_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_spec_groups_rows\`("_order", "_parent_id", "id", "label", "value") SELECT "_order", "_parent_id", "id", "label", "value" FROM \`products_spec_groups_rows\`;`)
  await db.run(sql`DROP TABLE \`products_spec_groups_rows\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_spec_groups_rows\` RENAME TO \`products_spec_groups_rows\`;`)
  await db.run(sql`CREATE INDEX \`products_spec_groups_rows_order_idx\` ON \`products_spec_groups_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_spec_groups_rows_parent_id_idx\` ON \`products_spec_groups_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_specs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_specs\`("_order", "_parent_id", "id", "label", "value") SELECT "_order", "_parent_id", "id", "label", "value" FROM \`products_specs\`;`)
  await db.run(sql`DROP TABLE \`products_specs\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_specs\` RENAME TO \`products_specs\`;`)
  await db.run(sql`CREATE INDEX \`products_specs_order_idx\` ON \`products_specs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_specs_parent_id_idx\` ON \`products_specs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_key_spec_strip_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_key_spec_strip\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_key_spec_strip_items\`("_order", "_parent_id", "id", "value", "label") SELECT "_order", "_parent_id", "id", "value", "label" FROM \`products_blocks_key_spec_strip_items\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_key_spec_strip_items\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_key_spec_strip_items\` RENAME TO \`products_blocks_key_spec_strip_items\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_key_spec_strip_items_order_idx\` ON \`products_blocks_key_spec_strip_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_key_spec_strip_items_parent_id_idx\` ON \`products_blocks_key_spec_strip_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_feature_section_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_feature_section\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_feature_section_stats\`("_order", "_parent_id", "id", "value", "label") SELECT "_order", "_parent_id", "id", "value", "label" FROM \`products_blocks_feature_section_stats\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_feature_section_stats\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_feature_section_stats\` RENAME TO \`products_blocks_feature_section_stats\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_feature_section_stats_order_idx\` ON \`products_blocks_feature_section_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_feature_section_stats_parent_id_idx\` ON \`products_blocks_feature_section_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_feature_section\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`subheading\` text,
  	\`body\` text,
  	\`image_id\` integer,
  	\`layout\` text DEFAULT 'image-right',
  	\`theme\` text DEFAULT 'light',
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_feature_section\`("_order", "_parent_id", "_path", "id", "anchor_label", "heading", "subheading", "body", "image_id", "layout", "theme", "block_name") SELECT "_order", "_parent_id", "_path", "id", "anchor_label", "heading", "subheading", "body", "image_id", "layout", "theme", "block_name" FROM \`products_blocks_feature_section\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_feature_section\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_feature_section\` RENAME TO \`products_blocks_feature_section\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_feature_section_order_idx\` ON \`products_blocks_feature_section\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_feature_section_parent_id_idx\` ON \`products_blocks_feature_section\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_feature_section_path_idx\` ON \`products_blocks_feature_section\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_feature_section_image_idx\` ON \`products_blocks_feature_section\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_tabbed_showcase_tabs_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon_id\` integer,
  	\`label\` text,
  	\`sublabel\` text,
  	\`value\` text,
  	FOREIGN KEY (\`icon_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_tabbed_showcase_tabs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_tabbed_showcase_tabs_rows\`("_order", "_parent_id", "id", "icon_id", "label", "sublabel", "value") SELECT "_order", "_parent_id", "id", "icon_id", "label", "sublabel", "value" FROM \`products_blocks_tabbed_showcase_tabs_rows\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_tabbed_showcase_tabs_rows\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_tabbed_showcase_tabs_rows\` RENAME TO \`products_blocks_tabbed_showcase_tabs_rows\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_tabs_rows_order_idx\` ON \`products_blocks_tabbed_showcase_tabs_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_tabs_rows_parent_id_idx\` ON \`products_blocks_tabbed_showcase_tabs_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_tabs_rows_icon_idx\` ON \`products_blocks_tabbed_showcase_tabs_rows\` (\`icon_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_tabbed_showcase_tabs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`image_id\` integer,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_tabbed_showcase\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_tabbed_showcase_tabs\`("_order", "_parent_id", "id", "label", "image_id") SELECT "_order", "_parent_id", "id", "label", "image_id" FROM \`products_blocks_tabbed_showcase_tabs\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_tabbed_showcase_tabs\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_tabbed_showcase_tabs\` RENAME TO \`products_blocks_tabbed_showcase_tabs\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_tabs_order_idx\` ON \`products_blocks_tabbed_showcase_tabs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_tabs_parent_id_idx\` ON \`products_blocks_tabbed_showcase_tabs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_tabs_image_idx\` ON \`products_blocks_tabbed_showcase_tabs\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_bundle_options_options\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`price\` numeric,
  	\`compare_price\` numeric,
  	\`external_url\` text,
  	\`product_id\` integer,
  	\`is_current\` integer DEFAULT false,
  	\`sold_out\` integer DEFAULT false,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_bundle_options\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_bundle_options_options\`("_order", "_parent_id", "id", "label", "price", "compare_price", "external_url", "product_id", "is_current", "sold_out") SELECT "_order", "_parent_id", "id", "label", "price", "compare_price", "external_url", "product_id", "is_current", "sold_out" FROM \`products_blocks_bundle_options_options\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_bundle_options_options\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_bundle_options_options\` RENAME TO \`products_blocks_bundle_options_options\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_bundle_options_options_order_idx\` ON \`products_blocks_bundle_options_options\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_bundle_options_options_parent_id_idx\` ON \`products_blocks_bundle_options_options\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_bundle_options_options_product_idx\` ON \`products_blocks_bundle_options_options\` (\`product_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_comparison_table_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_comparison_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_comparison_table_rows\`("_order", "_parent_id", "id", "label") SELECT "_order", "_parent_id", "id", "label" FROM \`products_blocks_comparison_table_rows\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_comparison_table_rows\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_comparison_table_rows\` RENAME TO \`products_blocks_comparison_table_rows\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_comparison_table_rows_order_idx\` ON \`products_blocks_comparison_table_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_comparison_table_rows_parent_id_idx\` ON \`products_blocks_comparison_table_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_in_the_box_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`name\` text,
  	\`qty\` numeric DEFAULT 1,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_in_the_box\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_in_the_box_items\`("_order", "_parent_id", "id", "image_id", "name", "qty") SELECT "_order", "_parent_id", "id", "image_id", "name", "qty" FROM \`products_blocks_in_the_box_items\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_in_the_box_items\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_in_the_box_items\` RENAME TO \`products_blocks_in_the_box_items\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_in_the_box_items_order_idx\` ON \`products_blocks_in_the_box_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_in_the_box_items_parent_id_idx\` ON \`products_blocks_in_the_box_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_in_the_box_items_image_idx\` ON \`products_blocks_in_the_box_items\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_faq_block_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`answer\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_faq_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_faq_block_items\`("_order", "_parent_id", "id", "question", "answer") SELECT "_order", "_parent_id", "id", "question", "answer" FROM \`products_blocks_faq_block_items\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_faq_block_items\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_faq_block_items\` RENAME TO \`products_blocks_faq_block_items\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_faq_block_items_order_idx\` ON \`products_blocks_faq_block_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_faq_block_items_parent_id_idx\` ON \`products_blocks_faq_block_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_footnotes_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_footnotes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_footnotes_items\`("_order", "_parent_id", "id", "text") SELECT "_order", "_parent_id", "id", "text" FROM \`products_blocks_footnotes_items\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_footnotes_items\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_footnotes_items\` RENAME TO \`products_blocks_footnotes_items\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_footnotes_items_order_idx\` ON \`products_blocks_footnotes_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_footnotes_items_parent_id_idx\` ON \`products_blocks_footnotes_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`title\` text,
  	\`slug\` text,
  	\`sku\` text,
  	\`brand\` text DEFAULT 'EcoFlow',
  	\`ean\` text,
  	\`barcode_internal\` text,
  	\`category_id\` integer,
  	\`tagline\` text,
  	\`badge\` text DEFAULT 'none',
  	\`product_type\` text DEFAULT 'accessory',
  	\`price\` numeric,
  	\`compare_at_price\` numeric,
  	\`external_url\` text,
  	\`cta_label\` text DEFAULT 'Купи сега',
  	\`availability\` text DEFAULT 'in-stock',
  	\`image_id\` integer,
  	\`description\` text,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products\`("id", "_order", "title", "slug", "sku", "brand", "ean", "barcode_internal", "category_id", "tagline", "badge", "product_type", "price", "compare_at_price", "external_url", "cta_label", "availability", "image_id", "description", "meta_title", "meta_description", "updated_at", "created_at", "_status") SELECT "id", "_order", "title", "slug", "sku", "brand", "ean", "barcode_internal", "category_id", "tagline", "badge", "product_type", "price", "compare_at_price", "external_url", "cta_label", "availability", "image_id", "description", "meta_title", "meta_description", "updated_at", "created_at", 'published' FROM \`products\`;`)
  await db.run(sql`DROP TABLE \`products\`;`)
  await db.run(sql`ALTER TABLE \`__new_products\` RENAME TO \`products\`;`)
  await db.run(sql`CREATE INDEX \`products__order_idx\` ON \`products\` (\`_order\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`products_slug_idx\` ON \`products\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`products_category_idx\` ON \`products\` (\`category_id\`);`)
  await db.run(sql`CREATE INDEX \`products_image_idx\` ON \`products\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`products_updated_at_idx\` ON \`products\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`products_created_at_idx\` ON \`products\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`products__status_idx\` ON \`products\` (\`_status\`);`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE \`_products_v_version_highlights\`;`)
  await db.run(sql`DROP TABLE \`_products_v_version_gallery\`;`)
  await db.run(sql`DROP TABLE \`_products_v_version_spec_groups_rows\`;`)
  await db.run(sql`DROP TABLE \`_products_v_version_spec_groups\`;`)
  await db.run(sql`DROP TABLE \`_products_v_version_specs\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_key_spec_strip_items\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_key_spec_strip\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_feature_section_stats\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_feature_section\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_tabbed_showcase_tabs_rows\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_tabbed_showcase_tabs\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_tabbed_showcase\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_bundle_options_options\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_bundle_options\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_comparison_table_columns\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_comparison_table_rows_values\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_comparison_table_rows\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_comparison_table\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_in_the_box_items\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_in_the_box\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_spec_table\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_faq_block_items\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_faq_block\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_related_products\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_footnotes_items\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_footnotes\`;`)
  await db.run(sql`DROP TABLE \`_products_v_blocks_legal_text\`;`)
  await db.run(sql`DROP TABLE \`_products_v\`;`)
  await db.run(sql`DROP TABLE \`_products_v_rels\`;`)
  await db.run(sql`CREATE TABLE \`__new_products\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_order\` text,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`sku\` text,
  	\`brand\` text DEFAULT 'EcoFlow',
  	\`ean\` text,
  	\`barcode_internal\` text,
  	\`category_id\` integer NOT NULL,
  	\`tagline\` text,
  	\`badge\` text DEFAULT 'none',
  	\`product_type\` text DEFAULT 'accessory',
  	\`price\` numeric NOT NULL,
  	\`compare_at_price\` numeric,
  	\`external_url\` text NOT NULL,
  	\`cta_label\` text DEFAULT 'Купи сега',
  	\`availability\` text DEFAULT 'in-stock',
  	\`image_id\` integer NOT NULL,
  	\`description\` text,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products\`("id", "_order", "title", "slug", "sku", "brand", "ean", "barcode_internal", "category_id", "tagline", "badge", "product_type", "price", "compare_at_price", "external_url", "cta_label", "availability", "image_id", "description", "meta_title", "meta_description", "updated_at", "created_at") SELECT "id", "_order", "title", "slug", "sku", "brand", "ean", "barcode_internal", "category_id", "tagline", "badge", "product_type", "price", "compare_at_price", "external_url", "cta_label", "availability", "image_id", "description", "meta_title", "meta_description", "updated_at", "created_at" FROM \`products\`;`)
  await db.run(sql`DROP TABLE \`products\`;`)
  await db.run(sql`ALTER TABLE \`__new_products\` RENAME TO \`products\`;`)
  await db.run(sql`CREATE INDEX \`products__order_idx\` ON \`products\` (\`_order\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`products_slug_idx\` ON \`products\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`products_category_idx\` ON \`products\` (\`category_id\`);`)
  await db.run(sql`CREATE INDEX \`products_image_idx\` ON \`products\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`products_updated_at_idx\` ON \`products\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`products_created_at_idx\` ON \`products\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_highlights\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`text\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_highlights\`("_order", "_parent_id", "id", "title", "text") SELECT "_order", "_parent_id", "id", "title", "text" FROM \`products_highlights\`;`)
  await db.run(sql`DROP TABLE \`products_highlights\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_highlights\` RENAME TO \`products_highlights\`;`)
  await db.run(sql`CREATE INDEX \`products_highlights_order_idx\` ON \`products_highlights\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_highlights_parent_id_idx\` ON \`products_highlights\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_gallery\`("_order", "_parent_id", "id", "image_id") SELECT "_order", "_parent_id", "id", "image_id" FROM \`products_gallery\`;`)
  await db.run(sql`DROP TABLE \`products_gallery\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_gallery\` RENAME TO \`products_gallery\`;`)
  await db.run(sql`CREATE INDEX \`products_gallery_order_idx\` ON \`products_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_gallery_parent_id_idx\` ON \`products_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_gallery_image_idx\` ON \`products_gallery\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_spec_groups_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_spec_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_spec_groups_rows\`("_order", "_parent_id", "id", "label", "value") SELECT "_order", "_parent_id", "id", "label", "value" FROM \`products_spec_groups_rows\`;`)
  await db.run(sql`DROP TABLE \`products_spec_groups_rows\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_spec_groups_rows\` RENAME TO \`products_spec_groups_rows\`;`)
  await db.run(sql`CREATE INDEX \`products_spec_groups_rows_order_idx\` ON \`products_spec_groups_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_spec_groups_rows_parent_id_idx\` ON \`products_spec_groups_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_specs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_specs\`("_order", "_parent_id", "id", "label", "value") SELECT "_order", "_parent_id", "id", "label", "value" FROM \`products_specs\`;`)
  await db.run(sql`DROP TABLE \`products_specs\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_specs\` RENAME TO \`products_specs\`;`)
  await db.run(sql`CREATE INDEX \`products_specs_order_idx\` ON \`products_specs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_specs_parent_id_idx\` ON \`products_specs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_key_spec_strip_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	\`label\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_key_spec_strip\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_key_spec_strip_items\`("_order", "_parent_id", "id", "value", "label") SELECT "_order", "_parent_id", "id", "value", "label" FROM \`products_blocks_key_spec_strip_items\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_key_spec_strip_items\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_key_spec_strip_items\` RENAME TO \`products_blocks_key_spec_strip_items\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_key_spec_strip_items_order_idx\` ON \`products_blocks_key_spec_strip_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_key_spec_strip_items_parent_id_idx\` ON \`products_blocks_key_spec_strip_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_feature_section_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	\`label\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_feature_section\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_feature_section_stats\`("_order", "_parent_id", "id", "value", "label") SELECT "_order", "_parent_id", "id", "value", "label" FROM \`products_blocks_feature_section_stats\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_feature_section_stats\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_feature_section_stats\` RENAME TO \`products_blocks_feature_section_stats\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_feature_section_stats_order_idx\` ON \`products_blocks_feature_section_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_feature_section_stats_parent_id_idx\` ON \`products_blocks_feature_section_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_feature_section\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text NOT NULL,
  	\`subheading\` text,
  	\`body\` text,
  	\`image_id\` integer NOT NULL,
  	\`layout\` text DEFAULT 'image-right',
  	\`theme\` text DEFAULT 'light',
  	\`block_name\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_feature_section\`("_order", "_parent_id", "_path", "id", "anchor_label", "heading", "subheading", "body", "image_id", "layout", "theme", "block_name") SELECT "_order", "_parent_id", "_path", "id", "anchor_label", "heading", "subheading", "body", "image_id", "layout", "theme", "block_name" FROM \`products_blocks_feature_section\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_feature_section\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_feature_section\` RENAME TO \`products_blocks_feature_section\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_feature_section_order_idx\` ON \`products_blocks_feature_section\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_feature_section_parent_id_idx\` ON \`products_blocks_feature_section\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_feature_section_path_idx\` ON \`products_blocks_feature_section\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_feature_section_image_idx\` ON \`products_blocks_feature_section\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_tabbed_showcase_tabs_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon_id\` integer,
  	\`label\` text NOT NULL,
  	\`sublabel\` text,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`icon_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_tabbed_showcase_tabs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_tabbed_showcase_tabs_rows\`("_order", "_parent_id", "id", "icon_id", "label", "sublabel", "value") SELECT "_order", "_parent_id", "id", "icon_id", "label", "sublabel", "value" FROM \`products_blocks_tabbed_showcase_tabs_rows\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_tabbed_showcase_tabs_rows\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_tabbed_showcase_tabs_rows\` RENAME TO \`products_blocks_tabbed_showcase_tabs_rows\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_tabs_rows_order_idx\` ON \`products_blocks_tabbed_showcase_tabs_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_tabs_rows_parent_id_idx\` ON \`products_blocks_tabbed_showcase_tabs_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_tabs_rows_icon_idx\` ON \`products_blocks_tabbed_showcase_tabs_rows\` (\`icon_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_tabbed_showcase_tabs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`image_id\` integer NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_tabbed_showcase\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_tabbed_showcase_tabs\`("_order", "_parent_id", "id", "label", "image_id") SELECT "_order", "_parent_id", "id", "label", "image_id" FROM \`products_blocks_tabbed_showcase_tabs\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_tabbed_showcase_tabs\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_tabbed_showcase_tabs\` RENAME TO \`products_blocks_tabbed_showcase_tabs\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_tabs_order_idx\` ON \`products_blocks_tabbed_showcase_tabs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_tabs_parent_id_idx\` ON \`products_blocks_tabbed_showcase_tabs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_tabs_image_idx\` ON \`products_blocks_tabbed_showcase_tabs\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_bundle_options_options\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`price\` numeric NOT NULL,
  	\`compare_price\` numeric,
  	\`external_url\` text,
  	\`product_id\` integer,
  	\`is_current\` integer DEFAULT false,
  	\`sold_out\` integer DEFAULT false,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_bundle_options\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_bundle_options_options\`("_order", "_parent_id", "id", "label", "price", "compare_price", "external_url", "product_id", "is_current", "sold_out") SELECT "_order", "_parent_id", "id", "label", "price", "compare_price", "external_url", "product_id", "is_current", "sold_out" FROM \`products_blocks_bundle_options_options\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_bundle_options_options\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_bundle_options_options\` RENAME TO \`products_blocks_bundle_options_options\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_bundle_options_options_order_idx\` ON \`products_blocks_bundle_options_options\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_bundle_options_options_parent_id_idx\` ON \`products_blocks_bundle_options_options\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_bundle_options_options_product_idx\` ON \`products_blocks_bundle_options_options\` (\`product_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_comparison_table_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_comparison_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_comparison_table_rows\`("_order", "_parent_id", "id", "label") SELECT "_order", "_parent_id", "id", "label" FROM \`products_blocks_comparison_table_rows\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_comparison_table_rows\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_comparison_table_rows\` RENAME TO \`products_blocks_comparison_table_rows\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_comparison_table_rows_order_idx\` ON \`products_blocks_comparison_table_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_comparison_table_rows_parent_id_idx\` ON \`products_blocks_comparison_table_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_in_the_box_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`name\` text NOT NULL,
  	\`qty\` numeric DEFAULT 1,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_in_the_box\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_in_the_box_items\`("_order", "_parent_id", "id", "image_id", "name", "qty") SELECT "_order", "_parent_id", "id", "image_id", "name", "qty" FROM \`products_blocks_in_the_box_items\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_in_the_box_items\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_in_the_box_items\` RENAME TO \`products_blocks_in_the_box_items\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_in_the_box_items_order_idx\` ON \`products_blocks_in_the_box_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_in_the_box_items_parent_id_idx\` ON \`products_blocks_in_the_box_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_in_the_box_items_image_idx\` ON \`products_blocks_in_the_box_items\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_faq_block_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`question\` text NOT NULL,
  	\`answer\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_faq_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_faq_block_items\`("_order", "_parent_id", "id", "question", "answer") SELECT "_order", "_parent_id", "id", "question", "answer" FROM \`products_blocks_faq_block_items\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_faq_block_items\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_faq_block_items\` RENAME TO \`products_blocks_faq_block_items\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_faq_block_items_order_idx\` ON \`products_blocks_faq_block_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_faq_block_items_parent_id_idx\` ON \`products_blocks_faq_block_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_products_blocks_footnotes_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_footnotes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_products_blocks_footnotes_items\`("_order", "_parent_id", "id", "text") SELECT "_order", "_parent_id", "id", "text" FROM \`products_blocks_footnotes_items\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_footnotes_items\`;`)
  await db.run(sql`ALTER TABLE \`__new_products_blocks_footnotes_items\` RENAME TO \`products_blocks_footnotes_items\`;`)
  await db.run(sql`CREATE INDEX \`products_blocks_footnotes_items_order_idx\` ON \`products_blocks_footnotes_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_footnotes_items_parent_id_idx\` ON \`products_blocks_footnotes_items\` (\`_parent_id\`);`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
