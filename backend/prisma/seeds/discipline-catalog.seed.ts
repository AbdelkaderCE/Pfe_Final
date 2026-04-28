import { PrismaClient, GraviteInfraction, NiveauSanction } from '@prisma/client';

const prisma = new PrismaClient();

const infractions: {
  nom_en: string;
  nom_ar: string;
  description_en: string;
  gravite: GraviteInfraction;
}[] = [
  // ── 1st Degree ──────────────────────────────────────────────
  {
    nom_en: 'Exam Fraud',
    nom_ar: 'الغش في الامتحان',
    description_en: 'Any act of cheating or attempt to cheat during an examination.',
    gravite: 'faible',
  },
  {
    nom_en: 'Refusal to Obey',
    nom_ar: 'رفض الطاعة',
    description_en: 'Refusal to comply with instructions from authorised academic or administrative staff.',
    gravite: 'moyenne',
  },
  {
    nom_en: 'Unfounded Double Correction',
    nom_ar: 'طلب التصحيح المزدوج بلا مبرر',
    description_en: 'Requesting a double correction without valid justification.',
    gravite: 'faible',
  },

  // ── 2nd Degree ──────────────────────────────────────────────
  {
    nom_en: '1st Degree Recidivism',
    nom_ar: 'العود إلى مخالفة الدرجة الأولى',
    description_en: 'Repetition of a first-degree infraction after a previous sanction.',
    gravite: 'grave',
  },
  {
    nom_en: 'Organized Disorder',
    nom_ar: 'الإخلال المنظم بالنظام',
    description_en: 'Collective or premeditated disruption of order within the institution.',
    gravite: 'grave',
  },
  {
    nom_en: 'Violence and Threats',
    nom_ar: 'العنف والتهديد',
    description_en: 'Physical or verbal violence or threats directed at any person within the institution.',
    gravite: 'tres_grave',
  },
  {
    nom_en: 'Harmful Means Possession',
    nom_ar: 'حيازة وسائل ضارة',
    description_en: 'Possession of weapons, drugs, or any other dangerous or prohibited items.',
    gravite: 'tres_grave',
  },
  {
    nom_en: 'Document Forgery',
    nom_ar: 'تزوير الوثائق',
    description_en: 'Falsification, alteration, or fabrication of any official academic document.',
    gravite: 'tres_grave',
  },
  {
    nom_en: 'Identity Usurpation',
    nom_ar: 'انتحال الهوية',
    description_en: 'Impersonating another student or person in any academic context.',
    gravite: 'tres_grave',
  },
  {
    nom_en: 'Defamation',
    nom_ar: 'القذف والتشهير',
    description_en: 'Spreading false or damaging information about any member of the institution.',
    gravite: 'grave',
  },
  {
    nom_en: 'Pedagogical Disruption',
    nom_ar: 'الإخلال بسير الدروس',
    description_en: 'Deliberate disruption of courses, exams, or any pedagogical activity.',
    gravite: 'grave',
  },
  {
    nom_en: 'Theft and Misappropriation',
    nom_ar: 'السرقة والاختلاس',
    description_en: 'Theft or misappropriation of property belonging to the institution or its members.',
    gravite: 'tres_grave',
  },
  {
    nom_en: 'Property Deterioration',
    nom_ar: 'إتلاف الممتلكات',
    description_en: 'Deliberate damage or destruction of institutional or personal property.',
    gravite: 'grave',
  },
  {
    nom_en: 'Insults to Staff/Students',
    nom_ar: 'الإهانة والسب',
    description_en: 'Insulting, abusive, or degrading language directed at staff or fellow students.',
    gravite: 'grave',
  },
  {
    nom_en: 'Regulatory Control Refusal',
    nom_ar: 'رفض الخضوع للرقابة التنظيمية',
    description_en: 'Refusal to submit to identity checks or any regulatory control within the institution.',
    gravite: 'grave',
  },
];

const decisions: {
  nom_en: string;
  nom_ar: string;
  description_en: string;
  niveauSanction: NiveauSanction;
}[] = [
  // ── 1st Degree Sanctions ────────────────────────────────────
  {
    nom_en: 'Verbal Warning',
    nom_ar: 'تحذير شفهي',
    description_en: 'Formal oral warning issued by the responsible authority.',
    niveauSanction: 'avertissement',
  },
  {
    nom_en: 'Written Warning',
    nom_ar: 'إنذار كتابي',
    description_en: 'Formal written warning recorded in the student file.',
    niveauSanction: 'avertissement',
  },
  {
    nom_en: 'Blame on File',
    nom_ar: 'توبيخ مسجل في الملف',
    description_en: 'Official written reprimand permanently recorded in the student\'s academic file.',
    niveauSanction: 'blame',
  },
  {
    nom_en: 'Zero on Exam',
    nom_ar: 'صفر في الامتحان',
    description_en: 'Nullification of the examination result, applied exclusively in cases of exam fraud.',
    niveauSanction: 'avertissement',
  },

  // ── 2nd Degree Sanctions ────────────────────────────────────
  {
    nom_en: 'Module Exclusion',
    nom_ar: 'الإقصاء من الوحدة',
    description_en: 'Temporary exclusion from a specific module for the current semester.',
    niveauSanction: 'suspension',
  },
  {
    nom_en: 'Semester Exclusion',
    nom_ar: 'الإقصاء لفصل دراسي',
    description_en: 'Exclusion from all activities for the duration of one semester.',
    niveauSanction: 'suspension',
  },
  {
    nom_en: 'Year Exclusion',
    nom_ar: 'الإقصاء لسنة دراسية',
    description_en: 'Exclusion from all activities for the duration of one academic year.',
    niveauSanction: 'suspension',
  },
  {
    nom_en: 'Two-Year Exclusion',
    nom_ar: 'الإقصاء لسنتين دراسيتين',
    description_en: 'Exclusion from all activities for a period of two academic years.',
    niveauSanction: 'exclusion',
  },
  {
    nom_en: 'Institution-Wide Exclusion',
    nom_ar: 'الطرد النهائي',
    description_en: 'Permanent exclusion from the institution, applicable across all higher-education establishments.',
    niveauSanction: 'exclusion',
  },
];

async function main() {
  console.log('🌱 Seeding discipline catalog…\n');

  for (const inf of infractions) {
    const existing = await prisma.infraction.findFirst({ where: { nom_en: inf.nom_en } });
    if (existing) {
      await prisma.infraction.update({ where: { id: existing.id }, data: inf });
      console.log(`  ↺  Updated infraction: ${inf.nom_en}`);
    } else {
      await prisma.infraction.create({ data: { ...inf, nom_ar: inf.nom_ar, description_ar: inf.description_en } });
      console.log(`  ✓  Created infraction: ${inf.nom_en}`);
    }
  }

  for (const dec of decisions) {
    const existing = await prisma.decision.findFirst({ where: { nom_en: dec.nom_en } });
    if (existing) {
      await prisma.decision.update({ where: { id: existing.id }, data: dec });
      console.log(`  ↺  Updated decision: ${dec.nom_en}`);
    } else {
      await prisma.decision.create({ data: { ...dec, nom_ar: dec.nom_ar, description_ar: dec.description_en } });
      console.log(`  ✓  Created decision: ${dec.nom_en}`);
    }
  }

  console.log('\n✅ Discipline catalog seeded successfully.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
