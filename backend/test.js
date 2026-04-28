const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const [reclamations, justifications, submissions, guestSubmissions] = await Promise.all([
      prisma.reclamation.findMany({
        include: {
          type: { select: { nom_ar: true, nom_en: true } },
          etudiant: {
            select: {
              id: true,
              userId: true,
              matricule: true,
              promo: { select: { section: true } },
              user: { select: { nom: true, prenom: true } },
            },
          },
        },
      }),
      prisma.justification.findMany({
        include: {
          type: { select: { nom_ar: true, nom_en: true } },
          etudiant: {
            select: {
              id: true,
              userId: true,
              matricule: true,
              promo: { select: { section: true } },
              user: { select: { nom: true, prenom: true } },
            },
          },
        },
      }),
      prisma.submission.findMany({
        include: {
          user: { select: { nom: true, prenom: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.guestSubmission.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);
    console.log("Success fetching all data! Submissions count:", submissions.length, "Guest submissions count:", guestSubmissions.length);
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
