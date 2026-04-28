import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS student_reclamation_documents (
        id SERIAL PRIMARY KEY,
        reclamation_id INTEGER NOT NULL REFERENCES reclamations(id) ON DELETE CASCADE,
        etudiant_id INTEGER NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE,
        file_path TEXT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(120),
        file_size BIGINT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Table created");
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS student_justification_documents (
        id SERIAL PRIMARY KEY,
        justification_id INTEGER NOT NULL REFERENCES justifications(id) ON DELETE CASCADE,
        etudiant_id INTEGER NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE,
        file_path TEXT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(120),
        file_size BIGINT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Table 2 created");

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS request_workflow_history (
        id SERIAL PRIMARY KEY,
        request_category VARCHAR(50) NOT NULL,
        request_id INTEGER NOT NULL,
        stage VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        actor_user_id INTEGER,
        actor_roles JSONB,
        note TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Table 3 created");

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS teacher_announcement_modules (
        annonce_id INTEGER PRIMARY KEY REFERENCES public.annonces(id) ON DELETE CASCADE,
        module_id INTEGER REFERENCES public.modules(id) ON DELETE SET NULL,
        scheduled_for TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Table 4 created");

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
