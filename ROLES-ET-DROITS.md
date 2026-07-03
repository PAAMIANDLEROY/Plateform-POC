# Rôles & Droits d'administration — Hi! Platform

> Document de référence pour le système d'autorisation (RBAC), la gestion des accès aux cours,
> la modération et la gestion des droits utilisateurs.
> Rédigé le 2026-07-03. Source de vérité pour la session « droits d'administrateur ».

---

## 0. TL;DR — décision de nommage à valider ⚠️

Ton modèle décrit **5 niveaux**. Ils mappent presque 1:1 sur l'enum déjà présent dans le code
(`apps/api/models/user.py`), **sauf une collision de vocabulaire** :

- Dans ton message, tu appelles le **prof** « superuser ».
- Dans le code actuel, `superuser` est déjà le **rôle le plus haut** (config plateforme).

Pour éviter toute ambiguïté, je propose de **faire disparaître le mot « superuser »** du code et
d'adopter ce nommage canonique (le reste du document s'appuie dessus) :

| Niveau | Nom produit (ton terme) | Clé technique (proposée) | Rôle actuel dans le code | Action |
|---|---|---|---|---|
| 1 | **Super Admin** (toi) | `super_admin` | `superuser` | 🔁 renommer `superuser` → `super_admin` |
| 2 | **Admin** | `admin` | `admin` | ✅ inchangé |
| 3 | **Prof** | `teacher` | `teacher` | ✅ inchangé (tu l'appelles oralement « superuser ») |
| 4 | **User+ / Élève** (domaine autorisé) | `student` | `student` | ✅ inchangé |
| 5 | **User classique** (quelconque) | `public` | `public` | ✅ inchangé |

> **À confirmer** : OK pour `super_admin` comme clé technique du niveau 1 ? Si oui, une seule
> migration renomme la valeur d'enum `superuser` → `super_admin`. Tout le reste du modèle est déjà
> en place. Le reste du document suppose cette validation.

---

## 1. Les 5 rôles

### 🟣 1. Super Admin (`super_admin`) — toi
Le plus haut niveau. **Contrôle total.**
- Tout consulter (comme l'admin).
- **Gérer les droits** : promouvoir / rétrograder n'importe quel utilisateur (y compris créer des admins).
- Configuration plateforme : domaines email autorisés, écoles, réglages globaux.
- Accès à l'audit log complet et à la modération.

### 🔴 2. Admin (`admin`)
**Consultation totale + gestion des rôles jusqu'à `teacher`.**
- Tout **consulter** : utilisateurs, cohortes, cours, stats, contenus.
- **Modifier les rôles des niveaux strictement inférieurs** : `public` ↔ `student` ↔ `teacher`.
- **Ne peut PAS** créer/modifier un `admin` ou un `super_admin` (réservé au super_admin).
- Modération de contenu (masquer/signaler), gestion des signalements.
- **Ne peut PAS** toucher à la config plateforme (domaines, écoles).

### 🔵 3. Prof (`teacher`)
L'enseignant. Le cœur pédagogique.
- **Créer des cohortes**, les suivre (dashboard de suivi), les archiver.
- **Gérer ses élèves** : inscrire/désinscrire dans SES cohortes, suivre leur progression.
- **Donner accès à des cours du catalogue** aux membres de ses cohortes.
- **Créer des cours** via Hi! Studio (markdown + quiz).
- Périmètre limité à **ses propres** cohortes et cours (pas de vue globale plateforme).

### 🟢 4. User+ / Élève (`student`) — domaine autorisé
Utilisateur inscrit avec un **email institutionnel autorisé** (`@polytechnique.edu`, `@telecom-paris.fr`, …).
- Accès à la **base de cours dédiée « Hi! PARIS »** (contenu réservé aux membres des écoles partenaires).
- Accès aux **cours de sa/ses cohorte(s)** dès qu'un prof lui en donne l'accès.
- Suit les cours, passe les quiz, obtient badges/certificats.

### ⚪ 5. User classique (`public`) — quelconque
Utilisateur avec un email **non institutionnel** (grand public).
- Accès à la **base de cours « simple »** (contenu ouvert / vitrine).
- Pas d'accès à la base Hi! PARIS ni aux cohortes.
- Peut être « promu » élève s'il rejoint un domaine autorisé (post-MVP).

---

## 2. Hiérarchie & principe d'héritage

```
super_admin  ─┐  (tout + gestion des droits + config)
   admin      ─┤  (tout en consultation + modération)
   teacher    ─┤  (ses cohortes, ses élèves, ses cours)
   student    ─┤  (base Hi! PARIS + cohortes)
   public     ─┘  (base simple)
```

**Règle générale** : un niveau supérieur voit tout ce que voit le niveau inférieur, mais
**la gestion des droits est exclusive au `super_admin`**. L'`admin` observe et modère, il ne
distribue pas les rôles.

---

## 3. Matrice de permissions

| Capacité | public | student | teacher | admin | super_admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Voir la base de cours « simple » | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voir la base « Hi! PARIS » | ❌ | ✅ | ✅ | ✅ | ✅ |
| Voir les cours de sa cohorte | ❌ | ✅ | ✅ (siennes) | ✅ | ✅ |
| Passer quiz / obtenir badges | ✅¹ | ✅ | ✅ | ✅ | ✅ |
| Créer / éditer un cours (Studio) | ❌ | ❌ | ✅ | ❌² | ✅ |
| Créer / gérer une cohorte | ❌ | ❌ | ✅ (siennes) | 👁️ | ✅ |
| Inscrire / retirer un élève d'une cohorte | ❌ | ❌ | ✅ (siennes) | ✅ | ✅ |
| Donner accès à un cours du catalogue | ❌ | ❌ | ✅ (siennes) | ✅ | ✅ |
| Voir le dashboard admin (KPIs globaux) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Voir **toutes** les cohortes / tous les élèves | ❌ | ❌ | ❌ | ✅ | ✅ |
| Modérer / masquer un contenu | ❌ | ❌ | ❌³ | ✅ | ✅ |
| Traiter les signalements | ❌ | ❌ | ❌ | ✅ | ✅ |
| Suspendre / bannir un compte | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Modifier un rôle jusqu'à `teacher`** (public/student/teacher) | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Créer / modifier / retirer un `admin`** | ❌ | ❌ | ❌ | ❌ | ✅ |
| Config plateforme (domaines, écoles) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Consulter l'audit log | ❌ | ❌ | ❌ | ✅ (lecture) | ✅ |
| Import massif d'utilisateurs (Excel) | ❌ | ❌ | ❌ | ✅ | ✅ |

<sub>¹ Selon le contenu ouvert. ² L'admin modère mais ne crée pas de contenu pédagogique par défaut — à trancher. ³ Le prof gère le contenu de SES cours mais ne modère pas la plateforme.</sub>

---

## 4. Modèle d'accès aux cours

Aujourd'hui un cours a `status` (draft/published/archived) et `school`, mais **aucun champ de
visibilité/niveau d'accès**. Il faut introduire une notion d'**access level** pour distinguer les
trois bases décrites :

| Access level (proposé) | Qui y accède | Correspond à |
|---|---|---|
| `public` | tout le monde (public + student + …) | « base de cours simple » |
| `hiparis` | `student` et au-dessus (domaine autorisé) | « base Hi! PARIS dédiée » |
| `cohort` | uniquement membres d'une cohorte y ayant accès | cours dédiés d'une cohorte |

**Règles d'accès à un cours** (à implémenter côté API, `courses.py`) :
```
peut_voir(user, course) =
    course.access_level == "public"
    OR (course.access_level == "hiparis" AND user.role >= student)
    OR (course.access_level == "cohort" AND user ∈ une cohorte ayant accès à course)
    OR user.role in {teacher (propriétaire), admin, super_admin}
```

> Le lien « cohorte → cours accessibles » est ce que le **prof** manipule quand il « donne accès à
> des cours du catalogue » à ses élèves.

---

## 5. Cohortes — modèle à créer

⚠️ **Les cohortes n'existent aujourd'hui qu'en données mock côté frontend** (`MOCK_COHORTS` dans
`apps/web/lib/mock.ts`). **Aucun modèle backend, aucune table.** C'est le plus gros chantier.

Modèle cible (backend, nouvelles tables) :

- **`cohorts`** : `id`, `name`, `school`, `owner_id` (→ teacher), `status` (draft/active/archived),
  `start_date`, `end_date`, `created_at`.
- **`cohort_members`** : `cohort_id`, `user_id`, `joined_at`, `status` (active/at-risk/inactive) —
  contrainte d'unicité (cohort_id, user_id).
- **`cohort_courses`** : `cohort_id`, `course_id`, `granted_at`, `granted_by` — les cours auxquels
  la cohorte donne accès (c'est le levier « donner accès au catalogue »).

**Périmètre prof** : un `teacher` ne voit / ne gère **que les cohortes dont il est `owner`**.
L'`admin` et le `super_admin` voient toutes les cohortes.

---

## 6. Gestion des droits (déléguée)

**Principe : chacun ne gère que les rôles strictement inférieurs au sien.**

| Acteur | Peut attribuer / modifier | Ne peut PAS toucher |
|---|---|---|
| `admin` | `public`, `student`, `teacher` | `admin`, `super_admin` |
| `super_admin` | tout, y compris **créer / retirer des `admin`** et d'autres `super_admin` | — |

Règle formelle (implémentée dans `core/roles.py`, utilisée par `PATCH /users/{id}/role`) :
```
a_autorite_sur(acteur, role_cible) =
    acteur == super_admin            # le sommet a autorité sur tout le monde
    OR niveau(acteur) > niveau(role_cible)

peut_changer_role(acteur, cible, nouveau_role) =
    a_autorite_sur(acteur, cible.role_actuel)   # l'acteur domine la cible
    AND a_autorite_sur(acteur, nouveau_role)    # ... et le rôle visé
```
> Concrètement : un `admin` ne peut ni promouvoir quelqu'un `admin`, ni modifier un `admin` existant ;
> seul un `super_admin` fabrique/retire des `admin` (et peut gérer d'autres `super_admin`, borné par
> le garde-fou « dernier super_admin »).

- **Garde-fous obligatoires** :
  - ❌ On ne peut pas **se rétrograder soi-même** si on est le **dernier `super_admin`**
    (sinon plateforme orpheline).
  - ❌ Un `admin` ne peut pas se promouvoir `admin`/`super_admin` (couvert par la règle ci-dessus).
  - ❌ Un `admin` ne peut pas modifier/rétrograder un autre `admin` ou un `super_admin`.
  - ✅ Tout changement de rôle est **journalisé** (audit log) : qui, quand, cible, ancien → nouveau rôle.
  - ✅ Le premier `super_admin` (toi) est créé par **seed/migration** ou variable d'environnement
    (`SUPER_ADMIN_EMAIL`), jamais via l'UI publique.

---

## 7. Modération & sécurité (ajouts « classiques »)

Éléments standard d'une plateforme, non mentionnés mais nécessaires :

### Modération de contenu
- **Signalement** (`report`) : tout utilisateur connecté peut signaler un cours / une vidéo / un
  commentaire. File de signalements traitée par `admin` / `super_admin`.
- **Masquage** : un `admin` peut dépublier/masquer un contenu signalé sans le supprimer.
- **Validation** : les cours créés par un `teacher` peuvent (option) passer en revue avant
  publication sur une base large — à trancher (workflow `draft → pending → published`).

### Gestion des comptes
- **Suspension / bannissement** : `admin`+ peut désactiver un compte (`is_active = false`) →
  login refusé. Réversible.
- **Vérification email** déjà en place (`is_verified`).

### Audit log
- Table **`audit_logs`** : `id`, `actor_id`, `action`, `target_type`, `target_id`, `metadata` (JSON),
  `created_at`.
- Actions journalisées a minima : changement de rôle, suspension/ban, dépublication, création/
  suppression de cohorte, changement de config plateforme.
- Consultable en lecture par `admin`, complet pour `super_admin`.

### Garde-fous techniques
- **Défense en profondeur** : gating **côté API** (le frontend ne fait qu'améliorer l'UX). La page
  `/admin` actuelle n'est protégée que par un commentaire — à durcir.
- **Rate limiting** sur les endpoints sensibles (login, changement de rôle, import).
- **Least privilege** : chaque endpoint déclare explicitement `require_role(...)`.

### RGPD (déjà en place — rappel)
- Droit d'accès / portabilité / effacement / consentement déjà implémentés
  (`apps/api/routers/users.py`). L'anonymisation ne doit **pas** casser l'audit log
  (garder `actor_id` même après anonymisation, ou pseudonymiser).

---

## 8. Liste des tâches à faire

Priorisées. Cases à cocher pour suivre l'avancement du weekend.

### 🥇 Lot 1 — Fondations RBAC (backend) — ✅ FAIT (2026-07-03, à builder/déployer)
- [x] **Décision nommage** : `super_admin` validé (cf. §0).
- [x] Migration `0009` : renomme la valeur d'enum `superuser` → `super_admin` (Postgres uniquement,
      SQLite via create_all) + `apps/api/models/user.py` + `packages/shared/types/auth.ts`.
- [x] Mis à jour tous les `("...", "superuser")` des routers → `super_admin`
      (analytics, courses, videos, apps, moocs, studio, users).
- [x] Helper hiérarchique : `apps/api/core/roles.py` (`ROLE_LEVEL`, `role_at_least`, `can_manage_role`).
- [x] Env `SUPER_ADMIN_EMAIL` + `bootstrap_super_admin()` dans `main.py` (rejoué à chaque démarrage, idempotent).
- [x] Durci `/admin` : garde côté client (`useAuth` → redirection si rôle ∉ {admin, super_admin}).
      ⚠️ Reste à faire : la page consomme encore du **mock** ; le gating API réel viendra avec les
      endpoints admin (Lot 2). La garde frontend est en place.
- [ ] **À ta charge** : push → vérifier le build GitHub Pages/Vercel + les logs Render
      (`Running upgrade 0008 -> 0009`) ; définir `SUPER_ADMIN_EMAIL=<ton email>` sur Render.

### 🥈 Lot 2 — Gestion des droits (déléguée) — ✅ FAIT (2026-07-03, à builder/déployer)
- [x] Endpoint `GET /api/v1/users` (liste paginée + filtres rôle/école/recherche) — `admin`+.
- [x] Endpoint `PATCH /api/v1/users/{id}/role` — `admin`+ avec plafond hiérarchique (`can_manage_role`) +
      garde-fou « dernier super_admin non rétrogradable ».
- [x] Endpoint `PATCH /api/v1/users/{id}/status` (suspendre/réactiver) — `admin`+ ;
      `is_active` désormais **enforced** dans `get_current_user` + au login (compte suspendu = accès refusé).
- [x] Import Excel resserré : un admin ne peut plus créer d'`admin` par import (délégation respectée).
- [x] Tests `apps/api/tests/test_users_admin.py` : unitaires délégation + endpoints (dernier super_admin,
      admin ne touche pas un admin, pas d'auto-suspension, filtres, 401/403…).
- [x] UI admin : onglet « Utilisateurs » → table réelle branchée sur l'API
      (`components/platform/UserManagement.tsx`), actions rôle + suspension, options masquées/désactivées
      selon le rôle de l'acteur (revalidées côté API).
- [ ] **À ta charge** : push → `pytest` (CI) + build front ; tester en vrai une fois déployé.
- ⏭️ Report vers Lot 5 : journalisation (audit log) de ces changements de rôle/statut.

### 🥉 Lot 3 — Cohortes (backend, gros morceau)
- [ ] Modèles `cohorts`, `cohort_members`, `cohort_courses` + migration alembic.
- [ ] CRUD cohortes (`teacher` = ses cohortes ; `admin`/`super_admin` = toutes).
- [ ] Endpoints membres : inscrire / retirer un élève d'une cohorte.
- [ ] Endpoints cours de cohorte : accorder / révoquer l'accès à un cours du catalogue.
- [ ] Brancher les pages `/lms` et `/lms/[id]` sur l'API (aujourd'hui `MOCK_COHORTS`).

### Lot 4 — Accès aux cours (3 bases)
- [ ] Ajouter `access_level` (`public` / `hiparis` / `cohort`) au modèle `Course` + migration.
- [ ] Implémenter `peut_voir(user, course)` (§4) et l'appliquer sur toutes les routes cours.
- [ ] Filtrer les catalogues selon le rôle (public → base simple ; student → + Hi! PARIS ; cohorte → cours dédiés).
- [ ] Tests d'accès par rôle (public ne voit pas Hi! PARIS, etc.).

### Lot 5 — Modération & audit
- [ ] Table `audit_logs` + helper `log_action(actor, action, target, meta)`.
- [ ] Journaliser : changement de rôle, suspension, dépublication, CRUD cohorte, config.
- [ ] Endpoint + UI de consultation de l'audit log (`admin` lecture, `super_admin` complet).
- [ ] Table `reports` (signalements) + endpoint de signalement + file de traitement (`admin`+).
- [ ] Endpoint « masquer / dépublier » un contenu signalé.

### Lot 6 — Config plateforme (super_admin)
- [ ] UI/endpoints de gestion des **domaines email autorisés** (le modèle `allowed_domain` existe déjà).
- [ ] UI/endpoints de gestion des **écoles** (le modèle `school` existe déjà).
- [ ] Réglages globaux (feature flags basiques si besoin).

### Lot 7 — Transverse
- [ ] Rate limiting sur login / changement de rôle / import.
- [ ] Vérifier que l'anonymisation RGPD ne casse pas l'audit log.
- [ ] Mettre à jour `CLAUDE.md` (section « Rôles utilisateurs ») avec le nommage final.
- [ ] Mettre à jour les traductions `fr.ts` / `en.ts` (libellés des rôles).
- [ ] Tests e2e : parcours par rôle (public, student, teacher, admin, super_admin).

---

## 9. Récap des écarts code ↔ cible (état au 2026-07-03)

| Élément | État actuel | Cible |
|---|---|---|
| Rôle `super_admin` | ❌ (`superuser` = plus haut) | 🔁 renommer |
| `require_role()` | ✅ existe | ➕ ajouter helper hiérarchique |
| Gating page `/admin` | ⚠️ commentaire only, mock | 🔒 gating API réel |
| Gestion des droits (change role) | ❌ | ➕ endpoint + garde-fous |
| Cohortes | ⚠️ mock frontend only | ➕ modèle backend complet |
| Access level cours (3 bases) | ❌ | ➕ champ + logique |
| Modération / signalements | ❌ | ➕ tables + endpoints |
| Audit log | ❌ | ➕ table + journalisation |
| Suspension / ban | ⚠️ `is_active` existe, pas exposé | ➕ endpoint |
| RGPD | ✅ complet | 🔗 préserver l'audit à l'anonymisation |

---

*Voir aussi : [CLAUDE.md](CLAUDE.md) (rôles MVP), [ROADMAP.md](ROADMAP.md), [specs-mvp.md](specs-mvp.md).*
