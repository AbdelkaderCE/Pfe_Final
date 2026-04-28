const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function listColumns(table) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = '${table}'
     ORDER BY ordinal_position`
  );

  console.log(`--- ${table} ---`);
  console.log(rows.map((row) => row.column_name).join(", "));
}

(async () => {
  try {
    await listColumns("pfe_sujets");
    await listColumns("groups_pfe");
  } finally {
    await prisma.$disconnect();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
