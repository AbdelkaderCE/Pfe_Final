--
-- PostgreSQL database dump
--

\restrict QbdHcq9GnfuruBd4PMiBzRr44XwjOUukdJqfCm8JjMOjNoeAXn6IvLPhPI3K7Vy

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AlertType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AlertType" AS ENUM (
    'MEETING',
    'DECISION',
    'REQUEST'
);


ALTER TYPE public."AlertType" OWNER TO postgres;

--
-- Name: CategorieDocument; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CategorieDocument" AS ENUM (
    'enseignement',
    'administratif',
    'scientifique',
    'pedagogique',
    'autre'
);


ALTER TYPE public."CategorieDocument" OWNER TO postgres;

--
-- Name: CibleAnnonce; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CibleAnnonce" AS ENUM (
    'tous',
    'etudiants',
    'enseignants',
    'administration'
);


ALTER TYPE public."CibleAnnonce" OWNER TO postgres;

--
-- Name: GraviteInfraction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."GraviteInfraction" AS ENUM (
    'faible',
    'moyenne',
    'grave',
    'tres_grave'
);


ALTER TYPE public."GraviteInfraction" OWNER TO postgres;

--
-- Name: MentionPfe; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MentionPfe" AS ENUM (
    'passable',
    'assez_bien',
    'bien',
    'tres_bien',
    'excellent'
);


ALTER TYPE public."MentionPfe" OWNER TO postgres;

--
-- Name: Niveau; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Niveau" AS ENUM (
    'L1',
    'L2',
    'L3',
    'M1',
    'M2'
);


ALTER TYPE public."Niveau" OWNER TO postgres;

--
-- Name: NiveauCible; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NiveauCible" AS ENUM (
    'L2',
    'L3',
    'M1',
    'M2',
    'D1'
);


ALTER TYPE public."NiveauCible" OWNER TO postgres;

--
-- Name: NiveauSanction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NiveauSanction" AS ENUM (
    'avertissement',
    'blame',
    'suspension',
    'exclusion'
);


ALTER TYPE public."NiveauSanction" OWNER TO postgres;

--
-- Name: NiveauSource; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NiveauSource" AS ENUM (
    'L1',
    'L2',
    'L3',
    'M1',
    'M2'
);


ALTER TYPE public."NiveauSource" OWNER TO postgres;

--
-- Name: PrioriteAnnonce; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PrioriteAnnonce" AS ENUM (
    'basse',
    'normale',
    'haute',
    'urgente'
);


ALTER TYPE public."PrioriteAnnonce" OWNER TO postgres;

--
-- Name: PrioriteReclamation; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PrioriteReclamation" AS ENUM (
    'faible',
    'normale',
    'haute',
    'urgente'
);


ALTER TYPE public."PrioriteReclamation" OWNER TO postgres;

--
-- Name: RoleConseil; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RoleConseil" AS ENUM (
    'president',
    'rapporteur',
    'membre'
);


ALTER TYPE public."RoleConseil" OWNER TO postgres;

--
-- Name: RoleJury; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RoleJury" AS ENUM (
    'president',
    'examinateur',
    'rapporteur'
);


ALTER TYPE public."RoleJury" OWNER TO postgres;

--
-- Name: RoleMembre; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RoleMembre" AS ENUM (
    'membre',
    'chef_groupe'
);


ALTER TYPE public."RoleMembre" OWNER TO postgres;

--
-- Name: SessionExam; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SessionExam" AS ENUM (
    'normale',
    'dette',
    'rattrapage'
);


ALTER TYPE public."SessionExam" OWNER TO postgres;

--
-- Name: Sexe; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Sexe" AS ENUM (
    'H',
    'F'
);


ALTER TYPE public."Sexe" OWNER TO postgres;

--
-- Name: StatusAnnonce; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusAnnonce" AS ENUM (
    'brouillon',
    'publie',
    'archive'
);


ALTER TYPE public."StatusAnnonce" OWNER TO postgres;

--
-- Name: StatusCampagne; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusCampagne" AS ENUM (
    'brouillon',
    'ouverte',
    'fermee',
    'terminee'
);


ALTER TYPE public."StatusCampagne" OWNER TO postgres;

--
-- Name: StatusConseil; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusConseil" AS ENUM (
    'planifie',
    'en_cours',
    'termine'
);


ALTER TYPE public."StatusConseil" OWNER TO postgres;

--
-- Name: StatusCopie; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusCopie" AS ENUM (
    'non_remis',
    'remis',
    'en_retard'
);


ALTER TYPE public."StatusCopie" OWNER TO postgres;

--
-- Name: StatusDocumentRequest; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusDocumentRequest" AS ENUM (
    'en_attente',
    'en_traitement',
    'valide',
    'refuse'
);


ALTER TYPE public."StatusDocumentRequest" OWNER TO postgres;

--
-- Name: StatusDossier; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusDossier" AS ENUM (
    'signale',
    'en_instruction',
    'jugement',
    'traite'
);


ALTER TYPE public."StatusDossier" OWNER TO postgres;

--
-- Name: StatusGroupSujet; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusGroupSujet" AS ENUM (
    'en_attente',
    'accepte',
    'refuse'
);


ALTER TYPE public."StatusGroupSujet" OWNER TO postgres;

--
-- Name: StatusJustification; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusJustification" AS ENUM (
    'soumis',
    'en_verification',
    'valide',
    'refuse'
);


ALTER TYPE public."StatusJustification" OWNER TO postgres;

--
-- Name: StatusReclamation; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusReclamation" AS ENUM (
    'soumise',
    'en_cours',
    'en_attente',
    'traitee',
    'refusee'
);


ALTER TYPE public."StatusReclamation" OWNER TO postgres;

--
-- Name: StatusSujet; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusSujet" AS ENUM (
    'propose',
    'valide',
    'reserve',
    'affecte',
    'termine',
    'refuse'
);


ALTER TYPE public."StatusSujet" OWNER TO postgres;

--
-- Name: StatusVoeu; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatusVoeu" AS ENUM (
    'en_attente',
    'accepte',
    'refuse'
);


ALTER TYPE public."StatusVoeu" OWNER TO postgres;

--
-- Name: SubmissionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SubmissionStatus" AS ENUM (
    'submitted',
    'under_review',
    'resolved',
    'rejected'
);


ALTER TYPE public."SubmissionStatus" OWNER TO postgres;

--
-- Name: SubmissionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SubmissionType" AS ENUM (
    'JUSTIFICATION',
    'RECLAMATION'
);


ALTER TYPE public."SubmissionType" OWNER TO postgres;

--
-- Name: TypeEnseignement; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TypeEnseignement" AS ENUM (
    'cours',
    'td',
    'tp',
    'online'
);


ALTER TYPE public."TypeEnseignement" OWNER TO postgres;

--
-- Name: TypeFichierAnnonce; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TypeFichierAnnonce" AS ENUM (
    'pdf',
    'image',
    'doc',
    'autre'
);


ALTER TYPE public."TypeFichierAnnonce" OWNER TO postgres;

--
-- Name: TypeProjet; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TypeProjet" AS ENUM (
    'recherche',
    'application',
    'etude',
    'innovation'
);


ALTER TYPE public."TypeProjet" OWNER TO postgres;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserStatus" AS ENUM (
    'active',
    'inactive',
    'suspended'
);


ALTER TYPE public."UserStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: academic_years; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.academic_years (
    id integer NOT NULL,
    name character varying(20) NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.academic_years OWNER TO postgres;

--
-- Name: academic_years_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.academic_years_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.academic_years_id_seq OWNER TO postgres;

--
-- Name: academic_years_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.academic_years_id_seq OWNED BY public.academic_years.id;


--
-- Name: alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alerts (
    id integer NOT NULL,
    titre character varying(255) NOT NULL,
    message text NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT now() NOT NULL,
    type public."AlertType" DEFAULT 'REQUEST'::public."AlertType" NOT NULL,
    is_read boolean DEFAULT false NOT NULL
);


ALTER TABLE public.alerts OWNER TO postgres;

--
-- Name: alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alerts_id_seq OWNER TO postgres;

--
-- Name: alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alerts_id_seq OWNED BY public.alerts.id;


