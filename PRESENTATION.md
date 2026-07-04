# Hi! Platform — Présentation

> Plateforme pédagogique mutualisée **Hi! PARIS** (HEC Paris + Institut Polytechnique de Paris).
> Objectif : remplacer Moodle et les LMS externes par une solution moderne, open source, contrôlée en interne.
> Document de présentation, chapitre par chapitre.

---

## Chapitre 1 — Vision

Hi! Platform réunit **au même endroit** ce qui est aujourd'hui éparpillé : vidéos, cours, MOOCs,
applications interactives, outils de création et de certification. Trois inspirations UX :

- **YouTube** pour l'engagement (vidéothèque, découverte),
- **Google Colab** pour l'interactivité technique,
- une logique **certifiante** (badges, certificats).

Style : moderne, épuré, académique sans être austère. Couleurs Hi! PARIS (bleu `#1A3A8F`, rouge `#D72638`).

---

## Chapitre 2 — Les modules

La plateforme est **modulaire** (chaque module déployable indépendamment) :

| Module | Rôle |
|---|---|
| **Hi! Tube** | Vidéothèque style YouTube |
| **Hi! Course** | Catalogue de cours (markdown + quiz) |
| **Hi! MOOC** | Parcours structurés multi-cours (avec prérequis) |
| **Hi! App** | Hébergement d'applications (Streamlit, démos…) |
| **Hi! Studio** | Builder de cours pour enseignants (dont génération IA) |
| **Hi! Cert** | Certification + badges |

Le catalogue est organisé en trois univers : **Learning AI**, **Learning with AI**, **Learning at the Edge**.

---

## Chapitre 3 — Rôles & droits

Cinq rôles, par privilège croissant :

```
public  <  student  <  teacher  <  admin  <  super_admin
```

| Rôle | Accès |
|---|---|
| **public** | Base de cours « simple » (contenu ouvert) |
| **student** (User+) | Base « Hi! PARIS » (domaine autorisé) + cours de ses cohortes |
| **teacher** (prof) | Crée/gère ses cohortes et élèves, donne accès à des cours, crée du contenu (Studio) |
| **admin** | Consultation totale, modération, gestion des rôles **jusqu'à `teacher`** |
| **super_admin** | Contrôle total : config plateforme, écoles, **crée/retire les `admin`** |

**Principe de délégation** : chacun ne gère que les rôles **strictement inférieurs** au sien.
Un admin fabrique des profs, mais seul un super_admin fabrique des admins. Le dernier super_admin
ne peut pas être rétrogradé (garde-fou anti-orphelinage).

---

## Chapitre 4 — Accès au contenu (les 3 bases)

Chaque cours porte un **niveau d'accès** :

- `public` — visible de tous (base « simple ») ;
- `hiparis` — réservé aux élèves des écoles partenaires (base « Hi! PARIS ») ;
- `cohort` — réservé aux membres d'une **cohorte** à qui le cours a été accordé.

Le catalogue se **filtre automatiquement** selon le rôle. Les enseignants et admins voient tout le
catalogue publié (pour curation et assignation).

---

## Chapitre 5 — Cohortes & suivi (LMS)

Un enseignant crée des **cohortes**, y **inscrit des élèves**, et leur **donne accès à des cours** du
catalogue. Le tableau de bord LMS affiche des **métriques réelles** calculées à partir de la progression :
taux de complétion, score moyen, et **apprenants à risque** (inactivité ou score faible).

Chaque prof ne voit que **ses** cohortes ; admins et super_admin voient tout.

---

## Chapitre 6 — Hi! Studio (création assistée par IA)

Studio permet aux enseignants de **produire du contenu rapidement** :

- **Excel → Quiz** : un fichier de questions devient un quiz interactif ;
- **Vidéo + slides → Cours** : transcription (Whisper) + slides → cours Markdown structuré ;
- Outils IA : **flashcards**, **carte mentale**, **fiche de révision**, **FAQ**.

La couche LLM est **agnostique** (Anthropic / OpenAI / Mistral) — on change de fournisseur sans toucher au code.

---

## Chapitre 7 — NeuriPP (appel à soumissions EdTech)

Un **track dédié** pour agréger les outils pédagogiques développés par les étudiants, les mettre en
commun et **itérer collectivement** dessus. Les étudiants soumettent un projet via un formulaire structuré :

- dépôt **GitHub**, page projet, **démo**, **licence** ;
- **catégorie d'usage** (tuteur perso, révision, contenus interactifs, assistance à la correction,
  apprendre avec/malgré l'IA, QCM automatiques) ;
- périmètre (matière spécifique vs tous domaines), type de modèle (open vs API) ;
- **consentement** aux règles (accord de l'enseignant) ; pièce jointe optionnelle.

Vision pluriannuelle : d'abord des projets *from scratch*, puis un track *building on top* (reprise
communautaire), avec identification des auteurs d'origine et Hi!PACE comme point de centralité.

---

## Chapitre 8 — Contenu éditable (no-code léger)

Le texte des pages peut être **édité directement depuis l'interface** par un admin, sans redéploiement :

- édition **inline** (un crayon sur la page) ou centralisée (**panneau Contenu** dans l'admin) ;
- flux **brouillon → publication** : un admin voit ses brouillons en aperçu, le public voit le publié ;
- chaque texte garde une **valeur par défaut codée** (aucune régression si un bloc n'existe pas).

---

## Chapitre 9 — Modération, audit & sécurité

- **Signalement** de contenu par tout utilisateur ; file de traitement pour les admins (avec masquage).
- **Journal d'audit** : chaque action sensible (changement de rôle, suspension, cohorte, publication de
  contenu, modération) est tracée (qui, quoi, quand).
- **Suspension / réactivation** de comptes ; contrôle d'accès appliqué **côté serveur** (le frontend
  n'améliore que l'UX).

---

## Chapitre 10 — Authentification & RGPD

- Connexion par **code à usage unique (OTP)** envoyé par email institutionnel — pas de mot de passe à gérer.
- **JWT** : access token court (15 min) + refresh token (30 j) en cookie `httpOnly`.
- Domaines email autorisés configurables (ex. `@polytechnique.edu`, `@hec.fr`…).
- **RGPD natif** : droit d'accès, rectification, effacement (anonymisation), portabilité (export),
  gestion des consentements.

---

## Chapitre 11 — Architecture technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | FastAPI (Python 3.12) + SQLAlchemy + Alembic |
| Base de données | PostgreSQL (Supabase) |
| Stockage fichiers | Supabase Storage |
| IA | Claude / OpenAI / Mistral (couche agnostique) · Whisper (transcription) |

Monorepo : `apps/web` (frontend) · `apps/api` (backend) · `packages/shared` (types partagés).
Détails : voir [README.md](README.md) et [ROLES-ET-DROITS.md](ROLES-ET-DROITS.md).

---

## Chapitre 12 — Déploiement

- **Frontend** : Vercel · **Backend** : Render · **Données/Storage** : Supabase.
- **CI/CD** GitHub Actions : tests backend (pytest) + vérification du build frontend + déploiement Vercel.
- Bilingue **FR / EN**.

---

## Chapitre 13 — Feuille de route

**Livré** : les modules cœur, le RBAC avec délégation, les cohortes et le suivi réel, les niveaux
d'accès aux cours, la modération & l'audit, NeuriPP, le contenu éditable, la refonte de la navigation.

**À venir** : appli mobile, notebooks interactifs (**JupyterLite**), config plateforme par super_admin,
fiabilisation des données (backups), SSO/SAML, interopérabilité SCORM. Détail dans [TODO.md](TODO.md).

---

*Hi! PARIS — usage interne.*
