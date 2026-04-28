-- CreateEnum
CREATE TYPE "Niveau" AS ENUM ('L1', 'L2', 'L3', 'M1', 'M2');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('H', 'F');

-- CreateEnum
CREATE TYPE "TypeEnseignement" AS ENUM ('cours', 'td', 'tp');

-- CreateEnum
CREATE TYPE "CategorieDocument" AS ENUM ('enseignement', 'administratif', 'scientifique', 'pedagogique', 'autre');

-- CreateEnum
CREATE TYPE "StatusDocumentRequest" AS ENUM ('en_attente', 'en_traitement', 'valide', 'refuse');

-- CreateEnum
CREATE TYPE "SessionExam" AS ENUM ('normale', 'dette', 'rattrapage');

-- CreateEnum
CREATE TYPE "StatusCopie" AS ENUM ('non_remis', 'remis', 'en_retard');

-- CreateEnum
CREATE TYPE "NiveauSource" AS ENUM ('L1', 'L2', 'L3', 'M1', 'M2');

-- CreateEnum
CREATE TYPE "NiveauCible" AS ENUM ('L2', 'L3', 'M1', 'M2', 'D1');

-- CreateEnum
CREATE TYPE "StatusCampagne" AS ENUM ('brouillon', 'ouverte', 'fermee', 'terminee');

-- CreateEnum
CREATE TYPE "StatusVoeu" AS ENUM ('en_attente', 'accepte', 'refuse');

-- CreateEnum
CREATE TYPE "TypeProjet" AS ENUM ('recherche', 'application', 'etude', 'innovation');

-- CreateEnum
CREATE TYPE "StatusSujet" AS ENUM ('propose', 'valide', 'reserve', 'affecte', 'termine');

-- CreateEnum
CREATE TYPE "MentionPfe" AS ENUM ('passable', 'assez_bien', 'bien', 'tres_bien', 'excellent');

-- CreateEnum
CREATE TYPE "StatusGroupSujet" AS ENUM ('en_attente', 'accepte', 'refuse');

-- CreateEnum
CREATE TYPE "RoleMembre" AS ENUM ('membre', 'chef_groupe');

-- CreateEnum
CREATE TYPE "RoleJury" AS ENUM ('president', 'examinateur', 'rapporteur');

-- CreateEnum
CREATE TYPE "GraviteInfraction" AS ENUM ('faible', 'moyenne', 'grave', 'tres_grave');

-- CreateEnum
CREATE TYPE "NiveauSanction" AS ENUM ('avertissement', 'blame', 'suspension', 'exclusion');

-- CreateEnum
CREATE TYPE "StatusConseil" AS ENUM ('planifie', 'en_cours', 'termine');

-- CreateEnum
CREATE TYPE "RoleConseil" AS ENUM ('president', 'rapporteur', 'membre');

-- CreateEnum
CREATE TYPE "StatusDossier" AS ENUM ('signale', 'en_instruction', 'jugement', 'traite');

-- CreateEnum
CREATE TYPE "PrioriteReclamation" AS ENUM ('faible', 'normale', 'haute', 'urgente');

-- CreateEnum
CREATE TYPE "StatusReclamation" AS ENUM ('soumise', 'en_cours', 'en_attente', 'traitee', 'refusee');

-- CreateEnum
CREATE TYPE "StatusJustification" AS ENUM ('soumis', 'en_verification', 'valide', 'refuse');

-- CreateEnum
CREATE TYPE "CibleAnnonce" AS ENUM ('tous', 'etudiants', 'enseignants', 'administration');

-- CreateEnum
CREATE TYPE "PrioriteAnnonce" AS ENUM ('basse', 'normale', 'haute', 'urgente');

-- CreateEnum
CREATE TYPE "StatusAnnonce" AS ENUM ('brouillon', 'publie', 'archive');

-- CreateEnum
CREATE TYPE "TypeFichierAnnonce" AS ENUM ('pdf', 'image', 'doc', 'autre');