--
-- Name: annonce_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.annonce_media (
    id integer NOT NULL,
    annonce_id integer NOT NULL,
    type character varying(50) NOT NULL,
    url text NOT NULL,
    thumbnail_url text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.annonce_media OWNER TO postgres;

--
-- Name: annonce_media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.annonce_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.annonce_media_id_seq OWNER TO postgres;

--
-- Name: annonce_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.annonce_media_id_seq OWNED BY public.annonce_media.id;


--
-- Name: annonce_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.annonce_types (
    id integer NOT NULL,
    nom_ar character varying(100),
    nom_en character varying(100),
    description_ar text,
    description_en text
);


ALTER TABLE public.annonce_types OWNER TO postgres;

--
-- Name: annonce_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.annonce_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.annonce_types_id_seq OWNER TO postgres;

--
-- Name: annonce_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.annonce_types_id_seq OWNED BY public.annonce_types.id;


--
-- Name: annonces; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.annonces (
    id integer NOT NULL,
    auteur_id integer NOT NULL,
    type_id integer,
    cible public."CibleAnnonce" DEFAULT 'tous'::public."CibleAnnonce" NOT NULL,
    date_publication date DEFAULT CURRENT_TIMESTAMP,
    date_expiration date,
    priorite public."PrioriteAnnonce" DEFAULT 'normale'::public."PrioriteAnnonce" NOT NULL,
    status public."StatusAnnonce" DEFAULT 'publie'::public."StatusAnnonce" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    titre_ar character varying(255) NOT NULL,
    titre_en character varying(255),
    contenu_ar text NOT NULL,
    contenu_en text
);


ALTER TABLE public.annonces OWNER TO postgres;

--
-- Name: annonces_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.annonces_documents (
    id integer NOT NULL,
    annonce_id integer NOT NULL,
    fichier text NOT NULL,
    type public."TypeFichierAnnonce" DEFAULT 'autre'::public."TypeFichierAnnonce" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description_ar text,
    description_en text
);


ALTER TABLE public.annonces_documents OWNER TO postgres;

--
-- Name: annonces_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.annonces_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.annonces_documents_id_seq OWNER TO postgres;

--
-- Name: annonces_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.annonces_documents_id_seq OWNED BY public.annonces_documents.id;


--
-- Name: annonces_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.annonces_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.annonces_id_seq OWNER TO postgres;

--
-- Name: annonces_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.annonces_id_seq OWNED BY public.annonces.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    event_key character varying(120) NOT NULL,
    action character varying(80) NOT NULL,
    entity_type character varying(80) NOT NULL,
    entity_id character varying(120),
    actor_user_id integer,
    actor_roles text[] DEFAULT ARRAY[]::text[],
    request_path text,
    request_method character varying(12),
    ip_address character varying(128),
    user_agent text,
    payload jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: campagne_affectation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campagne_affectation (
    id integer NOT NULL,
    niveau_source public."NiveauSource" NOT NULL,
    niveau_cible public."NiveauCible" NOT NULL,
    annee_universitaire character varying(20) NOT NULL,
    date_debut date NOT NULL,
    date_fin date NOT NULL,
    status public."StatusCampagne" DEFAULT 'brouillon'::public."StatusCampagne" NOT NULL,
    date_affectation timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    nom_ar character varying(150) NOT NULL,
    nom_en character varying(150)
);


ALTER TABLE public.campagne_affectation OWNER TO postgres;

--
-- Name: campagne_affectation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.campagne_affectation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.campagne_affectation_id_seq OWNER TO postgres;

--
-- Name: campagne_affectation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.campagne_affectation_id_seq OWNED BY public.campagne_affectation.id;


--
-- Name: campagne_specialites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campagne_specialites (
    id integer NOT NULL,
    campagne_id integer NOT NULL,
    specialite_id integer NOT NULL,
    quota integer,
    places_occupees integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.campagne_specialites OWNER TO postgres;

--
-- Name: campagne_specialites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.campagne_specialites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.campagne_specialites_id_seq OWNER TO postgres;

--
-- Name: campagne_specialites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.campagne_specialites_id_seq OWNED BY public.campagne_specialites.id;


--
-- Name: conseils_disciplinaires; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conseils_disciplinaires (
    id integer NOT NULL,
    date_reunion date NOT NULL,
    heure time without time zone,
    lieu character varying(150),
    annee_universitaire character varying(20) NOT NULL,
    status public."StatusConseil" DEFAULT 'planifie'::public."StatusConseil" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description_ar text,
    description_en text
);


ALTER TABLE public.conseils_disciplinaires OWNER TO postgres;

--
-- Name: conseils_disciplinaires_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conseils_disciplinaires_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conseils_disciplinaires_id_seq OWNER TO postgres;

--
-- Name: conseils_disciplinaires_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conseils_disciplinaires_id_seq OWNED BY public.conseils_disciplinaires.id;


--
-- Name: copies_remise; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.copies_remise (
    id integer NOT NULL,
    enseignement_id integer,
    session public."SessionExam" DEFAULT 'normale'::public."SessionExam" NOT NULL,
    date_exam date,
    date_remise date,
    nb_copies integer DEFAULT 0 NOT NULL,
    status public."StatusCopie" DEFAULT 'non_remis'::public."StatusCopie" NOT NULL,
    commentaire_ar text,
    commentaire_en text
);


ALTER TABLE public.copies_remise OWNER TO postgres;

--
-- Name: copies_remise_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.copies_remise_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.copies_remise_id_seq OWNER TO postgres;

--
-- Name: copies_remise_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.copies_remise_id_seq OWNED BY public.copies_remise.id;


--
-- Name: decisions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.decisions (
    id integer NOT NULL,
    niveau_sanction public."NiveauSanction",
    nom_ar character varying(150) NOT NULL,
    nom_en character varying(150),
    description_ar text,
    description_en text
);


ALTER TABLE public.decisions OWNER TO postgres;

--
-- Name: decisions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.decisions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.decisions_id_seq OWNER TO postgres;

--
-- Name: decisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.decisions_id_seq OWNED BY public.decisions.id;


--
-- Name: departements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departements (
    id integer NOT NULL,
    faculte_id integer,
    nom_ar character varying(200) NOT NULL,
    nom_en character varying(200)
);


ALTER TABLE public.departements OWNER TO postgres;

--
-- Name: departements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departements_id_seq OWNER TO postgres;

--
-- Name: departements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departements_id_seq OWNED BY public.departements.id;


--
-- Name: document_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_requests (
    id integer NOT NULL,
    enseignant_id integer,
    type_doc_id integer,
    date_demande date,
    status public."StatusDocumentRequest" DEFAULT 'en_attente'::public."StatusDocumentRequest" NOT NULL,
    traite_par integer,
    date_traitement date,
    document_url text,
    description_ar text,
    description_en text
);


ALTER TABLE public.document_requests OWNER TO postgres;

--
-- Name: document_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.document_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_requests_id_seq OWNER TO postgres;

--
-- Name: document_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.document_requests_id_seq OWNED BY public.document_requests.id;


--
-- Name: document_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_types (
    id integer NOT NULL,
    categorie public."CategorieDocument" NOT NULL,
    nom_ar character varying(150),
    nom_en character varying(150),
    description_ar text,
    description_en text
);


ALTER TABLE public.document_types OWNER TO postgres;

--
-- Name: document_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.document_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_types_id_seq OWNER TO postgres;

--
-- Name: document_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.document_types_id_seq OWNED BY public.document_types.id;


--
-- Name: dossiers_disciplinaires; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dossiers_disciplinaires (
    id integer NOT NULL,
    conseil_id integer,
    etudiant_id integer NOT NULL,
    enseignant_signalant integer,
    infraction_id integer NOT NULL,
    date_signal date NOT NULL,
    decision_id integer,
    date_decision date,
    status public."StatusDossier" DEFAULT 'signale'::public."StatusDossier" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    description_signal_ar text,
    description_signal_en text,
    remarque_decision_ar text,
    remarque_decision_en text,
    CONSTRAINT chk_instruction_has_conseil CHECK (((status <> 'en_instruction'::public."StatusDossier") OR (conseil_id IS NOT NULL))),
    CONSTRAINT chk_traite_has_decision CHECK (((status <> 'traite'::public."StatusDossier") OR (decision_id IS NOT NULL)))
);


ALTER TABLE public.dossiers_disciplinaires OWNER TO postgres;

--
-- Name: dossiers_disciplinaires_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dossiers_disciplinaires_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dossiers_disciplinaires_id_seq OWNER TO postgres;

--
-- Name: dossiers_disciplinaires_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dossiers_disciplinaires_id_seq OWNED BY public.dossiers_disciplinaires.id;


--
-- Name: enseignants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enseignants (
    id integer NOT NULL,
    user_id integer NOT NULL,
    grade_id integer,
    bureau character varying(50),
    date_recrutement date
);


ALTER TABLE public.enseignants OWNER TO postgres;

--
-- Name: enseignants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.enseignants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enseignants_id_seq OWNER TO postgres;

--
-- Name: enseignants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.enseignants_id_seq OWNED BY public.enseignants.id;


--
-- Name: enseignements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enseignements (
    id integer NOT NULL,
    enseignant_id integer,
    module_id integer,
    promo_id integer,
    type public."TypeEnseignement",
    annee_universitaire character varying(20),
    academic_year_id integer
);


ALTER TABLE public.enseignements OWNER TO postgres;

--
-- Name: enseignements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.enseignements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enseignements_id_seq OWNER TO postgres;

--
-- Name: enseignements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.enseignements_id_seq OWNED BY public.enseignements.id;


--
-- Name: etudiants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.etudiants (
    id integer NOT NULL,
    user_id integer NOT NULL,
    matricule character varying(50) NOT NULL,
    promo_id integer,
    moyenne numeric(4,2),
    annee_inscription smallint
);


ALTER TABLE public.etudiants OWNER TO postgres;

--
-- Name: etudiants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.etudiants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.etudiants_id_seq OWNER TO postgres;

--
-- Name: etudiants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.etudiants_id_seq OWNED BY public.etudiants.id;


--
-- Name: facultes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.facultes (
    id integer NOT NULL,
    nom_ar character varying(200) NOT NULL,
    nom_en character varying(200)
);


ALTER TABLE public.facultes OWNER TO postgres;

--
-- Name: facultes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.facultes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.facultes_id_seq OWNER TO postgres;

--
-- Name: facultes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.facultes_id_seq OWNED BY public.facultes.id;


--
-- Name: filieres; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.filieres (
    id integer NOT NULL,
    departement_id integer,
    nom_ar character varying(100) NOT NULL,
    nom_en character varying(100),
    description_ar text,
    description_en text
);


ALTER TABLE public.filieres OWNER TO postgres;

--
-- Name: filieres_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.filieres_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.filieres_id_seq OWNER TO postgres;

--
-- Name: filieres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.filieres_id_seq OWNED BY public.filieres.id;


--
-- Name: grades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grades (
    id integer NOT NULL,
    nom_ar character varying(100),
    nom_en character varying(100),
    description_ar text,
    description_en text
);


ALTER TABLE public.grades OWNER TO postgres;

--
-- Name: grades_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grades_id_seq OWNER TO postgres;

--
-- Name: grades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grades_id_seq OWNED BY public.grades.id;


--
-- Name: group_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_members (
    id integer NOT NULL,
    group_id integer NOT NULL,
    etudiant_id integer NOT NULL,
    role public."RoleMembre" DEFAULT 'membre'::public."RoleMembre" NOT NULL
);


ALTER TABLE public.group_members OWNER TO postgres;

--
-- Name: group_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.group_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_members_id_seq OWNER TO postgres;

--
-- Name: group_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.group_members_id_seq OWNED BY public.group_members.id;


--
-- Name: group_sujets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_sujets (
    id integer NOT NULL,
    group_id integer NOT NULL,
    sujet_id integer NOT NULL,
    ordre integer NOT NULL,
    status public."StatusGroupSujet" DEFAULT 'en_attente'::public."StatusGroupSujet" NOT NULL,
    valide_par_enseignant integer,
    date_reponse_enseignant timestamp(3) without time zone,
    commentaire_enseignant_ar text,
    commentaire_enseignant_en text
);


ALTER TABLE public.group_sujets OWNER TO postgres;

--
-- Name: group_sujets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.group_sujets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_sujets_id_seq OWNER TO postgres;

--
-- Name: group_sujets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.group_sujets_id_seq OWNED BY public.group_sujets.id;


--
-- Name: groups_pfe; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups_pfe (
    id integer NOT NULL,
    sujet_final_id integer,
    co_encadrant_id integer NOT NULL,
    date_creation date,
    date_affectation date,
    date_soutenance date,
    salle_soutenance character varying(50),
    note numeric(4,2),
    mention public."MentionPfe",
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    nom_ar character varying(100) NOT NULL,
    nom_en character varying(100),
    validation_finale boolean DEFAULT false NOT NULL,
    date_validation_finale timestamp(3) without time zone,
    valide_par_admin integer,
    commentaire_admin_ar text,
    commentaire_admin_en text
);


ALTER TABLE public.groups_pfe OWNER TO postgres;

--
-- Name: groups_pfe_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.groups_pfe_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.groups_pfe_id_seq OWNER TO postgres;

--
-- Name: groups_pfe_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.groups_pfe_id_seq OWNED BY public.groups_pfe.id;


--
-- Name: guest_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guest_submissions (
    id integer NOT NULL,
    type public."SubmissionType" NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    subject character varying(255),
    message text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public."SubmissionStatus" DEFAULT 'submitted'::public."SubmissionStatus" NOT NULL,
    admin_note text,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP CONSTRAINT "guest_submissions_updatedAt_not_null" NOT NULL
);


ALTER TABLE public.guest_submissions OWNER TO postgres;

--
-- Name: guest_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.guest_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.guest_submissions_id_seq OWNER TO postgres;

--
-- Name: guest_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.guest_submissions_id_seq OWNED BY public.guest_submissions.id;


--
-- Name: infractions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.infractions (
    id integer NOT NULL,
    gravite public."GraviteInfraction" NOT NULL,
    nom_ar character varying(150) NOT NULL,
    nom_en character varying(150),
    description_ar text,
    description_en text
);


ALTER TABLE public.infractions OWNER TO postgres;

--
-- Name: infractions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.infractions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.infractions_id_seq OWNER TO postgres;

--
-- Name: infractions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.infractions_id_seq OWNED BY public.infractions.id;


--
-- Name: justifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.justifications (
    id integer NOT NULL,
    etudiant_id integer NOT NULL,
    type_id integer NOT NULL,
    date_absence date NOT NULL,
    document text,
    date_depot date DEFAULT CURRENT_TIMESTAMP,
    status public."StatusJustification" DEFAULT 'soumis'::public."StatusJustification" NOT NULL,
    traite_par integer,
    date_traitement timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    motif_ar text,
    motif_en text,
    commentaire_admin_ar text,
    commentaire_admin_en text
);


ALTER TABLE public.justifications OWNER TO postgres;

--
-- Name: justifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.justifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.justifications_id_seq OWNER TO postgres;

--
-- Name: justifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.justifications_id_seq OWNED BY public.justifications.id;


--
-- Name: membres_conseil; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.membres_conseil (
    id integer NOT NULL,
    conseil_id integer NOT NULL,
    enseignant_id integer NOT NULL,
    role public."RoleConseil" DEFAULT 'membre'::public."RoleConseil" NOT NULL
);


ALTER TABLE public.membres_conseil OWNER TO postgres;

--
-- Name: membres_conseil_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.membres_conseil_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.membres_conseil_id_seq OWNER TO postgres;

--
-- Name: membres_conseil_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.membres_conseil_id_seq OWNED BY public.membres_conseil.id;


--
-- Name: modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modules (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    semestre smallint,
    specialite_id integer NOT NULL,
    volume_cours integer DEFAULT 0 NOT NULL,
    volume_td integer DEFAULT 0 NOT NULL,
    volume_tp integer DEFAULT 0 NOT NULL,
    credit integer DEFAULT 0 NOT NULL,
    coef numeric(4,2) DEFAULT 1 NOT NULL,
    nom_ar character varying(150) NOT NULL,
    nom_en character varying(150),
    description_ar text,
    description_en text
);


ALTER TABLE public.modules OWNER TO postgres;

--
-- Name: modules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.modules_id_seq OWNER TO postgres;

--
-- Name: modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.modules_id_seq OWNED BY public.modules.id;


--
-- Name: note_pfe; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.note_pfe (
    id integer NOT NULL,
    group_id integer NOT NULL,
    jury_id integer NOT NULL,
    note numeric(4,2) NOT NULL,
    observation_ar text,
    observation_en text,
    date_saisie timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.note_pfe OWNER TO postgres;

--
-- Name: note_pfe_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.note_pfe_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.note_pfe_id_seq OWNER TO postgres;

--
-- Name: note_pfe_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.note_pfe_id_seq OWNED BY public.note_pfe.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    nom character varying(100),
    description text,
    module character varying(100),
    action character varying(50)
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: pfe_compte_rendu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pfe_compte_rendu (
    id integer NOT NULL,
    group_id integer NOT NULL,
    enseignant_id integer NOT NULL,
    date_reunion timestamp(3) without time zone NOT NULL,
    contenu text NOT NULL,
    actions_decidees text,
    prochaine_reunion timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pfe_compte_rendu OWNER TO postgres;

--
-- Name: pfe_compte_rendu_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pfe_compte_rendu_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pfe_compte_rendu_id_seq OWNER TO postgres;

--
-- Name: pfe_compte_rendu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pfe_compte_rendu_id_seq OWNED BY public.pfe_compte_rendu.id;


--
-- Name: pfe_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pfe_config (
    id integer NOT NULL,
    nom_config character varying(100) NOT NULL,
    valeur character varying(50) NOT NULL,
    description_ar text,
    description_en text,
    annee_universitaire character varying(20) NOT NULL,
    created_by integer,
    created_at timestamp(3) without time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pfe_config OWNER TO postgres;

--
-- Name: pfe_config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pfe_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pfe_config_id_seq OWNER TO postgres;

--
-- Name: pfe_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pfe_config_id_seq OWNED BY public.pfe_config.id;


--
-- Name: pfe_jury; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pfe_jury (
    id integer NOT NULL,
    group_id integer,
    enseignant_id integer,
    role public."RoleJury"
);


ALTER TABLE public.pfe_jury OWNER TO postgres;

--
-- Name: pfe_jury_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pfe_jury_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pfe_jury_id_seq OWNER TO postgres;

--
-- Name: pfe_jury_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pfe_jury_id_seq OWNED BY public.pfe_jury.id;


--
-- Name: pfe_sujets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pfe_sujets (
    id integer NOT NULL,
    enseignant_id integer NOT NULL,
    promo_id integer NOT NULL,
    type_projet public."TypeProjet" DEFAULT 'application'::public."TypeProjet" NOT NULL,
    status public."StatusSujet" DEFAULT 'propose'::public."StatusSujet" NOT NULL,
    annee_universitaire character varying(20) NOT NULL,
    max_grps integer DEFAULT 1 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    titre_ar character varying(255) NOT NULL,
    titre_en character varying(255),
    description_ar text NOT NULL,
    description_en text,
    keywords_ar text,
    keywords_en text,
    workplan_ar text,
    workplan_en text,
    bibliographie_ar text,
    bibliographie_en text,
    valide_par integer,
    date_validation timestamp(3) without time zone,
    commentaire_admin_ar text,
    commentaire_admin_en text,
    assignment_status character varying(30) DEFAULT 'draft'::character varying NOT NULL,
    finalized_at timestamp(3) without time zone,
    CONSTRAINT pfe_sujets_assignment_status_check CHECK (((assignment_status)::text = ANY ((ARRAY['draft'::character varying, 'assigned'::character varying, 'finalized'::character varying])::text[])))
);


ALTER TABLE public.pfe_sujets OWNER TO postgres;

--
-- Name: pfe_sujets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pfe_sujets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pfe_sujets_id_seq OWNER TO postgres;

--
-- Name: pfe_sujets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pfe_sujets_id_seq OWNED BY public.pfe_sujets.id;


--
-- Name: promos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promos (
    id integer NOT NULL,
    specialite_id integer,
    annee_universitaire character varying(20),
    section character varying(50),
    nom_ar character varying(100),
    nom_en character varying(100),
    academic_year_id integer
);


ALTER TABLE public.promos OWNER TO postgres;

--
-- Name: promos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promos_id_seq OWNER TO postgres;

--
-- Name: promos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promos_id_seq OWNED BY public.promos.id;


--
-- Name: reclamation_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reclamation_types (
    id integer NOT NULL,
    nom_ar character varying(150),
    nom_en character varying(150),
    description_ar text,
    description_en text,
    code character varying(60)
);


ALTER TABLE public.reclamation_types OWNER TO postgres;

--
-- Name: reclamation_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reclamation_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reclamation_types_id_seq OWNER TO postgres;

--
-- Name: reclamation_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reclamation_types_id_seq OWNED BY public.reclamation_types.id;


--
-- Name: reclamations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reclamations (
    id integer NOT NULL,
    etudiant_id integer NOT NULL,
    type_id integer NOT NULL,
    priorite public."PrioriteReclamation" DEFAULT 'normale'::public."PrioriteReclamation" NOT NULL,
    date_reclamation date DEFAULT CURRENT_TIMESTAMP,
    status public."StatusReclamation" DEFAULT 'soumise'::public."StatusReclamation" NOT NULL,
    traite_par integer,
    date_traitement timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    objet_ar character varying(255) NOT NULL,
    objet_en character varying(255),
    description_ar text NOT NULL,
    description_en text,
    reponse_ar text,
    reponse_en text
);


ALTER TABLE public.reclamations OWNER TO postgres;

--
-- Name: reclamations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reclamations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reclamations_id_seq OWNER TO postgres;

--
-- Name: reclamations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reclamations_id_seq OWNED BY public.reclamations.id;


--
-- Name: request_workflow_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.request_workflow_history (
    id bigint NOT NULL,
    request_category character varying(32) NOT NULL,
    request_id integer NOT NULL,
    stage character varying(64) NOT NULL,
    action character varying(64) NOT NULL,
    actor_user_id integer,
    actor_roles text[] DEFAULT ARRAY[]::text[],
    note text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.request_workflow_history OWNER TO postgres;

--
-- Name: request_workflow_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.request_workflow_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.request_workflow_history_id_seq OWNER TO postgres;

--
-- Name: request_workflow_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.request_workflow_history_id_seq OWNED BY public.request_workflow_history.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_permissions_id_seq OWNER TO postgres;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    nom character varying(100),
    description text
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_settings (
    id integer DEFAULT 1 NOT NULL,
    university_name_ar character varying(200),
    university_name_en character varying(200),
    university_name_fr character varying(200),
    university_subtitle_ar character varying(255),
    university_subtitle_en character varying(255),
    university_subtitle_fr character varying(255),
    city_ar character varying(120),
    city_en character varying(120),
    city_fr character varying(120),
    hero_students_stat character varying(30),
    hero_teachers_stat character varying(30),
    hero_courses_stat character varying(30),
    hero_satisfaction_stat character varying(30),
    banner_students_stat character varying(30),
    banner_teachers_stat character varying(30),
    banner_faculties_stat character varying(30),
    banner_national_rank_stat character varying(30),
    statistics_students_stat character varying(30),
    statistics_teachers_stat character varying(30),
    statistics_projects_stat character varying(30),
    statistics_satisfaction_stat character varying(30),
    statistics_quote_ar text,
    statistics_quote_en text,
    statistics_quote_fr text,
    about_line1_ar text,
    about_line1_en text,
    about_line1_fr text,
    about_line2_ar text,
    about_line2_en text,
    about_line2_fr text,
    contact_phone character varying(60),
    contact_email character varying(150),
    contact_address_ar character varying(255),
    contact_address_en character varying(255),
    contact_address_fr character varying(255),
    logo_url character varying(255),
    hero_background_url character varying(255),
    banner_background_url character varying(255),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    primary_color character varying(20),
    secondary_color character varying(20),
    sidebar_color character varying(20),
    system_email character varying(150),
    maintenance_mode boolean DEFAULT false NOT NULL
);


ALTER TABLE public.site_settings OWNER TO postgres;

--
-- Name: specialites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.specialites (
    id integer NOT NULL,
    filiere_id integer,
    niveau public."Niveau",
    nom_ar character varying(100) NOT NULL,
    nom_en character varying(100)
);


ALTER TABLE public.specialites OWNER TO postgres;

--
-- Name: specialites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.specialites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.specialites_id_seq OWNER TO postgres;

--
-- Name: specialites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.specialites_id_seq OWNED BY public.specialites.id;


--
-- Name: student_justification_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_justification_documents (
    id integer NOT NULL,
    justification_id integer NOT NULL,
    etudiant_id integer NOT NULL,
    file_path text NOT NULL,
    file_name character varying(255) NOT NULL,
    mime_type character varying(120),
    file_size bigint,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.student_justification_documents OWNER TO postgres;

--
-- Name: student_justification_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_justification_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_justification_documents_id_seq OWNER TO postgres;

--
-- Name: student_justification_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_justification_documents_id_seq OWNED BY public.student_justification_documents.id;


--
-- Name: student_reclamation_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_reclamation_documents (
    id integer NOT NULL,
    reclamation_id integer NOT NULL,
    etudiant_id integer NOT NULL,
    file_path text NOT NULL,
    file_name character varying(255) NOT NULL,
    mime_type character varying(120),
    file_size bigint,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.student_reclamation_documents OWNER TO postgres;

--
-- Name: student_reclamation_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_reclamation_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_reclamation_documents_id_seq OWNER TO postgres;

--
-- Name: student_reclamation_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_reclamation_documents_id_seq OWNED BY public.student_reclamation_documents.id;


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.submissions (
    id integer NOT NULL,
    type public."SubmissionType" NOT NULL,
    user_id integer NOT NULL,
    subject character varying(255),
    message text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public."SubmissionStatus" DEFAULT 'submitted'::public."SubmissionStatus" NOT NULL,
    admin_note text,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP CONSTRAINT "submissions_updatedAt_not_null" NOT NULL
);


ALTER TABLE public.submissions OWNER TO postgres;

--
-- Name: submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.submissions_id_seq OWNER TO postgres;

--
-- Name: submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.submissions_id_seq OWNED BY public.submissions.id;


--
-- Name: teacher_announcement_modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_announcement_modules (
    annonce_id integer NOT NULL,
    module_id integer,
    scheduled_for timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.teacher_announcement_modules OWNER TO postgres;

--
-- Name: teacher_course_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_course_documents (
    id integer NOT NULL,
    enseignant_id integer NOT NULL,
    module_id integer,
    annonce_id integer,
    title character varying(255) NOT NULL,
    file_path text NOT NULL,
    mime_type character varying(120),
    file_size bigint,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.teacher_course_documents OWNER TO postgres;

--
-- Name: teacher_course_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.teacher_course_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teacher_course_documents_id_seq OWNER TO postgres;

--
-- Name: teacher_course_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.teacher_course_documents_id_seq OWNED BY public.teacher_course_documents.id;


--
-- Name: teacher_reclamation_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_reclamation_notes (
    id integer NOT NULL,
    reclamation_id integer NOT NULL,
    enseignant_id integer NOT NULL,
    note text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.teacher_reclamation_notes OWNER TO postgres;

--
-- Name: teacher_reclamation_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.teacher_reclamation_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teacher_reclamation_notes_id_seq OWNER TO postgres;

--
-- Name: teacher_reclamation_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.teacher_reclamation_notes_id_seq OWNED BY public.teacher_reclamation_notes.id;


--
-- Name: type_absence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.type_absence (
    id integer NOT NULL,
    nom_ar character varying(100),
    nom_en character varying(100),
    description_ar text,
    description_en text,
    code character varying(60)
);


ALTER TABLE public.type_absence OWNER TO postgres;

--
-- Name: type_absence_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.type_absence_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.type_absence_id_seq OWNER TO postgres;

--
-- Name: type_absence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.type_absence_id_seq OWNED BY public.type_absence.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_roles_id_seq OWNER TO postgres;

--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    sexe public."Sexe",
    date_naissance date,
    telephone character varying(20),
    photo character varying(255),
    email character varying(150) NOT NULL,
    password character varying(255) NOT NULL,
    first_use boolean DEFAULT true NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    reset_token character varying(255),
    reset_token_expire timestamp(3) without time zone,
    status public."UserStatus" DEFAULT 'active'::public."UserStatus" NOT NULL,
    last_login timestamp(3) without time zone,
    login_attempts integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone,
    lock_until timestamp(3) without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: voeux; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.voeux (
    id integer NOT NULL,
    campagne_id integer,
    etudiant_id integer,
    specialite_id integer,
    ordre integer NOT NULL,
    status public."StatusVoeu" DEFAULT 'en_attente'::public."StatusVoeu" NOT NULL,
    date_saisie timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.voeux OWNER TO postgres;

--
-- Name: voeux_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.voeux_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.voeux_id_seq OWNER TO postgres;

--
-- Name: voeux_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.voeux_id_seq OWNED BY public.voeux.id;


--
-- Name: academic_years id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_years ALTER COLUMN id SET DEFAULT nextval('public.academic_years_id_seq'::regclass);


--
-- Name: alerts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts ALTER COLUMN id SET DEFAULT nextval('public.alerts_id_seq'::regclass);


--
-- Name: annonce_media id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annonce_media ALTER COLUMN id SET DEFAULT nextval('public.annonce_media_id_seq'::regclass);


--
-- Name: annonce_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annonce_types ALTER COLUMN id SET DEFAULT nextval('public.annonce_types_id_seq'::regclass);


--
-- Name: annonces id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annonces ALTER COLUMN id SET DEFAULT nextval('public.annonces_id_seq'::regclass);


--
-- Name: annonces_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annonces_documents ALTER COLUMN id SET DEFAULT nextval('public.annonces_documents_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: campagne_affectation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campagne_affectation ALTER COLUMN id SET DEFAULT nextval('public.campagne_affectation_id_seq'::regclass);


--
-- Name: campagne_specialites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campagne_specialites ALTER COLUMN id SET DEFAULT nextval('public.campagne_specialites_id_seq'::regclass);


--
-- Name: conseils_disciplinaires id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conseils_disciplinaires ALTER COLUMN id SET DEFAULT nextval('public.conseils_disciplinaires_id_seq'::regclass);


--
-- Name: copies_remise id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.copies_remise ALTER COLUMN id SET DEFAULT nextval('public.copies_remise_id_seq'::regclass);


--
-- Name: decisions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.decisions ALTER COLUMN id SET DEFAULT nextval('public.decisions_id_seq'::regclass);


--
-- Name: departements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departements ALTER COLUMN id SET DEFAULT nextval('public.departements_id_seq'::regclass);


--
-- Name: document_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_requests ALTER COLUMN id SET DEFAULT nextval('public.document_requests_id_seq'::regclass);


--
-- Name: document_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_types ALTER COLUMN id SET DEFAULT nextval('public.document_types_id_seq'::regclass);


--
-- Name: dossiers_disciplinaires id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossiers_disciplinaires ALTER COLUMN id SET DEFAULT nextval('public.dossiers_disciplinaires_id_seq'::regclass);


--
-- Name: enseignants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enseignants ALTER COLUMN id SET DEFAULT nextval('public.enseignants_id_seq'::regclass);


--
-- Name: enseignements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enseignements ALTER COLUMN id SET DEFAULT nextval('public.enseignements_id_seq'::regclass);


--
-- Name: etudiants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etudiants ALTER COLUMN id SET DEFAULT nextval('public.etudiants_id_seq'::regclass);


--
-- Name: facultes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facultes ALTER COLUMN id SET DEFAULT nextval('public.facultes_id_seq'::regclass);


--
-- Name: filieres id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.filieres ALTER COLUMN id SET DEFAULT nextval('public.filieres_id_seq'::regclass);


--
-- Name: grades id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades ALTER COLUMN id SET DEFAULT nextval('public.grades_id_seq'::regclass);


--
-- Name: group_members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members ALTER COLUMN id SET DEFAULT nextval('public.group_members_id_seq'::regclass);


--
-- Name: group_sujets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_sujets ALTER COLUMN id SET DEFAULT nextval('public.group_sujets_id_seq'::regclass);


--
-- Name: groups_pfe id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups_pfe ALTER COLUMN id SET DEFAULT nextval('public.groups_pfe_id_seq'::regclass);


--
-- Name: guest_submissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_submissions ALTER COLUMN id SET DEFAULT nextval('public.guest_submissions_id_seq'::regclass);


--
-- Name: infractions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.infractions ALTER COLUMN id SET DEFAULT nextval('public.infractions_id_seq'::regclass);


--
-- Name: justifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.justifications ALTER COLUMN id SET DEFAULT nextval('public.justifications_id_seq'::regclass);


--
-- Name: membres_conseil id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membres_conseil ALTER COLUMN id SET DEFAULT nextval('public.membres_conseil_id_seq'::regclass);


--
-- Name: modules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules ALTER COLUMN id SET DEFAULT nextval('public.modules_id_seq'::regclass);


--
-- Name: note_pfe id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.note_pfe ALTER COLUMN id SET DEFAULT nextval('public.note_pfe_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: pfe_compte_rendu id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pfe_compte_rendu ALTER COLUMN id SET DEFAULT nextval('public.pfe_compte_rendu_id_seq'::regclass);


--
-- Name: pfe_config id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pfe_config ALTER COLUMN id SET DEFAULT nextval('public.pfe_config_id_seq'::regclass);


--
-- Name: pfe_jury id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pfe_jury ALTER COLUMN id SET DEFAULT nextval('public.pfe_jury_id_seq'::regclass);


--
-- Name: pfe_sujets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pfe_sujets ALTER COLUMN id SET DEFAULT nextval('public.pfe_sujets_id_seq'::regclass);


--
-- Name: promos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promos ALTER COLUMN id SET DEFAULT nextval('public.promos_id_seq'::regclass);


--
-- Name: reclamation_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reclamation_types ALTER COLUMN id SET DEFAULT nextval('public.reclamation_types_id_seq'::regclass);


--
-- Name: reclamations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reclamations ALTER COLUMN id SET DEFAULT nextval('public.reclamations_id_seq'::regclass);


--
-- Name: request_workflow_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_workflow_history ALTER COLUMN id SET DEFAULT nextval('public.request_workflow_history_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: specialites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specialites ALTER COLUMN id SET DEFAULT nextval('public.specialites_id_seq'::regclass);


--
-- Name: student_justification_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_justification_documents ALTER COLUMN id SET DEFAULT nextval('public.student_justification_documents_id_seq'::regclass);


--
-- Name: student_reclamation_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_reclamation_documents ALTER COLUMN id SET DEFAULT nextval('public.student_reclamation_documents_id_seq'::regclass);


--
-- Name: submissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions ALTER COLUMN id SET DEFAULT nextval('public.submissions_id_seq'::regclass);


--
-- Name: teacher_course_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_course_documents ALTER COLUMN id SET DEFAULT nextval('public.teacher_course_documents_id_seq'::regclass);


--
-- Name: teacher_reclamation_notes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_reclamation_notes ALTER COLUMN id SET DEFAULT nextval('public.teacher_reclamation_notes_id_seq'::regclass);


--
-- Name: type_absence id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_absence ALTER COLUMN id SET DEFAULT nextval('public.type_absence_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: voeux id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voeux ALTER COLUMN id SET DEFAULT nextval('public.voeux_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
1ccc01c0-a852-48a2-b978-e32f9952855d	21f4833f264ee4da92c721bf6ea12e83211598bb91cfe3da52925edacbcb4763	2026-04-19 14:10:28.244705+01	20260309140906_init_41_tables		\N	2026-04-19 14:10:28.244705+01	0
994668e1-4f10-40d2-a8ba-eae83c44ce0e	9b5ada7a4c271892f215302af12245f5a33a92d5d8500b74eadfcb9c20caa1a8	2026-04-19 14:10:32.132594+01	20260418000000_collapse_to_three_roles		\N	2026-04-19 14:10:32.132594+01	0
67bdcc42-792f-4727-8de4-5759c8f85df5	54687cd79ff9f616cc5f9f20cfe50f68b1ee5277ad844e7a9981e2e7abb04a80	2026-04-19 14:10:36.578582+01	20260418010000_add_alerts		\N	2026-04-19 14:10:36.578582+01	0
26fd8301-322a-4be8-82d5-9d44d8fe9664	8c4c6cf19114a4b2bf04c121578e572f6d89430cb86753c0151cd6952718ed48	2026-04-19 14:11:21.48451+01	20260419000000_disciplinary_constraints	\N	\N	2026-04-19 14:11:21.429737+01	1
35d44166-608c-43c7-bd0d-ea5f67ee10b0	2e5385aa9528b82bb1bc1515da170da7611b5c63b47fc6feec570b898303e182	2026-04-20 01:11:54.835152+01	20260420010000_event_alerts	\N	\N	2026-04-20 01:11:54.757484+01	1
4e9f7022-abbf-42fb-beb0-a7bcb50b22ef	cf2fc19059b8958b6bd8ebdf25e15790a369450eefc988b2b2c0c20dc81b96ef	2026-04-23 15:26:21.511412+01	20260422000000_align_pfe_sujets_bilingual	\N	\N	2026-04-23 15:26:21.216954+01	1
2ddccb6f-79f4-4b8a-b81b-8829b244e69e	57fec09189f4c4e72102e90e46b46b2486d5a7d302e1f2a66ed2698aa1a8b62b	2026-04-23 15:26:21.579026+01	20260423000000_add_group_sujets_teacher_validation	\N	\N	2026-04-23 15:26:21.513643+01	1
f9de3f83-4d01-4b28-aa40-6ad1c4e9f229	f0107b20305299fc23829fd8a5624fff298d26617c5ad471a3c3f28a07c96fcb	2026-04-28 13:26:44.83708+01	20260424000000_request_type_labels	\N	\N	2026-04-28 13:26:44.796623+01	1
ee1c97dd-68ec-4878-9ac4-0c5a8fe9087c	71ab0e791e824ad3362e96020046c97981288113770173583b4f801d079683a3	2026-04-28 13:26:45.037931+01	20260425000000_pfe_assignment_lock	\N	\N	2026-04-28 13:26:44.83853+01	1
43b5509c-11d7-46c4-b796-029ebbf1c98f	d191c380c63b2afd602e57a99367b3c6ff5ebbc2b9a135c4c6c521f12e770924	2026-04-28 13:26:45.084175+01	20260427000000_add_online_to_type_enseignement	\N	\N	2026-04-28 13:26:45.039661+01	1
0ba16af2-11ce-47d7-81cd-37baf801a447	5271c4cce1243502585913a933c9f1fcde089cd357f398ef6552906276e8c5e6	2026-04-28 13:26:45.333525+01	20260427000100_academic_year_and_require_matricule	\N	\N	2026-04-28 13:26:45.085823+01	1
91485119-2780-4efb-867e-1de783b89bed	7f06ef43cd2455544b0f9a13a16637630d15b814297d0ed1d801712b3fc3de3a	2026-04-28 13:26:45.341484+01	20260427100000_status_sujet_add_refuse	\N	\N	2026-04-28 13:26:45.335067+01	1
\.


--
-- Data for Name: academic_years; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.academic_years (id, name, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alerts (id, titre, message, created_by, created_at, type, is_read) FROM stdin;
1	Test Alert	mark read flow	7	2026-04-20 00:15:02.572	REQUEST	t
4	Disciplinary Decision	Decision: Temporary Sanction\nExplanation: Decision integration test	7	2026-04-20 00:20:11.755	DECISION	t
3	Disciplinary Meeting Scheduled	Date: 2026-05-10 00:00\nLocation: Room A\nDetails: Integration meeting test	7	2026-04-20 00:17:26.651	MEETING	t
5	Disciplinary Decision	Decision: Temporary Sanction\nExplanation: Decision integration test	5	2026-04-20 00:20:11.757	DECISION	t
2	Document Request Update	Status: approved\nRequest: Work Certificate\nMessage: Validated for teacher	5	2026-04-20 00:16:10.523	REQUEST	t
7	Document Request Update	Status: approved\nRequest: Pedagogical Participation Attestation	6	2026-04-22 11:00:24.048	REQUEST	t
6	Document Request Update	Status: approved\nRequest: Teaching Assignment Certificate	5	2026-04-22 10:55:20.831	REQUEST	t
8	Affectation campaign is open	Campaign "university" is now open. Submit your voeux before 2026-05-09.\nReference ID: 1	9	2026-04-25 12:37:13.836	REQUEST	f
10	Affectation campaign is open	Campaign "university" is now open. Submit your voeux before 2026-05-09.\nReference ID: 1	7	2026-04-25 12:37:13.865	REQUEST	t
11	Document Request Update	Status: approved\nRequest: Teaching Assignment Certificate\nReference ID: 6	5	2026-04-25 16:02:42.826	REQUEST	t
12	Document Request Update	Status: approved\nRequest: Work Certificate\nReference ID: 7	5	2026-04-25 16:05:38.629	REQUEST	t
13	Affectation campaign is open	Campaign ",kjhkjk" is now open. Submit your voeux before 2026-04-28.\nReference ID: 2	9	2026-04-26 09:22:54.754	REQUEST	f
15	Affectation campaign is open	Campaign ",kjhkjk" is now open. Submit your voeux before 2026-04-28.\nReference ID: 2	7	2026-04-26 09:22:54.765	REQUEST	t
16	Nouveau dossier disciplinaire	Un nouveau signalement a été créé (dossier #6).	1	2026-04-26 09:48:27.299	REQUEST	t
17	Document Request Update	Status: approved\nRequest: Teaching Assignment Certificate\nReference ID: 8	5	2026-04-26 12:14:10.625	REQUEST	t
14	Affectation campaign is open	Campaign ",kjhkjk" is now open. Submit your voeux before 2026-04-28.\nReference ID: 2	8	2026-04-26 09:22:54.761	REQUEST	t
9	Affectation campaign is open	Campaign "university" is now open. Submit your voeux before 2026-05-09.\nReference ID: 1	8	2026-04-25 12:37:13.86	REQUEST	t
18	Affectation result	You have been affected to "SIC" in campaign ",kjhkjk".\nReference ID: 2	7	2026-04-26 22:13:03.505	DECISION	f
19	Affectation result	The campaign ",kjhkjk" is complete. Unfortunately, none of your voeux could be honored. Please contact administration.\nReference ID: 2	8	2026-04-26 22:13:03.513	DECISION	t
\.


--
-- Data for Name: annonce_media; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.annonce_media (id, annonce_id, type, url, thumbnail_url, created_at) FROM stdin;
\.


--
-- Data for Name: annonce_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.annonce_types (id, nom_ar, nom_en, description_ar, description_en) FROM stdin;
1	Events	Events	\N	\N
2	Administrative	Administrative	\N	\N
\.


--
-- Data for Name: annonces; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.annonces (id, auteur_id, type_id, cible, date_publication, date_expiration, priorite, status, created_at, updated_at, titre_ar, titre_en, contenu_ar, contenu_en) FROM stdin;
1	1	1	tous	2026-04-20	\N	normale	publie	2026-04-20 00:40:17.384	2026-04-20 00:40:17.384	test	test	test	test
2	1	2	tous	2026-04-25	\N	normale	publie	2026-04-25 06:37:13.325	2026-04-25 06:37:13.325	jjjj	jjjj	jjjj	jjjj
\.


--
-- Data for Name: annonces_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.annonces_documents (id, annonce_id, fichier, type, created_at, description_ar, description_en) FROM stdin;
1	2	/uploads/others/annonces/1777099032943-ff909a2ff8f0ac11-Screen_Recording_2025-11-11_190944.mp4	autre	2026-04-25 06:37:13.349	\N	\N
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, event_key, action, entity_type, entity_id, actor_user_id, actor_roles, request_path, request_method, ip_address, user_agent, payload, created_at) FROM stdin;
1	requests.reclamation.created	create	reclamation	8	7	{etudiant}	/api/v1/requests/reclamations	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"typeId": 5, "etudiantId": 1}	2026-04-25 22:53:09.305042
2	requests.reclamation.decision	approve	reclamation	8	1	{admin}	/api/v1/requests/admin/reclamations/8/decision	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"status": "traitee", "decision": "approve"}	2026-04-25 22:53:35.823215
3	auth.login.success	login	user	1	1	{admin}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "admin@univ-tiaret.dz"}	2026-04-26 14:58:36.064205
4	auth.login.success	login	user	1	1	{admin}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "admin@univ-tiaret.dz"}	2026-04-26 14:59:47.905424
5	auth.login.success	login	user	5	5	{enseignant}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "teacher@univ-tiaret.dz"}	2026-04-26 15:00:44.586432
6	auth.login.success	login	user	1	1	{admin}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "admin@univ-tiaret.dz"}	2026-04-26 15:11:08.050524
7	auth.login.success	login	user	1	1	{admin}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "admin@univ-tiaret.dz"}	2026-04-26 16:16:01.04678
8	auth.login.success	login	user	5	5	{enseignant}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "teacher@univ-tiaret.dz"}	2026-04-26 16:34:39.299517
9	auth.login.success	login	user	1	1	{admin}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "admin@univ-tiaret.dz"}	2026-04-26 23:01:50.439362
10	requests.guest_submission.decision	reject	guest_submission	1	1	{admin}	/api/v1/requests/admin/guest-submissions/1/decision	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"status": "rejected", "decision": "reject"}	2026-04-26 23:02:06.302039
11	requests.guest_submission.decision	reject	guest_submission	2	1	{admin}	/api/v1/requests/admin/guest-submissions/2/decision	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"status": "rejected", "decision": "reject"}	2026-04-26 23:02:17.978523
12	auth.login.failure	login_failed	user	\N	\N	{}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "belkacem@gmail.com", "reason": "invalid_credentials"}	2026-04-26 23:04:08.601358
13	auth.login.failure	login_failed	user	\N	\N	{}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "belkacem@gmail.com", "reason": "invalid_credentials"}	2026-04-26 23:04:36.998299
14	auth.login.success	login	user	8	8	{etudiant}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "student2@univ-tiaret.dz"}	2026-04-26 23:06:20.680868
15	auth.login.success	login	user	8	8	{etudiant}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "student2@univ-tiaret.dz"}	2026-04-26 23:06:21.126964
16	auth.login.success	login	user	8	8	{etudiant}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "student2@univ-tiaret.dz"}	2026-04-26 23:10:30.644713
17	auth.login.success	login	user	1	1	{admin}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "admin@univ-tiaret.dz"}	2026-04-27 07:54:41.692399
18	auth.login.success	login	user	1	1	{admin}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "admin@univ-tiaret.dz"}	2026-04-27 08:34:33.60493
19	auth.login.failure	login_failed	user	\N	\N	{}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "teacher@univ-tiaret.dz", "reason": "invalid_credentials"}	2026-04-27 08:48:21.449864
20	auth.login.success	login	user	5	5	{enseignant}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "teacher@univ-tiaret.dz"}	2026-04-27 08:48:23.607751
21	auth.login.failure	login_failed	user	\N	\N	{}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "student3@univ-tiaret.dz", "reason": "invalid_credentials"}	2026-04-27 08:53:00.884878
22	auth.login.success	login	user	8	8	{etudiant}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "student2@univ-tiaret.dz"}	2026-04-27 08:53:13.702327
23	auth.login.success	login	user	6	6	{enseignant}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "teacher2@univ-tiaret.dz"}	2026-04-27 08:59:30.642697
24	auth.login.success	login	user	1	1	{admin}	/login	POST	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	{"email": "admin@univ-tiaret.dz"}	2026-04-27 09:00:09.474873
\.


