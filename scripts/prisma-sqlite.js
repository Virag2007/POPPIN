#!/usr/bin/env node
/**
 * SQLite Prisma CLI Runner
 * Guarantees that SQLite commands run with a valid SQLite file: DATABASE_URL,
 * regardless of whether production PostgreSQL credentials are active in the environment.
 */
const { spawnSync } = require("child_process");
const path = require("path");

const env = { ...process.env };
env.DATABASE_URL = env.SQLITE_DATABASE_URL || "file:./dev.db";

const args = process.argv.slice(2);
const schemaPath = path.join("prisma", "schema.prisma");

const result = spawnSync("npx", ["prisma", ...args, `--schema=${schemaPath}`], {
  stdio: "inherit",
  env,
  shell: true,
});

process.exit(result.status ?? 0);