-- CreateTable
CREATE TABLE "facultes" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(200) NOT NULL,

    CONSTRAINT "facultes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departements" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(200) NOT NULL,
    "faculte_id" INTEGER,

    CONSTRAINT "departements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filieres" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "departement_id" INTEGER,
    "description" TEXT,

    CONSTRAINT "filieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialites" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "filiere_id" INTEGER,
    "niveau" "Niveau",

    CONSTRAINT "specialites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promos" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100),
    "specialite_id" INTEGER,
    "annee_universitaire" VARCHAR(20),
    "section" VARCHAR(50),

    CONSTRAINT "promos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "sexe" "Sexe",
    "date_naissance" DATE,
    "telephone" VARCHAR(20),
    "photo" VARCHAR(255),
    "email" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "first_use" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "reset_token" VARCHAR(255),
    "reset_token_expire" TIMESTAMP(3),
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "last_login" TIMESTAMP(3),
    "login_attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100),
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100),
    "description" TEXT,
    "module" VARCHAR(100),
    "action" VARCHAR(50),

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100),
    "description" TEXT,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enseignants" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "grade_id" INTEGER,
    "bureau" VARCHAR(50),
    "date_recrutement" DATE,

    CONSTRAINT "enseignants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etudiants" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "matricule" VARCHAR(50),
    "promo_id" INTEGER,
    "moyenne" DECIMAL(4,2),
    "annee_inscription" SMALLINT,

    CONSTRAINT "etudiants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(150) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "semestre" SMALLINT,
    "specialite_id" INTEGER NOT NULL,
    "volume_cours" INTEGER NOT NULL DEFAULT 0,
    "volume_td" INTEGER NOT NULL DEFAULT 0,
    "volume_tp" INTEGER NOT NULL DEFAULT 0,
    "credit" INTEGER NOT NULL DEFAULT 0,
    "coef" DECIMAL(4,2) NOT NULL DEFAULT 1,
    "description" TEXT,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enseignements" (
    "id" SERIAL NOT NULL,
    "enseignant_id" INTEGER,
    "module_id" INTEGER,
    "promo_id" INTEGER,
    "type" "TypeEnseignement",
    "annee_universitaire" VARCHAR(20),

    CONSTRAINT "enseignements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(150),
    "description" TEXT,
    "categorie" "CategorieDocument" NOT NULL,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_requests" (
    "id" SERIAL NOT NULL,
    "enseignant_id" INTEGER,
    "type_doc_id" INTEGER,
    "description" TEXT,
    "date_demande" DATE,
    "status" "StatusDocumentRequest" NOT NULL DEFAULT 'en_attente',
    "traite_par" INTEGER,
    "date_traitement" DATE,
    "document_url" TEXT,

    CONSTRAINT "document_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copies_remise" (
    "id" SERIAL NOT NULL,
    "enseignement_id" INTEGER,
    "session" "SessionExam" NOT NULL DEFAULT 'normale',
    "date_exam" DATE,
    "date_remise" DATE,
    "nb_copies" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusCopie" NOT NULL DEFAULT 'non_remis',
    "commentaire" TEXT,

    CONSTRAINT "copies_remise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campagne_affectation" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(150) NOT NULL,
    "niveau_source" "NiveauSource" NOT NULL,
    "niveau_cible" "NiveauCible" NOT NULL,
    "annee_universitaire" VARCHAR(20) NOT NULL,
    "date_debut" DATE NOT NULL,
    "date_fin" DATE NOT NULL,
    "status" "StatusCampagne" NOT NULL DEFAULT 'brouillon',
    "date_affectation" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campagne_affectation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campagne_specialites" (
    "id" SERIAL NOT NULL,
    "campagne_id" INTEGER NOT NULL,
    "specialite_id" INTEGER NOT NULL,
    "quota" INTEGER,
    "places_occupees" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "campagne_specialites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voeux" (
    "id" SERIAL NOT NULL,
    "campagne_id" INTEGER,
    "etudiant_id" INTEGER,
    "specialite_id" INTEGER,
    "ordre" INTEGER NOT NULL,
    "status" "StatusVoeu" NOT NULL DEFAULT 'en_attente',
    "date_saisie" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voeux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pfe_sujets" (
    "id" SERIAL NOT NULL,
    "titre" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "keywords" TEXT,
    "enseignant_id" INTEGER NOT NULL,
    "promo_id" INTEGER NOT NULL,
    "workplan" TEXT,
    "bibliographie" TEXT,
    "type_projet" "TypeProjet" NOT NULL DEFAULT 'application',
    "status" "StatusSujet" NOT NULL DEFAULT 'propose',
    "annee_universitaire" VARCHAR(20) NOT NULL,
    "max_grps" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pfe_sujets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups_pfe" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "sujet_final_id" INTEGER NOT NULL,
    "co_encadrant_id" INTEGER NOT NULL,
    "date_creation" DATE,
    "date_affectation" DATE,
    "date_soutenance" DATE,
    "salle_soutenance" VARCHAR(50),
    "note" DECIMAL(4,2),
    "mention" "MentionPfe",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pfe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_sujets" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "sujet_id" INTEGER NOT NULL,
    "ordre" INTEGER NOT NULL,
    "status" "StatusGroupSujet" NOT NULL DEFAULT 'en_attente',

    CONSTRAINT "group_sujets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "etudiant_id" INTEGER NOT NULL,
    "role" "RoleMembre" NOT NULL DEFAULT 'membre',

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pfe_jury" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER,
    "enseignant_id" INTEGER,
    "role" "RoleJury",

    CONSTRAINT "pfe_jury_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infractions" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "gravite" "GraviteInfraction" NOT NULL,

    CONSTRAINT "infractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisions" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "niveau_sanction" "NiveauSanction",

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conseils_disciplinaires" (
    "id" SERIAL NOT NULL,
    "date_reunion" DATE NOT NULL,
    "heure" TIME,
    "lieu" VARCHAR(150),
    "annee_universitaire" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "status" "StatusConseil" NOT NULL DEFAULT 'planifie',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conseils_disciplinaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membres_conseil" (
    "id" SERIAL NOT NULL,
    "conseil_id" INTEGER NOT NULL,
    "enseignant_id" INTEGER NOT NULL,
    "role" "RoleConseil" NOT NULL DEFAULT 'membre',

    CONSTRAINT "membres_conseil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossiers_disciplinaires" (
    "id" SERIAL NOT NULL,
    "conseil_id" INTEGER,
    "etudiant_id" INTEGER NOT NULL,
    "enseignant_signalant" INTEGER,
    "infraction_id" INTEGER NOT NULL,
    "date_signal" DATE NOT NULL,
    "description_signal" TEXT,
    "decision_id" INTEGER,
    "remarque_decision" TEXT,
    "date_decision" DATE,
    "status" "StatusDossier" NOT NULL DEFAULT 'signale',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dossiers_disciplinaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reclamation_types" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(150),
    "description" TEXT,

    CONSTRAINT "reclamation_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reclamations" (
    "id" SERIAL NOT NULL,
    "etudiant_id" INTEGER NOT NULL,
    "type_id" INTEGER NOT NULL,
    "objet" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "priorite" "PrioriteReclamation" NOT NULL DEFAULT 'normale',
    "date_reclamation" DATE DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusReclamation" NOT NULL DEFAULT 'soumise',
    "traite_par" INTEGER,
    "date_traitement" TIMESTAMP(3),
    "reponse" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reclamations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "type_absence" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100),
    "description" TEXT,

    CONSTRAINT "type_absence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "justifications" (
    "id" SERIAL NOT NULL,
    "etudiant_id" INTEGER NOT NULL,
    "type_id" INTEGER NOT NULL,
    "date_absence" DATE NOT NULL,
    "motif" TEXT,
    "document" TEXT,
    "date_depot" DATE DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusJustification" NOT NULL DEFAULT 'soumis',
    "traite_par" INTEGER,
    "date_traitement" TIMESTAMP(3),
    "commentaire_admin" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "justifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annonce_types" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100),
    "description" TEXT,

    CONSTRAINT "annonce_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annonces" (
    "id" SERIAL NOT NULL,
    "titre" VARCHAR(255) NOT NULL,
    "contenu" TEXT NOT NULL,
    "auteur_id" INTEGER NOT NULL,
    "type_id" INTEGER,
    "cible" "CibleAnnonce" NOT NULL DEFAULT 'tous',
    "date_publication" DATE DEFAULT CURRENT_TIMESTAMP,
    "date_expiration" DATE,
    "priorite" "PrioriteAnnonce" NOT NULL DEFAULT 'normale',
    "status" "StatusAnnonce" NOT NULL DEFAULT 'publie',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annonces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annonces_documents" (
    "id" SERIAL NOT NULL,
    "annonce_id" INTEGER NOT NULL,
    "fichier" TEXT NOT NULL,
    "type" "TypeFichierAnnonce" NOT NULL DEFAULT 'autre',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annonces_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "enseignants_user_id_key" ON "enseignants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "etudiants_user_id_key" ON "etudiants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "etudiants_matricule_key" ON "etudiants"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "modules_code_key" ON "modules"("code");

-- CreateIndex
CREATE UNIQUE INDEX "group_sujets_group_id_sujet_id_key" ON "group_sujets"("group_id", "sujet_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_group_id_etudiant_id_key" ON "group_members"("group_id", "etudiant_id");

-- AddForeignKey
ALTER TABLE "departements" ADD CONSTRAINT "departements_faculte_id_fkey" FOREIGN KEY ("faculte_id") REFERENCES "facultes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filieres" ADD CONSTRAINT "filieres_departement_id_fkey" FOREIGN KEY ("departement_id") REFERENCES "departements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specialites" ADD CONSTRAINT "specialites_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promos" ADD CONSTRAINT "promos_specialite_id_fkey" FOREIGN KEY ("specialite_id") REFERENCES "specialites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enseignants" ADD CONSTRAINT "enseignants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enseignants" ADD CONSTRAINT "enseignants_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etudiants" ADD CONSTRAINT "etudiants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etudiants" ADD CONSTRAINT "etudiants_promo_id_fkey" FOREIGN KEY ("promo_id") REFERENCES "promos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_specialite_id_fkey" FOREIGN KEY ("specialite_id") REFERENCES "specialites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enseignements" ADD CONSTRAINT "enseignements_enseignant_id_fkey" FOREIGN KEY ("enseignant_id") REFERENCES "enseignants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enseignements" ADD CONSTRAINT "enseignements_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enseignements" ADD CONSTRAINT "enseignements_promo_id_fkey" FOREIGN KEY ("promo_id") REFERENCES "promos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_enseignant_id_fkey" FOREIGN KEY ("enseignant_id") REFERENCES "enseignants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_type_doc_id_fkey" FOREIGN KEY ("type_doc_id") REFERENCES "document_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copies_remise" ADD CONSTRAINT "copies_remise_enseignement_id_fkey" FOREIGN KEY ("enseignement_id") REFERENCES "enseignements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campagne_specialites" ADD CONSTRAINT "campagne_specialites_campagne_id_fkey" FOREIGN KEY ("campagne_id") REFERENCES "campagne_affectation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campagne_specialites" ADD CONSTRAINT "campagne_specialites_specialite_id_fkey" FOREIGN KEY ("specialite_id") REFERENCES "specialites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voeux" ADD CONSTRAINT "voeux_campagne_id_fkey" FOREIGN KEY ("campagne_id") REFERENCES "campagne_affectation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voeux" ADD CONSTRAINT "voeux_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "etudiants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voeux" ADD CONSTRAINT "voeux_specialite_id_fkey" FOREIGN KEY ("specialite_id") REFERENCES "specialites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfe_sujets" ADD CONSTRAINT "pfe_sujets_enseignant_id_fkey" FOREIGN KEY ("enseignant_id") REFERENCES "enseignants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfe_sujets" ADD CONSTRAINT "pfe_sujets_promo_id_fkey" FOREIGN KEY ("promo_id") REFERENCES "promos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups_pfe" ADD CONSTRAINT "groups_pfe_sujet_final_id_fkey" FOREIGN KEY ("sujet_final_id") REFERENCES "pfe_sujets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups_pfe" ADD CONSTRAINT "groups_pfe_co_encadrant_id_fkey" FOREIGN KEY ("co_encadrant_id") REFERENCES "enseignants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_sujets" ADD CONSTRAINT "group_sujets_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups_pfe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_sujets" ADD CONSTRAINT "group_sujets_sujet_id_fkey" FOREIGN KEY ("sujet_id") REFERENCES "pfe_sujets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups_pfe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "etudiants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfe_jury" ADD CONSTRAINT "pfe_jury_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups_pfe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfe_jury" ADD CONSTRAINT "pfe_jury_enseignant_id_fkey" FOREIGN KEY ("enseignant_id") REFERENCES "enseignants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres_conseil" ADD CONSTRAINT "membres_conseil_conseil_id_fkey" FOREIGN KEY ("conseil_id") REFERENCES "conseils_disciplinaires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres_conseil" ADD CONSTRAINT "membres_conseil_enseignant_id_fkey" FOREIGN KEY ("enseignant_id") REFERENCES "enseignants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers_disciplinaires" ADD CONSTRAINT "dossiers_disciplinaires_conseil_id_fkey" FOREIGN KEY ("conseil_id") REFERENCES "conseils_disciplinaires"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers_disciplinaires" ADD CONSTRAINT "dossiers_disciplinaires_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "etudiants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers_disciplinaires" ADD CONSTRAINT "dossiers_disciplinaires_enseignant_signalant_fkey" FOREIGN KEY ("enseignant_signalant") REFERENCES "enseignants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers_disciplinaires" ADD CONSTRAINT "dossiers_disciplinaires_infraction_id_fkey" FOREIGN KEY ("infraction_id") REFERENCES "infractions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers_disciplinaires" ADD CONSTRAINT "dossiers_disciplinaires_decision_id_fkey" FOREIGN KEY ("decision_id") REFERENCES "decisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reclamations" ADD CONSTRAINT "reclamations_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "etudiants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reclamations" ADD CONSTRAINT "reclamations_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "reclamation_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reclamations" ADD CONSTRAINT "reclamations_traite_par_fkey" FOREIGN KEY ("traite_par") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "justifications" ADD CONSTRAINT "justifications_etudiant_id_fkey" FOREIGN KEY ("etudiant_id") REFERENCES "etudiants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "justifications" ADD CONSTRAINT "justifications_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "type_absence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "justifications" ADD CONSTRAINT "justifications_traite_par_fkey" FOREIGN KEY ("traite_par") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "annonce_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces_documents" ADD CONSTRAINT "annonces_documents_annonce_id_fkey" FOREIGN KEY ("annonce_id") REFERENCES "annonces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