--
-- Data for Name: campagne_affectation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.campagne_affectation (id, niveau_source, niveau_cible, annee_universitaire, date_debut, date_fin, status, date_affectation, created_at, nom_ar, nom_en) FROM stdin;
1	L3	M1	2025-2026	2026-05-07	2026-05-09	fermee	\N	2026-04-24 07:57:33.35	الجامعة	university
2	L3	M1	2025-2026	2026-04-25	2026-04-28	terminee	2026-04-26 22:13:03.483	2026-04-26 09:22:06.257	نعغفلغفغت	,kjhkjk
\.


--
-- Data for Name: campagne_specialites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.campagne_specialites (id, campagne_id, specialite_id, quota, places_occupees) FROM stdin;
2	2	11	1	1
4	1	3	\N	0
\.


--
-- Data for Name: conseils_disciplinaires; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conseils_disciplinaires (id, date_reunion, heure, lieu, annee_universitaire, status, created_at, description_ar, description_en) FROM stdin;
\.


--
-- Data for Name: copies_remise; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.copies_remise (id, enseignement_id, session, date_exam, date_remise, nb_copies, status, commentaire_ar, commentaire_en) FROM stdin;
\.


--
-- Data for Name: decisions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.decisions (id, niveau_sanction, nom_ar, nom_en, description_ar, description_en) FROM stdin;
1	avertissement	Temporary Sanction	Temporary Sanction	integration test	integration test
2	\N	Only English Label	Only English Label	\N	validation
3	\N	Only English Label	Only English Label	\N	validation
4	avertissement	تحذير شفهي	Verbal Warning	Formal oral warning issued by the responsible authority.	Formal oral warning issued by the responsible authority.
5	avertissement	إنذار كتابي	Written Warning	Formal written warning recorded in the student file.	Formal written warning recorded in the student file.
6	blame	توبيخ مسجل في الملف	Blame on File	Official written reprimand permanently recorded in the student's academic file.	Official written reprimand permanently recorded in the student's academic file.
7	avertissement	صفر في الامتحان	Zero on Exam	Nullification of the examination result, applied exclusively in cases of exam fraud.	Nullification of the examination result, applied exclusively in cases of exam fraud.
8	suspension	الإقصاء من الوحدة	Module Exclusion	Temporary exclusion from a specific module for the current semester.	Temporary exclusion from a specific module for the current semester.
9	suspension	الإقصاء لفصل دراسي	Semester Exclusion	Exclusion from all activities for the duration of one semester.	Exclusion from all activities for the duration of one semester.
10	suspension	الإقصاء لسنة دراسية	Year Exclusion	Exclusion from all activities for the duration of one academic year.	Exclusion from all activities for the duration of one academic year.
11	exclusion	الإقصاء لسنتين دراسيتين	Two-Year Exclusion	Exclusion from all activities for a period of two academic years.	Exclusion from all activities for a period of two academic years.
12	exclusion	الطرد النهائي	Institution-Wide Exclusion	Permanent exclusion from the institution, applicable across all higher-education establishments.	Permanent exclusion from the institution, applicable across all higher-education establishments.
\.


