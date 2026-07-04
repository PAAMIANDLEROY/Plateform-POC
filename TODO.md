# Hi! Platform — Prochaines étapes (TODO)

> Mis à jour le 2026-07-04. Regroupe ce qui a été demandé, ce qui est en attente, et la dette.
> Voir aussi [ROLES-ET-DROITS.md](ROLES-ET-DROITS.md) (RBAC & modules) pour le détail des lots.

---

## 🔜 Demandé récemment
- [x] Footer : description raccourcie → « Plateforme pédagogique mutualisée Hi! PARIS » (FR + EN).
- [x] Édition de contenu : **liste de pages → clic → édition** (onglet Contenu dans /admin).
- [ ] **Pass sur les outils IA** (Studio IA) — à cadrer : périmètre, providers, quotas, UX.
- [ ] **Fiabilité de la BDD / pas de perte de données** — cf. section « Infra & données » (doute exprimé).
- [ ] **Intégrer JupyterLite** — notebooks Python **in-browser** (Pyodide/WASM, sans serveur). Brique
      naturelle pour **Hi! App** et le contenu interactif. À cadrer : page dédiée vs. embarqué dans un cours,
      packages pré-installés, persistance des notebooks (localStorage vs. compte), poids/perf.

## ✍️ Contenu éditable (suite)
- [ ] **Prévisualiser « en tant que rôle »** (voir une page comme student / public) — passe dédiée.
- [ ] **i18n des blocs éditables** : aujourd'hui mono-langue. Si besoin FR/EN éditables → clés par langue
      (`footer.hiparis.label.fr` / `.en`). Le bouton « Contact » est resté en i18n pour cette raison.
- [ ] **Étendre les blocs éditables** à d'autres pages (hero accueil, descriptions de sections, CGU…) :
      envelopper le texte dans `<EditableBlock>` + ajouter la clé à `lib/contentRegistry.ts`.

## 🖥️ Frontend / UX
- [ ] **Nav mobile de l'espace « Mon profil »** : le menu latéral est masqué sous `md` (desktop-first pour l'instant).
- [ ] **Bouton « Signaler »** sur les contenus (le backend `reports` est déjà prêt).
- [ ] Warnings lint `<img>` (préexistants, non bloquants) → `next/image` ou désactivation propre. Optionnel.

## ⚙️ Backend / API
- [ ] **API cours** : `DELETE /courses/{id}` manquant + unifier les 2 mécanismes de progression
      (`/courses/progress` vs `learning.py`) dont dépendent les métriques cohortes. (voir mémoire projet)
- [ ] **Lot 6 — config plateforme** : gérer les domaines email autorisés + les écoles (super_admin).
- [ ] **access_level des cours réglable via l'UI** — bloqué par le gap « Studio save » (création/édition
      de cours pas branchée sur `coursesApi`).
- [ ] **Audit** sur create/update/dépublication de cours (aujourd'hui non journalisés).

## 🗄️ Infra & données (IMPORTANT — doute exprimé sur la persistance)
> Les données Postgres/Supabase sont **durables** (pas perdues au redémarrage). Les vrais risques :
- [ ] **Pause d'inactivité (Supabase free)** : le projet se met en **pause après ~1 semaine** sans activité
      → base injoignable (données conservées) jusqu'à reprise manuelle. **Solution** : un keep-alive
      (cron qui ping `/health` ou fait une petite requête DB) — ou plan payant.
- [ ] **Sauvegardes** : vérifier/activer les **backups** (quotidiens selon le plan). En complément, prévoir
      un **`pg_dump` régulier** exporté ailleurs → vrai filet en cas de mauvaise migration/corruption.
- [ ] **Migrations destructives** : éviter les `drop_column`/`drop_table` sur des données réelles ; toujours
      tester sur une copie. (nos migrations récentes ajoutent surtout des colonnes — OK.)
- [ ] **Render cold start** (~30-50 s à la 1ʳᵉ requête après inactivité) : plan payant ou ping périodique.
- [ ] **Supabase Storage** : confirmer `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` / `SUPABASE_BUCKET` + bucket créé
      (l'upload NeuriPP en dépend).

## 🎓 NeuriPP (décisions orga — voir mémoire `project_neuripp`)
- [ ] Prix (1k€/0,5k€…), tracks, **ouverture** (Hi!Paris → France/monde).
- [ ] **Upvotes** liés aux comptes (remplacent les stars GitHub).
- [ ] **Board scientifique** (via UNITE + les assos).
- [ ] Specs **from-scratch vs building-on-top** : identification des auteurs d'origine + reprise
      communautaire + Hi!PACE comme point de centralité (inspiration : format ICLR blogposts).
- [ ] Récupérer le **repo brouillon de specs** (relancer l'expéditeur si oubli).

## 🧹 Nettoyage / dette
- [x] Pages mock orphelines `/lms/[id]` + `/lms/[id]/student/[userId]` → **supprimées** (+ lien sitemap mort).
- [x] `/dashboard` : sections Insights / Vidéos / Cours → **vraies API** (plus de mock).
- [x] `/my-learning` : titres de cours résolus via `coursesApi` (plus de `MOCK_COURSES`).
- [ ] `output: "export"` : **à décider avec le sujet appli mobile** (un wrap Capacitor a besoin de l'export
      statique ; sinon on peut le retirer pour débloquer les routes dynamiques). Voir section mobile.
- [ ] Mock restant (hors périmètre de ce nettoyage) : `studio`, `tube/[id]`, `insights` — à traiter au fil de l'eau.

---

## ✅ Déjà fait (rappel — cette série de sessions)
- Lots 1→5 (RBAC super_admin, gestion des droits déléguée, cohortes + LMS réel, access_level cours, modération & audit).
- Nettoyage des « fausses stats » sur `/admin` (données réelles).
- Onglet NeuriPP (appel à soumissions + formulaire projet) + upload Supabase (pièce jointe < 1 Mo).
- Blocs de texte **éditables** (inline + panneau admin) avec **brouillon / publication**.
- Refonte nav : top réduit (Insights / Learning×3 / About) + espace « Mon profil » à menu latéral.
- Retrait du déploiement maquette **github.io** (Vercel conservé).
