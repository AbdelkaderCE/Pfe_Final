# Rapport de Contributions Groupe 8 — Plateforme PFE Ibn Khaldoun
## Core Template / Frontend et Architecture Fondationnelle

---

## Table des Matières

1. [Résumé Exécutif](#résumé-exécutif)
2. [Architecture Technique & Standards API](#architecture-technique--standards-api)
3. [Système de Design & Architecture UI](#système-de-design--architecture-ui)
4. [Configuration Globale & Modèle de Données](#configuration-globale--modèle-de-données)
5. [Stack Technologique](#stack-technologique)
6. [Contributions Détaillées](#contributions-détaillées)
7. [Impact Organisationnel](#impact-organisationnel)

---

## Résumé Exécutif

Le **Groupe 8** a été responsable de l'établissement des standards architecturaux et visuels fondamentaux pour l'intégralité de la plateforme universitaire. En tant que groupe "Template/Core", nous avons créé le cadre technique et le langage de conception que tous les modules successifs ont adopté pour assurer la cohérence transversale du projet.

### Domaines Clés de Responsabilité

| Domaine | Responsabilité | Livrable |
|---------|-----------------|----------|
| **Contrats API** | Standardisation des formats de réponse JSON | API_CONTRACT.md |
| **Système de Design** | Tokens visuels, palettes, typographie | index.css + design-system/ |
| **Architecture Composants** | Bibliothèque de composants réutilisables | 20+ composants atomiques & composites |
| **Configuration Globale** | Gestion centralisée des paramètres site | Modèle `SiteSetting` + UI Admin |
| **Base de Données** | Schéma Prisma centralisé (Hiérarchie & Core) | schema.prisma |
| **Infrastructure Frontend** | Thèming, routing, contextes globaux | Tailwind + i18n + React Flow |

---

## Architecture Technique & Standards API

### 1. Contrats API — REST & JSON Standardisés

#### 1.1 Format de Réponse Standardisé
Nous avons défini un **contrat JSON uniforme** pour garantir l'interopérabilité entre les différents modules développés par les groupes.

**Format de Succès (2xx):**
```json
{
  "success": true,
  "data": { /* payload */ },
  "message": "Operation completed successfully"
}
```

**Format d'Erreur (4xx/5xx):**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable explanation"
  }
}
```

#### 1.2 Endpoints Standard (Pattern CRUD)
Nous avons établi un pattern de routage que chaque groupe doit suivre :
```
GET    /api/v1/{module}              → Liste (avec pagination/filtres)
GET    /api/v1/{module}/:id          → Détail complet
POST   /api/v1/{module}              → Création
PUT    /api/v1/{module}/:id          → Modification
DELETE /api/v1/{module}/:id          → Suppression
```

---

## Architecture Frontend Modulaire

### 1. Structure des Dossiers
Une structure modulaire a été mise en place pour permettre le développement parallèle :
```
frontend/src/
├── design-system/          → Bibliothèque de composants (Source unique)
├── components/             → Composants fonctionnels partagés
├── layouts/                → Coquilles d'application (Admin, Student, Public)
├── pages/                  → Pages de destination routables
├── services/               → Abstraction des appels API (Axios)
├── contexts/               → États globaux (UI, Theme, Settings)
├── i18n/                   → Internationalisation (AR/EN/FR)
└── theme/                  → Configuration Tailwind & Variables CSS
```

### 2. Hiérarchie des Composants
Nous avons implémenté une approche de "Atomic Design" simplifiée :
- **Primitifs:** Boutons, Inputs, Badges, Tooltips (Composants sans logique métier).
- **Composites:** Modales, Cartes, Formulaires complexes, Tables de données.
- **Layout Shells:** Sidebars, Topbars, Footers.

---

## Système de Design & Architecture UI

### 1. Philosophie Visuelle : "Calme Institutionnel"
L'objectif était de créer une interface qui évoque la confiance et l'ordre universitaire :
- **Canvas:** Fond "Parchemin" (#f8f9fb) pour réduire la fatigue oculaire.
- **Ink:** Typographie hiérarchisée pour une lecture rapide des données académiques.
- **Edge:** Bordures subtiles pour séparer les zones d'information sans encombrement.

### 2. Système de Thèming Dynamique
Le système supporte nativement le **Mode Sombre** et **5 thèmes d'accent** :
- **Blue (Ibn Khaldoun):** Professionnel et institutionnel.
- **Emerald:** Calme et académique.
- **Violet:** Moderne et créatif.
- **Amber:** Chaleureux et accessible.
- **Rose:** Dynamique.

---

## Configuration Globale & Modèle de Données

### 1. Modèle SiteSetting (Singleton)
Le Groupe 8 a créé une table de configuration unique permettant de gérer l'identité du site sans modifier le code :
- Noms de l'université (AR/EN/FR).
- Statistiques globales (Nombre d'étudiants, diplômés, etc.).
- Assets (Logos, images de fond).
- Informations de contact et réseaux sociaux.

### 2. Schéma Database Core
Nous avons conçu la structure pivot de la base de données :
- **Structure Académique:** Facultés, Départements, Filières, Spécialités, Promos.
- **Acteurs:** Profils Enseignants et Étudiants.
- **Enums Standard:** Niveaux d'étude (L1-M2), Statuts de requêtes, Sexe.

---

## Stack Technologique Standardisée

| Layer | Technologie | Rôle |
|-------|-------------|------|
| **Framework UI** | React 19 | Bibliothèque frontend principale |
| **Styling** | Tailwind CSS | Système de design utility-first |
| **API Client** | Axios | Communication backend |
| **Backend** | Node.js / Express | Serveur d'API REST |
| **ORM** | Prisma | Gestion et migration de la base de données |
| **DB** | PostgreSQL | Stockage relationnel |
| **i18n** | i18next | Support Arabe, Anglais, Français |

---

## Impact Organisationnel

1. **Cohérence Visuelle :** 100% des modules utilisent les mêmes composants, garantissant que l'utilisateur ne se sent jamais "perdu" en changeant de fonctionnalité.
2. **Vitesse de Développement :** Les groupes suivants ont économisé environ 40% de temps en utilisant les composants et services déjà prêts.
3. **Maintenance Centralisée :** Une mise à jour du système de design s'applique instantanément à toute la plateforme.

---

**Document Préparé par :** Groupe 8 (Core/Template)  
**Version :** 2.0 — Template Focus  