--
-- Data for Name: departements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departements (id, faculte_id, nom_ar, nom_en) FROM stdin;
9	5	الإعلام الآلي	Computer Science
10	5	الفيزياء	Physics
11	6	الإعلام الآلي	Computer Science
12	6	الفيزياء	Physics
1	1	Informatique	Informatique
2	1	Physique	Physique
3	2	Informatique	Informatique
4	2	Physique	Physique
5	3	Informatique	Informatique
6	3	Physique	Physique
7	4	Informatique	Informatique
8	4	Physique	Physique
\.


--
-- Data for Name: document_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_requests (id, enseignant_id, type_doc_id, date_demande, status, traite_par, date_traitement, document_url, description_ar, description_en) FROM stdin;
1	1	5	2026-04-18	valide	1	2026-04-18	uploads/1776536781275-auto-send-test.pdf	Smoke test demande document	Smoke test demande document
2	1	1	2026-04-19	valide	1	2026-04-19	/uploads/documents/1776625465053-3d2f3a9e1979c241-fiche_conseil_disciplinaire_2026-04-24__1_.pdf	Document request	Document request
4	1	1	2026-04-20	valide	1	2026-04-20	/uploads/documents/seed-test.pdf	seed for alert test	\N
3	1	2	2026-04-19	valide	1	2026-04-22	/uploads/documents/1776855320723-98961690f3df25ee-document_3.pdf	Document request	Document request
5	2	4	2026-04-22	valide	1	2026-04-22	/uploads/documents/1776855623950-b032ab00e61ed9d8-document_5.pdf	Document request	Document request
6	1	2	2026-04-25	valide	1	2026-04-25	/uploads/documents/1777132962723-ccf1dc9d8ea54d64-document_6.pdf	Document request	Document request
7	1	1	2026-04-25	valide	1	2026-04-25	/uploads/documents/1777133138570-a5f72ab3e5c3e746-document_7.pdf	Document request	Document request
8	1	2	2026-04-26	valide	1	2026-04-26	/uploads/documents/1777205650501-b438a6856d693094-document_8.pdf	Document request	Document request
\.


--
-- Data for Name: document_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_types (id, categorie, nom_ar, nom_en, description_ar, description_en) FROM stdin;
1	administratif	Certificat de travail	Work Certificate	Document attestant les fonctions d'enseignement au sein de l'etablissement.	Document certifying active teaching duties at the institution.
2	enseignement	Certificat d'affectation d'enseignement	Teaching Assignment Certificate	Document indiquant les unites et groupes d'enseignement assignes a l'enseignant.	Certificate listing assigned modules and teaching groups.
3	scientifique	Decision de conge scientifique	Academic Leave Decision	Document administratif relatif au conge scientifique ou de recherche.	Administrative document related to scientific/academic leave.
4	pedagogique	Attestation de participation pedagogique	Pedagogical Participation Attestation	Attestation de participation aux commissions ou activites pedagogiques.	Attestation of participation in pedagogical committees or activities.
5	autre	Autre document administratif	Other Administrative Document	Tout document non classe dans les autres categories.	Any document not covered by other categories.
\.


--
-- Data for Name: dossiers_disciplinaires; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dossiers_disciplinaires (id, conseil_id, etudiant_id, enseignant_signalant, infraction_id, date_signal, decision_id, date_decision, status, created_at, updated_at, description_signal_ar, description_signal_en, remarque_decision_ar, remarque_decision_en) FROM stdin;
2	\N	2	\N	1	2026-04-18	\N	\N	signale	2026-04-18 16:29:37.777	2026-04-18 16:29:37.777	hhhhhhh	hhhhhhh	\N	\N
4	\N	8	\N	1	2026-04-19	\N	\N	signale	2026-04-19 13:06:03.37	2026-04-19 13:06:03.37	hh	hh	\N	\N
3	\N	1	\N	1	2026-04-19	\N	\N	signale	2026-04-19 11:35:41.446	2026-04-19 14:35:32.189	www	www	\N	\N
1	\N	1	1	1	2026-03-30	1	2026-04-20	traite	2026-03-30 22:17:12.247	2026-04-27 08:02:17.578	Teacher disciplinary report\n\nhhhhhhhh	Teacher disciplinary report\n\nhhhhhhhh	Decision integration test	Decision integration test
\.


--
-- Data for Name: enseignants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enseignants (id, user_id, grade_id, bureau, date_recrutement) FROM stdin;
2	6	1	\N	\N
1	5	2	\N	\N
3	12	\N	\N	\N
4	14	\N	\N	\N
5	27	\N	\N	\N
6	28	\N	\N	\N
\.


--
-- Data for Name: enseignements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enseignements (id, enseignant_id, module_id, promo_id, type, annee_universitaire, academic_year_id) FROM stdin;
4	2	4	6	cours	2024-2025	\N
5	2	3	6	tp	2024-2025	\N
6	1	1	4	\N	2024-2025	\N
7	1	2	4	\N	2024-2025	\N
8	1	3	4	\N	2024-2025	\N
9	3	1	\N	\N	\N	\N
10	4	3	\N	\N	\N	\N
\.


--
-- Data for Name: etudiants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.etudiants (id, user_id, matricule, promo_id, moyenne, annee_inscription) FROM stdin;
3	9	212131234569	4	\N	\N
1	7	212131234567	11	\N	\N
2	8	212131234568	11	\N	\N
7	20	TMP-7	\N	\N	2026
8	21	TMP-8	3	\N	2026
9	22	TMP-9	\N	\N	2026
11	23	TMP-11	11	\N	2026
12	24	TMP-12	\N	\N	2026
13	25	TMP-13	\N	\N	2026
\.


