const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const rows = await prisma.$queryRawUnsafe("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'student_reclamation_documents';");
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
