import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  /*
    „Дни" (избор „много") → „От ден" и „До ден". Payload 3.88 не записва
    избор „много" в масив в масив във версиите (`src/blocks/Stores.ts`).
    Първо колоните, после дните от старата таблица (най-ранният и
    най-късният ден на реда), чак накрая старата таблица се маха — иначе
    страницата остава без работно време до следващия запис.
  */
  await db.run(sql`ALTER TABLE \`pages_blocks_stores_stores_hours\` ADD \`from_day\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_stores_stores_hours\` ADD \`to_day\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_stores_stores_hours\` ADD \`from_day\` text;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_stores_stores_hours\` ADD \`to_day\` text;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_stores_stores_hours\` ADD \`from_day\` text NOT NULL DEFAULT 'Monday';`)
  await db.run(sql`ALTER TABLE \`categories_blocks_stores_stores_hours\` ADD \`to_day\` text;`)
  for (const t of ['pages_blocks_stores_stores_hours', '_pages_v_blocks_stores_stores_hours', 'categories_blocks_stores_stores_hours']) {
    await db.run(
      sql.raw(`UPDATE \`${t}\` SET
        \`from_day\` = (SELECT d.value FROM \`${t}_days\` d WHERE d.parent_id = \`${t}\`.id ORDER BY d."order" LIMIT 1),
        \`to_day\` = (SELECT d.value FROM \`${t}_days\` d WHERE d.parent_id = \`${t}\`.id ORDER BY d."order" DESC LIMIT 1)
        WHERE EXISTS (SELECT 1 FROM \`${t}_days\` d WHERE d.parent_id = \`${t}\`.id);`),
    )
  }
  await db.run(sql`DROP TABLE \`pages_blocks_stores_stores_hours_days\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_stores_stores_hours_days\`;`)
  await db.run(sql`DROP TABLE \`categories_blocks_stores_stores_hours_days\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_stores_stores_hours_days\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` text NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages_blocks_stores_stores_hours\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_stores_stores_hours_days_order_idx\` ON \`pages_blocks_stores_stores_hours_days\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_stores_stores_hours_days_parent_idx\` ON \`pages_blocks_stores_stores_hours_days\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_stores_stores_hours_days\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v_blocks_stores_stores_hours\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_stores_stores_hours_days_order_idx\` ON \`_pages_v_blocks_stores_stores_hours_days\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_stores_stores_hours_days_parent_idx\` ON \`_pages_v_blocks_stores_stores_hours_days\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`categories_blocks_stores_stores_hours_days\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` text NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`categories_blocks_stores_stores_hours\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`categories_blocks_stores_stores_hours_days_order_idx\` ON \`categories_blocks_stores_stores_hours_days\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`categories_blocks_stores_stores_hours_days_parent_idx\` ON \`categories_blocks_stores_stores_hours_days\` (\`parent_id\`);`)
  await db.run(sql`ALTER TABLE \`pages_blocks_stores_stores_hours\` DROP COLUMN \`from_day\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_stores_stores_hours\` DROP COLUMN \`to_day\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_stores_stores_hours\` DROP COLUMN \`from_day\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_stores_stores_hours\` DROP COLUMN \`to_day\`;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_stores_stores_hours\` DROP COLUMN \`from_day\`;`)
  await db.run(sql`ALTER TABLE \`categories_blocks_stores_stores_hours\` DROP COLUMN \`to_day\`;`)
}
