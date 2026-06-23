# Hi! Platform — Feuille de route

> Synthèse des chantiers à venir, issue du brief P. Braun + besoins produit.
> Continuité des phases 0–7 (livrées). Source de vérité pour le séquençage du développement.

**Légende statut :** ✅ livré · 🚧 en cours · ⬜ à faire · 🔶 extension d'un acquis
**Légende effort :** S (petit) · M (moyen) · L (gros chantier)

---

## 0. État actuel (acquis)

| Domaine | Statut |
|---|---|
| Auth OTP + JWT + RGPD, rôles (student/teacher/admin/superuser/public) | ✅ |
| Cours → blocs, progression, commentaires vidéo | ✅ |
| Studio : Excel → Quiz · Vidéo+Slides → Cours markdown | ✅ |
| MOOC / modules / prérequis, badges, certificats PDF+QR | ✅ |
| Analytics : KPIs, at-risk (seuils manuels), export CSV | ✅ |
| Catalogue d'apps (GitHub API) | ✅ |
| **Déploiement bout-en-bout** Vercel ↔ Render ↔ Supabase ↔ Resend (login réel OK) | ✅ |

---

## 1. Prérequis transverses (à faire en premier — débloquent le reste)

Ces fondations conditionnent plusieurs phases. À traiter avant d'attaquer la couche IA et le mobile.

| # | Chantier | Objectif | Effort | Statut |
|---|---|---|---|---|
| **P1** | **Abstraction LLM-agnostique** | Refondre `services/ai.py` derrière une interface `LLMProvider` (generate, chat, embed) ; le modèle devient un paramètre de config swappable. Préalable au broker et à tous les pipelines IA. | M | ⬜ |
| **P2** | **Socle RAG / base vectorielle** | Ingestion des cours (markdown/blocs) → chunking → embeddings → store vectoriel (pgvector sur Supabase, déjà PostgreSQL). API de recherche sémantique réutilisable. Préalable à Q&R, tuteur, distribution, assemblage, suggestion. | L | ⬜ |
| **P3** | **Auth "mobile-ready"** | Flux de tokens utilisable hors navigateur : endpoint d'échange renvoyant access+refresh en **corps JSON** (pas seulement cookie httpOnly), rotation refresh côté client mobile. Préalable à l'app mobile. | M | ⬜ |

---

## 2. Phases produit

### Phase 8 — Broker LLM & gouvernance des coûts  ⬜  (effort L · dépend de P1)
Réponse à la contrainte de dépense publique (pas de pay-as-you-go ouvert).
- ⬜ Passerelle interne d'appel LLM (type OpenRouter) : tous les appels IA passent par un broker.
- ⬜ **Crédits plafonnés** globaux + par clé.
- ⬜ **Clés API distribuables** (par enseignant / cohorte) avec **limite par clé**.
- ⬜ **ACL par utilisateur** : autoriser/interdire certains modèles.
- ⬜ Tableau de bord conso (crédits restants, par clé, par modèle).
- *Impacts :* nouvelles tables `llm_keys`, `llm_usage` ; middleware de comptage ; UI admin.

