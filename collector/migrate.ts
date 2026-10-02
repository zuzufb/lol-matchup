import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getSql } from "../src/lib/db";

export async function migrate() {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL tanımlı değil.");
  await sql.unsafe(readFileSync(join(import.meta.dirname, "schema.sql"), "utf8"));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => {
      console.log("Veritabanı tabloları hazır.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
