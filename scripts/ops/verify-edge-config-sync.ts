/**
 * Fail when a supabase/functions/* folder lacks a [functions.name] entry in config.toml.
 * Usage: npx tsx scripts/ops/verify-edge-config-sync.ts
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "../..");
const functionsDir = join(root, "supabase/functions");
const configPath = join(root, "supabase/config.toml");
const config = readFileSync(configPath, "utf8");

const configured = new Set<string>();
for (const line of config.split("\n")) {
  const m = line.match(/^\[functions\.([^\]]+)\]/);
  if (m) configured.add(m[1]!);
}

const folders = readdirSync(functionsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
  .map((d) => d.name)
  .filter((name) => {
    try {
      return readdirSync(join(functionsDir, name)).includes("index.ts");
    } catch {
      return false;
    }
  });

const missing = folders.filter((f) => !configured.has(f));
if (missing.length > 0) {
  console.error("Missing [functions.*] in supabase/config.toml:");
  for (const name of missing.sort()) {
    console.error(`  - ${name}`);
  }
  process.exit(1);
}

console.log(`OK: ${folders.length} Edge functions match config.toml entries.`);
