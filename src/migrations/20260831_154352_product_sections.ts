import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`products_spec_groups_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_spec_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_spec_groups_rows_order_idx\` ON \`products_spec_groups_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_spec_groups_rows_parent_id_idx\` ON \`products_spec_groups_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_spec_groups\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`group_label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_spec_groups_order_idx\` ON \`products_spec_groups\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_spec_groups_parent_id_idx\` ON \`products_spec_groups\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_key_spec_strip_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	\`label\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_key_spec_strip\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_key_spec_strip_items_order_idx\` ON \`products_blocks_key_spec_strip_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_key_spec_strip_items_parent_id_idx\` ON \`products_blocks_key_spec_strip_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_key_spec_strip\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_key_spec_strip_order_idx\` ON \`products_blocks_key_spec_strip\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_key_spec_strip_parent_id_idx\` ON \`products_blocks_key_spec_strip\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_key_spec_strip_path_idx\` ON \`products_blocks_key_spec_strip\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_feature_section_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	\`label\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_feature_section\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_feature_section_stats_order_idx\` ON \`products_blocks_feature_section_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_feature_section_stats_parent_id_idx\` ON \`products_blocks_feature_section_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_feature_section\` (
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
  await db.run(sql`CREATE INDEX \`products_blocks_feature_section_order_idx\` ON \`products_blocks_feature_section\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_feature_section_parent_id_idx\` ON \`products_blocks_feature_section\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_feature_section_path_idx\` ON \`products_blocks_feature_section\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_feature_section_image_idx\` ON \`products_blocks_feature_section\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_tabbed_showcase_tabs_rows\` (
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
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_tabs_rows_order_idx\` ON \`products_blocks_tabbed_showcase_tabs_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_tabs_rows_parent_id_idx\` ON \`products_blocks_tabbed_showcase_tabs_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_tabs_rows_icon_idx\` ON \`products_blocks_tabbed_showcase_tabs_rows\` (\`icon_id\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_tabbed_showcase_tabs\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`image_id\` integer NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_tabbed_showcase\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_tabs_order_idx\` ON \`products_blocks_tabbed_showcase_tabs\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_tabs_parent_id_idx\` ON \`products_blocks_tabbed_showcase_tabs\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_tabs_image_idx\` ON \`products_blocks_tabbed_showcase_tabs\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_tabbed_showcase\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_order_idx\` ON \`products_blocks_tabbed_showcase\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_parent_id_idx\` ON \`products_blocks_tabbed_showcase\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_tabbed_showcase_path_idx\` ON \`products_blocks_tabbed_showcase\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_bundle_options_options\` (
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
  await db.run(sql`CREATE INDEX \`products_blocks_bundle_options_options_order_idx\` ON \`products_blocks_bundle_options_options\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_bundle_options_options_parent_id_idx\` ON \`products_blocks_bundle_options_options\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_bundle_options_options_product_idx\` ON \`products_blocks_bundle_options_options\` (\`product_id\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_bundle_options\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text DEFAULT 'Варианти',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_bundle_options_order_idx\` ON \`products_blocks_bundle_options\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_bundle_options_parent_id_idx\` ON \`products_blocks_bundle_options\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_bundle_options_path_idx\` ON \`products_blocks_bundle_options\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_comparison_table_columns\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`product_id\` integer,
  	\`label\` text,
  	\`image_id\` integer,
  	\`tagline\` text,
  	\`price\` numeric,
  	\`compare_price\` numeric,
  	\`cta_label\` text DEFAULT 'Купи сега',
  	\`cta_url\` text,
  	\`highlight\` integer DEFAULT false,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_comparison_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_comparison_table_columns_order_idx\` ON \`products_blocks_comparison_table_columns\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_comparison_table_columns_parent_id_idx\` ON \`products_blocks_comparison_table_columns\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_comparison_table_columns_product_idx\` ON \`products_blocks_comparison_table_columns\` (\`product_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_comparison_table_columns_image_idx\` ON \`products_blocks_comparison_table_columns\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_comparison_table_rows_values\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_comparison_table_rows\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_comparison_table_rows_values_order_idx\` ON \`products_blocks_comparison_table_rows_values\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_comparison_table_rows_values_parent_id_idx\` ON \`products_blocks_comparison_table_rows_values\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_comparison_table_rows\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_comparison_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_comparison_table_rows_order_idx\` ON \`products_blocks_comparison_table_rows\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_comparison_table_rows_parent_id_idx\` ON \`products_blocks_comparison_table_rows\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_comparison_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_comparison_table_order_idx\` ON \`products_blocks_comparison_table\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_comparison_table_parent_id_idx\` ON \`products_blocks_comparison_table\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_comparison_table_path_idx\` ON \`products_blocks_comparison_table\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_in_the_box_items\` (
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
  await db.run(sql`CREATE INDEX \`products_blocks_in_the_box_items_order_idx\` ON \`products_blocks_in_the_box_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_in_the_box_items_parent_id_idx\` ON \`products_blocks_in_the_box_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_in_the_box_items_image_idx\` ON \`products_blocks_in_the_box_items\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_in_the_box\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text DEFAULT 'Какво има в кутията',
  	\`caption\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_in_the_box_order_idx\` ON \`products_blocks_in_the_box\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_in_the_box_parent_id_idx\` ON \`products_blocks_in_the_box\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_in_the_box_path_idx\` ON \`products_blocks_in_the_box\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_spec_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text DEFAULT 'Спецификации',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_spec_table_order_idx\` ON \`products_blocks_spec_table\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_spec_table_parent_id_idx\` ON \`products_blocks_spec_table\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_spec_table_path_idx\` ON \`products_blocks_spec_table\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_faq_block_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`question\` text NOT NULL,
  	\`answer\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_faq_block\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_faq_block_items_order_idx\` ON \`products_blocks_faq_block_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_faq_block_items_parent_id_idx\` ON \`products_blocks_faq_block_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_faq_block\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text DEFAULT 'Често задавани въпроси',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_faq_block_order_idx\` ON \`products_blocks_faq_block\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_faq_block_parent_id_idx\` ON \`products_blocks_faq_block\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_faq_block_path_idx\` ON \`products_blocks_faq_block\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_related_products\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text DEFAULT 'Може да ви заинтересува',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_related_products_order_idx\` ON \`products_blocks_related_products\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_related_products_parent_id_idx\` ON \`products_blocks_related_products\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_related_products_path_idx\` ON \`products_blocks_related_products\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_footnotes_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products_blocks_footnotes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_footnotes_items_order_idx\` ON \`products_blocks_footnotes_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_footnotes_items_parent_id_idx\` ON \`products_blocks_footnotes_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_footnotes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_footnotes_order_idx\` ON \`products_blocks_footnotes\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_footnotes_parent_id_idx\` ON \`products_blocks_footnotes\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_footnotes_path_idx\` ON \`products_blocks_footnotes\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`products_blocks_legal_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`anchor_label\` text,
  	\`heading\` text,
  	\`body\` text,
  	\`collapsed\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_blocks_legal_text_order_idx\` ON \`products_blocks_legal_text\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_legal_text_parent_id_idx\` ON \`products_blocks_legal_text\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_blocks_legal_text_path_idx\` ON \`products_blocks_legal_text\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`products_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`products_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`products_rels_order_idx\` ON \`products_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`products_rels_parent_idx\` ON \`products_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`products_rels_path_idx\` ON \`products_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`products_rels_products_id_idx\` ON \`products_rels\` (\`products_id\`);`)
  await db.run(sql`ALTER TABLE \`products\` ADD \`product_type\` text DEFAULT 'accessory';`)

  /*
    Пренасяне на старото плоско поле „Технически данни" в новото
    „Спецификации по групи". Всички съществуващи редове отиват в една група
    на име „Общи", със запазен ред.

    Старата таблица НЕ се пипа — пада с отделна миграция, след като
    пренасянето бъде проверено.
  */
  await db.run(sql`
    INSERT INTO products_spec_groups (_order, _parent_id, id, group_label)
    SELECT 1, _parent_id, 'migrated-group-' || _parent_id, 'Общи'
    FROM (SELECT DISTINCT _parent_id FROM products_specs)
  `)
  await db.run(sql`
    INSERT INTO products_spec_groups_rows (_order, _parent_id, id, label, value)
    SELECT _order, 'migrated-group-' || _parent_id, 'migrated-row-' || id, label, value
    FROM products_specs
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`products_spec_groups_rows\`;`)
  await db.run(sql`DROP TABLE \`products_spec_groups\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_key_spec_strip_items\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_key_spec_strip\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_feature_section_stats\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_feature_section\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_tabbed_showcase_tabs_rows\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_tabbed_showcase_tabs\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_tabbed_showcase\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_bundle_options_options\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_bundle_options\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_comparison_table_columns\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_comparison_table_rows_values\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_comparison_table_rows\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_comparison_table\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_in_the_box_items\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_in_the_box\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_spec_table\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_faq_block_items\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_faq_block\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_related_products\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_footnotes_items\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_footnotes\`;`)
  await db.run(sql`DROP TABLE \`products_blocks_legal_text\`;`)
  await db.run(sql`DROP TABLE \`products_rels\`;`)
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`product_type\`;`)
}
