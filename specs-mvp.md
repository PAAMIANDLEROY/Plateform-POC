# Hi! Platform — Spécifications fonctionnelles MVP

**Version** : 0.1 — MVP  
**Projet** : Hi! PARIS — Plateforme pédagogique mutualisée  
**Date** : Avril 2026

---

## 1. Vision MVP

Le MVP couvre les modules suivants, dans l'ordre de priorité :

1. **Authentification** (socle obligatoire)
2. **Hi! Tube** — vidéothèque
3. **Hi! Course** — cours markdown + quiz
4. **Hi! Studio** — builder enseignant
5. **Hi! MOOC** — parcours structurés
6. **Hi! App** — hébergement d'applications *(périmètre réduit)*
7. **Hi! Certificat** - Parcours de l'apprenant

Hors MVP : import PDF/PPTX, SSO/SAML, interopérabilité Moodle.

---

## 2. Authentification

### 2.1 Inscription
- Formulaire : prénom, nom, email institutionnel, mot de passe
- Validation du domaine email contre la liste `ALLOWED_DOMAINS` (configurée par superuser)
- Envoi email de vérification (lien à usage unique, expire 24h)
- Compte inactif jusqu'à vérification

### 2.2 Connexion
- Email + mot de passe
- JWT access token (15 min) stocké en mémoire côté client
- Refresh token (30j) en cookie httpOnly
- Route `POST /api/v1/auth/refresh` pour renouveler silencieusement

### 2.3 Gestion des rôles
- Rôle par défaut à l'inscription : `student`
- Promotion vers `teacher` ou `admin` par un `admin` ou `superuser`
- Un utilisateur peut appartenir à plusieurs écoles (mutualisaton Hi! PARIS / Hi! PACE)

### 2.4 Domaines autorisés
- Table `allowed_domains` gérée via interface superuser
- Exemple : `polytechnique.edu`, `telecom-paris.fr`, `hec.fr`, `ensae.fr`

---

## 3. Hi! Tube

Vidéothèque interne style YouTube pour contenus pédagogiques.

### 3.1 Côté étudiant
- Page d'accueil : grille de vidéos avec miniature, titre, catégorie, tags, durée
- Filtres : catégorie, tags, école source
- Page vidéo :
  - Lecteur vidéo (player HTML5 ou embed selon hébergement)
  - Titre, description, tags
  - Section commentaires (utilisateurs inscrits uniquement)
  - Vidéos recommandées (même catégorie/tags, simple)
- Recherche full-text sur titre + description + tags

### 3.2 Côté enseignant / admin
- Upload vidéo (OVH S3) ou saisie d'URL externe (YouTube embed)
- Formulaire : titre, description, catégorie, tags, école, visibilité (public / inscrits / restreint)
- Miniature auto ou upload manuel

### 3.3 Modèle de données
```
Video
  id, title, description, url, thumbnail_url
  category_id, tags[], school_id
  visibility: enum(public, enrolled, restricted)
  created_by (user_id), created_at, updated_at
  duration_seconds, view_count
```

---

## 4. Hi! Course

Catalogue de cours individuels au format markdown + quiz.

### 4.1 Structure d'un cours
Un cours est composé de **blocs ordonnés** :

| Type de bloc | Description |
|---|---|
| `heading` | Titre H1/H2/H3 |
| `text` | Paragraphe texte libre |
| `markdown` | Contenu markdown enrichi (code, listes, liens) |
| `image` | Image avec légende (URL ou upload) |
| `quiz` | QCM avec 2 à 6 options, 1 ou N bonnes réponses |
| `video` | Embed vidéo (URL Hi! Tube ou externe) |
| `divider` | Séparateur visuel |

### 4.2 Côté étudiant
- Catalogue : grille de cours filtrables par thématique, tags, niveau, école
- Page cours : lecture séquentielle des blocs
- Quiz interactifs : feedback immédiat (bonne/mauvaise réponse)
- Progression : tracking de complétion par bloc (localStorage + API)
- Certificat de complétion simple (non signé — Hi! Cert hors MVP)

### 4.3 Côté enseignant (Hi! Studio)
- Builder WYSIWYG par blocs (cf. section 5)
- Publication en brouillon / publié / archivé
- Duplication d'un cours existant
- Métadonnées : titre, description courte, couverture, catégorie, tags, niveau, école, durée estimée

### 4.4 Modèle de données
```
Course
  id, title, description, cover_url
  category_id, tags[], level: enum(beginner, intermediate, advanced)
  school_id, created_by, status: enum(draft, published, archived)
  estimated_duration_minutes, created_at, updated_at

CourseBlock
  id, course_id, position (order), type (enum)
  content: JSONB  ← contenu spécifique au type

UserCourseProgress
  user_id, course_id, completed_blocks: int[], completed_at (nullable)
```

---

## 5. Hi! Studio

Builder de cours pour les enseignants. Interface WYSIWYG par blocs.

### 5.1 Fonctionnalités
- Ajout de blocs par type (palette latérale)
- Réordonnancement drag & drop
- Édition inline de chaque bloc
- Prévisualisation mode étudiant
- Sauvegarde automatique (autosave toutes les 30s + bouton manuel)
- Publication avec confirmation