--
-- Data for Name: facultes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.facultes (id, nom_ar, nom_en) FROM stdin;
1	Faculté des Sciences et Technologies	Faculté des Sciences et Technologies
2	Faculté des Sciences et Technologies	Faculté des Sciences et Technologies
3	Faculté des Sciences et Technologies	Faculté des Sciences et Technologies
4	Faculté des Sciences et Technologies	Faculté des Sciences et Technologies
5	كلية العلوم والتكنولوجيا	Faculty of Science and Technology
6	كلية العلوم والتكنولوجيا	Faculty of Science and Technology
\.


--
-- Data for Name: filieres; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.filieres (id, departement_id, nom_ar, nom_en, description_ar, description_en) FROM stdin;
1	1	Informatique	Informatique	Filière informatique	Filière informatique
2	3	Informatique	Informatique	Filière informatique	Filière informatique
3	5	Informatique	Informatique	Filière informatique	Filière informatique
4	7	Informatique	Informatique	Filière informatique	Filière informatique
5	9	شعبة الإعلام الآلي	Computer Science Track	شعبة الإعلام الآلي	Computer science stream
6	11	شعبة الإعلام الآلي	Computer Science Track	شعبة الإعلام الآلي	Computer science stream
\.


--
-- Data for Name: grades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grades (id, nom_ar, nom_en, description_ar, description_en) FROM stdin;
1	MAA	MAA	Maître assistant A	Maître assistant A
2	MCA	MCA	Maître de conférences A	Maître de conférences A
3	Professeur	Professeur	Professeur	Professeur
4	MAA	MAA	Maître assistant A	Maître assistant A
5	MCA	MCA	Maître de conférences A	Maître de conférences A
6	Professeur	Professeur	Professeur	Professeur
7	MAA	MAA	Maître assistant A	Maître assistant A
8	MCA	MCA	Maître de conférences A	Maître de conférences A
9	Professeur	Professeur	Professeur	Professeur
10	MAA	MAA	Maître assistant A	Maître assistant A
11	MCA	MCA	Maître de conférences A	Maître de conférences A
12	Professeur	Professeur	Professeur	Professeur
13	أستاذ مساعد أ	Assistant Professor A	رتبة أستاذ مساعد أ	Academic rank: Assistant Professor A
14	أستاذ محاضر أ	Associate Professor A	رتبة أستاذ محاضر أ	Academic rank: Associate Professor A
15	أستاذ	Professor	رتبة أستاذ	Academic rank: Professor
16	أستاذ مساعد أ	Assistant Professor A	رتبة أستاذ مساعد أ	Academic rank: Assistant Professor A
17	أستاذ محاضر أ	Associate Professor A	رتبة أستاذ محاضر أ	Academic rank: Associate Professor A
18	أستاذ	Professor	رتبة أستاذ	Academic rank: Professor
\.


--
-- Data for Name: group_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.group_members (id, group_id, etudiant_id, role) FROM stdin;
1	1	1	membre
2	1	3	chef_groupe
3	2	2	chef_groupe
4	3	11	chef_groupe
5	4	1	chef_groupe
\.


--
-- Data for Name: group_sujets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.group_sujets (id, group_id, sujet_id, ordre, status, valide_par_enseignant, date_reponse_enseignant, commentaire_enseignant_ar, commentaire_enseignant_en) FROM stdin;
\.


--
-- Data for Name: groups_pfe; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups_pfe (id, sujet_final_id, co_encadrant_id, date_creation, date_affectation, date_soutenance, salle_soutenance, note, mention, created_at, updated_at, nom_ar, nom_en, validation_finale, date_validation_finale, valide_par_admin, commentaire_admin_ar, commentaire_admin_en) FROM stdin;
1	1	2	2024-10-01	2024-10-05	\N	\N	\N	\N	2026-03-31 17:58:10.444	2026-03-31 17:58:10.444	Groupe ISI-A1	Groupe ISI-A1	f	\N	\N	\N	\N
2	2	1	2024-10-01	2024-10-06	\N	\N	\N	\N	2026-03-31 17:58:10.452	2026-03-31 17:58:10.452	Groupe ISI-B1	Groupe ISI-B1	f	\N	\N	\N	\N
3	\N	1	2026-04-25	\N	\N	\N	\N	\N	2026-04-25 21:36:06.408	2026-04-25 21:36:06.408	نتاشسلاش	hdhdrf	f	\N	\N	\N	\N
4	\N	1	2026-04-25	\N	\N	\N	\N	\N	2026-04-25 21:47:08.969	2026-04-25 21:47:08.969	Test Group	Test Group EN	f	\N	\N	\N	\N
\.


--
-- Data for Name: guest_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guest_submissions (id, type, first_name, last_name, email, subject, message, created_at, status, admin_note, updated_at) FROM stdin;
1	RECLAMATION	Mohamed	Said	medsaidghoulam@gmail.com	Lil Test	bla bla bla bla bla bla	2026-04-26 15:32:08.413	rejected	\N	2026-04-26 22:02:06.281
2	RECLAMATION	bla bla	bla bla	medsaidghoulam@gmail.com	bla bla bla	bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla	2026-04-26 15:33:03.176	rejected	\N	2026-04-26 22:02:17.973
\.


--
-- Data for Name: infractions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.infractions (id, gravite, nom_ar, nom_en, description_ar, description_en) FROM stdin;
1	moyenne	Misconduct	Misconduct	\N	\N
2	faible	الغش في الامتحان	Exam Fraud	Any act of cheating or attempt to cheat during an examination.	Any act of cheating or attempt to cheat during an examination.
3	moyenne	رفض الطاعة	Refusal to Obey	Refusal to comply with instructions from authorised academic or administrative staff.	Refusal to comply with instructions from authorised academic or administrative staff.
4	faible	طلب التصحيح المزدوج بلا مبرر	Unfounded Double Correction	Requesting a double correction without valid justification.	Requesting a double correction without valid justification.
5	grave	العود إلى مخالفة الدرجة الأولى	1st Degree Recidivism	Repetition of a first-degree infraction after a previous sanction.	Repetition of a first-degree infraction after a previous sanction.
6	grave	الإخلال المنظم بالنظام	Organized Disorder	Collective or premeditated disruption of order within the institution.	Collective or premeditated disruption of order within the institution.
7	tres_grave	العنف والتهديد	Violence and Threats	Physical or verbal violence or threats directed at any person within the institution.	Physical or verbal violence or threats directed at any person within the institution.
8	tres_grave	حيازة وسائل ضارة	Harmful Means Possession	Possession of weapons, drugs, or any other dangerous or prohibited items.	Possession of weapons, drugs, or any other dangerous or prohibited items.
9	tres_grave	تزوير الوثائق	Document Forgery	Falsification, alteration, or fabrication of any official academic document.	Falsification, alteration, or fabrication of any official academic document.
10	tres_grave	انتحال الهوية	Identity Usurpation	Impersonating another student or person in any academic context.	Impersonating another student or person in any academic context.
11	grave	القذف والتشهير	Defamation	Spreading false or damaging information about any member of the institution.	Spreading false or damaging information about any member of the institution.
12	grave	الإخلال بسير الدروس	Pedagogical Disruption	Deliberate disruption of courses, exams, or any pedagogical activity.	Deliberate disruption of courses, exams, or any pedagogical activity.
13	tres_grave	السرقة والاختلاس	Theft and Misappropriation	Theft or misappropriation of property belonging to the institution or its members.	Theft or misappropriation of property belonging to the institution or its members.
14	grave	إتلاف الممتلكات	Property Deterioration	Deliberate damage or destruction of institutional or personal property.	Deliberate damage or destruction of institutional or personal property.
15	grave	الإهانة والسب	Insults to Staff/Students	Insulting, abusive, or degrading language directed at staff or fellow students.	Insulting, abusive, or degrading language directed at staff or fellow students.
16	grave	رفض الخضوع للرقابة التنظيمية	Regulatory Control Refusal	Refusal to submit to identity checks or any regulatory control within the institution.	Refusal to submit to identity checks or any regulatory control within the institution.
\.


--
-- Data for Name: justifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.justifications (id, etudiant_id, type_id, date_absence, document, date_depot, status, traite_par, date_traitement, created_at, updated_at, motif_ar, motif_en, commentaire_admin_ar, commentaire_admin_en) FROM stdin;
1	1	1	2026-03-29	\N	2026-03-30	valide	1	2026-04-20 00:20:16.771	2026-03-30 15:15:22.799	2026-04-20 00:20:16.773	Guest justification without login	Guest justification without login	\N	\N
2	1	4	2026-04-15	uploads/others/student-requests/1776644572345-85f322f87370fc87-Food.pdf	2026-04-20	valide	1	2026-04-20 00:27:04.53	2026-04-20 00:22:52.364	2026-04-20 00:27:04.532	ghggh	ghggh	Approved from API test	Approved from API test
3	1	4	2026-12-12	uploads/others/student-requests/1776682932701-fce72c2a85451837-backiee-98869.jpg	2026-04-20	refuse	1	2026-04-22 18:47:30.282	2026-04-20 11:02:12.822	2026-04-22 18:47:30.283	ytuityitu	ytuityitu	\N	\N
4	2	7	2026-04-22	\N	2026-04-24	refuse	1	2026-04-24 16:31:49.052	2026-04-24 16:27:29.458	2026-04-24 16:31:49.054	hola	hola	bla bla bla bla	bla bla bla bla
\.


--
-- Data for Name: membres_conseil; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.membres_conseil (id, conseil_id, enseignant_id, role) FROM stdin;
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.modules (id, code, semestre, specialite_id, volume_cours, volume_td, volume_tp, credit, coef, nom_ar, nom_en, description_ar, description_en) FROM stdin;
1	123	5	7	0	0	0	0	1.00	Algorithm	Algorithm	\N	\N
2	ISI-M2-ALGO-ADV	3	8	24	18	0	6	3.00	Algorithmique Avancée	Algorithmique Avancée	UE de tronc commun M2 ISI	UE de tronc commun M2 ISI
3	ISI-M2-CLOUD	3	8	20	10	14	5	2.00	Cloud et DevOps	Cloud et DevOps	Infrastructure cloud et intégration continue	Infrastructure cloud et intégration continue
4	ISI-M2-AI	3	8	18	12	12	5	2.00	IA Appliquée	IA Appliquée	Méthodes d'IA pour applications métiers	Méthodes d'IA pour applications métiers
\.


--
-- Data for Name: note_pfe; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.note_pfe (id, group_id, jury_id, note, observation_ar, observation_en, date_saisie) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, nom, description, module, action) FROM stdin;
1	manage_users	Gérer les utilisateurs	auth	manage
2	manage_pfe	Gérer les PFE	pfe	manage
3	submit_pfe	Soumettre un PFE	pfe	submit
4	view_documents	Consulter les documents	documents	view
5	manage_discipline	Gérer les dossiers disciplinaires	discipline	manage
6	submit_reclamation	Soumettre une réclamation	reclamations	submit
7	manage_annonces	Gérer les annonces	annonces	manage
8	announcements:download	Permission announcements:download	announcements	download
9	announcements:manage:course	Permission announcements:manage:course	announcements	manage
10	announcements:manage:global	Permission announcements:manage:global	announcements	manage
11	announcements:view	Permission announcements:view	announcements	view
12	announcements:view:department	Permission announcements:view:department	announcements	view
13	announcements:view:specialite	Permission announcements:view:specialite	announcements	view
14	coordination:manage:specialite	Permission coordination:manage:specialite	coordination	manage
15	courses:manage:specialite	Permission courses:manage:specialite	courses	manage
16	decisions:validate:specialite	Permission decisions:validate:specialite	decisions	validate
17	departments:manage	Permission departments:manage	departments	manage
18	documents:download:self	Permission documents:download:self	documents	download
19	documents:manage:course	Permission documents:manage:course	documents	manage
20	documents:view:self	Permission documents:view:self	documents	view
21	documents:view:specialite	Permission documents:view:specialite	documents	view
22	issues:categorize:group	Permission issues:categorize:group	issues	categorize
23	justifications:view:self	Permission justifications:view:self	justifications	view
24	messages:send:group-representative	Permission messages:send:group-representative	messages	send
25	notifications:view:priority	Permission notifications:view:priority	notifications	view
26	notifications:view:self	Permission notifications:view:self	notifications	view
27	password:change:self	Permission password:change:self	password	change
28	profile:manage:self	Permission profile:manage:self	profile	manage
29	reclamations:create:group	Permission reclamations:create:group	reclamations	create
30	reclamations:create:self	Permission reclamations:create:self	reclamations	create
31	reclamations:finalize:council	Permission reclamations:finalize:council	reclamations	finalize
32	reclamations:manage:global	Permission reclamations:manage:global	reclamations	manage
33	reclamations:override:department	Permission reclamations:override:department	reclamations	override
34	reclamations:respond:course	Permission reclamations:respond:course	reclamations	respond
35	reclamations:review:sensitive	Permission reclamations:review:sensitive	reclamations	review
36	reclamations:track:self	Permission reclamations:track:self	reclamations	track
37	reclamations:update-status:course	Permission reclamations:update-status:course	reclamations	update-status
38	reclamations:view:broad	Permission reclamations:view:broad	reclamations	view
39	reclamations:view:course	Permission reclamations:view:course	reclamations	view
40	reclamations:view:department	Permission reclamations:view:department	reclamations	view
41	reclamations:view:group	Permission reclamations:view:group	reclamations	view
42	reclamations:view:self	Permission reclamations:view:self	reclamations	view
43	reclamations:view:specialite	Permission reclamations:view:specialite	reclamations	view
44	reports:generate:department	Permission reports:generate:department	reports	generate
45	reports:generate:faculty	Permission reports:generate:faculty	reports	generate
46	reports:validate:council	Permission reports:validate:council	reports	validate
47	reports:view:academic	Permission reports:view:academic	reports	view
48	reports:view:global	Permission reports:view:global	reports	view
49	responsibilities:assign:department	Permission responsibilities:assign:department	responsibilities	assign
50	roles:assign	Permission roles:assign	roles	assign
51	roles:view	Permission roles:view	roles	view
52	specialites:manage	Permission specialites:manage	specialites	manage
53	students:view:course	Permission students:view:course	students	view
54	teachers:manage:department	Permission teachers:manage:department	teachers	manage
55	users:manage	Permission users:manage	users	manage
\.


