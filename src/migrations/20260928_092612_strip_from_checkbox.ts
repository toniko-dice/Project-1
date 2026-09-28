import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  /*
    Махане на връзката „Категории" от блока „Лента с категории".

    Лентата вече чете отметката „Показване в лентата с икони" на самата
    категория, а не собствен списък в блока (виж CLAUDE.md, т. 23). С
    полето отпада и последната връзка към категории в трите таблици с
    връзки, затова SQLite ги пресъздава.

    `PRAGMA foreign_keys=OFF` е ПЪРВИЯТ ред и `=ON` — ПОСЛЕДНИЯТ. Както е
    генерирана, миграцията връщаше ключовете още след първата таблица и
    следващите два `DROP TABLE` минаваха с включени ключове. Точно това
    изпразни `pages_rels` на 1 септември (CLAUDE.md, т. 7).
  */
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_pages_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`products_id\` integer,
  	\`testimonials_id\` integer,
  	\`awards_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`testimonials_id\`) REFERENCES \`testimonials\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`awards_id\`) REFERENCES \`awards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_pages_rels\`("id", "order", "parent_id", "path", "products_id", "testimonials_id", "awards_id") SELECT "id", "order", "parent_id", "path", "products_id", "testimonials_id", "awards_id" FROM \`pages_rels\`;`)
  await db.run(sql`DROP TABLE \`pages_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_rels\` RENAME TO \`pages_rels\`;`)
  await db.run(sql`CREATE INDEX \`pages_rels_order_idx\` ON \`pages_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_parent_idx\` ON \`pages_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_path_idx\` ON \`pages_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_products_id_idx\` ON \`pages_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_testimonials_id_idx\` ON \`pages_rels\` (\`testimonials_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_rels_awards_id_idx\` ON \`pages_rels\` (\`awards_id\`);`)
  await db.run(sql`CREATE TABLE \`__new__pages_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`products_id\` integer,
  	\`testimonials_id\` integer,
  	\`awards_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`testimonials_id\`) REFERENCES \`testimonials\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`awards_id\`) REFERENCES \`awards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__pages_v_rels\`("id", "order", "parent_id", "path", "products_id", "testimonials_id", "awards_id") SELECT "id", "order", "parent_id", "path", "products_id", "testimonials_id", "awards_id" FROM \`_pages_v_rels\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_rels\` RENAME TO \`_pages_v_rels\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_order_idx\` ON \`_pages_v_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_parent_idx\` ON \`_pages_v_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_path_idx\` ON \`_pages_v_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_products_id_idx\` ON \`_pages_v_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_testimonials_id_idx\` ON \`_pages_v_rels\` (\`testimonials_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_awards_id_idx\` ON \`_pages_v_rels\` (\`awards_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_categories_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`products_id\` integer,
  	\`testimonials_id\` integer,
  	\`awards_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`testimonials_id\`) REFERENCES \`testimonials\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`awards_id\`) REFERENCES \`awards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_categories_rels\`("id", "order", "parent_id", "path", "products_id", "testimonials_id", "awards_id") SELECT "id", "order", "parent_id", "path", "products_id", "testimonials_id", "awards_id" FROM \`categories_rels\`;`)
  await db.run(sql`DROP TABLE \`categories_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_categories_rels\` RENAME TO \`categories_rels\`;`)
  await db.run(sql`CREATE INDEX \`categories_rels_order_idx\` ON \`categories_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`categories_rels_parent_idx\` ON \`categories_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_rels_path_idx\` ON \`categories_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`categories_rels_products_id_idx\` ON \`categories_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_rels_testimonials_id_idx\` ON \`categories_rels\` (\`testimonials_id\`);`)
  await db.run(sql`CREATE INDEX \`categories_rels_awards_id_idx\` ON \`categories_rels\` (\`awards_id\`);`)
  /*
    Редовете на стария списък остават без цел — колоната им я няма.
    Payload ги чисти при следващия запис на страницата, но началната не
    се записва, докато три задължителни снимки са празни, тоест те биха
    стояли неопределено дълго. Ред без нито една цел е безсмислен.

    Не се връщат от `down()`: списъкът в блока вече не се ползва, а
    `npm run migrate` прави архив преди всичко това.
  */
  for (const table of ['pages_rels', '_pages_v_rels', 'categories_rels']) {
    await db.run(
      sql.raw(
        `DELETE FROM \`${table}\` WHERE \`products_id\` IS NULL AND \`testimonials_id\` IS NULL AND \`awards_id\` IS NULL;`,
      ),
    )
  }

  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_rels\` ADD \`categories_id\` integer REFERENCES categories(id);`)
  await db.run(sql`CREATE INDEX \`pages_rels_categories_id_idx\` ON \`pages_rels\` (\`categories_id\`);`)
  await db.run(sql`ALTER TABLE \`_pages_v_rels\` ADD \`categories_id\` integer REFERENCES categories(id);`)
  await db.run(sql`CREATE INDEX \`_pages_v_rels_categories_id_idx\` ON \`_pages_v_rels\` (\`categories_id\`);`)
  await db.run(sql`ALTER TABLE \`categories_rels\` ADD \`categories_id\` integer REFERENCES categories(id);`)
  await db.run(sql`CREATE INDEX \`categories_rels_categories_id_idx\` ON \`categories_rels\` (\`categories_id\`);`)
}
