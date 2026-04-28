SET NAMES utf8mb4;

CREATE TABLE facultes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(200)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE departements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(200),
    faculte_id INT,

    FOREIGN KEY (faculte_id) REFERENCES facultes(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE filieres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    departement_id INT,
    description TEXT,

    FOREIGN KEY (departement_id) REFERENCES departements(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE specialites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    filiere_id INT,
    niveau ENUM('L1','L2','L3','M1','M2'),
    FOREIGN KEY (filiere_id) REFERENCES filieres(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE promos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100),
    specialite_id INT,
    annee_universitaire VARCHAR(20),
    section VARCHAR(50),
    FOREIGN KEY (specialite_id) REFERENCES specialites(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Informations personnelles
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    sexe ENUM('H','F') NULL,
    date_naissance DATE NULL,
    telephone VARCHAR(20),

    -- Photo profil
    photo VARCHAR(255),

    -- Authentification
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_use BOOLEAN DEFAULT TRUE,

    -- Sécurité
    email_verified BOOLEAN DEFAULT FALSE,
    reset_token VARCHAR(255),
    reset_token_expire DATETIME,

    -- Gestion du compte
    status ENUM('active','inactive','suspended') DEFAULT 'active',
    last_login DATETIME NULL,
    login_attempts INT DEFAULT 0,

    -- Informations système
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100),
    description TEXT
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100),
    description TEXT,
    module VARCHAR(100),
    action VARCHAR(50)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT,
    permission_id INT,

    UNIQUE (role_id, permission_id),
    
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    role_id INT,

    UNIQUE (user_id, role_id),

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100),
    description TEXT
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE enseignants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    grade_id INT,
    bureau VARCHAR(50),
    date_recrutement DATE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (grade_id) REFERENCES grades(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE etudiants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    matricule VARCHAR(50) UNIQUE,
    promo_id INT,
    moyenne DECIMAL(4,2),
    annee_inscription YEAR,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (promo_id) REFERENCES promos(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    semestre TINYINT CHECK (semestre BETWEEN 1 AND 10),
    specialite_id INT NOT NULL,
    volume_cours INT DEFAULT 0,
    volume_td INT DEFAULT 0,
    volume_tp INT DEFAULT 0,
    credit INT DEFAULT 0,
    coef DECIMAL(4,2) DEFAULT 1,
    description TEXT,

    FOREIGN KEY (specialite_id) REFERENCES specialites(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE enseignements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enseignant_id INT,
    module_id INT,
    promo_id INT,
    type ENUM('cours','td','tp'),
    annee_universitaire VARCHAR(20),
    FOREIGN KEY (enseignant_id) REFERENCES enseignants(id),
    FOREIGN KEY (module_id) REFERENCES modules(id),
    FOREIGN KEY (promo_id) REFERENCES promos(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE document_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(150),
    description TEXT,
    categorie ENUM(
        'enseignement',
        'administratif',
        'scientifique',
        'pedagogique',
        'autre'
    ) NOT NULL
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE document_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enseignant_id INT,
    type_doc_id INT,
    description TEXT,
    date_demande DATE,
    status ENUM(
        'en_attente',
        'en_traitement',
        'valide',
        'refuse'
    ) DEFAULT 'en_attente',
    traite_par INT,
    date_traitement DATE,
    document_url TEXT,
    FOREIGN KEY (enseignant_id) REFERENCES enseignants(id),
    FOREIGN KEY (type_doc_id) REFERENCES document_types(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE copies_remise (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enseignement_id INT,
    session ENUM('normale','dette','rattrapage') DEFAULT 'normale',
    date_exam DATE,
    date_remise DATE,
    nb_copies INT DEFAULT 0,
    status ENUM(
        'non_remis',
        'remis',
        'en_retard'
    ) DEFAULT 'non_remis',
    commentaire TEXT,

    FOREIGN KEY (enseignement_id) REFERENCES enseignements(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE campagne_affectation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    niveau_source ENUM(
        'L1','L2','L3',
        'M1','M2'
    ) NOT NULL,
    niveau_cible ENUM(
        'L2','L3',
        'M1','M2',
        'D1'
    ) NOT NULL,
    annee_universitaire VARCHAR(20) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    status ENUM(
        'brouillon',
        'ouverte',
        'fermee',
        'terminee'
    ) DEFAULT 'brouillon',
    date_affectation DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE campagne_specialites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campagne_id INT,
    specialite_id INT,
    quota INT,
    places_occupees INT DEFAULT 0,
    FOREIGN KEY (campagne_id) REFERENCES campagne_affectation(id),
    FOREIGN KEY (specialite_id) REFERENCES specialites(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE voeux (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campagne_id INT,
    etudiant_id INT,
    specialite_id INT,
    ordre INT NOT NULL,
    status ENUM(
        'en_attente',
        'accepte',
        'refuse'
    ) DEFAULT 'en_attente',
    date_saisie TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campagne_id) REFERENCES campagne_affectation(id),
    FOREIGN KEY (etudiant_id) REFERENCES etudiants(id),
    FOREIGN KEY (specialite_id) REFERENCES specialites(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pfe_sujets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    keywords TEXT,
    enseignant_id INT NOT NULL,
    promo_id INT NOT NULL,
    workplan TEXT,
    bibliographie TEXT,
    type_projet ENUM(
        'recherche',
        'application',
        'etude',
        'innovation'
    ) DEFAULT 'application',
    status ENUM(
        'propose',
        'valide',
        'reserve',
        'affecte',
        'termine'
    ) DEFAULT 'propose',
    annee_universitaire VARCHAR(20) NOT NULL,
    max_grps INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (enseignant_id) REFERENCES enseignants(id),
    FOREIGN KEY (promo_id) REFERENCES promos(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE groups_pfe (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    sujet_final_id INT NOT NULL,
    co_encadrant_id INT NOT NULL,
    date_creation DATE,
    date_affectation DATE,
    date_soutenance DATE,
    salle_soutenance VARCHAR(50),
    note DECIMAL(4,2),
    mention ENUM(
        'passable',
        'assez_bien',
        'bien',
        'tres_bien',
        'excellent'
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (sujet_final_id) REFERENCES pfe_sujets(id),
    FOREIGN KEY (co_encadrant_id) REFERENCES enseignants(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE group_sujets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    sujet_id INT NOT NULL,
    ordre INT NOT NULL,
    status ENUM(
        'en_attente',
        'accepte',
        'refuse'
    ) DEFAULT 'en_attente',

    UNIQUE (group_id, sujet_id),

    FOREIGN KEY (group_id) REFERENCES groups_pfe(id),
    FOREIGN KEY (sujet_id) REFERENCES pfe_sujets(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    etudiant_id INT NOT NULL,
    role ENUM(
        'membre',
        'chef_groupe'
    ) DEFAULT 'membre',

    UNIQUE (group_id, etudiant_id),

    FOREIGN KEY (group_id) REFERENCES groups_pfe(id),
    FOREIGN KEY (etudiant_id) REFERENCES etudiants(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pfe_jury (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT,
    enseignant_id INT,
    role ENUM(
        'president',
        'examinateur',
        'rapporteur'
    ),

    FOREIGN KEY (group_id) REFERENCES groups_pfe(id),
    FOREIGN KEY (enseignant_id) REFERENCES enseignants(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE infractions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    description TEXT,
    gravite ENUM(
        'faible',
        'moyenne',
        'grave',
        'tres_grave'
    ) NOT NULL
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE decisions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    description TEXT,
    niveau_sanction ENUM(
        'avertissement',
        'blame',
        'suspension',
        'exclusion'
    )
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE conseils_disciplinaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_reunion DATE NOT NULL,
    heure TIME,
    lieu VARCHAR(150),
    annee_universitaire VARCHAR(20) NOT NULL,
    description TEXT,
    status ENUM(
        'planifie',
        'en_cours',
        'termine'
    ) DEFAULT 'planifie',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE membres_conseil (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conseil_id INT NOT NULL,
    enseignant_id INT NOT NULL,
    role ENUM(
        'president',
        'rapporteur',
        'membre'
    ) DEFAULT 'membre',

    FOREIGN KEY (conseil_id) REFERENCES conseils_disciplinaires(id),
    FOREIGN KEY (enseignant_id) REFERENCES enseignants(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dossiers_disciplinaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conseil_id INT,
    etudiant_id INT NOT NULL,
    enseignant_signalant INT,
    infraction_id INT NOT NULL,
    date_signal DATE NOT NULL,
    description_signal TEXT,
    decision_id INT,
    remarque_decision TEXT,
    date_decision DATE,
    status ENUM(
        'signale',
        'en_instruction',
        'jugement',
        'traite'
    ) DEFAULT 'signale',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (conseil_id) REFERENCES conseils_disciplinaires(id),
    FOREIGN KEY (etudiant_id) REFERENCES etudiants(id),
    FOREIGN KEY (enseignant_signalant) REFERENCES enseignants(id),
    FOREIGN KEY (infraction_id) REFERENCES infractions(id),
    FOREIGN KEY (decision_id) REFERENCES decisions(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reclamation_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(150),
    description TEXT
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reclamations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    etudiant_id INT NOT NULL,
    type_id INT NOT NULL,
    objet VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priorite ENUM(
        'faible',
        'normale',
        'haute',
        'urgente'
    ) DEFAULT 'normale',
    date_reclamation DATE DEFAULT (CURRENT_DATE),
    status ENUM(
        'soumise',
        'en_cours',
        'en_attente',
        'traitee',
        'refusee'
    ) DEFAULT 'soumise',
    traite_par INT,
    date_traitement DATETIME,
    reponse TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (etudiant_id) REFERENCES etudiants(id),
    FOREIGN KEY (type_id) REFERENCES reclamation_types(id),
    FOREIGN KEY (traite_par) REFERENCES users(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE type_absence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100),
    description TEXT
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE justifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    etudiant_id INT NOT NULL,
    type_id INT NOT NULL,
    date_absence DATE NOT NULL,
    motif TEXT,
    document TEXT,
    date_depot DATE DEFAULT (CURRENT_DATE),
    status ENUM(
        'soumis',
        'en_verification',
        'valide',
        'refuse'
    ) DEFAULT 'soumis',
    traite_par INT,
    date_traitement DATETIME,
    commentaire_admin TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (etudiant_id) REFERENCES etudiants(id),
    FOREIGN KEY (type_id) REFERENCES type_absence(id),
    FOREIGN KEY (traite_par) REFERENCES users(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE annonce_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100),
    description TEXT
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE annonces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    auteur_id INT NOT NULL,
    type_id INT,
    cible ENUM(
        'tous',
        'etudiants',
        'enseignants',
        'administration'
    ) DEFAULT 'tous',
    date_publication DATE DEFAULT (CURRENT_DATE),
    date_expiration DATE,
    priorite ENUM(
        'basse',
        'normale',
        'haute',
        'urgente'
    ) DEFAULT 'normale',
    status ENUM(
        'brouillon',
        'publie',
        'archive'
    ) DEFAULT 'publie',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (auteur_id) REFERENCES users(id),
    FOREIGN KEY (type_id) REFERENCES annonce_types(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE annonces_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    annonce_id INT NOT NULL,
    fichier TEXT NOT NULL,
    type ENUM(
        'pdf',
        'image',
        'doc',
        'autre'
    ) DEFAULT 'autre',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (annonce_id) REFERENCES annonces(id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;