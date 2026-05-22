const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      userRoles: {
        include: { role: true }
      }
    }
  });

  const roleCounts = {};
  users.forEach(u => {
    const roles = u.userRoles.map(ur => ur.role.nom).join(', ') || 'no_role';
    roleCounts[roles] = (roleCounts[roles] || 0) + 1;
  });

  console.log('Total Users:', users.length);
  console.log('Users by Role:', roleCounts);

  const students = await prisma.etudiant.count();
  const teachers = await prisma.enseignant.count();

  console.log('Etudiants table:', students);
  console.log('Enseignants table:', teachers);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
