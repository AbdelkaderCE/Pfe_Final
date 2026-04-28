/**
 * SYSTEM-ONLY recovery script — not exposed via any API endpoint.
 * Usage: node scripts/unlock-admin.js <email>
 *
 * Resets a locked/suspended account back to active so the user can log in again.
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: node scripts/unlock-admin.js <email>");
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email },
    data: {
      status: "active",
      loginAttempts: 0,
      lockUntil: null,
    },
    select: { id: true, email: true, status: true, loginAttempts: true, lockUntil: true },
  });

  console.log("Account unlocked successfully:", user);
}

main()
  .catch((e) => {
    console.error("Failed to unlock account:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
