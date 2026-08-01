const fs = require("fs");
const sql = fs.readFileSync("prisma/migrations_init_fixed.sql", "utf8");
const enumEnd = sql.indexOf("-- CreateTable");
const indexStart = sql.indexOf("-- CreateIndex");
fs.mkdirSync("prisma/sql-parts", { recursive: true });
fs.writeFileSync("prisma/sql-parts/01-enums.sql", sql.slice(0, enumEnd));
fs.writeFileSync("prisma/sql-parts/02-tables.sql", sql.slice(enumEnd, indexStart));
fs.writeFileSync("prisma/sql-parts/03-indexes-fks.sql", sql.slice(indexStart));
console.log(
  [enumEnd, indexStart - enumEnd, sql.length - indexStart].join(","),
);
