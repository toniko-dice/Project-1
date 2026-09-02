import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_content_url\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_content_width\` numeric;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_content_height\` numeric;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_content_mime_type\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_content_filesize\` numeric;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_content_filename\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_large_url\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_large_width\` numeric;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_large_height\` numeric;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_large_mime_type\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_large_filesize\` numeric;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_large_filename\` text;`)
  await db.run(sql`CREATE INDEX \`media_sizes_content_sizes_content_filename_idx\` ON \`media\` (\`sizes_content_filename\`);`)
  await db.run(sql`CREATE INDEX \`media_sizes_large_sizes_large_filename_idx\` ON \`media\` (\`sizes_large_filename\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`media_sizes_content_sizes_content_filename_idx\`;`)
  await db.run(sql`DROP INDEX \`media_sizes_large_sizes_large_filename_idx\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_content_url\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_content_width\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_content_height\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_content_mime_type\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_content_filesize\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_content_filename\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_large_url\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_large_width\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_large_height\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_large_mime_type\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_large_filesize\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_large_filename\`;`)
}
