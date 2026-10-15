import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { connect } from "./db";

/** Applies migrations/*.sql in order, once each, inside a transaction per file. */
async function main() {
  const sql = connect();
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
  const done = new Set((await sql<{ name: string }[]>`SELECT name FROM schema_migrations`).map((r) => r.name));
  const dir = join(process.cwd(), "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    if (done.has(f)) continue;
    const body = readFileSync(join(dir, f), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`INSERT INTO schema_migrations (name) VALUES (${f})`;
    });
    console.log(`applied ${f}`);
  }
  console.log("migrations up to date");
  await sql.end();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
