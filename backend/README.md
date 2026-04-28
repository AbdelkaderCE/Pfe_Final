# 🗄️ Backend — Database & Server Setup Guide

> **Time needed:** ~10 minutes  
> **You need:** Node.js 18+ and either **PostgreSQL** or **XAMPP (MySQL)**

---

## Quick Start (4 commands)

```bash
cd backend
npm install
copy .env.example .env        # then edit .env with your DB password
npx prisma db push
npx prisma db seed
npm run dev
```

If that worked → you're done! Server runs at **http://localhost:5000**  
If not → follow the detailed steps below. 👇

---

## Step 1 — Install Node.js dependencies

```bash
cd backend
npm install
```

---

## Step 2 — Choose your database

You have **two options**. Pick the one you already have installed.

### Option A — PostgreSQL ✅ (recommended)

<details>
<summary>📥 Click to expand PostgreSQL setup</summary>

#### 1. Install PostgreSQL

- Download from: https://www.postgresql.org/download/
- During installation, **remember the password** you set for `postgres` user
- Default port: `5432`

#### 2. Create the database

Open **pgAdmin** or **psql** terminal and run:

```sql
CREATE DATABASE university_pfe;
```

**Using psql terminal:**
```bash
psql -U postgres
# Enter your password when prompted
CREATE DATABASE university_pfe;
\q
```

**Using pgAdmin:**
1. Open pgAdmin → connect to your server
2. Right-click "Databases" → "Create" → "Database"
3. Name: `university_pfe` → Save

#### 3. Set your `.env`

```bash
copy .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/university_pfe?schema=public"
```

Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation.

</details>

---

### Option B — MySQL via XAMPP

<details>
<summary>📥 Click to expand XAMPP / MySQL setup</summary>

#### 1. Start XAMPP

- Open XAMPP Control Panel
- Start **Apache** and **MySQL**

#### 2. Create the database

Open **phpMyAdmin** at http://localhost/phpmyadmin

1. Click "New" in the left sidebar
2. Database name: `university_pfe`
3. Collation: `utf8mb4_unicode_ci`
4. Click "Create"

#### 3. Switch Prisma to MySQL

⚠️ **Important:** You must change the database provider in the Prisma schema.

Open `backend/prisma/schema.prisma` and change line 8:

```prisma
datasource db {
  provider = "mysql"          // ← change "postgresql" to "mysql"
  url      = env("DATABASE_URL")
}
```

#### 4. Set your `.env`

```bash
copy .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="mysql://root:@localhost:3306/university_pfe"
```

> XAMPP MySQL default: user = `root`, password = empty, port = `3306`

> ⚠️ If you have a password on MySQL, use: `mysql://root:YOUR_PASSWORD@localhost:3306/university_pfe`

</details>

---

## Step 3 — Push schema & seed data

```bash
cd backend

# Create all 38 tables in your database
npx prisma db push

# Generate the Prisma client
npx prisma generate

# Seed test data (users, roles, university structure)
npx prisma db seed
```

### Start from a fresh database (same DB name, wipe old data)

If you already used the same DB name before and want a clean restart:

```bash
cd backend
npm run db:fresh
```

This command resets the schema, regenerates Prisma client, and seeds test data again.

### Verify it worked

```bash
npx prisma studio
```

This opens http://localhost:5555 — you should see all 38 tables with data.

---

## Step 4 — Start the server

```bash
npm run dev
```

Server starts at **http://localhost:5000**

### Test it

Open your browser or use curl:

```
GET http://localhost:5000/api/v1/auth/me
```

Should return `401 Unauthorized` (because you're not logged in — that's correct!).

### Login test

```bash
curl -X POST http://localhost:5000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@univ-tiaret.dz\",\"password\":\"Test@1234\"}"
```

Should return a success response with user data.

### Admin bulk user import (Excel)

Admins and vice deans can import users from an Excel file:

- **Endpoint:** `POST /api/v1/auth/admin/import-users-excel`
- **Auth:** required (`admin` or `vice_doyen` role)
- **Content-Type:** `multipart/form-data` with a `file` field (`.xlsx` or `.xls`)

Required columns in the first sheet:

- `nom`
- `prenom`
- `email`
- `roles` (comma-separated if multiple; creation supports one base role: `admin`, `enseignant`, or `etudiant`)

Optional columns:

- `telephone`
- `promoId`
- `specialiteId`
- `moduleIds` (comma-separated ids)
- `anneeUniversitaire`

The endpoint returns row-level results with:

- `createdCount`, `failedCount`
- `created[]` (includes generated temporary password)
- `failures[]` (row number + reason)

---

## 📋 Test Accounts (after seeding)

| Email                        | Password   | Role                |
|------------------------------|------------|---------------------|
| admin@univ-tiaret.dz         | Test@1234  | Admin               |
| faculty@univ-tiaret.dz       | Test@1234  | Admin faculté       |
| chef.info@univ-tiaret.dz     | Test@1234  | Chef département    |
| chef.isi@univ-tiaret.dz      | Test@1234  | Chef spécialité     |
| teacher@univ-tiaret.dz       | Test@1234  | Enseignant          |
| teacher2@univ-tiaret.dz      | Test@1234  | Enseignant          |
| student@univ-tiaret.dz       | Test@1234  | Étudiant            |
| student2@univ-tiaret.dz      | Test@1234  | Étudiant            |
| delegate@univ-tiaret.dz      | Test@1234  | Étudiant + Délégué  |
| committee@univ-tiaret.dz     | Test@1234  | Président conseil   |

---

## 🔧 Useful Commands

| Command                  | What it does                          |
|--------------------------|---------------------------------------|
| `npm run dev`            | Start backend in dev mode (auto-reload) |
| `npm run build`          | Compile TypeScript to JavaScript      |
| `npx prisma studio`     | Visual database browser (port 5555)   |
| `npx prisma db push`    | Sync schema → database (no migration files) |
| `npx prisma db seed`    | Insert test data                      |
| `npx prisma generate`   | Regenerate Prisma client after schema changes |
| `npm run prisma:reset`  | Drop & recreate DB via migrations     |
| `npm run db:fresh`      | Force-reset schema + generate + seed  |

---

## ❓ Troubleshooting

### "Can't reach database server"
- **PostgreSQL:** Make sure the PostgreSQL service is running. Check Windows Services or run `pg_isready`
- **XAMPP:** Make sure MySQL is started in XAMPP Control Panel
- Check the port in your `DATABASE_URL` matches (PostgreSQL: 5432, MySQL: 3306)

### "Database does not exist"
- You need to manually create the `university_pfe` database first (see Step 2)

### "prisma db push" shows errors
- Make sure `provider` in `schema.prisma` matches your database:
  - PostgreSQL → `provider = "postgresql"`
  - MySQL/XAMPP → `provider = "mysql"`

### "EACCES permission denied" or "Port 5000 already in use"
- Another process is using port 5000. Kill it or change `PORT` in `.env`

### "Cannot find module '@prisma/client'"
- Run `npx prisma generate` first

### "Seed fails with duplicate key"
- The seed was already run. This is fine — your data is already there.
- To re-seed: `npx prisma db push --force-reset` then `npx prisma db seed`

---

## ⚠️ Important for MySQL (XAMPP) users

When you push your code, **do NOT commit the `provider` change** in `schema.prisma`. The master branch uses PostgreSQL. Only change the provider locally on your machine.

If you accidentally staged it:
```bash
git checkout -- prisma/schema.prisma
```

---

*See also: `CONTRIBUTING.md` for branch workflow, `docs/API_CONTRACT.md` for API format.*
