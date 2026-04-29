"""
SQLAlchemy ORM models (read-only from existing backend database)
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, Enum, Numeric, SmallInteger
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum


# ═══════════════════════════════════════════════════════════════
# Enums
# ═══════════════════════════════════════════════════════════════
class UserStatusEnum(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"


class NiveauEnum(str, enum.Enum):
    L1 = "L1"
    L2 = "L2"
    L3 = "L3"
    M1 = "M1"
    M2 = "M2"


# ═══════════════════════════════════════════════════════════════
# User Management Models
# ═══════════════════════════════════════════════════════════════
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    nom = Column(String(100))
    prenom = Column(String(100))
    email = Column(String(150), unique=True)
    status = Column(Enum(UserStatusEnum), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

    enseignant = relationship(
        "Enseignant", back_populates="user", uselist=False)
    etudiant = relationship("Etudiant", back_populates="user", uselist=False)
    user_roles = relationship("UserRole", back_populates="user")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    nom = Column(String(100))
    description = Column(Text)

    user_roles = relationship("UserRole", back_populates="role")


class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role_id = Column(Integer, ForeignKey("roles.id"))

    user = relationship("User", back_populates="user_roles")
    role = relationship("Role", back_populates="user_roles")


# ═══════════════════════════════════════════════════════════════
# Etudiant & Enseignant Models
# ═══════════════════════════════════════════════════════════════
class Etudiant(Base):
    __tablename__ = "etudiants"

    id = Column(Integer, primary_key=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=True)
    matricule = Column(String(50), unique=True, nullable=True)
    promo_id = Column(Integer, ForeignKey("promos.id"), nullable=True)
    moyenne = Column(Numeric(4, 2))
    annee_inscription = Column(SmallInteger, nullable=True)

    user = relationship("User", back_populates="etudiant")
    promo = relationship("Promo", back_populates="etudiants")
    reclamations = relationship("Reclamation", back_populates="etudiant")


class Enseignant(Base):
    __tablename__ = "enseignants"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    grade_id = Column(Integer, ForeignKey("grades.id"))

    user = relationship("User", back_populates="enseignant")


class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True)
    nom = Column(String(100))


# ═══════════════════════════════════════════════════════════════
# Academic Structure Models
# ═══════════════════════════════════════════════════════════════
class Departement(Base):
    __tablename__ = "departements"

    id = Column(Integer, primary_key=True)
    nom = Column(String(100))

    filieres = relationship("Filiere", back_populates="departement")


class Filiere(Base):
    __tablename__ = "filieres"

    id = Column(Integer, primary_key=True)
    nom = Column(String(100))
    departement_id = Column(Integer, ForeignKey("departements.id"))

    departement = relationship("Departement", back_populates="filieres")
    specialites = relationship("Specialite", back_populates="filiere")


class Specialite(Base):
    __tablename__ = "specialites"

    id = Column(Integer, primary_key=True)
    nom = Column(String(100))
    filiere_id = Column(Integer, ForeignKey("filieres.id"), nullable=True)
    niveau = Column(String(2), nullable=True)

    filiere = relationship("Filiere", back_populates="specialites")
    promos = relationship("Promo", back_populates="specialite")
    modules = relationship("Module", back_populates="specialite")


class Promo(Base):
    __tablename__ = "promos"

    id = Column(Integer, primary_key=True)
    nom = Column(String(100))
    specialite_id = Column(Integer, ForeignKey("specialites.id"))
    annee_universitaire = Column(String(20))

    specialite = relationship("Specialite", back_populates="promos")
    etudiants = relationship("Etudiant", back_populates="promo")


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True)
    nom = Column(String(150))
    code = Column(String(50), unique=True)
    specialite_id = Column(Integer, ForeignKey("specialites.id"))
    credit = Column(Integer)

    specialite = relationship("Specialite", back_populates="modules")


# ═══════════════════════════════════════════════════════════════
# Reclamation & Discipline
# ═══════════════════════════════════════════════════════════════
class Reclamation(Base):
    __tablename__ = "reclamations"

    id = Column(Integer, primary_key=True)
    etudiant_id = Column(Integer, ForeignKey("etudiants.id"))
    type_id = Column(Integer, nullable=True)
    objet = Column(String(255))
    description = Column(Text)
    priorite = Column(String(50), default="moyenne")
    date_reclamation = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50))
    traite_par = Column(Integer, nullable=True)
    date_traitement = Column(DateTime, nullable=True)
    reponse = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)

    etudiant = relationship("Etudiant", back_populates="reclamations")


# ═══════════════════════════════════════════════════════════════
# Documents & Justifications
# ═══════════════════════════════════════════════════════════════
class DocumentRequest(Base):
    __tablename__ = "document_requests"

    id = Column(Integer, primary_key=True)
    etudiant_id = Column(Integer, ForeignKey("etudiants.id"))
    titre = Column(String(255))
    description = Column(Text)
    document_type = Column(String(100))
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    ai_safety_score = Column(Float, nullable=True)
    ai_approved = Column(Boolean, default=False)


class Justification(Base):
    __tablename__ = "justifications"

    id = Column(Integer, primary_key=True)
    etudiant_id = Column(Integer, ForeignKey("etudiants.id"))
    objet = Column(String(255))
    description = Column(Text)
    document_path = Column(String(255))
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    ai_safety_score = Column(Float, nullable=True)
    ai_approved = Column(Boolean, default=False)


# ═══════════════════════════════════════════════════════════════
# AI Audit Logging
# ═══════════════════════════════════════════════════════════════
class AiAuditLog(Base):
    __tablename__ = "ai_audit_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String(50))
    endpoint = Column(String(255))
    method = Column(String(10))
    input_summary = Column(Text)
    output_summary = Column(Text)
    status = Column(String(50))  # success, error
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    duration_ms = Column(Float)

    user = relationship("User")
