# Hi! Platform — CLAUDE.md

Contexte projet pour Claude Code. Ce fichier est la source de vérité pour toute session de développement.

---

## Contexte

Plateforme pédagogique mutualisée pour **IP Paris** (Hi! PARIS / Hi! PACE).
Objectif : remplacer Moodle et les LMS externes par une solution moderne, open source, contrôlée en interne.
Inspirations UX : YouTube (engagement), Google Colab (interactivité technique), HFactory (certification).

---

## Stack technique

| Couche | Choix |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | FastAPI (Python) |
| Base de données | MangoDB |
| Auth | Maison — domain-based (email @polytechnique.edu, @telecom-paris.fr, etc.) |
| Stockage fichiers | OVH Object Storage (S3-compatible) |
| Infra | OVH Cloud |
| Monorepo | `/apps/web` (Next.js) + `/apps/api` (FastAPI) + `/packages/shared` |

---

## Design system

- **Couleurs primaires** : Bleu `#1A3A8F` + Rouge `#D72638`
- **Couleurs secondaires** : Blanc `#FFFFFF`, Gris clair `#F4F6FA`, Gris texte `#4A4A6A`
- **Typographie** : [À choisir — suggestion : Sora ou DM Sans]
- **Style** : Moderne, épuré, académique sans être austère. Pas de purple gradients.

---

## Architecture fonctionnelle (MVP)

```
Hi! Platform
├── Hi! Tube       → Vidéothèque style YouTube
├── Hi! Course     → Catalogue de cours (markdown + quiz)
├── Hi! MOOC       → Parcours structurés multi-cours
├── Hi! App        → Hébergement apps Python/JS (Streamlit, etc.)
├── Hi! Studio     → Builder de cours pour enseignants
└── Hi! Cert       → Certification + badges
```

---

## Rôles utilisateurs

| Rôle | Accès |
|---|---|
| `student` | Consulter contenus, suivre cours, passer quiz |
| `teacher` | Créer/éditer cours via Hi! Studio, gérer ses cohortes |
| `admin` | Gestion complète, gestion des utilisateurs, stats |
| `superuser` | Config plateforme, gestion des écoles |
| `public` | Accès limité aux contenus non restreints |

---

## Authentification (domain-based)

- Inscription via email institutionnel uniquement
- Domaines autorisés configurables par `superuser` (ex : `@polytechnique.edu`, `@telecom-paris.fr`, `@hec.fr`)
- Email de vérification obligatoire
- JWT access token (15min) + refresh token (30j) en cookie httpOnly
- Pas de SSO/SAML dans le MVP — prévu post-MVP

---

## Structure des dossiers

```
/
├── apps/
│   ├── web/                  # Next.js frontend
│   │   ├── app/              # App Router pages
│   │   │   ├── (auth)/       # login, register
│   │   │   ├── (platform)/   # dashboard, cours, vidéos...
│   │   │   └── (studio)/     # builder enseignant
│   │   ├── components/
│   │   └── lib/
│   └── api/                  # FastAPI backend
│       ├── routers/          # auth, courses, videos, users...
│       ├── models/           # SQLAlchemy models
│       ├── schemas/          # Pydantic schemas
│       └── services/
├── packages/
│   └── shared/               # types TypeScript partagés
├── CLAUDE.md
└── docker-compose.yml
```

---

## Commandes clés

```bash
# Dev
docker-compose up -d          # Lance PostgreSQL + services
cd apps/web && npm run dev    # Frontend :3000
cd apps/api && uvicorn main:app --reload  # API :8000

# Tests
cd apps/api && pytest
cd apps/web && npm run test

# DB migrations
cd apps/api && alembic upgrade head
alembic revision --autogenerate -m "description"
```

---

## Conventions de code

- **Python** : snake_case, type hints partout, docstrings sur les fonctions publiques
- **TypeScript** : strict mode, pas de `any`, composants en PascalCase
- **API** : RESTful, préfixe `/api/v1/`, réponses JSON typées avec Pydantic
- **Commits** : Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
- **Branches** : `feature/nom-feature`, `fix/nom-bug`

---

## Décisions techniques importantes

- **Pas de monolith Moodle** : architecture modulaire pour déployer les modules indépendamment
- **Markdown-first** : tout contenu cours est stocké en markdown (rendu côté client avec MDX)
- **Import PDF/PPTX** : hors MVP, prévu en V2
- **Hi! Cert** : hors MVP
- **Interopérabilité Moodle** : import/export SCORM prévu post-MVP

---

## Variables d'environnement attendues

```env
# apps/api/.env
DATABASE_URL=postgresql://user:pass@localhost/hiplatform
SECRET_KEY=...
ALLOWED_DOMAINS=polytechnique.edu,telecom-paris.fr,hec.fr
OVH_S3_ENDPOINT=...
OVH_S3_KEY=...
OVH_S3_SECRET=...

# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```
