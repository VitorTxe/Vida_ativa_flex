import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

function getLocalD1SqlitePath(): string {
  const baseDir = path.resolve(process.cwd(), ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
  if (fs.existsSync(baseDir)) {
    const files = fs.readdirSync(baseDir);
    const sqliteFile = files.find((f) => f.endsWith(".sqlite") && !f.startsWith("metadata"));
    if (sqliteFile) {
      const normalizedPath = path.join(baseDir, sqliteFile).replace(/\\/g, "/");
      return `file:${normalizedPath}`;
    }
  }
  return "";
}

export default defineConfig({
  out: "./drizzle",
  schema: "./backend/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: getLocalD1SqlitePath(),
  },
});

