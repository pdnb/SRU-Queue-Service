import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/app/generated/prisma/client";
import { parseMysqlUrl } from "@/lib/parse-mysql-url";

function getSqliteUrl() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (url.startsWith("file:")) {
    const filePath = url.replace(/^file:/, "");
    if (!path.isAbsolute(filePath)) {
      return `file:${path.join(process.cwd(), filePath)}`;
    }
  }
  return url;
}

export function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";

  if (url.startsWith("file:")) {
    const adapter = new PrismaBetterSqlite3({ url: getSqliteUrl() });
    return new PrismaClient({ adapter });
  }

  if (url.startsWith("mysql:")) {
    const adapter = new PrismaMariaDb(
      parseMysqlUrl(url) as ConstructorParameters<typeof PrismaMariaDb>[0],
    );
    return new PrismaClient({ adapter });
  }

  throw new Error(
    "Unsupported DATABASE_URL scheme. Use file: (SQLite) or mysql: (TiDB/MySQL).",
  );
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
