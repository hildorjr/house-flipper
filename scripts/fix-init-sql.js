const fs = require("fs");
let sql = fs.readFileSync("prisma/migrations_init.sql", "utf8");
sql = sql.replace(/CREATE SCHEMA IF NOT EXISTS "public";\n+/, "");
sql = sql.replace(
  /"updatedAt" TIMESTAMP\(3\) NOT NULL,/g,
  '"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,',
);
sql = sql.replace(
  /"id" UUID NOT NULL,/g,
  '"id" UUID NOT NULL DEFAULT gen_random_uuid(),',
);
sql = sql.replace(
  /CREATE TABLE "Profile" \(\n    "id" UUID NOT NULL DEFAULT gen_random_uuid\(\),/,
  'CREATE TABLE "Profile" (\n    "id" UUID NOT NULL,',
);
fs.writeFileSync("prisma/migrations_init_fixed.sql", sql);
console.log("wrote", sql.length);
