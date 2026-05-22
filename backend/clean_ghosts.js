const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find users with NO roles and NO etudiant/enseignant record
  const ghosts = await prisma.user.findMany({
    where: { 
      userRoles: { none: {} }, 
      etudiant: null,
      enseignant: null
    },
    select: { id: true, email: true }
  });

  if (ghosts.length > 0) {
    const ghostIds = ghosts.map(g => g.id);
    
    // Delete the users
    const result = await prisma.user.deleteMany({
      where: { id: { in: ghostIds } }
    });

    console.log('Successfully cleaned up', result.count, 'role-less ghost users!');
  } else {
    console.log('No ghost users found.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
