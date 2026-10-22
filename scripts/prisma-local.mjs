#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const envFiles = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
];

function parseEnvValue(raw) {
  let value = raw.trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return value;
}

function readLocalDatabaseUrl() {
  let localDatabaseUrl = "";

  for (const file of envFiles) {
    const envPath = resolve(root, file);
    if (!existsSync(envPath)) continue;

    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("#")) continue;
      if (!trimmedLine.startsWith("DATABASE_URL_LOCAL=")) continue;

      localDatabaseUrl = parseEnvValue(trimmedLine.split("=").slice(1).join("="));
    }
  }

  if (!localDatabaseUrl) {
    throw new Error(
      "DATABASE_URL_LOCAL belum ditemukan. Tambahkan dulu di .env atau .env.local."
    );
  }

  return localDatabaseUrl;
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: node scripts/prisma-local.mjs <prisma-command>");
  console.log("Example: node scripts/prisma-local.mjs migrate dev");
  process.exit(0);
}

process.env.DATABASE_URL = readLocalDatabaseUrl();

const prismaCli = resolve(root, "node_modules", "prisma", "build", "index.js");

console.log("Using DATABASE_URL_LOCAL for Prisma CLI.");

const child = spawn(process.execPath, [prismaCli, ...args], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
