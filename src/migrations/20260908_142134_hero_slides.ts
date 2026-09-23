import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`pages_blocks_hero_banner_slides\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_hero_banner\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_slides_order_idx\` ON \`pages_blocks_hero_banner_slides\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_slides_parent_id_idx\` ON \`pages_blocks_hero_banner_slides\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_slides_badge_image_idx\` ON \`pages_blocks_hero_banner_slides\` (\`badge_image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_slides_image_idx\` ON \`pages_blocks_hero_banner_slides\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_slides_image_mobile_idx\` ON \`pages_blocks_hero_banner_slides\` (\`image_mobile_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero_banner_slides\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
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
  	\`_uuid\` text,
  	FOREIGN KEY (\`badge_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`image_mobile_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_hero_banner\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_slides_order_idx\` ON \`_pages_v_blocks_hero_banner_slides\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_slides_parent_id_idx\` ON \`_pages_v_blocks_hero_banner_slides\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_slides_badge_image_idx\` ON \`_pages_v_blocks_hero_banner_slides\` (\`badge_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_slides_image_idx\` ON \`_pages_v_blocks_hero_banner_slides\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_slides_image_mobile_idx\` ON \`_pages_v_blocks_hero_banner_slides\` (\`image_mobile_id\`);`)

  /*
    ПРЕНАСЯНЕ НА СЪЩЕСТВУВАЩИЯ БАНЕР В ПЪРВИЯ СЛАЙД.

    Мястото е избрано нарочно: таблиците за слайдове вече съществуват, а
    старите колони още не са махнати. Няколко реда по-долу
    `pages_blocks_hero_banner` се пресъздава без тях и съдържанието им
    изчезва безвъзвратно.

    Без този пренос собственикът щеше да отвори админа и да завари празен
    банер, който трябва да въведе наново — заедно със снимката.

    `id` на ред в масив е 24 шестнайсетични знака, като тези, които Payload
    генерира сам. `_order` на масив започва от 1.
  */
  await db.run(
    sql`INSERT INTO \`pages_blocks_hero_banner_slides\` (\`_order\`, \`_parent_id\`, \`id\`, \`eyebrow\`, \`heading\`, \`subheading\`, \`note\`, \`image_id\`, \`image_mobile_id\`, \`cta_label\`, \`cta_url\`, \`cta_new_tab\`, \`cta_style\`, \`align\`, \`theme\`, \`overlay\`) SELECT 1, \`id\`, lower(hex(randomblob(12))), \`eyebrow\`, \`heading\`, \`subheading\`, \`note\`, \`image_id\`, \`image_mobile_id\`, \`cta_label\`, \`cta_url\`, \`cta_new_tab\`, \`cta_style\`, \`align\`, \`theme\`, \`overlay\` FROM \`pages_blocks_hero_banner\`;`,
  )

  /* Същото за версиите — иначе черновите остават без банер. */
  await db.run(
    sql`INSERT INTO \`_pages_v_blocks_hero_banner_slides\` (\`_order\`, \`_parent_id\`, \`eyebrow\`, \`heading\`, \`subheading\`, \`note\`, \`image_id\`, \`image_mobile_id\`, \`cta_label\`, \`cta_url\`, \`cta_new_tab\`, \`cta_style\`, \`align\`, \`theme\`, \`overlay\`, \`_uuid\`) SELECT 1, \`id\`, \`eyebrow\`, \`heading\`, \`subheading\`, \`note\`, \`image_id\`, \`image_mobile_id\`, \`cta_label\`, \`cta_url\`, \`cta_new_tab\`, \`cta_style\`, \`align\`, \`theme\`, \`overlay\`, lower(hex(randomblob(12))) FROM \`_pages_v_blocks_hero_banner\`;`,
  )

  await db.run(sql`CREATE TABLE \`__new_pages_blocks_hero_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`autoplay_seconds\` numeric DEFAULT 6,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_pages_blocks_hero_banner\`("_order", "_parent_id", "_path", "id", "hidden", "autoplay_seconds", "block_name") SELECT "_order", "_parent_id", "_path", "id", "hidden", "autoplay_seconds", "block_name" FROM \`pages_blocks_hero_banner\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_hero_banner\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_hero_banner\` RENAME TO \`pages_blocks_hero_banner\`;`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_order_idx\` ON \`pages_blocks_hero_banner\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_parent_id_idx\` ON \`pages_blocks_hero_banner\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_path_idx\` ON \`pages_blocks_hero_banner\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_hero_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`autoplay_seconds\` numeric DEFAULT 6,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__pages_v_blocks_hero_banner\`("_order", "_parent_id", "_path", "id", "hidden", "autoplay_seconds", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "hidden", "autoplay_seconds", "_uuid", "block_name" FROM \`_pages_v_blocks_hero_banner\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero_banner\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_blocks_hero_banner\` RENAME TO \`_pages_v_blocks_hero_banner\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_order_idx\` ON \`_pages_v_blocks_hero_banner\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_parent_id_idx\` ON \`_pages_v_blocks_hero_banner\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_path_idx\` ON \`_pages_v_blocks_hero_banner\` (\`_path\`);`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`DROP TABLE \`pages_blocks_hero_banner_slides\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero_banner_slides\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` ADD \`eyebrow\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` ADD \`heading\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` ADD \`subheading\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` ADD \`note\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` ADD \`image_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` ADD \`image_mobile_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` ADD \`cta_label\` text DEFAULT 'Разгледай';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` ADD \`cta_url\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` ADD \`cta_new_tab\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` ADD \`cta_style\` text DEFAULT 'light';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` ADD \`align\` text DEFAULT 'left';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` ADD \`theme\` text DEFAULT 'dark';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_banner\` ADD \`overlay\` text DEFAULT 'medium';`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_image_idx\` ON \`pages_blocks_hero_banner\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_banner_image_mobile_idx\` ON \`pages_blocks_hero_banner\` (\`image_mobile_id\`);`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` ADD \`eyebrow\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` ADD \`heading\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` ADD \`subheading\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` ADD \`note\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` ADD \`image_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` ADD \`image_mobile_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` ADD \`cta_label\` text DEFAULT 'Разгледай';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` ADD \`cta_url\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` ADD \`cta_new_tab\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` ADD \`cta_style\` text DEFAULT 'light';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` ADD \`align\` text DEFAULT 'left';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` ADD \`theme\` text DEFAULT 'dark';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_banner\` ADD \`overlay\` text DEFAULT 'medium';`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_image_idx\` ON \`_pages_v_blocks_hero_banner\` (\`image_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_banner_image_mobile_idx\` ON \`_pages_v_blocks_hero_banner\` (\`image_mobile_id\`);`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