--
-- Data for Name: pfe_compte_rendu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pfe_compte_rendu (id, group_id, enseignant_id, date_reunion, contenu, actions_decidees, prochaine_reunion, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pfe_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pfe_config (id, nom_config, valeur, description_ar, description_en, annee_universitaire, created_by, created_at, updated_at) FROM stdin;
47	5	3	يلييل	sdrg	2025/2026	1	2026-04-24 20:28:04.155	2026-04-24 20:28:04.155
1	proposition_sujets_ouverte	true	السماح باقتراح المواضيع من قبل الأساتذة	\N	2025/2026	\N	2026-04-22 22:06:47.698	2026-04-28 13:18:12.109
\.


--
-- Data for Name: pfe_jury; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pfe_jury (id, group_id, enseignant_id, role) FROM stdin;
1	1	1	president
2	1	2	examinateur
4	2	1	rapporteur
3	2	2	president
\.


--
-- Data for Name: pfe_sujets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pfe_sujets (id, enseignant_id, promo_id, type_projet, status, annee_universitaire, max_grps, created_at, updated_at, titre_ar, titre_en, description_ar, description_en, keywords_ar, keywords_en, workplan_ar, workplan_en, bibliographie_ar, bibliographie_en, valide_par, date_validation, commentaire_admin_ar, commentaire_admin_en, assignment_status, finalized_at) FROM stdin;
4	1	1	application	valide	2025/2026	1	2026-04-22 21:07:06.698	2026-04-23 14:27:19.21	Sujet test after fix	\N	Debug desc	\N	\N	\N	\N	\N	\N	\N	1	2026-04-23 14:27:19.081	\N	\N	draft	\N
3	1	1	application	valide	2025/2026	3	2026-04-22 21:06:57.15	2026-04-23 14:27:20.928	الجامعة	university	الجامعة	university	\N	\N	\N	\N	\N	\N	1	2026-04-23 14:27:20.926	\N	\N	draft	\N
1	1	5	application	valide	2024-2025	2	2026-03-31 17:58:10.434	2026-03-31 17:58:10.434	Plateforme de gestion intelligente des réclamations	Plateforme de gestion intelligente des réclamations	Conception d'une plateforme web avec workflows automatisés.	Conception d'une plateforme web avec workflows automatisés.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	draft	\N
2	2	6	recherche	valide	2024-2025	1	2026-03-31 17:58:10.441	2026-03-31 17:58:10.441	Analyse prédictive des risques disciplinaires	Analyse prédictive des risques disciplinaires	Modèle d'IA pour la détection précoce des risques académiques.	Modèle d'IA pour la détection précoce des risques académiques.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	draft	\N
5	1	1	application	termine	2025/2026	1	2026-04-24 20:34:32.97	2026-04-25 00:04:19.174	سبيسيب	fggggg	سبيسيب	fggggg	\N	\N	\N	\N	\N	\N	1	2026-04-25 00:04:18.975	\N	\N	draft	\N
\.


--
-- Data for Name: promos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promos (id, specialite_id, annee_universitaire, section, nom_ar, nom_en, academic_year_id) FROM stdin;
1	1	2024-2025	A	M2 ISI 2024-2025	M2 ISI 2024-2025	\N
2	3	2024-2025	A	M2 ISI 2024-2025	M2 ISI 2024-2025	\N
3	5	2024-2025	A	M2 ISI 2024-2025	M2 ISI 2024-2025	\N
4	7	2025-2026	1	G1	G1	\N
5	8	2024-2025	A	M2 ISI 2024-2025	M2 ISI 2024-2025	\N
6	8	2024-2025	B	M2 ISI 2024-2025	M2 ISI 2024-2025	\N
7	10	2024-2025	A	M2 ISI 2024-2025	M2 ISI 2024-2025	\N
8	10	2024-2025	B	M2 ISI 2024-2025	M2 ISI 2024-2025	\N
9	12	2024-2025	A	M2 ISI 2024-2025	M2 ISI 2024-2025	\N
10	12	2024-2025	B	M2 ISI 2024-2025	M2 ISI 2024-2025	\N
11	14	2025-2026	L1	ISIL	\N	\N
\.


--
-- Data for Name: reclamation_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reclamation_types (id, nom_ar, nom_en, description_ar, description_en, code) FROM stdin;
1	Guest General	Guest General	Auto-created by public request submission	Auto-created by public request submission	\N
2	خطأ في العلامات	Grade Error	مشكلة تتعلق بعلامات امتحان أو تقييم.	Issue related to marks or exam grading.	GRADE_ERROR
3	تعارض في الجدول	Schedule Conflict	تعارض في جدول الدراسة أو الامتحانات.	Conflict in timetable or exam schedule.	SCHEDULE_CONFLICT
4	خطأ إداري	Administrative Error	مشكلة إدارية أو تتعلق بالتسجيل.	Administrative or registration issue.	ADMIN_ERROR
6	طلب وثيقة	Document Request	طلب شهادة أو وثيقة رسمية.	Request for a transcript or official document.	DOCUMENT_REQUEST
5	أخرى	Other	أنواع أخرى من الشكاوى.	Other reclamation reasons.	OTHER
\.


--
-- Data for Name: reclamations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reclamations (id, etudiant_id, type_id, priorite, date_reclamation, status, traite_par, date_traitement, created_at, updated_at, objet_ar, objet_en, description_ar, description_en, reponse_ar, reponse_en) FROM stdin;
1	1	1	normale	2026-03-30	traitee	1	2026-04-22 18:30:18.303	2026-03-30 15:15:03.844	2026-04-22 18:30:18.305	Guest no-login reclamation	Guest no-login reclamation	Should save without auth	Should save without auth	yes	yes
2	1	1	normale	2026-03-30	refusee	1	2026-04-06 14:58:41.352	2026-03-30 15:16:05.281	2026-04-06 14:58:41.354	Grade	Grade	hhhhhhh	hhhhhhh	\N	\N
3	1	4	normale	2026-04-06	traitee	1	2026-04-20 00:29:41.299	2026-04-06 18:01:28.749	2026-04-20 00:29:41.301	hellod	hellod	jrejfijre uefijwfij hfiu wefiu hefuhre fijhruehrfuhfuh fruewhfuwehriu huhweruf qeihruherih rheirh e riwehruh rhiuwhrw hriuh rchuhr uhru hruhr iuhru urhquihr84yfjf hu	jrejfijre uefijwfij hfiu wefiu hefuhre fijhruehrfuhfuh fruewhfuwehriu huhweruf qeihruherih rheirh e riwehruh rhiuwhrw hriuh rchuhr uhru hruhr iuhru urhquihr84yfjf hu	Approved reclamation API smoke test	Approved reclamation API smoke test
4	2	1	normale	2026-04-22	traitee	1	2026-04-22 20:40:46.182	2026-04-22 20:40:01.444	2026-04-22 20:40:46.184	Grade	Grade	heelo my name is mohamed i'm 20 yo, i study in this univ	heelo my name is mohamed i'm 20 yo, i study in this univ	your reclamation approved LOL	your reclamation approved LOL
5	1	1	normale	2026-04-23	traitee	1	2026-04-23 14:23:21.213	2026-04-23 14:22:21.433	2026-04-23 14:23:21.215	Hello	Hello	Hello my name is blablablablablablablablablablablabla	Hello my name is blablablablablablablablablablablabla	yes i blablablablablablablablablablablablablalba	yes i blablablablablablablablablablablablablalba
6	1	3	normale	2026-04-24	refusee	1	2026-04-24 07:56:15.673	2026-04-24 07:54:12.051	2026-04-24 07:56:15.675	hhhhh	hhhhh	hhhhh	hhhhh	\N	\N
7	2	2	normale	2026-04-24	traitee	1	2026-04-24 16:35:20.641	2026-04-24 16:26:41.413	2026-04-24 16:35:20.642	hello	hello	hello world	hello world	\N	\N
8	1	5	normale	2026-04-25	traitee	1	2026-04-25 21:53:35.779	2026-04-25 21:53:09.268	2026-04-25 21:53:35.781	ggggg	ggggg	ytrgfghfghfy	ytrgfghfghfy	\N	\N
\.


--
-- Data for Name: request_workflow_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.request_workflow_history (id, request_category, request_id, stage, action, actor_user_id, actor_roles, note, metadata, created_at) FROM stdin;
1	reclamation	8	submitted	submitted	7	{etudiant}	Student submitted reclamation	{"source": "student_portal", "status": "soumise"}	2026-04-25 22:53:09.298005
2	reclamation	8	final_decision	approve	1	{admin}	\N	{"status": "traitee", "decision": "approve"}	2026-04-25 22:53:35.816909
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, role_id, permission_id) FROM stdin;
1	6	11
2	6	8
3	6	30
4	6	42
5	6	36
6	6	23
7	6	20
8	6	18
9	6	28
10	6	27
11	6	26
12	7	29
13	7	41
14	7	24
15	7	25
16	7	22
17	5	9
18	5	19
19	5	39
20	5	34
21	5	37
22	5	53
23	5	28
24	5	27
25	9	35
26	9	38
27	9	31
28	9	47
29	8	35
30	8	38
31	8	31
32	8	47
33	8	46
34	3	54
35	3	12
36	3	40
37	3	33
38	3	44
39	3	49
40	4	15
41	4	13
42	4	21
43	4	43
44	4	16
45	4	14
46	1	55
47	1	50
48	1	51
49	1	10
50	1	32
51	1	48
52	1	17
53	1	52
54	10	55
55	10	50
56	10	10
57	10	32
58	10	45
59	2	55
60	2	10
61	2	32
62	2	45
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, nom, description) FROM stdin;
1	admin	Administrateur système
2	admin_faculte	Administrateur de faculté
3	chef_departement	Chef de département
4	chef_specialite	Chef de spécialité
5	enseignant	Enseignant
6	etudiant	Étudiant
7	delegue	Délégué de section
8	president_conseil	Président du conseil de discipline
9	membre_conseil	Teacher extension role for council-level reclamation review.
10	vice_doyen	Admin extension role with faculty-level supervision.
\.


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.site_settings (id, university_name_ar, university_name_en, university_name_fr, university_subtitle_ar, university_subtitle_en, university_subtitle_fr, city_ar, city_en, city_fr, hero_students_stat, hero_teachers_stat, hero_courses_stat, hero_satisfaction_stat, banner_students_stat, banner_teachers_stat, banner_faculties_stat, banner_national_rank_stat, statistics_students_stat, statistics_teachers_stat, statistics_projects_stat, statistics_satisfaction_stat, statistics_quote_ar, statistics_quote_en, statistics_quote_fr, about_line1_ar, about_line1_en, about_line1_fr, about_line2_ar, about_line2_en, about_line2_fr, contact_phone, contact_email, contact_address_ar, contact_address_en, contact_address_fr, logo_url, hero_background_url, banner_background_url, created_at, updated_at, primary_color, secondary_color, sidebar_color, system_email, maintenance_mode) FROM stdin;
1	جامعة ابن خلدون	Ibn Khaldoun University	Université Ibn Khaldoun	كلية الرياضيات والإعلام الآلي	Faculty of Mathematics and Computer Science	Faculté des Mathématiques et d'Informatique	تيارت	Tiaret	Tiaret	2500+	150+	200+	98%	28K+	1.1K+	8	15th	2500+	150+	500+	98%	تمكين التعليم عبر التكنولوجيا	Empowering education through technology	Autonomiser l'éducation grâce à la technologie	جامعة ابن خلدون - تيارت، كلية الرياضيات والإعلام الآلي	Ibn Khaldoun University - Tiaret, Faculty of Mathematics and Computer Science	Université Ibn Khaldoun - Tiaret, Faculté des Mathématiques et d'Informatique	تأسست سنة 1980 ومكرسة للتميز في التعليم والبحث العلمي.	Established in 1980, dedicated to excellence in education and research.	Fondée en 1980, dédiée à l'excellence en enseignement et en recherche.	+213 555 55 55 55	info@univ-tiaret.dz	تيارت، الجزائر	Tiaret, Algeria	Tiaret, Algérie	/uploads/others/site-settings/1777275675938-6244f4551abc84a8-apple-touch-icon.png	\N	\N	2026-04-18 09:57:34.009	2026-04-27 07:42:22.614	\N	\N	\N	\N	f
\.


--
-- Data for Name: specialites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.specialites (id, filiere_id, niveau, nom_ar, nom_en) FROM stdin;
1	1	M2	ISI	ISI
2	1	M2	SIC	SIC
3	2	M2	ISI	ISI
4	2	M2	SIC	SIC
5	3	M2	ISI	ISI
6	3	M2	SIC	SIC
7	\N	L3	isil	isil
8	4	M2	ISI	ISI
9	4	M2	SIC	SIC
10	5	M2	ISI	ISI
11	5	M2	SIC	SIC
12	6	M2	ISI	ISI
13	6	M2	SIC	SIC
14	\N	L3	ISIL	\N
\.


--
-- Data for Name: student_justification_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_justification_documents (id, justification_id, etudiant_id, file_path, file_name, mime_type, file_size, created_at) FROM stdin;
\.


--
-- Data for Name: student_reclamation_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_reclamation_documents (id, reclamation_id, etudiant_id, file_path, file_name, mime_type, file_size, created_at) FROM stdin;
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.submissions (id, type, user_id, subject, message, created_at, status, admin_note, updated_at) FROM stdin;
\.


