import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveDbProvider, restoreCanonicalSchema } from "./resolve-db-provider.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const prismaArgs = process.argv.slice(2);
if (prismaArgs.length === 0) {
  console.error("Usage: node scripts/with-prisma.mjs <prisma-command> [args...]");
  process.exit(1);
}

resolveDbProvider();

try {
  execSync(`npx prisma ${prismaArgs.join(" ")}`, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
} finally {
  restoreCanonicalSchema();
}
