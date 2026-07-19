#!/usr/bin/env node
/**
 * Post-build script: adds .js extensions to all relative imports in the dist folder.
 * Required because TypeScript with "moduleResolution: Bundler" omits extensions,
 * but Node.js ESM requires them at runtime.
 * Uses only Node.js built-ins — no external dependencies.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function walkDir(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (entry.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

const distDir = new URL("../dist", import.meta.url).pathname;
const files = walkDir(distDir);
let count = 0;

for (const file of files) {
  const content = readFileSync(file, "utf8");
  // Add .js to relative imports/exports that don't already have an extension
  const updated = content
    .replace(/(from\s+["'])(\.\.?\/[^"']*?)(?<!\.[a-z]{1,5})(["'])/g, "$1$2.js$3")
    .replace(/(export\s+\*\s+from\s+["'])(\.\.?\/[^"']*?)(?<!\.[a-z]{1,5})(["'])/g, "$1$2.js$3");
  if (updated !== content) {
    writeFileSync(file, updated, "utf8");
    count++;
  }
}

console.log(`✅ Added .js extensions to ${count} files`);
