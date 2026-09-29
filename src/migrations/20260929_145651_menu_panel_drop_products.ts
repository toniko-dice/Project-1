import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/*
  Втора стъпка след `menu_panel_cards`: маха списъка `products` на
  секциите — редовете вече са попълнени от него. Само `DROP TABLE` на
  таблица, към която нищо не сочи; пресъздаване няма и външните ключове не
  играят роля (т. 7).
*/

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`menu_panels_rels\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`menu_panels_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`products_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`menu_panels\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`menu_panels_rels_order_idx\` ON \`menu_panels_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_rels_parent_idx\` ON \`menu_panels_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_rels_path_idx\` ON \`menu_panels_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`menu_panels_rels_products_id_idx\` ON \`menu_panels_rels\` (\`products_id\`);`)
}