### Phase 9 — Assistant IA pédagogique  ⬜  (effort L · dépend de P1, P2, 8)
- ⬜ **RAG / Q&R sur les cours** — réponses ancrées sur le contenu, à plusieurs niveaux de détail, avec citations des sources.
- ⬜ **Bouton « je ne comprends pas »** — reformulation à la volée d'un passage. *(quick win une fois P2 posé)*
- ⬜ **Suggestion / recoupement de cours** — recommandations entre cours proches (similarité d'embeddings).

### Phase 10 — Tuteur guidé & personnalisation  ⬜  (effort L · dépend de 9)
- ⬜ **Tuteur pas-à-pas (« Deep Tutor »)** — indices progressifs au lieu de la solution, anti copier-coller.
- ⬜ **Distribution personnalisée des ressources** *(priorité n°1 du brief)* — suggérer/contextualiser la bonne ressource selon l'usage de l'apprenant.
- ⬜ **Assemblage personnalisé** *(priorité n°2 du brief)* — redécouper exercice/leçon selon une auto-évaluation initiale.

### Phase 11 — Studio v2 & outils type NotebookLM  ⬜  (effort M · dépend de P1)
- ⬜ **Flashcards automatiques** depuis un cours *(quick win, très demandé)*.
- 🔶 **MOOC semi-automatisé** — transcription vidéo + slides → squelette de MOOC entier pré-créé (extension du pipeline vidéo→cours existant).
- ⬜ **Outils dérivés type NotebookLM** — à partir d'un cours/document, générer automatiquement : **carte mentale**, fiche de révision, FAQ, résumé audio (« podcast »), chronologie. Deux voies : (a) **connecteur** vers un outil externe (NotebookLM n'a pas d'API publique stable → plutôt en V2), (b) **équivalents maison** via nos pipelines LLM — la carte mentale et la fiche de révision sont faciles à produire (JSON → rendu front), à privilégier en premier.

### Phase 12 — Pédagogie interactive  ⬜  (effort L)
- ⬜ **Playground d'exercices de code pas-à-pas** (type AnswerFlow) — ~20 exercices enchaînés, exécution, entraînement manuel puis automatique, suivi complet.
- 🔶 **Parcours d'exercices structuré** — exercices enchaînés + quiz intermédiaires + **badges à mi-parcours** + certificat final (orchestration des briques existantes).
- ⬜ **Sandbox projet** — l'apprenant implémente son propre projet (entrepreneurial ou autre).

### Phase 13 — Analytics avancé & classification  ⬜  (effort M/L)
- ⬜ **Tracking granulaire** — temps **par exercice**, vitesse de navigation, activité/inactivité fine (events front → backend).
- ⬜ **Algorithme de classification ML** — déterminer automatiquement les élèves à suivre (actif/inactif/à risque), au-delà des seuils manuels actuels.
- 🔶 **Fiche de suivi par élève** — vue individuelle détaillée côté enseignant.
- ⬜ **Indicateurs d'apprentissage prioritaires** — définir de meilleures métriques que le temps passé.

### Phase 14 — Modèle & périmètre élargis  ⬜  (effort M)
- ⬜ **Multi-public** — Bachelor, cycle supérieur, **Exec Ed (HEC)**, **grand public** (dissémination) : impacte rôles, visibilité, parcours.
- ⬜ **Modèle ouvert public / privé** — cours accessibles hors établissement (partie publique / partie privée).
- ⬜ **Réutilisation collaborative de briques** — reprendre/forker un cours d'une autre école (clé de la mutualisation entre 8 écoles).
- 🔶 **Couche « Parcours » explicite** — formaliser la hiérarchie brique(cours) → module → parcours.

### Phase 15 — Application mobile  ⬜  (effort L) — *détaillée ci-dessous*

### Phase 16 — Adoption & feedback  ⬜  (effort S/M)
- ⬜ **Recueil de feedback intégré** à la plateforme (remplace l'Excel/formulaire externe), agrégeable par cours / par promo.

---

## 3. Phase 15 détaillée — Application mobile (+ tout ce qui va avec)

**Choix techno recommandé : React Native + Expo.** Cohérent avec la stack TypeScript existante, partage des types et du client API via `packages/shared`, build/déploiement gérés par EAS. Alternative légère : PWA (déjà envisagée en V2) si l'on veut éviter les stores — mais limite le push natif et l'offline avancé.

### 3.1 Fondations
- ⬜ Nouvel espace monorepo **`apps/mobile`** (Expo + TypeScript).
- ⬜ **Client API & types partagés** — extraire `lib/api.ts` + types vers `packages/shared`, consommé par web ET mobile.
- ⬜ **Design system mobile** — décliner couleurs (`#1A3A8F` / `#D72638`) et composants (Button, Input, Card…) en RN.

### 3.2 Auth & sécurité (dépend de P3)
- ⬜ **Flux bearer token** — le cookie httpOnly du web ne marche pas en natif ; échange OTP → access+refresh en JSON.
- ⬜ **Stockage sécurisé** des tokens (`expo-secure-store` / Keychain / Keystore).
- ⬜ Rotation refresh + déconnexion propre.

### 3.3 Fonctionnalités natives
- ⬜ **Notifications push** (Expo Push → APNs/FCM) — code OTP, rappels de cours, nudges « à risque », nouveaux contenus. *(table `push_tokens` côté backend)*
- ⬜ **Mode hors-ligne** — cache des cours consultés + **téléchargement** pour consultation offline, synchro de la progression au retour réseau.
- ⬜ **Lecteur vidéo** mobile (Hi! Tube) + reprise de lecture.
- ⬜ **Deep links / universal links** — ouvrir un cours/parcours depuis un lien ou une notif.

### 3.4 Industrialisation
- ⬜ **CI/CD mobile** — EAS Build (iOS + Android), builds de preview par PR.
- ⬜ **Comptes stores** — Apple Developer (99 $/an) + Google Play (25 $ une fois). *(action administrative à anticiper)*
- ⬜ **Soumission stores** — fiches, captures, politique de confidentialité (réutiliser la page RGPD existante).
- ⬜ **Impacts backend** — endpoints d'enregistrement de push token, livraison de fichiers adaptée mobile, CORS/headers pour origine native.

---

## 4. Infra continue

- ⬜ **Migration cloud OVH / Scaleway** (courant 2026) — sortir des offres gratuites (Vercel/Render/Supabase) vers une infra UE maîtrisée. Architecture « suffisamment propre » : priorité zéro fuite de données + conformité légale.
- ⬜ **Vérification domaine Resend** (DNS SPF/DKIM) → sortir du mode test email, envoyer à toute adresse.
- ⬜ **Anti cold-start Render** (plan payant ou keep-alive) avant démo publique.
- ⬜ **Config logging** backend (rendre les INFO visibles, niveau configurable).

---

## 5. Séquençage proposé

```
P1 (abstraction LLM) ─┬─> Phase 8 (broker) ─> Phase 9 (RAG Q&R) ─> Phase 10 (tuteur/perso)
P2 (socle RAG) ───────┘                    └─> Phase 11 (Studio v2 : flashcards)
P3 (auth mobile) ───────────────────────────> Phase 15 (mobile)
Phases 12 / 13 / 14 / 16 : parallélisables selon priorités
Infra continue : en fond de tâche
```

**Quick wins** (impact rapide, faible coût) : flashcards (Ph.11), bouton « je ne comprends pas » (Ph.9), feedback intégré (Ph.16), abstraction `ai.py` (P1).
**Gros chantiers** : socle RAG (P2), broker LLM (Ph.8), playground code (Ph.12), mobile (Ph.15).
