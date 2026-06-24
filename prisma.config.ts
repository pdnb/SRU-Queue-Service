import path from "node:path";
import { readFileSync, existsSync } from "node:fs";
import "dotenv/config";
import { defineConfig } from "prisma/config";

function detectDbProvider() {
  const markerPath = path.join("prisma", ".db-provider");
  if (existsSync(markerPath)) {
    const marker = readFileSync(markerPath, "utf8").trim();
    if (marker === "sqlite" || marker === "mysql") {
      return marker;
    }
  }

  const override = process.env.DB_PROVIDER;
  if (override === "sqlite" || override === "mysql") {
    return override;
  }

  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (url.startsWith("file:")) {
    return "sqlite";
  }
  if (url.startsWith("mysql:")) {
    return "mysql";
  }

  throw new Error(
    `Unsupported DATABASE_URL scheme. Use file: (SQLite) or mysql: (TiDB/MySQL).`,
  );
}

const provider = detectDbProvider();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path:
      provider === "sqlite"
        ? "prisma/migrations-sqlite"
        : "prisma/migrations-mysql",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
