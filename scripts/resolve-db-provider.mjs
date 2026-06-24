import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

config({ path: path.join(root, ".env") });

const schemaPath = path.join(root, "prisma", "schema.prisma");

const CANONICAL_PROVIDER = "mysql";

export function detectDbProvider() {
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
    `Unsupported DATABASE_URL scheme. Use file: (SQLite) or mysql: (TiDB/MySQL). Got: ${url.split(":")[0]}:`,
  );
}

export function getMigrationsPath(provider) {
  return provider === "sqlite"
    ? path.join(root, "prisma", "migrations-sqlite")
    : path.join(root, "prisma", "migrations-mysql");
}

function updateSchemaProvider(provider) {
  const schema = readFileSync(schemaPath, "utf8");
  const updated = schema.replace(
    /provider\s*=\s*"(sqlite|mysql)"/,
    `provider = "${provider}"`,
  );

  if (updated === schema) {
    if (!schema.includes(`provider = "${provider}"`)) {
      throw new Error('Could not update provider in prisma/schema.prisma');
    }
    return;
  }

  writeFileSync(schemaPath, updated);
}

function updateMigrationLock(provider) {
  const migrationsPath = getMigrationsPath(provider);
  const lockPath = path.join(migrationsPath, "migration_lock.toml");

  if (!existsSync(lockPath)) {
    throw new Error(`Missing migration lock file: ${lockPath}`);
  }

  const lock = readFileSync(lockPath, "utf8");
  if (lock.includes(`provider = "${provider}"`)) {
    return;
  }

  const updated = lock.replace(
    /provider\s*=\s*"(sqlite|mysql)"/,
    `provider = "${provider}"`,
  );
  writeFileSync(lockPath, updated);
}

function writeProviderMarker(provider) {
  writeFileSync(path.join(root, "prisma", ".db-provider"), provider);
}

export function restoreCanonicalSchema() {
  updateSchemaProvider(CANONICAL_PROVIDER);
  const markerPath = path.join(root, "prisma", ".db-provider");
  if (existsSync(markerPath)) {
    unlinkSync(markerPath);
  }
}

export function resolveDbProvider() {
  const provider = detectDbProvider();
  updateSchemaProvider(provider);
  updateMigrationLock(provider);
  writeProviderMarker(provider);
  return provider;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const provider = resolveDbProvider();
  console.log(`Resolved database provider: ${provider}`);
}