### 5.2 Éditeur de quiz
- Question textuelle
- 2 à 6 options
- Sélection de la/les bonne(s) réponse(s)
- Feedback optionnel par réponse (explication)

### 5.3 Accès
- Rôles autorisés : `teacher`, `admin`, `superuser`
- Route dédiée : `/studio`
- Un enseignant ne voit que ses propres cours dans le studio

---

## 6. Hi! MOOC

Parcours pédagogiques structurés, composés de plusieurs cours.

### 6.1 Structure
- Un MOOC = séquence ordonnée de cours (Hi! Course)
- Organisé en **modules** (chapitres) contenant plusieurs cours
- Progression linéaire ou libre (configurable par l'enseignant)

### 6.2 Côté étudiant
- Page MOOC : présentation, plan du parcours, progression globale
- Inscription au MOOC (bouton "Commencer")
- Accès aux cours dans l'ordre défini
- Tableau de bord de progression : % complété par module

### 6.3 Côté enseignant
- Créer un MOOC en sélectionnant des cours existants
- Organiser en modules, définir l'ordre
- Définir si le parcours est linéaire (cours suivant débloqué à la complétion) ou libre
- Affecter une cohorte d'étudiants (par email ou domaine)

### 6.4 Modèle de données
```
MOOC
  id, title, description, cover_url
  school_id, created_by, status
  is_linear: bool

MOOCModule
  id, mooc_id, title, position

MOOCModuleCourse
  module_id, course_id, position

UserMOOCEnrollment
  user_id, mooc_id, enrolled_at, completed_at (nullable)
```

---

## 7. Hi! App

Catalogue d'applications interactives hébergées (Streamlit, JS).

### 7.1 MVP réduit
- Page catalogue : liste d'apps avec titre, description, tags, école
- Page app : iframe embed de l'application hébergée
- Pas de déploiement automatisé dans le MVP — les apps sont pré-hébergées et référencées par URL

### 7.2 Post-MVP
- Déploiement automatisé depuis un repo Git
- Sandbox isolée par app
- Métriques d'usage

### 7.3 Modèle de données
```
App
  id, title, description, url (embed), thumbnail_url
  tags[], school_id, created_by, visibility
```
## 8. Hi! Certificat

Catalogue d'applications interactives hébergées (Streamlit, JS).

### 7.1 MVP réduit
- Page catalogue : liste des certificats
- Page app : iframe embed de l'application hébergée
- Pas de déploiement automatisé dans le MVP — les apps sont pré-hébergées et référencées par URL

### 7.2 Articulation autour d'un parcours de l'apprenant. Ce base sur les specs de Mooc
---

## 8. Navigation & page d'accueil

### 8.1 Page d'accueil (non connecté)
- Présentation de la plateforme
- Accès aux contenus publics
- Bouton connexion / inscription

### 8.2 Page d'accueil (connecté)
- Bannière principale (configurable par admin)
- Accès rapide aux modules : Hi! Tube, Hi! Course, Hi! MOOC, Hi! App
- Mes cours en cours (reprise de progression)
- Contenus récents / recommandés

### 8.3 Navigation principale
```
[Logo Hi!] | Tube | Cours | MOOCs | Apps | [Recherche] | [Avatar]
```
- Avatar → profil, mes cours, déconnexion
- Si `teacher`/`admin` : lien "Studio" dans le menu

---

## 9. Endpoints API principaux

### Auth
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
POST /api/v1/auth/verify-email
```

### Users
```
GET  /api/v1/users/me
PUT  /api/v1/users/me
GET  /api/v1/users/{id}           (admin)
PUT  /api/v1/users/{id}/role      (admin)
```

### Videos
```
GET  /api/v1/videos
GET  /api/v1/videos/{id}
POST /api/v1/videos               (teacher+)
PUT  /api/v1/videos/{id}          (owner/admin)
DELETE /api/v1/videos/{id}        (owner/admin)
POST /api/v1/videos/{id}/comments
```

### Courses
```
GET  /api/v1/courses
GET  /api/v1/courses/{id}
POST /api/v1/courses              (teacher+)
PUT  /api/v1/courses/{id}         (owner/admin)
PUT  /api/v1/courses/{id}/blocks  (owner/admin)
POST /api/v1/courses/{id}/progress
```

### MOOCs
```
GET  /api/v1/moocs
GET  /api/v1/moocs/{id}
POST /api/v1/moocs                (teacher+)
PUT  /api/v1/moocs/{id}           (owner/admin)
POST /api/v1/moocs/{id}/enroll
GET  /api/v1/moocs/{id}/progress
```

### Apps
```
GET  /api/v1/apps
GET  /api/v1/apps/{id}
POST /api/v1/apps                 (teacher+)
```

---

## 10. Hors scope MVP

- Hi! Cert (badges, certificats signés, parcours de certification)
- Import PDF/PPTX vers cours
- SSO / SAML / CAS
- Interopérabilité Moodle / SCORM
- Déploiement automatisé d'apps
- Recommandations algorithmiques avancées
- Analytics avancées
- Application mobile