--
-- Data for Name: teacher_announcement_modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_announcement_modules (annonce_id, module_id, scheduled_for, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: teacher_course_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_course_documents (id, enseignant_id, module_id, annonce_id, title, file_path, mime_type, file_size, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: teacher_reclamation_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_reclamation_notes (id, reclamation_id, enseignant_id, note, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: type_absence; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.type_absence (id, nom_ar, nom_en, description_ar, description_en, code) FROM stdin;
1	Guest Absence	Guest Absence	Auto-created by public justification submission	Auto-created by public justification submission	\N
7	Administrative	Administrative	Auto-created by public justification submission	Auto-created by public justification submission	\N
2	طبي	Medical	سبب طبي بوثيقة داعمة.	Medical reason with supporting document.	MEDICAL
3	طارئ عائلي	Family Emergency	ظرف عائلي طارئ.	Urgent family situation.	FAMILY
4	تداخل أكاديمي	Academic Overlap	تداخل مع نشاط أكاديمي رسمي آخر.	Overlap with another official academic activity.	ACADEMIC_OVERLAP
5	سبب إداري	Administrative Reason	سبب مؤسسي أو إداري.	Institutional or administrative reason.	ADMIN
8	نقل	Transport	مشكلة نقل أو مواصلات.	Transport or commute issue.	TRANSPORT
6	أخرى	Other	أسباب أخرى للتغيب.	Other absence reasons.	OTHER
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (id, user_id, role_id) FROM stdin;
1	1	1
2	2	2
3	3	3
4	4	4
6	6	5
7	7	6
8	8	6
9	9	6
10	9	7
11	10	8
14	11	6
15	12	5
17	14	5
18	13	6
19	15	6
20	16	6
22	17	6
23	17	7
24	18	6
25	19	6
26	20	6
27	21	6
28	22	6
29	5	3
30	5	4
31	5	5
33	24	6
34	23	6
35	25	6
36	27	5
37	28	5
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, nom, prenom, sexe, date_naissance, telephone, photo, email, password, first_use, email_verified, reset_token, reset_token_expire, status, last_login, login_attempts, created_at, updated_at, lock_until) FROM stdin;
2	Bouzid	Karim	\N	\N	\N	\N	faculty@univ-tiaret.dz	$2b$10$Szs36p1JRctV2vAshhNCT.1LMlqP1cvAG.02EjEN9.2I5LVR5qWz.	f	t	\N	\N	active	\N	0	2026-03-12 00:33:12.362	2026-03-31 17:58:10.315	\N
16	Said	Mohamed	H	\N	\N	\N	Safi@gmail.com	$2b$10$C6rVlQ5/h9ysAC2v6tYg3OgMGFTLo7eCv92HYOEVt6K9PY5ZR26nu	t	f	\N	\N	active	\N	0	2026-03-30 20:51:59.841	2026-03-30 20:51:59.841	\N
3	Hamdani	Mohamed	\N	\N	\N	\N	chef.info@univ-tiaret.dz	$2b$10$Szs36p1JRctV2vAshhNCT.1LMlqP1cvAG.02EjEN9.2I5LVR5qWz.	f	t	\N	\N	active	\N	0	2026-03-12 00:33:12.368	2026-03-31 17:58:10.328	\N
4	Berkane	Amina	\N	\N	\N	\N	chef.isi@univ-tiaret.dz	$2b$10$Szs36p1JRctV2vAshhNCT.1LMlqP1cvAG.02EjEN9.2I5LVR5qWz.	f	t	\N	\N	active	\N	0	2026-03-12 00:33:12.375	2026-03-31 17:58:10.333	\N
11	Mohamed	Mohamed	H	\N	0551818688	\N	medsaidghoulam@gmail.com	$2b$10$U49v60K1jl86gwuQ1Eh8D.ZDYogvRI/8on2f2r7mS9mtsePokdjLS	t	f	574b3258abdc350e7b763b54ec0caaac597417e93a629ea3ada74a317e93580c	2026-04-20 12:07:18.001	active	\N	0	2026-03-12 00:37:41.964	2026-04-20 11:07:18.003	\N
17	amine	chelig	\N	\N	12341234	\N	amine11@gmial.com	$2b$10$0O2KpfgtEbjZp6hyr.RHe.PuT5SIxPCDQdzBEFhhWcZWS4Gcyrkqq	t	f	\N	\N	active	\N	0	2026-03-30 21:17:20.992	2026-03-30 21:17:20.992	\N
18	saad	tlidji	\N	\N	123123123	\N	saad33@gmail.com	$2b$10$.7Rp0klVXyjBfOZ69bZ6ke9B9KG.rNCJhqD9GV7WunMjojhoq976m	t	f	\N	\N	active	\N	0	2026-03-30 21:31:51.034	2026-03-30 21:31:51.034	\N
19	fateh	ounes	\N	\N	123123123	\N	ounes22@gmail.com	$2b$10$r7Jj9KfNVFeMEABIrp1b/.nl7wtK7Z.1b5xjVsp4x7b.Qbbe.Tc52	t	f	\N	\N	active	\N	0	2026-03-30 21:31:51.372	2026-03-30 21:31:51.372	\N
24	Belkacem	Youssef	\N	\N	123123123	\N	youceff@gmail.com	$2b$10$LWbK.7ynlQNX0VWjjBnFa./j4r8gctwfl06yRiucQpiek8.R3ReMi	t	f	\N	\N	active	\N	0	2026-04-22 15:37:40.531	2026-04-22 15:37:40.531	\N
10	Touati	Rachid	\N	\N	\N	\N	committee@univ-tiaret.dz	$2b$10$Szs36p1JRctV2vAshhNCT.1LMlqP1cvAG.02EjEN9.2I5LVR5qWz.	f	t	\N	\N	active	\N	0	2026-03-12 00:33:12.428	2026-03-31 17:58:10.366	\N
12	Karim	Benzima	\N	\N	123123123	\N	karim@gmail.com	$2b$10$eYyEAauDw3Ev5uP/oxkyFut/6Cqiqz/mEwv7ltoEeSSRky7AgsHMK	t	f	\N	\N	active	2026-03-12 00:51:28.766	0	2026-03-12 00:49:08.462	2026-03-12 02:33:37.22	\N
13	Ahmed	hamid	\N	\N	\N	\N	hamid@gmail.com	$2b$10$lRkiFw5R4RmdS6/Lx7gZ2.lMpS54iTYL8WzFWV.y6Kc7KOtTXZKJ6	f	f	\N	\N	active	2026-03-12 02:35:08.322	0	2026-03-12 00:59:18.975	2026-03-12 02:35:08.324	\N
14	walid	walid	F	\N	\N	\N	walid@gmail.com	$2b$10$jDNfrPHDKevREwfDhr5zIuewyi1PRpn2DP44Lm53NWgddj9sgCuBe	t	f	\N	\N	active	\N	0	2026-03-12 01:28:20.53	2026-03-12 01:28:20.53	\N
20	AEK	Djellil	\N	\N	123123123	\N	djellil@gmail.com	$2b$10$.dbCycTDbG8UjzoPbwT4jucfY0zgkZpGbvOYSkhmaBI1LNKIYMTiy	t	f	\N	\N	active	\N	0	2026-03-31 16:25:42.549	2026-03-31 16:25:42.549	\N
15	gggggg	ggggg	H	\N	\N	\N	gggg@gmail.com	$2b$10$c1TZIKqeGhrxPCfDQkeok.SJL7faPB0KC9K/LGfPioAVORlTgZtP2	t	f	\N	\N	active	\N	0	2026-03-12 13:54:03.595	2026-03-12 13:57:49.905	\N
21	Said	Mohamed	\N	\N	123123123	\N	elsaaaid@gmail.com	$2b$10$S0U9kkEee9RUn8L7wsXII.MZ/K1iqhLv20f4WUR6nHbUPiQXn4ooG	t	f	\N	\N	active	\N	0	2026-03-31 16:41:30.592	2026-03-31 16:41:30.592	\N
22	manel	Ghoulam	\N	\N	123123123	\N	ghoulll@gmail.com	$2b$10$gvPYUtC4TYB0zsqqbX7lzuBXhYDNYjIvQvcbzQW2TFvKyXRD/IHPa	t	f	\N	\N	active	\N	0	2026-03-31 16:52:31.385	2026-03-31 16:52:31.385	\N
25	Kaim	said Mohamed	\N	\N	123123123	\N	karimmohamed@gmial.com	$2b$10$hJL0LTS1W/gXRIAJk0jVKOJPYpN2GSaGfR1wbMFrpc3400P0XztsC	f	f	\N	\N	active	2026-04-25 13:25:00.57	0	2026-04-25 12:39:33.83	2026-04-25 13:27:10.153	\N
5	Benali	Youcef	\N	\N	123123	/uploads/profiles/1777276152227-ebe10278f548838b-backiee-130807.jpg	teacher@univ-tiaret.dz	$2b$10$Szs36p1JRctV2vAshhNCT.1LMlqP1cvAG.02EjEN9.2I5LVR5qWz.	f	t	\N	\N	active	2026-04-27 07:48:23.571	0	2026-03-12 00:33:12.381	2026-04-27 07:49:12.259	\N
9	Djeraba	Sara	\N	\N	\N	\N	delegate@univ-tiaret.dz	$2b$10$8JojCQB1NZSKoV2lffgSsOwNIOhX2w9Y0eRZ4kYsi6xzirYoPYnTm	t	t	\N	\N	active	\N	0	2026-03-12 00:33:12.419	2026-04-27 07:52:21.734	\N
8	Mehdaoui	Yacine	\N	\N	654654654	\N	student2@univ-tiaret.dz	$2b$10$Szs36p1JRctV2vAshhNCT.1LMlqP1cvAG.02EjEN9.2I5LVR5qWz.	f	t	\N	\N	active	2026-04-27 07:53:13.679	0	2026-03-12 00:33:12.411	2026-04-27 07:53:13.682	\N
6	Mebarki	Nadia	\N	\N	\N	\N	teacher2@univ-tiaret.dz	$2b$10$Szs36p1JRctV2vAshhNCT.1LMlqP1cvAG.02EjEN9.2I5LVR5qWz.	f	t	\N	\N	active	2026-04-27 07:59:30.601	0	2026-03-12 00:33:12.392	2026-04-27 07:59:30.604	\N
1	Super	Admin	\N	\N	\N	/uploads/1776522212586.jpg	admin@univ-tiaret.dz	$2b$10$Szs36p1JRctV2vAshhNCT.1LMlqP1cvAG.02EjEN9.2I5LVR5qWz.	f	t	\N	\N	active	2026-04-27 08:00:09.447	0	2026-03-12 00:33:12.349	2026-04-27 08:00:09.449	\N
27	ggggg	gggg	H	\N	\N	\N	ggg@ggg.com	$2b$10$uPqVCn/Sn9/FVEWBiuDnyeRWA9z/ZVzIUBG4WK5hbX6l5ssbK6IOu	t	f	\N	\N	active	\N	0	2026-04-27 08:20:17.217	2026-04-27 08:20:17.217	\N
23	reddas	belkacem	\N	\N	0791328341	/uploads/profiles/1776854109460-144bcd9513f98a03-3d-triangles-backiee-HD.jpg	belkacem@gmail.com	$2b$10$sxHYHL4DLW84ViYlb9pw.uFaMiVu/pM2rktoNe9AAmjTbbOln6nLa	f	f	\N	\N	active	2026-04-24 13:30:25.82	2	2026-04-22 10:30:40.965	2026-04-26 22:04:36.99	\N
28	aich	fatima	F	\N	\N	\N	fffff@fake.com	$2b$10$6DATs8xFY0aYobanrGlqeOKtG7QbMYQ1iZMkpbWRHeVVmxg5vhlp2	t	f	\N	\N	active	\N	0	2026-04-27 08:20:38.492	2026-04-27 08:20:38.492	\N
7	Bensalem	Amira	\N	\N	\N	/uploads/1775491605105.jpg	student@univ-tiaret.dz	$2b$10$Szs36p1JRctV2vAshhNCT.1LMlqP1cvAG.02EjEN9.2I5LVR5qWz.	f	t	\N	\N	active	2026-04-26 12:02:49.904	0	2026-03-12 00:33:12.399	2026-04-26 12:02:49.906	\N
\.


--
-- Data for Name: voeux; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.voeux (id, campagne_id, etudiant_id, specialite_id, ordre, status, date_saisie) FROM stdin;
1	2	1	11	1	accepte	2026-04-26 09:23:34.882
2	2	2	11	1	refuse	2026-04-26 22:06:32.575
\.


--
-- Name: academic_years_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.academic_years_id_seq', 1, false);


--
-- Name: alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alerts_id_seq', 19, true);


--
-- Name: annonce_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.annonce_media_id_seq', 1, false);


--
-- Name: annonce_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.annonce_types_id_seq', 2, true);


--
-- Name: annonces_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.annonces_documents_id_seq', 1, true);


--
-- Name: annonces_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.annonces_id_seq', 2, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 24, true);


--
-- Name: campagne_affectation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.campagne_affectation_id_seq', 2, true);


--
-- Name: campagne_specialites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.campagne_specialites_id_seq', 4, true);


--
-- Name: conseils_disciplinaires_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conseils_disciplinaires_id_seq', 2, true);


--
-- Name: copies_remise_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.copies_remise_id_seq', 1, false);


--
-- Name: decisions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.decisions_id_seq', 12, true);


--
-- Name: departements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departements_id_seq', 12, true);


--
-- Name: document_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_requests_id_seq', 8, true);


--
-- Name: document_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_types_id_seq', 5, true);


--
-- Name: dossiers_disciplinaires_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dossiers_disciplinaires_id_seq', 6, true);


--
-- Name: enseignants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.enseignants_id_seq', 6, true);


--
-- Name: enseignements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.enseignements_id_seq', 10, true);


--
-- Name: etudiants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.etudiants_id_seq', 17, true);


--
-- Name: facultes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.facultes_id_seq', 6, true);


--
-- Name: filieres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.filieres_id_seq', 6, true);


--
-- Name: grades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.grades_id_seq', 18, true);


--
-- Name: group_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.group_members_id_seq', 5, true);


--
-- Name: group_sujets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.group_sujets_id_seq', 1, false);


--
-- Name: groups_pfe_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.groups_pfe_id_seq', 4, true);


--
-- Name: guest_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.guest_submissions_id_seq', 2, true);


--
-- Name: infractions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.infractions_id_seq', 16, true);


--
-- Name: justifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.justifications_id_seq', 4, true);


--
-- Name: membres_conseil_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.membres_conseil_id_seq', 8, true);


--
-- Name: modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.modules_id_seq', 4, true);


--
-- Name: note_pfe_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.note_pfe_id_seq', 1, false);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permissions_id_seq', 55, true);


--
-- Name: pfe_compte_rendu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pfe_compte_rendu_id_seq', 1, false);


--
-- Name: pfe_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pfe_config_id_seq', 86, true);


--
-- Name: pfe_jury_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pfe_jury_id_seq', 4, true);


--
-- Name: pfe_sujets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pfe_sujets_id_seq', 5, true);


--
-- Name: promos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promos_id_seq', 11, true);


--
-- Name: reclamation_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reclamation_types_id_seq', 6, true);


--
-- Name: reclamations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reclamations_id_seq', 8, true);


--
-- Name: request_workflow_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.request_workflow_history_id_seq', 2, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 9700, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 10, true);


--
-- Name: specialites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.specialites_id_seq', 14, true);


--
-- Name: student_justification_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_justification_documents_id_seq', 1, false);


--
-- Name: student_reclamation_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_reclamation_documents_id_seq', 1, false);


--
-- Name: submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.submissions_id_seq', 1, false);


--
-- Name: teacher_course_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.teacher_course_documents_id_seq', 1, false);


--
-- Name: teacher_reclamation_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.teacher_reclamation_notes_id_seq', 1, false);


--
-- Name: type_absence_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.type_absence_id_seq', 8, true);


--
-- Name: user_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_roles_id_seq', 37, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 28, true);


--
-- Name: voeux_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.voeux_id_seq', 2, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: academic_years academic_years_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT academic_years_pkey PRIMARY KEY (id);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: annonce_media annonce_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annonce_media
    ADD CONSTRAINT annonce_media_pkey PRIMARY KEY (id);


--
-- Name: annonce_types annonce_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annonce_types
    ADD CONSTRAINT annonce_types_pkey PRIMARY KEY (id);


--
-- Name: annonces_documents annonces_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annonces_documents
    ADD CONSTRAINT annonces_documents_pkey PRIMARY KEY (id);


--
-- Name: annonces annonces_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annonces
    ADD CONSTRAINT annonces_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: campagne_affectation campagne_affectation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campagne_affectation
    ADD CONSTRAINT campagne_affectation_pkey PRIMARY KEY (id);


--
-- Name: campagne_specialites campagne_specialites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campagne_specialites
    ADD CONSTRAINT campagne_specialites_pkey PRIMARY KEY (id);


--
-- Name: conseils_disciplinaires conseils_disciplinaires_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conseils_disciplinaires
    ADD CONSTRAINT conseils_disciplinaires_pkey PRIMARY KEY (id);


--
-- Name: copies_remise copies_remise_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.copies_remise
    ADD CONSTRAINT copies_remise_pkey PRIMARY KEY (id);


--
-- Name: decisions decisions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.decisions
    ADD CONSTRAINT decisions_pkey PRIMARY KEY (id);


--
-- Name: departements departements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departements
    ADD CONSTRAINT departements_pkey PRIMARY KEY (id);


--
-- Name: document_requests document_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_requests
    ADD CONSTRAINT document_requests_pkey PRIMARY KEY (id);


--
-- Name: document_types document_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_types
    ADD CONSTRAINT document_types_pkey PRIMARY KEY (id);


--
-- Name: dossiers_disciplinaires dossiers_disciplinaires_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossiers_disciplinaires
    ADD CONSTRAINT dossiers_disciplinaires_pkey PRIMARY KEY (id);


--
-- Name: enseignants enseignants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enseignants
    ADD CONSTRAINT enseignants_pkey PRIMARY KEY (id);


--
-- Name: enseignements enseignements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enseignements
    ADD CONSTRAINT enseignements_pkey PRIMARY KEY (id);


--
-- Name: etudiants etudiants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etudiants
    ADD CONSTRAINT etudiants_pkey PRIMARY KEY (id);


--
-- Name: facultes facultes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facultes
    ADD CONSTRAINT facultes_pkey PRIMARY KEY (id);


--
-- Name: filieres filieres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.filieres
    ADD CONSTRAINT filieres_pkey PRIMARY KEY (id);


--
-- Name: grades grades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_pkey PRIMARY KEY (id);


--
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (id);


--
-- Name: group_sujets group_sujets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_sujets
    ADD CONSTRAINT group_sujets_pkey PRIMARY KEY (id);


--
-- Name: groups_pfe groups_pfe_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups_pfe
    ADD CONSTRAINT groups_pfe_pkey PRIMARY KEY (id);


--
-- Name: guest_submissions guest_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guest_submissions
    ADD CONSTRAINT guest_submissions_pkey PRIMARY KEY (id);


--
-- Name: infractions infractions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.infractions
    ADD CONSTRAINT infractions_pkey PRIMARY KEY (id);


--
-- Name: justifications justifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.justifications
    ADD CONSTRAINT justifications_pkey PRIMARY KEY (id);


--
-- Name: membres_conseil membres_conseil_conseil_id_enseignant_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membres_conseil
    ADD CONSTRAINT membres_conseil_conseil_id_enseignant_id_key UNIQUE (conseil_id, enseignant_id);


--
-- Name: membres_conseil membres_conseil_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membres_conseil
    ADD CONSTRAINT membres_conseil_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: note_pfe note_pfe_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.note_pfe
    ADD CONSTRAINT note_pfe_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: pfe_compte_rendu pfe_compte_rendu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pfe_compte_rendu
    ADD CONSTRAINT pfe_compte_rendu_pkey PRIMARY KEY (id);


--
-- Name: pfe_config pfe_config_nom_config_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pfe_config
    ADD CONSTRAINT pfe_config_nom_config_key UNIQUE (nom_config);


--
-- Name: pfe_config pfe_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pfe_config
    ADD CONSTRAINT pfe_config_pkey PRIMARY KEY (id);


--
-- Name: pfe_jury pfe_jury_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pfe_jury
    ADD CONSTRAINT pfe_jury_pkey PRIMARY KEY (id);


--
-- Name: pfe_sujets pfe_sujets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pfe_sujets
    ADD CONSTRAINT pfe_sujets_pkey PRIMARY KEY (id);


--
-- Name: promos promos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promos
    ADD CONSTRAINT promos_pkey PRIMARY KEY (id);


--
-- Name: reclamation_types reclamation_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reclamation_types
    ADD CONSTRAINT reclamation_types_pkey PRIMARY KEY (id);


--
-- Name: reclamations reclamations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reclamations
    ADD CONSTRAINT reclamations_pkey PRIMARY KEY (id);


--
-- Name: request_workflow_history request_workflow_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_workflow_history
    ADD CONSTRAINT request_workflow_history_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: specialites specialites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specialites
    ADD CONSTRAINT specialites_pkey PRIMARY KEY (id);


--
-- Name: student_justification_documents student_justification_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_justification_documents
    ADD CONSTRAINT student_justification_documents_pkey PRIMARY KEY (id);


--
-- Name: student_reclamation_documents student_reclamation_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_reclamation_documents
    ADD CONSTRAINT student_reclamation_documents_pkey PRIMARY KEY (id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: teacher_announcement_modules teacher_announcement_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_announcement_modules
    ADD CONSTRAINT teacher_announcement_modules_pkey PRIMARY KEY (annonce_id);


--
-- Name: teacher_course_documents teacher_course_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_course_documents
    ADD CONSTRAINT teacher_course_documents_pkey PRIMARY KEY (id);


--
-- Name: teacher_reclamation_notes teacher_reclamation_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_reclamation_notes
    ADD CONSTRAINT teacher_reclamation_notes_pkey PRIMARY KEY (id);


--
-- Name: teacher_reclamation_notes teacher_reclamation_notes_reclamation_id_enseignant_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_reclamation_notes
    ADD CONSTRAINT teacher_reclamation_notes_reclamation_id_enseignant_id_key UNIQUE (reclamation_id, enseignant_id);


--
-- Name: type_absence type_absence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.type_absence
    ADD CONSTRAINT type_absence_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: voeux voeux_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voeux
    ADD CONSTRAINT voeux_pkey PRIMARY KEY (id);


--
-- Name: academic_years_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX academic_years_name_key ON public.academic_years USING btree (name);


--
-- Name: alerts_created_by_is_read_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX alerts_created_by_is_read_created_at_idx ON public.alerts USING btree (created_by, is_read, created_at);


--
-- Name: enseignants_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX enseignants_user_id_key ON public.enseignants USING btree (user_id);


--
-- Name: etudiants_matricule_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX etudiants_matricule_key ON public.etudiants USING btree (matricule);


--
-- Name: etudiants_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX etudiants_user_id_key ON public.etudiants USING btree (user_id);


--
-- Name: group_members_group_id_etudiant_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX group_members_group_id_etudiant_id_key ON public.group_members USING btree (group_id, etudiant_id);


--
-- Name: group_sujets_group_id_sujet_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX group_sujets_group_id_sujet_id_key ON public.group_sujets USING btree (group_id, sujet_id);


--
-- Name: guest_submissions_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX guest_submissions_email_idx ON public.guest_submissions USING btree (email);


--
-- Name: guest_submissions_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX guest_submissions_type_idx ON public.guest_submissions USING btree (type);


--
-- Name: idx_audit_logs_actor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_actor ON public.audit_logs USING btree (actor_user_id);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_request_workflow_request; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_request_workflow_request ON public.request_workflow_history USING btree (request_category, request_id, created_at DESC);


--
-- Name: idx_request_workflow_stage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_request_workflow_stage ON public.request_workflow_history USING btree (stage);


--
-- Name: idx_student_justification_documents_etudiant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_justification_documents_etudiant_id ON public.student_justification_documents USING btree (etudiant_id);


--
-- Name: idx_student_justification_documents_justification_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_justification_documents_justification_id ON public.student_justification_documents USING btree (justification_id);


--
-- Name: idx_student_reclamation_documents_etudiant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_reclamation_documents_etudiant_id ON public.student_reclamation_documents USING btree (etudiant_id);


--
-- Name: idx_student_reclamation_documents_reclamation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_reclamation_documents_reclamation_id ON public.student_reclamation_documents USING btree (reclamation_id);


--
-- Name: idx_teacher_announcement_modules_module_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teacher_announcement_modules_module_id ON public.teacher_announcement_modules USING btree (module_id);


--
-- Name: idx_teacher_course_documents_enseignant_module; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teacher_course_documents_enseignant_module ON public.teacher_course_documents USING btree (enseignant_id, module_id);


--
-- Name: idx_teacher_reclamation_notes_enseignant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_teacher_reclamation_notes_enseignant_id ON public.teacher_reclamation_notes USING btree (enseignant_id);


--
-- Name: modules_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX modules_code_key ON public.modules USING btree (code);


--
-- Name: note_pfe_group_id_jury_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX note_pfe_group_id_jury_id_key ON public.note_pfe USING btree (group_id, jury_id);


--
-- Name: pfe_sujets_assignment_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pfe_sujets_assignment_status_idx ON public.pfe_sujets USING btree (assignment_status);


--
-- Name: reclamation_types_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX reclamation_types_code_key ON public.reclamation_types USING btree (code);


--
-- Name: role_permissions_role_id_permission_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX role_permissions_role_id_permission_id_key ON public.role_permissions USING btree (role_id, permission_id);


--
-- Name: submissions_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX submissions_type_idx ON public.submissions USING btree (type);


--
-- Name: submissions_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX submissions_user_id_idx ON public.submissions USING btree (user_id);


--
-- Name: type_absence_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX type_absence_code_key ON public.type_absence USING btree (code);


--
-- Name: uq_president_par_conseil; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_president_par_conseil ON public.membres_conseil USING btree (conseil_id) WHERE (role = 'president'::public."RoleConseil");


--
-- Name: uq_rapporteur_par_conseil; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_rapporteur_par_conseil ON public.membres_conseil USING btree (conseil_id) WHERE (role = 'rapporteur'::public."RoleConseil");


--
-- Name: user_roles_user_id_role_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_roles_user_id_role_id_key ON public.user_roles USING btree (user_id, role_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: alerts alerts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: annonce_media annonce_media_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annonce_media
    ADD CONSTRAINT annonce_media_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: annonces annonces_auteur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annonces
    ADD CONSTRAINT annonces_auteur_id_fkey FOREIGN KEY (auteur_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: annonces_documents annonces_documents_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annonces_documents
    ADD CONSTRAINT annonces_documents_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: annonces annonces_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annonces
    ADD CONSTRAINT annonces_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.annonce_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: campagne_specialites campagne_specialites_campagne_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campagne_specialites
    ADD CONSTRAINT campagne_specialites_campagne_id_fkey FOREIGN KEY (campagne_id) REFERENCES public.campagne_affectation(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: campagne_specialites campagne_specialites_specialite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campagne_specialites
    ADD CONSTRAINT campagne_specialites_specialite_id_fkey FOREIGN KEY (specialite_id) REFERENCES public.specialites(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: copies_remise copies_remise_enseignement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.copies_remise
    ADD CONSTRAINT copies_remise_enseignement_id_fkey FOREIGN KEY (enseignement_id) REFERENCES public.enseignements(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: departements departements_faculte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departements
    ADD CONSTRAINT departements_faculte_id_fkey FOREIGN KEY (faculte_id) REFERENCES public.facultes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: document_requests document_requests_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_requests
    ADD CONSTRAINT document_requests_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES public.enseignants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: document_requests document_requests_type_doc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_requests
    ADD CONSTRAINT document_requests_type_doc_id_fkey FOREIGN KEY (type_doc_id) REFERENCES public.document_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: dossiers_disciplinaires dossiers_disciplinaires_conseil_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossiers_disciplinaires
    ADD CONSTRAINT dossiers_disciplinaires_conseil_id_fkey FOREIGN KEY (conseil_id) REFERENCES public.conseils_disciplinaires(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: dossiers_disciplinaires dossiers_disciplinaires_decision_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossiers_disciplinaires
    ADD CONSTRAINT dossiers_disciplinaires_decision_id_fkey FOREIGN KEY (decision_id) REFERENCES public.decisions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: dossiers_disciplinaires dossiers_disciplinaires_enseignant_signalant_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossiers_disciplinaires
    ADD CONSTRAINT dossiers_disciplinaires_enseignant_signalant_fkey FOREIGN KEY (enseignant_signalant) REFERENCES public.enseignants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: dossiers_disciplinaires dossiers_disciplinaires_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossiers_disciplinaires
    ADD CONSTRAINT dossiers_disciplinaires_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: dossiers_disciplinaires dossiers_disciplinaires_infraction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossiers_disciplinaires
    ADD CONSTRAINT dossiers_disciplinaires_infraction_id_fkey FOREIGN KEY (infraction_id) REFERENCES public.infractions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: enseignants enseignants_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enseignants
    ADD CONSTRAINT enseignants_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.grades(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enseignants enseignants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enseignants
    ADD CONSTRAINT enseignants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: enseignements enseignements_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enseignements
    ADD CONSTRAINT enseignements_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enseignements enseignements_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enseignements
    ADD CONSTRAINT enseignements_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES public.enseignants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enseignements enseignements_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enseignements
    ADD CONSTRAINT enseignements_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enseignements enseignements_promo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enseignements
    ADD CONSTRAINT enseignements_promo_id_fkey FOREIGN KEY (promo_id) REFERENCES public.promos(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: etudiants etudiants_promo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etudiants
    ADD CONSTRAINT etudiants_promo_id_fkey FOREIGN KEY (promo_id) REFERENCES public.promos(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: etudiants etudiants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etudiants
    ADD CONSTRAINT etudiants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: filieres filieres_departement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.filieres
    ADD CONSTRAINT filieres_departement_id_fkey FOREIGN KEY (departement_id) REFERENCES public.departements(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: group_members group_members_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: group_members group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups_pfe(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: group_sujets group_sujets_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_sujets
    ADD CONSTRAINT group_sujets_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups_pfe(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: group_sujets group_sujets_sujet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_sujets
    ADD CONSTRAINT group_sujets_sujet_id_fkey FOREIGN KEY (sujet_id) REFERENCES public.pfe_sujets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: group_sujets group_sujets_valide_par_enseignant_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_sujets
    ADD CONSTRAINT group_sujets_valide_par_enseignant_fkey FOREIGN KEY (valide_par_enseignant) REFERENCES public.enseignants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: groups_pfe groups_pfe_co_encadrant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups_pfe
    ADD CONSTRAINT groups_pfe_co_encadrant_id_fkey FOREIGN KEY (co_encadrant_id) REFERENCES public.enseignants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: groups_pfe groups_pfe_sujet_final_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups_pfe
    ADD CONSTRAINT groups_pfe_sujet_final_id_fkey FOREIGN KEY (sujet_final_id) REFERENCES public.pfe_sujets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: groups_pfe groups_pfe_valide_par_admin_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups_pfe
    ADD CONSTRAINT groups_pfe_valide_par_admin_fkey FOREIGN KEY (valide_par_admin) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: justifications justifications_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.justifications
    ADD CONSTRAINT justifications_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: justifications justifications_traite_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.justifications
    ADD CONSTRAINT justifications_traite_par_fkey FOREIGN KEY (traite_par) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: justifications justifications_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.justifications
    ADD CONSTRAINT justifications_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.type_absence(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: membres_conseil membres_conseil_conseil_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membres_conseil
    ADD CONSTRAINT membres_conseil_conseil_id_fkey FOREIGN KEY (conseil_id) REFERENCES public.conseils_disciplinaires(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: membres_conseil membres_conseil_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membres_conseil
    ADD CONSTRAINT membres_conseil_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES public.enseignants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: modules modules_specialite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_specialite_id_fkey FOREIGN KEY (specialite_id) REFERENCES public.specialites(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: note_pfe note_pfe_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.note_pfe
    ADD CONSTRAINT note_pfe_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups_pfe(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: note_pfe note_pfe_jury_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.note_pfe
    ADD CONSTRAINT note_pfe_jury_id_fkey FOREIGN KEY (jury_id) REFERENCES public.pfe_jury(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pfe_compte_rendu pfe_compte_rendu_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pfe_compte_rendu
    ADD CONSTRAINT pfe_compte_rendu_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES public.enseignants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pfe_compte_rendu pfe_compte_rendu_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pfe_compte_rendu
    ADD CONSTRAINT pfe_compte_rendu_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups_pfe(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pfe_jury pfe_jury_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pfe_jury
    ADD CONSTRAINT pfe_jury_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES public.enseignants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pfe_jury pfe_jury_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pfe_jury
    ADD CONSTRAINT pfe_jury_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups_pfe(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pfe_sujets pfe_sujets_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pfe_sujets
    ADD CONSTRAINT pfe_sujets_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES public.enseignants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pfe_sujets pfe_sujets_promo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pfe_sujets
    ADD CONSTRAINT pfe_sujets_promo_id_fkey FOREIGN KEY (promo_id) REFERENCES public.promos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pfe_sujets pfe_sujets_valide_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pfe_sujets
    ADD CONSTRAINT pfe_sujets_valide_par_fkey FOREIGN KEY (valide_par) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: promos promos_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promos
    ADD CONSTRAINT promos_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: promos promos_specialite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promos
    ADD CONSTRAINT promos_specialite_id_fkey FOREIGN KEY (specialite_id) REFERENCES public.specialites(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reclamations reclamations_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reclamations
    ADD CONSTRAINT reclamations_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reclamations reclamations_traite_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reclamations
    ADD CONSTRAINT reclamations_traite_par_fkey FOREIGN KEY (traite_par) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reclamations reclamations_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reclamations
    ADD CONSTRAINT reclamations_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.reclamation_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: request_workflow_history request_workflow_history_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_workflow_history
    ADD CONSTRAINT request_workflow_history_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: specialites specialites_filiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specialites
    ADD CONSTRAINT specialites_filiere_id_fkey FOREIGN KEY (filiere_id) REFERENCES public.filieres(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: student_justification_documents student_justification_documents_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_justification_documents
    ADD CONSTRAINT student_justification_documents_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON DELETE CASCADE;


--
-- Name: student_justification_documents student_justification_documents_justification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_justification_documents
    ADD CONSTRAINT student_justification_documents_justification_id_fkey FOREIGN KEY (justification_id) REFERENCES public.justifications(id) ON DELETE CASCADE;


--
-- Name: student_reclamation_documents student_reclamation_documents_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_reclamation_documents
    ADD CONSTRAINT student_reclamation_documents_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON DELETE CASCADE;


--
-- Name: student_reclamation_documents student_reclamation_documents_reclamation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_reclamation_documents
    ADD CONSTRAINT student_reclamation_documents_reclamation_id_fkey FOREIGN KEY (reclamation_id) REFERENCES public.reclamations(id) ON DELETE CASCADE;


--
-- Name: submissions submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: teacher_announcement_modules teacher_announcement_modules_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_announcement_modules
    ADD CONSTRAINT teacher_announcement_modules_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON DELETE CASCADE;


--
-- Name: teacher_announcement_modules teacher_announcement_modules_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_announcement_modules
    ADD CONSTRAINT teacher_announcement_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE SET NULL;


--
-- Name: teacher_course_documents teacher_course_documents_annonce_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_course_documents
    ADD CONSTRAINT teacher_course_documents_annonce_id_fkey FOREIGN KEY (annonce_id) REFERENCES public.annonces(id) ON DELETE SET NULL;


--
-- Name: teacher_course_documents teacher_course_documents_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_course_documents
    ADD CONSTRAINT teacher_course_documents_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES public.enseignants(id) ON DELETE CASCADE;


--
-- Name: teacher_course_documents teacher_course_documents_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_course_documents
    ADD CONSTRAINT teacher_course_documents_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE SET NULL;


--
-- Name: teacher_reclamation_notes teacher_reclamation_notes_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_reclamation_notes
    ADD CONSTRAINT teacher_reclamation_notes_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES public.enseignants(id) ON DELETE CASCADE;


--
-- Name: teacher_reclamation_notes teacher_reclamation_notes_reclamation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_reclamation_notes
    ADD CONSTRAINT teacher_reclamation_notes_reclamation_id_fkey FOREIGN KEY (reclamation_id) REFERENCES public.reclamations(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: voeux voeux_campagne_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voeux
    ADD CONSTRAINT voeux_campagne_id_fkey FOREIGN KEY (campagne_id) REFERENCES public.campagne_affectation(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: voeux voeux_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voeux
    ADD CONSTRAINT voeux_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: voeux voeux_specialite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voeux
    ADD CONSTRAINT voeux_specialite_id_fkey FOREIGN KEY (specialite_id) REFERENCES public.specialites(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict QbdHcq9GnfuruBd4PMiBzRr44XwjOUukdJqfCm8JjMOjNoeAXn6IvLPhPI3K7Vy

