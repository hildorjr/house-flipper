import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src");
const ALLOWED = path.resolve("src/server/data");
const violations = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;
    if (full.startsWith(ALLOWED)) continue;
    if (full.includes(`${path.sep}generated${path.sep}`)) continue;
    if (full.endsWith(`${path.sep}prisma.ts`)) continue;
    const content = fs.readFileSync(full, "utf8");
    if (/\bprisma\./.test(content) && !full.includes(`${path.sep}lib${path.sep}prisma.ts`)) {
      if (full.includes(`${path.sep}lib${path.sep}entitlements.ts`)) continue;
      if (full.includes(`${path.sep}server${path.sep}auth.ts`)) continue;
      violations.push(path.relative(process.cwd(), full));
    }
  }
}

walk(ROOT);

if (violations.length) {
  console.error("prisma.* calls found outside src/server/data:\n" + violations.join("\n"));
  process.exit(1);
}

console.log("Prisma boundary OK");
