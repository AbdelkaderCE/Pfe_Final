/// <reference types="node" />

import { CategorieDocument, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedRequestTypes } from "./seeds/request-types.seed";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  const password = await bcrypt.hash("Test@1234", 10);

  // ── Seed request types ───────────────────────────────────
  await seedRequestTypes();
  console.log("✅ Request types seeded (reclamations + justifications)");

  // ── Roles & permissions ──────────────────────────────────
  const roleData = [
    { nom: "admin", description: "Administrateur système" },
    { nom: "enseignant", description: "Enseignant" },
    { nom: "etudiant", description: "Étudiant" },
  ];

  const roles: Record<string, { id: number; nom: string | null }> = {};
  for (const r of roleData) {
    const role = await prisma.role.upsert({
      where: { id: (await prisma.role.findFirst({ where: { nom: r.nom } }))?.id ?? 0 },
      update: {},
      create: r,
    });
    roles[r.nom] = role;
  }
  console.log("✅ Roles created");

  // ── Permissions ──────────────────────────────────────────
  const permData = [
    { nom: "manage_users", description: "Gérer les utilisateurs", module: "auth", action: "manage" },
    { nom: "manage_pfe", description: "Gérer les PFE", module: "pfe", action: "manage" },
    { nom: "submit_pfe", description: "Soumettre un PFE", module: "pfe", action: "submit" },
    { nom: "view_documents", description: "Consulter les documents", module: "documents", action: "view" },
    { nom: "manage_discipline", description: "Gérer les dossiers disciplinaires", module: "discipline", action: "manage" },
    { nom: "submit_reclamation", description: "Soumettre une réclamation", module: "reclamations", action: "submit" },
    { nom: "manage_annonces", description: "Gérer les annonces", module: "annonces", action: "manage" },
  ];

  for (const p of permData) {
    await prisma.permission.upsert({
      where: { id: (await prisma.permission.findFirst({ where: { nom: p.nom } }))?.id ?? 0 },
      update: {},
      create: p,
    });
  }
  console.log("✅ Permissions created");

  // ── Site settings (singleton) ───────────────────────────
  await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      universityNameAr: "جامعة ابن خلدون",
      universityNameEn: "Ibn Khaldoun University",
      universityNameFr: "Université Ibn Khaldoun",
      universitySubtitleAr: "كلية الرياضيات والإعلام الآلي",
      universitySubtitleEn: "Faculty of Mathematics and Computer Science",
      universitySubtitleFr: "Faculté des Mathématiques et d'Informatique",
      cityAr: "تيارت",
      cityEn: "Tiaret",
      cityFr: "Tiaret",
      heroStudentsStat: "2500+",
      heroTeachersStat: "150+",
      heroCoursesStat: "200+",
      heroSatisfactionStat: "98%",
      bannerStudentsStat: "28K+",
      bannerTeachersStat: "1.1K+",
      bannerFacultiesStat: "8",
      bannerNationalRankStat: "15th",
      statisticsStudentsStat: "2500+",
      statisticsTeachersStat: "150+",
      statisticsProjectsStat: "500+",
      statisticsSatisfactionStat: "98%",
      statisticsQuoteAr: "تمكين التعليم عبر التكنولوجيا",
      statisticsQuoteEn: "Empowering education through technology",
      statisticsQuoteFr: "Autonomiser l'éducation grâce à la technologie",
      aboutLine1Ar: "جامعة ابن خلدون - تيارت، كلية الرياضيات والإعلام الآلي",
      aboutLine1En: "Ibn Khaldoun University - Tiaret, Faculty of Mathematics and Computer Science",
      aboutLine1Fr: "Université Ibn Khaldoun - Tiaret, Faculté des Mathématiques et d'Informatique",
      aboutLine2Ar: "تأسست سنة 1980 ومكرسة للتميز في التعليم والبحث العلمي.",
      aboutLine2En: "Established in 1980, dedicated to excellence in education and research.",
      aboutLine2Fr: "Fondée en 1980, dédiée à l'excellence en enseignement et en recherche.",
      contactPhone: "+213 555 55 55 55",
      contactEmail: "info@univ-tiaret.dz",
      contactAddressAr: "تيارت، الجزائر",
      contactAddressEn: "Tiaret, Algeria",
      contactAddressFr: "Tiaret, Algérie",
    },
  });
  console.log("✅ Site settings seeded");

  // ── University structure ─────────────────────────────────
  const faculte = await prisma.faculte.create({
    data: {
      nom_ar: "كلية العلوم والتكنولوجيا",
      nom_en: "Faculty of Science and Technology",
    },
  });

  const deptInfo = await prisma.departement.create({
    data: {
      nom_ar: "الإعلام الآلي",
      nom_en: "Computer Science",
      faculteId: faculte.id,
    },
  });

  await prisma.departement.create({
    data: {
      nom_ar: "الفيزياء",
      nom_en: "Physics",
      faculteId: faculte.id,
    },
  });

  const filiereInfo = await prisma.filiere.create({
    data: {
      nom_ar: "شعبة الإعلام الآلي",
      nom_en: "Computer Science Track",
      departementId: deptInfo.id,
      description_ar: "شعبة الإعلام الآلي",
      description_en: "Computer science stream",
    },
  });

  const specISI = await prisma.specialite.create({
    data: {
      nom_ar: "ISI",
      nom_en: "ISI",
      filiereId: filiereInfo.id,
      niveau: "M2",
    },
  });

  await prisma.specialite.create({
    data: {
      nom_ar: "SIC",
      nom_en: "SIC",
      filiereId: filiereInfo.id,
      niveau: "M2",
    },
  });

  // ── Academic year (canonical, FK-backed) ─────────────────
  // Idempotent: re-runs reuse the existing row keyed by its unique `name`.
  // The seeded year is set active so the active-year defaulting in
  // /api/v1/enseignements/{mine,me} returns the right scope right away.
  const academicYear2025 = await prisma.academicYear.upsert({
    where: { name: "2024-2025" },
    update: { isActive: true },
    create: { name: "2024-2025", isActive: true },
  });
  console.log(`✅ Academic year ${academicYear2025.name} ready (active)`);

  const promo2025 = await prisma.promo.create({
    data: {
      nom_ar: "M2 ISI 2024-2025",
      nom_en: "M2 ISI 2024-2025",
      specialiteId: specISI.id,
      anneeUniversitaire: "2024-2025",
      section: "A",
      academicYearId: academicYear2025.id,
    },
  });

  const promo2025B = await prisma.promo.create({
    data: {
      nom_ar: "M2 ISI 2024-2025",
      nom_en: "M2 ISI 2024-2025",
      specialiteId: specISI.id,
      anneeUniversitaire: "2024-2025",
      section: "B",
      academicYearId: academicYear2025.id,
    },
  });

  console.log("✅ University structure created (Faculté → Département → Filière → Spécialité → Promo)");

  // ── Grades ───────────────────────────────────────────────
  const gradeMAA = await prisma.grade.create({
    data: {
      nom_ar: "أستاذ مساعد أ",
      nom_en: "Assistant Professor A",
      description_ar: "رتبة أستاذ مساعد أ",
      description_en: "Academic rank: Assistant Professor A",
    },
  });
  const gradeMCA = await prisma.grade.create({
    data: {
      nom_ar: "أستاذ محاضر أ",
      nom_en: "Associate Professor A",
      description_ar: "رتبة أستاذ محاضر أ",
      description_en: "Academic rank: Associate Professor A",
    },
  });
  await prisma.grade.create({
    data: {
      nom_ar: "أستاذ",
      nom_en: "Professor",
      description_ar: "رتبة أستاذ",
      description_en: "Academic rank: Professor",
    },
  });

  console.log("✅ Grades created");

  // ── Helper: create user + assign roles ───────────────────
  async function createUser(data: {
    email: string;
    nom: string;
    prenom: string;
    roleNames: string[];
    emailVerified?: boolean;
    enseignantData?: { gradeId: number };
    etudiantData?: { promoId: number; matricule: string; moyenne?: number };
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          firstUse: false,
          emailVerified: data.emailVerified ?? true,
          status: "active",
        },
      });
      console.log(`  ⏭️  ${data.email} already exists`);
      return existing;
    }

    // The student matricule is unique across the etudiants table. A prior
    // partial run (or a different fixture user) may already own it. Detect
    // and skip rather than blowing up on a unique-constraint violation.
    if (data.etudiantData) {
      const matriculeOwner = await prisma.etudiant.findUnique({
        where: { matricule: data.etudiantData.matricule },
        select: { user: { select: { id: true, email: true } } },
      });
      if (matriculeOwner) {
        console.log(
          `  ⚠️  matricule ${data.etudiantData.matricule} already owned by ${matriculeOwner.user.email} — skipping ${data.email}`
        );
        return matriculeOwner.user;
      }
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password,
        nom: data.nom,
        prenom: data.prenom,
        emailVerified: data.emailVerified ?? true,
        firstUse: false,
        ...(data.enseignantData
          ? { enseignant: { create: { gradeId: data.enseignantData.gradeId } } }
          : {}),
        ...(data.etudiantData
          ? {
              etudiant: {
                create: {
                  promoId: data.etudiantData.promoId,
                  matricule: data.etudiantData.matricule,
                  moyenne: data.etudiantData.moyenne,
                },
              },
            }
          : {}),
      },
    });

    // Assign roles
    for (const roleName of data.roleNames) {
      const role = roles[roleName];
      if (role) {
        await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
      }
    }

    console.log(`  ✅ [${data.roleNames.join(", ")}] ${data.email}`);
    return user;
  }

  // ── Users ────────────────────────────────────────────────
  console.log("\n👤 Creating users (password for all: Test@1234)\n");

  await createUser({
    email: "admin@univ-tiaret.dz",
    nom: "Super",
    prenom: "Admin",
    roleNames: ["admin"],
  });

  await createUser({
    email: "teacher@univ-tiaret.dz",
    nom: "Benali",
    prenom: "Youcef",
    roleNames: ["enseignant"],
    enseignantData: { gradeId: gradeMCA.id },
  });

  await createUser({
    email: "teacher2@univ-tiaret.dz",
    nom: "Mebarki",
    prenom: "Nadia",
    roleNames: ["enseignant"],
    enseignantData: { gradeId: gradeMAA.id },
  });

  await createUser({
    email: "student@univ-tiaret.dz",
    nom: "Bensalem",
    prenom: "Amira",
    roleNames: ["etudiant"],
    etudiantData: { promoId: promo2025.id, matricule: "212131234567", moyenne: 14.5 },
  });

  await createUser({
    email: "student2@univ-tiaret.dz",
    nom: "Mehdaoui",
    prenom: "Yacine",
    roleNames: ["etudiant"],
    etudiantData: { promoId: promo2025B.id, matricule: "212131234568", moyenne: 12.75 },
  });

  await createUser({
    email: "student3@univ-tiaret.dz",
    nom: "Djeraba",
    prenom: "Sara",
    roleNames: ["etudiant"],
    etudiantData: { promoId: promo2025.id, matricule: "212131234569", moyenne: 15.2 },
  });

  // ── Additional Teachers (to reach 7) ─────────────────────
  const additionalTeacherNames = [
    { nom: "Kaddour", prenom: "Ahmed" },
    { nom: "Ziane", prenom: "Fatima" },
    { nom: "Mansouri", prenom: "Mustapha" },
    { nom: "Belkacem", prenom: "Saliha" },
    { nom: "Hamidi", prenom: "Rachid" },
  ];

  for (let i = 0; i < additionalTeacherNames.length; i++) {
    await createUser({
      email: `teacher${i + 3}@univ-tiaret.dz`,
      nom: additionalTeacherNames[i].nom,
      prenom: additionalTeacherNames[i].prenom,
      roleNames: ["enseignant"],
      enseignantData: { gradeId: i % 2 === 0 ? gradeMCA.id : gradeMAA.id },
    });
  }

  // ── Additional Students (to reach 15) ────────────────────
  const additionalStudentNames = [
    { nom: "Larbi", prenom: "Omar" },
    { nom: "Slimani", prenom: "Ines" },
    { nom: "Brahimi", prenom: "Khalil" },
    { nom: "Merah", prenom: "Zohra" },
    { nom: "Touati", prenom: "Abdelkader" },
    { nom: "Gherbi", prenom: "Meriem" },
    { nom: "Ould", prenom: "Said" },
    { nom: "Tahar", prenom: "Nabil" },
    { nom: "Abdi", prenom: "Sofia" },
    { nom: "Yousfi", prenom: "Karim" },
    { nom: "Belaid", prenom: "Amine" },
    { nom: "Saidi", prenom: "Leila" },
  ];

  for (let i = 0; i < additionalStudentNames.length; i++) {
    const promoId = i % 2 === 0 ? promo2025.id : promo2025B.id;
    const moyenne = parseFloat((Math.random() * (18 - 10) + 10).toFixed(2));
    await createUser({
      email: `student${i + 4}@univ-tiaret.dz`,
      nom: additionalStudentNames[i].nom,
      prenom: additionalStudentNames[i].prenom,
      roleNames: ["etudiant"],
      etudiantData: {
        promoId,
        matricule: `2121312345${70 + i}`,
        moyenne,
      },
    });
  }

  // ── Direct assignments: teachers ↔ promos/modules/groups, students ↔ promo/section/groups ──
  const teacherUser = await prisma.user.findUnique({
    where: { email: "teacher@univ-tiaret.dz" },
    include: { enseignant: true },
  });
  const teacher2User = await prisma.user.findUnique({
    where: { email: "teacher2@univ-tiaret.dz" },
    include: { enseignant: true },
  });
  const studentUser = await prisma.user.findUnique({
    where: { email: "student@univ-tiaret.dz" },
    include: { etudiant: true },
  });
  const student2User = await prisma.user.findUnique({
    where: { email: "student2@univ-tiaret.dz" },
    include: { etudiant: true },
  });
  const student3User = await prisma.user.findUnique({
    where: { email: "student3@univ-tiaret.dz" },
    include: { etudiant: true },
  });

  if (
    !teacherUser?.enseignant?.id ||
    !teacher2User?.enseignant?.id ||
    !studentUser?.etudiant?.id ||
    !student2User?.etudiant?.id
  ) {
    throw new Error("Missing enseignant/etudiant records required for direct assignments.");
  }

  const hasStudent3 = Boolean(student3User?.etudiant?.id);

  const moduleAlgo = await prisma.module.upsert({
    where: { code: "ISI-M2-ALGO-ADV" },
    update: {},
    create: {
      nom_ar: "الخوارزميات المتقدمة",
      nom_en: "Advanced Algorithms",
      code: "ISI-M2-ALGO-ADV",
      semestre: 3,
      specialiteId: specISI.id,
      volumeCours: 24,
      volumeTd: 18,
      volumeTp: 0,
      credit: 6,
      coef: 3,
      description_ar: "وحدة تعليمية أساسية لطلبة ماستر 2 ISI",
      description_en: "Core unit for M2 ISI students",
    },
  });

  const moduleCloud = await prisma.module.upsert({
    where: { code: "ISI-M2-CLOUD" },
    update: {},
    create: {
      nom_ar: "الحوسبة السحابية وDevOps",
      nom_en: "Cloud and DevOps",
      code: "ISI-M2-CLOUD",
      semestre: 3,
      specialiteId: specISI.id,
      volumeCours: 20,
      volumeTd: 10,
      volumeTp: 14,
      credit: 5,
      coef: 2,
      description_ar: "البنية السحابية والتكامل المستمر",
      description_en: "Cloud infrastructure and continuous integration",
    },
  });

  const moduleAI = await prisma.module.upsert({
    where: { code: "ISI-M2-AI" },
    update: {},
    create: {
      nom_ar: "الذكاء الاصطناعي التطبيقي",
      nom_en: "Applied AI",
      code: "ISI-M2-AI",
      semestre: 3,
      specialiteId: specISI.id,
      volumeCours: 18,
      volumeTd: 12,
      volumeTp: 12,
      credit: 5,
      coef: 2,
      description_ar: "طرق الذكاء الاصطناعي للتطبيقات المهنية",
      description_en: "AI methods for business applications",
    },
  });

  const ensureEnseignement = async (
    enseignantId: number,
    moduleId: number,
    promoId: number,
    type: "cours" | "td" | "tp" | "online",
  ) => {
    const existing = await prisma.enseignement.findFirst({
      where: {
        enseignantId,
        moduleId,
        promoId,
        type,
        academicYearId: academicYear2025.id,
      },
    });

    if (existing) return existing;

    return prisma.enseignement.create({
      data: {
        enseignantId,
        moduleId,
        promoId,
        type,
        anneeUniversitaire: academicYear2025.name,
        academicYearId: academicYear2025.id,
      },
    });
  };

  await ensureEnseignement(teacherUser.enseignant.id, moduleAlgo.id, promo2025.id, "cours");
  await ensureEnseignement(teacherUser.enseignant.id, moduleCloud.id, promo2025.id, "td");
  await ensureEnseignement(teacher2User.enseignant.id, moduleAI.id, promo2025B.id, "cours");
  await ensureEnseignement(teacher2User.enseignant.id, moduleCloud.id, promo2025B.id, "tp");

  // ── PFE submission lock — open by default in dev so the teacher seed
  // user can immediately submit subjects. Toggled at runtime via
  // PUT /api/v1/pfe/admin/config/submission. Idempotent on re-run.
  await prisma.pfeConfig.upsert({
    where: { nom_config: "submission_open" },
    update: { valeur: "true" },
    create: {
      nom_config: "submission_open",
      valeur: "true",
      anneeUniversitaire: academicYear2025.name,
      description_en: "Whether teachers may submit new PFE subjects",
      description_ar: "هل يُسمح للأساتذة بتقديم مواضيع PFE جديدة",
    },
  });
  console.log("✅ PFE submission lock seeded (open)");

  const defaultDocumentTypes: Array<{
    nomAr: string;
    nomEn: string;
    categorie: CategorieDocument;
    descriptionAr: string;
    descriptionEn: string;
  }> = [
      {
        nomAr: "Attestation de travail",
        nomEn: "Work Certificate",
        categorie: "administratif",
        descriptionAr: "Document attestant les fonctions d'enseignement au sein de l'etablissement.",
        descriptionEn: "Document certifying active teaching duties at the institution.",
      },
      {
        nomAr: "Certificat d'affectation d'enseignement",
        nomEn: "Teaching Assignment Certificate",
        categorie: "enseignement",
        descriptionAr: "Document indiquant les unites et groupes d'enseignement assignes a l'enseignant.",
        descriptionEn: "Certificate listing assigned modules and teaching groups.",
      },
      {
        nomAr: "Decision de conge scientifique",
        nomEn: "Academic Leave Decision",
        categorie: "scientifique",
        descriptionAr: "Document administratif relatif au conge scientifique ou de recherche.",
        descriptionEn: "Administrative document related to scientific/academic leave.",
      },
      {
        nomAr: "Attestation de participation pedagogique",
        nomEn: "Pedagogical Participation Attestation",
        categorie: "pedagogique",
        descriptionAr: "Attestation de participation aux commissions ou activites pedagogiques.",
        descriptionEn: "Attestation of participation in pedagogical committees or activities.",
      },
      {
        nomAr: "Autre document administratif",
        nomEn: "Other Administrative Document",
        categorie: "autre",
        descriptionAr: "Tout document non classe dans les autres categories.",
        descriptionEn: "Any document not covered by other categories.",
      },
    ];

  const ensureDocumentType = async (item: (typeof defaultDocumentTypes)[number]) => {
    const existing = await prisma.documentType.findFirst({
      where: {
        nom_en: item.nomEn,
        categorie: item.categorie,
      },
      select: { id: true },
    });

    if (existing) return;

    await prisma.documentType.create({
      data: {
        nom_ar: item.nomAr,
        nom_en: item.nomEn,
        categorie: item.categorie,
        description_ar: item.descriptionAr,
        description_en: item.descriptionEn,
      },
    });
  };

  for (const item of defaultDocumentTypes) {
    await ensureDocumentType(item);
  }

  console.log("✅ Default document types ensured");

  const sujet1 = await prisma.pfeSujet.create({
    data: {
      titre_ar: "منصة ذكية لإدارة الشكاوى",
      titre_en: "Smart Complaint Management Platform",
      description_ar: "تصميم منصة ويب مع مسارات عمل مؤتمتة.",
      description_en: "Design of a web platform with automated workflows.",
      keywords_ar: "شكاوى، منصة، سير عمل",
      keywords_en: "complaints, platform, workflow",
      enseignantId: teacherUser.enseignant.id,
      promoId: promo2025.id,
      workplan_ar: "تحليل المتطلبات ثم تطوير الواجهة الخلفية والأمامية",
      workplan_en: "Requirements analysis followed by backend and frontend implementation",
      bibliographie_ar: "مراجع في نظم إدارة الشكاوى والمنصات الأكاديمية",
      bibliographie_en: "References on complaint management systems and academic platforms",
      typeProjet: "application",
      status: "valide",
      anneeUniversitaire: "2024-2025",
      maxGrps: 2,
    },
  });

  const sujet2 = await prisma.pfeSujet.create({
    data: {
      titre_ar: "تحليل تنبؤي للمخاطر التأديبية",
      titre_en: "Predictive Analysis of Disciplinary Risks",
      description_ar: "نموذج ذكاء اصطناعي للكشف المبكر عن المخاطر الأكاديمية.",
      description_en: "AI model for early detection of academic risks.",
      keywords_ar: "ذكاء اصطناعي، تنبؤ، مخاطر تأديبية",
      keywords_en: "AI, prediction, disciplinary risks",
      enseignantId: teacher2User.enseignant.id,
      promoId: promo2025B.id,
      workplan_ar: "جمع البيانات، تدريب النموذج، ثم تقييم النتائج",
      workplan_en: "Data collection, model training, then evaluation",
      bibliographie_ar: "مراجع في التحليل التنبؤي والذكاء الاصطناعي التعليمي",
      bibliographie_en: "References on predictive analytics and educational AI",
      typeProjet: "recherche",
      status: "valide",
      anneeUniversitaire: "2024-2025",
      maxGrps: 1,
    },
  });

  const groupA = await prisma.groupPfe.create({
    data: {
      nom_ar: "فريق ISI-A1",
      nom_en: "Group ISI-A1",
      sujetFinalId: sujet1.id,
      coEncadrantId: teacher2User.enseignant.id,
      dateCreation: new Date("2024-10-01"),
      dateAffectation: new Date("2024-10-05"),
    },
  });

  const groupB = await prisma.groupPfe.create({
    data: {
      nom_ar: "فريق ISI-B1",
      nom_en: "Group ISI-B1",
      sujetFinalId: sujet2.id,
      coEncadrantId: teacherUser.enseignant.id,
      dateCreation: new Date("2024-10-01"),
      dateAffectation: new Date("2024-10-06"),
    },
  });

  const ensureGroupMember = async (groupId: number, etudiantId: number, role: "chef_groupe" | "membre") => {
    const existing = await prisma.groupMember.findFirst({
      where: { groupId, etudiantId },
    });
    if (existing) return existing;
    return prisma.groupMember.create({
      data: { groupId, etudiantId, role },
    });
  };

  await ensureGroupMember(groupA.id, studentUser.etudiant.id, "membre");
  if (hasStudent3 && student3User?.etudiant?.id) {
    await ensureGroupMember(groupA.id, student3User.etudiant.id, "chef_groupe");
  }
  await ensureGroupMember(groupB.id, student2User.etudiant.id, "chef_groupe");

  const ensureJury = async (groupId: number, enseignantId: number, role: "president" | "examinateur" | "rapporteur") => {
    const existing = await prisma.pfeJury.findFirst({
      where: { groupId, enseignantId, role },
    });
    if (existing) return existing;
    return prisma.pfeJury.create({
      data: { groupId, enseignantId, role },
    });
  };

  await ensureJury(groupA.id, teacherUser.enseignant.id, "president");
  await ensureJury(groupA.id, teacher2User.enseignant.id, "examinateur");
  await ensureJury(groupB.id, teacher2User.enseignant.id, "president");
  await ensureJury(groupB.id, teacherUser.enseignant.id, "rapporteur");

  // ── Seed justifications ──────────────────────────────────
  const adminUser = await prisma.user.findUnique({
    where: { email: "admin@univ-tiaret.dz" },
  });
  const medicalType = await prisma.typeAbsence.findFirst({ where: { code: "MEDICAL" } });
  const familyType = await prisma.typeAbsence.findFirst({ where: { code: "FAMILY" } });
  const academicType = await prisma.typeAbsence.findFirst({ where: { code: "ACADEMIC_OVERLAP" } });

  if (adminUser && medicalType && familyType && academicType) {
    // Create sample justifications with different statuses
    await prisma.justification.create({
      data: {
        etudiantId: studentUser.etudiant.id,
        typeId: medicalType.id,
        dateAbsence: new Date("2024-12-01"),
        motif_ar: "زيارة طبية",
        motif_en: "Medical visit",
        status: "valide",
        traitePar: adminUser.id,
        dateTraitement: new Date("2024-12-02"),
        commentaireAdmin_ar: "موافق عليها",
        commentaireAdmin_en: "Approved",
      },
    });

    await prisma.justification.create({
      data: {
        etudiantId: student2User.etudiant.id,
        typeId: familyType.id,
        dateAbsence: new Date("2024-12-05"),
        motif_ar: "طارئ عائلي",
        motif_en: "Family emergency",
        status: "en_verification",
      },
    });

    if (hasStudent3 && student3User?.etudiant?.id) {
      await prisma.justification.create({
        data: {
          etudiantId: student3User.etudiant.id,
          typeId: academicType.id,
          dateAbsence: new Date("2024-12-10"),
          motif_ar: "تداخل مع مؤتمر أكاديمي",
          motif_en: "Overlap with academic conference",
          status: "refuse",
          traitePar: adminUser.id,
          dateTraitement: new Date("2024-12-11"),
          commentaireAdmin_ar: "غير مقبول",
          commentaireAdmin_en: "Not acceptable",
        },
      });
    }

    await prisma.justification.create({
      data: {
        etudiantId: studentUser.etudiant.id,
        typeId: medicalType.id,
        dateAbsence: new Date("2024-12-15"),
        motif_ar: "مرض",
        motif_en: "Illness",
        status: "soumis",
      },
    });

    console.log("✅ Sample justifications seeded");
  }

  console.log("✅ Direct assignments created:");
  console.log("   • Teachers assigned to promos/modules (enseignements)");
  console.log("   • Students assigned to promo sections A/B");
  console.log("   • PFE groups created with student members and teacher jury/co-encadrant");

  console.log("\n🎉 Seeding complete!\n");
  console.log("────────────────────────────────────────────");
  console.log("  📧 Login credentials (all accounts):");
  console.log("  Password: Test@1234");
  console.log("");
  console.log("  admin@univ-tiaret.dz       (Admin)");
  console.log("  teacher@univ-tiaret.dz     (Enseignant)");
  console.log("  student@univ-tiaret.dz     (Étudiant)");
  console.log("────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
