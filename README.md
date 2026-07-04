# Hi! Platform — Documentation Technique v1.5

Plateforme LMS mutualisée pour **Hi! PARIS** (HEC Paris + École Polytechnique de Paris).  
Stack : **Next.js 14** (frontend) · **FastAPI** (backend) · **PostgreSQL** · **Claude API** (IA)

---

## Table des matières

1. [Architecture](#1-architecture)
2. [Stack technique](#2-stack-technique)
3. [Installation locale](#3-installation-locale)
4. [Variables d'environnement](#4-variables-denvironnement)
5. [API Reference](#5-api-reference)
6. [Modèle de données](#6-modèle-de-données)
7. [Authentification & RGPD](#7-authentification--rgpd)
8. [Studio IA](#8-studio-ia)
9. [CI/CD & Déploiement](#9-cicd--déploiement)
10. [Tests](#10-tests)
11. [Roadmap](#11-roadmap)

---

## 1. Architecture

```
/
├── apps/
│   ├── web/          # Next.js 14 — App Router, TypeScript, Tailwind CSS
│   └── api/          # FastAPI (Python 3.12) — REST, JWT, SQLAlchemy
├── packages/
│   └── shared/       # Types TypeScript partagés
├── .github/workflows # CI/CD GitHub Actions
└── docker-compose.yml
```

**Frontend** (`apps/web/`) :
- `app/(auth)/` — Pages publiques (login, register, privacy, CGU)
- `app/(platform)/` — Pages authentifiées. Top nav réduit (Insights, Learning×3, NeuriPP) ;
  le reste (profil, parcours, Studio, LMS, Admin) est rangé dans l'**espace « Mon profil »**
  (menu latéral, sections réservées selon le rôle — voir `WorkspaceShell` / `WorkspaceSidebar`)
- `components/platform/` — Nav, WorkspaceSidebar, EditableBlock/EditableLink (contenu éditable),
  UserManagement, AdminContentPanel, cartes de contenu, etc.
- `lib/` — `api.ts` (client HTTP), `auth.tsx` (contexte auth), `content.tsx` (blocs éditables),
  `contentRegistry.ts`, `export.ts`, `mock.ts` (démo résiduelle)

**Backend** (`apps/api/`) :
- `routers/` — auth, users, videos, courses, moocs, apps, studio, learning, analytics, insights,
  **cohorts**, **moderation** (audit + signalements), **submissions** (NeuriPP), **content** (blocs éditables)
- `models/` — SQLAlchemy ORM (User, Course, MOOC, Video, App, Insight, **Cohort/CohortMember/CohortCourse**,
  **AuditLog/Report**, **Submission**, **ContentBlock**, …)
- `services/` — `llm.py` (couche LLM-agnostique), `ai.py` (Studio : quiz/cours/flashcards/mindmap/fiche/FAQ),
  `transcription.py` (Whisper), `email.py` (Resend HTTP API), `certificate.py` (PDF+QR), `storage.py` (Supabase Storage)
- `core/` — config, security (JWT), deps, `roles.py` (hiérarchie & délégation), `access.py` (accès cours), `audit.py`

---

## 2. Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | FastAPI (Python 3.12) |
| Base de données | PostgreSQL 16 + SQLAlchemy 2.0 + Alembic |
| Auth | JWT (access 15min / refresh 30j) + email OTP ; contrôle d'accès par rôle (RBAC + délégation) |
| Stockage fichiers | Supabase Storage (uploads NeuriPP) — OVH S3 prévu |
| LLM Studio | Anthropic Claude API (`claude-sonnet-4-6`) |
| Transcription | OpenAI Whisper API |
| Certificats PDF | fpdf2 + qrcode |
| Hébergement (prod) | Vercel (frontend) · Render (API) · Supabase (Postgres + Storage) |
| CI/CD | GitHub Actions — tests backend + build check frontend + deploy Vercel |
| Tests backend | pytest + FastAPI TestClient |
| Tests E2E | Playwright |

---

## 3. Installation locale

### Prérequis
- Node.js 20+
- Python 3.12+
- PostgreSQL 16 (ou Docker)

### Frontend

```bash
cd apps/web
npm install --legacy-peer-deps
cp .env.local.example .env.local
npm run dev          # http://localhost:3000
```

### Backend

```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head          # Crée les tables
uvicorn main:app --reload     # http://localhost:8000
```

### Docker (optionnel)

```bash
docker-compose up -d          # PostgreSQL + Redis
```

---

## 4. Variables d'environnement

### `apps/api/.env`

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL PostgreSQL | `postgresql://user:pass@localhost/hiplatform` |
| `SECRET_KEY` | Clé JWT (32+ chars) | `openssl rand -hex 32` |
| `ALLOWED_DOMAINS` | Domaines email autorisés | `polytechnique.edu,hec.fr` |
| `ANTHROPIC_API_KEY` | Clé Claude API | `sk-ant-...` |
| `OPENAI_API_KEY` | Clé Whisper API / embeddings | `sk-...` |
| `LLM_PROVIDER` | Fournisseur LLM actif | `anthropic` \| `openai` \| `mistral` |
| `LLM_MODEL` | Modèle (vide = défaut provider) | `claude-sonnet-4-6`, `gpt-4o`, `mistral-large-latest` |
| `MISTRAL_API_KEY` | Clé Mistral (si `LLM_PROVIDER=mistral`) | `...` |
| `LOG_LEVEL` | Niveau de log applicatif | `INFO` |
| `FRONTEND_URL` | URLs CORS (séparées par virgule) | `http://localhost:3000` |
| `CORS_VERCEL_REGEX` | Regex origines Vercel (previews) | `https://...\.vercel\.app` |
| `EMAIL_FROM` | Expéditeur vérifié (Resend) | `onboarding@resend.dev` |
| `COOKIE_SECURE` | Cookies `Secure` + `SameSite=None` (prod cross-origin) | `true` |
| `SUPER_ADMIN_EMAIL` | Email promu `super_admin` au démarrage (fondateur) | `toi@…` |
| `SUPABASE_URL` | URL du projet Supabase (Storage) | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Clé **secrète** `service_role` (jamais côté front) | `sb_secret_…` / `eyJ…` |
| `SUPABASE_BUCKET` | Bucket Storage des soumissions | `submissions` |
| `OVH_S3_ENDPOINT` | Endpoint Object Storage (prévu) | `s3.gra.io.cloud.ovh.net` |

### `apps/web/.env.local`

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL du backend | `http://localhost:8000` |

---

## 5. API Reference

Documentation interactive disponible sur `http://localhost:8000/docs` (Swagger UI) et `/redoc`.

### Auth (`/api/v1/auth/`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/request-code` | Envoie un OTP 6 chiffres par email |
| POST | `/verify-code` | Vérifie l'OTP, retourne les tokens JWT |
| POST | `/refresh` | Rafraîchit l'access token |
| POST | `/logout` | Révoque la session |

### Users (`/api/v1/users/`)

| Méthode | Endpoint | Rôle | Description |
|---------|----------|------|-------------|
| GET | `/me` | Auth | Profil connecté |
| PUT | `/me` | Auth | Mise à jour profil |
| DELETE | `/me` | Auth | Suppression RGPD (anonymisation) |
| GET | `/me/data` | Auth | Export toutes données (Art. 15) |
| GET | `/me/export` | Auth | Export JSON (Art. 20) |
| PUT | `/me/consent` | Auth | Consentements analytics |
| POST | `/import` | Admin | Import massif Excel |

### Courses (`/api/v1/courses/`)

| Méthode | Endpoint | Rôle | Description |
|---------|----------|------|-------------|
| GET | `/` | Auth | Liste (filtres: category, level, school) |
| POST | `/` | Teacher | Créer un cours |
| GET | `/{id}` | Auth | Détail |
| PUT | `/{id}/blocks` | Teacher | Modifier les blocs |
| POST | `/{id}/progress` | Auth | Mettre à jour la progression |

### Learning (`/api/v1/learning/`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/dashboard` | Tableau de bord apprenant |
| GET | `/badges` | Badges gagnés + verrouillés |
| POST | `/certificates/{course_id}` | Émettre un certificat |
| GET | `/certificates/{id}/download` | Télécharger le PDF |
| GET | `/certificates/{id}/verify` | Vérifier l'authenticité (public) |
| POST | `/mooc/{id}/module/{mid}/check-unlock` | **Phase 5.2** Vérifier prérequis |

### Studio IA (`/api/v1/studio/`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/excel-to-quiz` | **Phase 3** Excel → Quiz (multipart/form-data) |
| POST | `/save-quiz` | Sauvegarder un quiz généré |
| POST | `/video-to-course` | **Phase 4** Vidéo+Slides → Cours |
| POST | `/save-course` | Publier un cours généré |
| POST | `/flashcards` | **Phase 11** Contenu → flashcards (JSON) |
| POST | `/mindmap` | **Phase 11** Contenu → carte mentale (arbre JSON) |
| POST | `/study-sheet` | **Phase 11** Contenu → fiche de révision |
| POST | `/faq` | **Phase 11** Contenu → FAQ |
| GET | `/health` | État Studio + provider LLM actif |

> Les pipelines `/flashcards`, `/mindmap`, `/study-sheet`, `/faq` prennent un corps JSON
> `{ "content": "<markdown/texte du cours>", "language": "fr", "title": "..." }` et
> retournent du JSON structuré. Sans provider LLM configuré, ils renvoient un contenu
> de démonstration (utile en dev/CI).

### Analytics (`/api/v1/analytics/`)

| Méthode | Endpoint | Rôle | Description |
|---------|----------|------|-------------|
| GET | `/platform` | Admin | KPIs globaux plateforme |
| GET | `/at-risk?inactivity_days=7&score_threshold=60` | Teacher | Apprenants à risque |
| GET | `/export/users` | Admin | Export CSV utilisateurs |
| GET | `/export/courses` | Teacher | Export CSV cours |

### Gestion des droits (`/api/v1/users/`)

| Méthode | Endpoint | Rôle | Description |
|---------|----------|------|-------------|
| GET | `/` | Admin | Liste paginée + filtres (rôle, école, recherche) |
| PATCH | `/{id}/role` | Admin | Changer le rôle (délégation : chacun gère strictement en dessous de soi) |
| PATCH | `/{id}/status` | Admin | Suspendre / réactiver un compte |

### Cohortes (`/api/v1/cohorts/`)

| Méthode | Endpoint | Rôle | Description |
|---------|----------|------|-------------|
| GET / POST | `/` | Teacher | Lister (les siennes ; admin = toutes) / créer |
| GET / PATCH / DELETE | `/{id}` | Owner/Admin | Détail (métriques réelles) / éditer / supprimer |
| GET / POST | `/{id}/members` | Owner/Admin | Membres / inscrire (par id ou email) |
| DELETE | `/{id}/members/{user_id}` | Owner/Admin | Retirer un membre |
| POST | `/{id}/courses` · DELETE `/{id}/courses/{course_id}` | Owner/Admin | Accorder / révoquer un cours du catalogue |

### Modération & audit (`/api/v1/`)

| Méthode | Endpoint | Rôle | Description |
|---------|----------|------|-------------|
| GET | `/audit-logs` | Admin | Journal des actions sensibles |
| POST | `/reports` | Auth | Signaler un contenu |
| GET | `/reports` · PATCH `/reports/{id}` | Admin | File des signalements / traiter (avec masquage) |

### Soumissions NeuriPP (`/api/v1/submissions/`)

| Méthode | Endpoint | Rôle | Description |
|---------|----------|------|-------------|
| POST | `/` | Auth | Soumettre un projet EdTech (form + pièce jointe < 1 Mo → Supabase) |
| GET | `/` | Admin | Liste des soumissions (URL signée de la pièce jointe) |

### Contenu éditable (`/api/v1/content/`)

| Méthode | Endpoint | Rôle | Description |
|---------|----------|------|-------------|
| GET | `/` | Public | Blocs de texte des pages (admin → inclut les brouillons) |
| PUT | `/{key}` | Admin | Écrire le **brouillon** d'un bloc |
| POST | `/{key}/publish` | Admin | Publier le brouillon |

### Accès aux cours (§ niveaux)

`GET /api/v1/courses` et `/{id}` filtrent selon `access_level` : `public` (tous) · `hiparis`
(élèves+) · `cohort` (membres d'une cohorte à qui le cours est accordé). Teachers/admins voient tout le catalogue publié.

---

## 6. Modèle de données

```
User (id, email, first_name, last_name, role, school, is_verified, …)
 ├── Course (id, title, level, status, category, school, …)
 │    └── CourseBlock (id, position, type, content JSON)
 ├── Video (id, title, youtube_id, url, category, view_count, …)
 │    └── VideoComment (id, user_id, content, created_at)
 ├── MOOC (id, title, is_linear, status, …)
 │    └── MOOCModule (id, position, min_score_to_unlock, prerequisite_module_id)
 │         └── MOOCModuleCourse (course_id, position)
 ├── UserMOOCEnrollment (user_id, mooc_id, completed_at)
 ├── App (id, title, url, tags, visibility, …)
 ├── Insight (id, title, abstract, authors, tags, cover, status, …)
 ├── Cohort (id, name, school, owner_id, status, start/end_date)
 │    ├── CohortMember (cohort_id, user_id, status)
 │    └── CohortCourse (cohort_id, course_id, granted_by)   — accès catalogue → cohorte
 └── Course.access_level : public | hiparis | cohort

AuditLog (id, actor_id, action, target_type, target_id, meta, created_at)
Report (id, reporter_id, target_type, target_id, reason, status, …)   — modération
Submission (id, project_name, repo_url, …, storage_path, uploaded_by)  — NeuriPP
ContentBlock (key, value, draft_value, updated_by)                     — texte éditable
AllowedDomain (id, domain)  — domaines autorisés, configurables par super_admin
```

**Rôles (privilège croissant) :** `public` < `student` < `teacher` < `admin` < `super_admin`.
Délégation : chacun ne gère que les rôles strictement inférieurs au sien (voir `ROLES-ET-DROITS.md`).

---

## 7. Authentification & RGPD

### Flux d'authentification

1. `POST /request-code` — OTP 6 chiffres envoyé par email
2. `POST /verify-code` — Vérification + émission tokens JWT
3. Access token (15min) stocké en mémoire côté client
4. Refresh token (30j) en cookie `httpOnly` — `Secure; SameSite=None` en prod (cross-origin, `COOKIE_SECURE=true`), `Lax` en dev
5. Rotation automatique du refresh token

### RGPD — Droits des utilisateurs (CNIL)

| Droit | Endpoint | Délai |
|-------|----------|-------|
| Accès (Art. 15) | `GET /api/v1/users/me/data` | Immédiat |
| Rectification (Art. 16) | `PUT /api/v1/users/me` | Immédiat |
| Effacement (Art. 17) | `DELETE /api/v1/users/me` | 30 jours |
| Portabilité (Art. 20) | `GET /api/v1/users/me/export` | Immédiat |
| Opposition (Art. 21) | `PUT /api/v1/users/me/consent` | Immédiat |

### Sécurité

- Passwords : `bcrypt` (coût 12), jamais stockés en clair
- JWT : `HS256`, expiration courte, rotation refresh
- HTTPS obligatoire (TLS 1.2+)
- Validation MIME côté serveur pour les uploads
- ORM paramétré (SQLAlchemy) — protection SQL injection
- CORS restreint au domaine frontend
- Aucune donnée personnelle dans les logs

---

## 8. Studio IA

### Pipeline 1 — Excel → Quiz (Phase 3)

```
Excel (.xlsx) → openpyxl → Claude claude-sonnet-4-6 → JSON → Preview/Edit → /save-quiz
```

Paramètres : `n_questions` (1-20), `difficulty`, `language`, `quiz_title`

### Pipeline 2 — Vidéo+Slides → Cours (Phase 4)

```
YouTube URL / Fichier MP4 + PPTX/PDF
  → Whisper (transcription) + python-pptx (extraction slides)
  → Claude claude-sonnet-4-6 (prompt structuré)
  → Markdown (sections, quiz intégrés, bibliographie)
  → Éditeur side-by-side
  → /save-course (publication)
```

---

## 9. CI/CD & Déploiement

### GitHub Actions

```yaml
# push main / PR :
backend-tests   →  pytest tests/ -v
frontend-build  →  next lint + next build (vérification, sans déploiement)
deploy-vercel   →  déploiement Vercel (main seulement, après tests ✅)
# (le déploiement maquette GitHub Pages a été retiré)
```

### Migrations DB

```bash
cd apps/api
alembic upgrade head                                    # Appliquer
alembic revision --autogenerate -m "description"        # Créer
```

Migrations disponibles :
- `0001`–`0008` — auth, contenus, prérequis MOOC, profil/learning, seeds (cours, contenus, insights)
- `0009_rename_superuser_to_super_admin` — enum rôle `superuser` → `super_admin`
- `0010_cohorts` — `cohorts`, `cohort_members`, `cohort_courses`
- `0011_course_access_level` — `courses.access_level` (public/hiparis/cohort)
- `0012_audit_and_reports` — `audit_logs`, `reports`
- `0013_submissions` + `0014_submission_project_fields` — soumissions NeuriPP
- `0015_content_blocks` + `0016_content_draft` — blocs de texte éditables (brouillon/publication)

---

## 10. Tests

### Backend

```bash
cd apps/api && pytest tests/ -v
```

Couverture : health check, auth OTP, JWT, RGPD, analytics, prérequis MOOC.

### Frontend E2E (Playwright)

```bash
cd apps/web
npm run test:e2e        # Headless
npm run test:e2e:ui     # Interface graphique
```

Couverture : auth flow, navigation dropdowns, pages protégées.

---

## 11. Roadmap

### V1 — Livré (Phases 0-7)

| Phase | Statut |
|-------|--------|
| 0 — Fondations (Next.js + FastAPI + PostgreSQL + CI/CD) | ✅ |
| 1 — Auth OTP + JWT + RGPD natif + Import Excel | ✅ |
| 2 — Cours, vidéos, progression, commentaires horodatés | ✅ |
| 3 — Studio IA : Excel → Quiz | ✅ |
| 4 — Studio IA : Vidéo+Slides → Cours Markdown | ✅ |
| 5 — MOOCs, certificats PDF+QR, badges, prérequis | ✅ |
| 6 — Dashboard LMS + Admin KPIs + Export CSV + Alertes | ✅ |
| 7 — Catalogue apps+GitHub API, Insights, E2E, Documentation | ✅ |

### V1.5 — Livré (récent)

| Lot | Statut |
|-----|--------|
| RBAC `super_admin` + gestion des droits **déléguée** (chacun gère strictement en dessous de soi) | ✅ |
| Cohortes (backend complet) + LMS branché sur données réelles + métriques calculées | ✅ |
| Niveaux d'accès aux cours (`public` / `hiparis` / `cohort`) | ✅ |
| Modération & **audit log** (changements de rôle/statut, cohortes, signalements, masquage) | ✅ |
| Nettoyage des « fausses stats » (admin, dashboard, my-learning → données réelles) | ✅ |
| **NeuriPP** — appel à soumissions + formulaire projet + upload Supabase | ✅ |
| **Contenu éditable** des pages (inline + panneau admin) avec brouillon / publication | ✅ |
| Refonte nav : top réduit + espace « Mon profil » à menu latéral | ✅ |
| i18n FR/EN | ✅ |

### V2 — Prévu

- **Appli mobile** (piste privilégiée : Capacitor sur l'export statique ; auth à basculer en token)
- Config plateforme par `super_admin` (domaines autorisés + écoles) — *Lot 6*
- Bouton « Signaler » côté contenus (backend prêt)
- SSO/SAML 2.0 (Renater) · Import/export SCORM
- Lecteur vidéo self-hosted (Mux/PeerTube) + métriques avancées
- Fiabilité données : keep-alive Supabase + backups (voir `TODO.md`)
- Dashboard analytics temps-réel (WebSocket) · Staging environment

---

*Hi! PARIS — usage interne uniquement*
