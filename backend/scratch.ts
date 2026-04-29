import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const etudiants = await prisma.etudiant.findMany({
    include: {
      user: true,
    },
    orderBy: {
      moyenne: 'desc'
    }
  });

  console.log("Students and their Averages:");
  console.log("----------------------------");
  etudiants.forEach(e => {
    console.log(`${e.user.nom} ${e.user.prenom} (${e.user.email}): ${e.moyenne}`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
