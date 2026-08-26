#!/usr/bin/env node
/**
 * Import-boundary enforcement (see docs/architecture.md).
 *
 * Rules:
 *  1. app (src/app)          → MAY import from src/features (pages compose
 *                              feature components — the intended pattern)
 *  2. features (src/features) → must NOT import from src/app
 *  3. features → features     → must NOT import another feature's internals;
 *                               shared pieces belong in src/components/shared
 *  4. lib (src/lib)           → must NOT import from src/app or src/features
 *  5. shared ui (src/components/ui, src/components/shared) → must NOT import from src/features
 *
 * Usage: npm run check:boundaries
 * Exit code 1 + a list of violations when any rule breaks.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "src");

function isDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (isDir(full)) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".test.ts") && !entry.endsWith(".test.tsx")) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(ROOT);

const IMPORT_RE =
  /(?:from\s+|import\s*\()["'](@\/[^"']+|\.\.?\/[^"']+)["']/g;

function norm(from, imp) {
  if (imp.startsWith("@/")) return resolve(ROOT, imp.slice(2));
  return resolve(from, "..", imp);
}

/** Resolve the top-level area of a path. */
function area(p) {
  const rel = relative(ROOT, p).split(/[\\/]/)[0] ?? "";
  return rel; // app | features | lib | components | hooks | types | config | ...
}

/** Resolve the feature name (second segment) of a path, e.g. "dashboard". */
function featureName(p) {
  const parts = relative(ROOT, p).split(/[\\/]/);
  return parts.length >= 2 ? parts[1] : "";
}

const violations = [];
const seen = new Set();

for (const file of files) {
  const content = readFileSync(file, "utf8");
  const fromArea = area(file);
  let m;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(content)) !== null) {
    const imp = m[1];
    if (imp.startsWith(".") || imp.startsWith("@/")) {
      let target;
      try {
        target = norm(file, imp);
      } catch {
        continue;
      }
      const targetArea = area(target);
      const key = `${relative(ROOT, file)} -> ${imp}`;
      if (seen.has(key)) continue;

      // Rule 3 only forbids *cross-feature* imports; a feature importing its
      // own internals (e.g. components/ → constants/) is perfectly legal.
      const crossFeature =
        fromArea === "features" &&
        targetArea === "features" &&
        featureName(file) !== featureName(target);

      const bad =
        // app → features is the composition pattern (allowed); everything
        // below keeps feature internals decoupled.
        (fromArea === "features" && targetArea === "app") ||
        crossFeature ||
        ((fromArea === "lib" || fromArea === "components") &&
          (targetArea === "app" || targetArea === "features"));

      if (bad) {
        violations.push(`${relative(ROOT, file)}  →  ${imp}  (${targetArea})`);
        seen.add(key);
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`❌ Boundary violations (${violations.length}):`);
  for (const v of violations) console.error(`  • ${v}`);
  process.exit(1);
}

console.log("✅ Import boundaries OK — no forbidden cross-module imports.");
