#!/usr/bin/env node
/**
 * Bump explicit px font sizes by +0.5px across app source.
 * Run once: node scripts/bump-type-scale.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "app");
/** Skip theme tokens — bumped manually in theme.css */
const SKIP_FILES = new Set([join(ROOT, "theme.css")]);
const BUMP = 0.5;

function bumpNum(n) {
  const v = parseFloat(n);
  if (Number.isNaN(v)) return n;
  const next = v + BUMP;
  return Number.isInteger(next) ? String(next) : String(next);
}

function bumpContent(content) {
  let c = content;
  c = c.replace(/text-\[(\d+(?:\.\d+)?)px\]/g, (_, n) => `text-[${bumpNum(n)}px]`);
  c = c.replace(/fontSize:\s*(\d+(?:\.\d+)?)(?=[,\s}\]])/g, (_, n) =>
    `fontSize: ${bumpNum(n)}`,
  );
  c = c.replace(/font-size:\s*(\d+(?:\.\d+)?)px/g, (_, n) =>
    `font-size: ${bumpNum(n)}px`,
  );
  c = c.replace(/\bsize = (\d+(?:\.\d+)?)\b/g, (_, n) => `size = ${bumpNum(n)}`);
  return c;
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "node_modules") continue;
      walk(p, files);
    } else if (/\.(tsx|ts|css)$/.test(name) && !name.endsWith(".test.ts")) {
      files.push(p);
    }
  }
  return files;
}

let changed = 0;
for (const file of walk(ROOT)) {
  if (SKIP_FILES.has(file)) continue;
  const before = readFileSync(file, "utf8");
  const after = bumpContent(before);
  if (after !== before) {
    writeFileSync(file, after);
    changed++;
  }
}
console.log(`bump-type-scale: updated ${changed} files`);
