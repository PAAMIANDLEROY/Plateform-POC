# À faire de ton côté — Pierre-Antoine

> Actions manuelles que Claude ne peut pas faire (push, config de services externes, comptes).
> Mis à jour le 2026-06-24 (session de nuit autonome).

---

## 🔴 Priorité 1 — Pousser les commits + VÉRIFIER LE BUILD FRONTEND

Pousse via **GitHub Desktop → Push origin**. Commits récents (du plus ancien au plus récent) :

| Commit | Contenu |
|---|---|
| `b9ab363` | **P1** — abstraction LLM-agnostique |
| `12fa9d4`…`cfe8354` | logging + flashcards / carte mentale / fiche / FAQ (backend) |
| `a1152df`, `5b66f69`, `5d6fde9` | docs + durcissement mindmap |
| `f12731a` | **Mistral** comme provider LLM |
| `e4bb260` | contraste : fond sombre pages insights |
| `73c33a2` | **page frontend Outils IA** + contraste hub Studio |
| `c8780c3` | contraste : fond sombre excel-quiz / video-course |
| `488d34e` | contraste : fond sombre pages détail (cours/mooc/vidéo/lms) |

> ⚠️ **IMPORTANT — vérifie le build après push.** Claude n'a **pas** pu lancer `npm run build`/`lint`
> en local (npm absent de son shell). Les modifs frontend (nouvelle page + corrections contraste) sont
> écrites en calquant les patterns existants, mais **non vérifiées par un build**. Surveille le job
> **`Build — GitHub Pages`** dans l'onglet Actions :
> - ✅ vert → tout est bon.
> - ❌ rouge → copie-moi l'erreur, je corrige (probablement une broutille TS/JSX dans un fichier précis).

---

## 🟢 Cours dans Supabase (« les cours ont disparu »)

Les cours n'apparaissaient pas car **Supabase était vide** (les migrations créaient les tables
mais aucun contenu) — ce n'était PAS lié aux corrections de contraste. La migration **`0006`**
(commit `f13bd15`) seede **11 cours de démo + blocs** (mêmes ids que le catalogue : `/courses/1`…`11`)
et un enseignant démo propriétaire.

**Elle s'exécute automatiquement au prochain déploiement Render** (migrations au démarrage).
Après push + redeploy, vérifie les **logs Render** au démarrage :
- ✅ `Running upgrade 0005 -> 0006` → cours seedés, `/courses/1` fonctionne.
- ⚠️ `Migrations skipped: ...` → la migration a échoué (copie-moi l'erreur).

> Note : seuls les **cours** sont seedés pour l'instant. Vidéos / MOOCs / apps sont encore vides —
> dis-moi si tu veux que je les seede pareil (même méthode).

## 🟠 Priorité 2 — Activer les nouvelles fonctions IA en production

Les nouveaux outils Studio (flashcards, carte mentale, fiche de révision, FAQ) **fonctionnent déjà**,
mais renvoient du **contenu de démonstration** tant qu'aucune clé LLM n'est configurée sur Render.

Sur **Render → Environment** — tu pars sur **Mistral** d'abord, donc :

| Variable | Valeur | Pourquoi |
|---|---|---|
| `LLM_PROVIDER` | `mistral` | Provider actif |
| `MISTRAL_API_KEY` | `...` (clé console.mistral.ai) | Active la vraie génération IA (sinon démo) |
| `LLM_MODEL` | *(vide)* | Laisse vide = `mistral-large-latest` par défaut |
| `LOG_LEVEL` | `INFO` | Rend les logs applicatifs visibles (défaut déjà INFO) |

> Récupère ta clé sur **console.mistral.ai → API Keys**.
> Pour changer de fournisseur plus tard : `LLM_PROVIDER=anthropic`+`ANTHROPIC_API_KEY`, ou
> `LLM_PROVIDER=openai`+`OPENAI_API_KEY`. **Aucun changement de code** (abstraction P1).

---

## 🟡 Priorité 3 — Finitions déploiement (déjà signalées)

- [ ] **Render** : confirmer `COOKIE_SECURE=true` et `FRONTEND_URL` (le login marche, donc sans doute déjà OK).
- [ ] **Resend** : pour envoyer des emails à **n'importe quelle adresse** (pas seulement la tienne en mode test),
      vérifier un domaine dans **Resend → Domains → Add Domain** (enregistrements DNS SPF/DKIM),
      puis mettre `EMAIL_FROM=noreply@<ton-domaine>` sur Render.
- [ ] **Render cold start** (~30-50s à la 1ʳᵉ requête après 15 min d'inactivité) : à régler avant une démo
      publique → plan payant Render, ou un petit ping périodique (cron) sur `/health`.

---

## 🧪 Tester les nouveaux endpoints (optionnel, quand tu veux)

Une fois connecté (token), tu peux essayer côté API. Exemple flashcards :

```bash
curl -X POST https://hiplatform-api.onrender.com/api/v1/studio/flashcards \
  -H "Authorization: Bearer <ton_access_token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"<colle ici le markdown d un cours>","n_cards":8,"language":"fr"}'
```

Même schéma pour `/mindmap`, `/study-sheet`, `/faq` (corps `{"content": "..."}`).
Doc interactive : `https://hiplatform-api.onrender.com/docs`.

---

## 🎨 Audit contraste — fait (à confirmer visuellement)

La plateforme avait une **migration thème sombre → clair incomplète** : plusieurs pages étaient
restées « dark » (texte blanc) mais affichées sur le nouveau fond clair → **texte invisible**.
Corrigé en redonnant un fond sombre (`bg-navy`) à ces pages :
- **insights** (article + éditeur), **studio** (excel-quiz, video-course, nouvelle page outils IA),
  **détail** cours / MOOC / vidéo / cohorte LMS / élève.
- Hub Studio (page claire) : titres blancs sur cartes blanches → repassés en gris foncé.
- Pages OK laissées telles quelles : listes (cours, vidéos, insights), dashboard, CGU/confidentialité
  (déjà `bg-black`).

> À confirmer d'un coup d'œil une fois déployé. Si une page te semble incohérente (panneau sombre
> centré sur fond clair), dis-le moi : on pourra soit la passer entièrement en thème clair, soit
> ajuster. Mon choix « fond sombre » préserve le design d'origine de ces pages avec le moins de risque.

## ⏭️ Ce qu'il reste à faire ensemble (besoin de toi / décisions produit)

- **Frontend des nouveaux outils Studio** : ✅ fait — page `/studio/ai-tools` (accessible depuis
  Hi! Studio → onglet « Studio IA » → carte « Outils IA »). Reste à la tester en vrai une fois le build OK.
- **Phase 8 — Broker LLM** : gros chantier avec décisions produit (modèle de clés, quotas, ACL par utilisateur).
  Le point d'insertion est prêt (tous les appels passent par `get_llm_provider()`). À cadrer ensemble.
- **Comptes stores** (pour l'app mobile, plus tard) : Apple Developer (99 $/an) + Google Play (25 $ une fois).

---

*Voir [ROADMAP.md](ROADMAP.md) pour la vue d'ensemble des phases.*
