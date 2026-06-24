# À faire de ton côté — Pierre-Antoine

> Actions manuelles que Claude ne peut pas faire (push, config de services externes, comptes).
> Mis à jour le 2026-06-24 (session de nuit autonome).

---

## 🔴 Priorité 1 — Pousser les commits de la nuit

Claude a fait **9 commits locaux** (il ne peut pas pousser — tu pousses via GitHub Desktop).
Ouvre **GitHub Desktop → Push origin**. Liste, du plus ancien au plus récent :

| Commit | Contenu |
|---|---|
| `67fe8f7` | docs: ROADMAP.md (feuille de route complète) |
| `171160f` | docs(roadmap): ajout outils type NotebookLM |
| `b9ab363` | **P1** — abstraction LLM-agnostique (services/llm.py) |
| `12fa9d4` | logging configurable + arrêt du log du code OTP |
| `4782469` | **flashcards** auto (Studio) |
| `d56ddc3` | **carte mentale** auto (Studio) |
| `975a099` | **fiche de révision** auto (Studio) |
| `cfe8354` | **FAQ** auto (Studio) |
| `a1152df` | docs(readme): endpoints Studio v2 + config |

> Après le push, **vérifie que la CI passe au vert** (onglet Actions sur GitHub). Les nouveaux tests
> backend (`test_llm.py`, `test_studio.py`) doivent tourner. Si un job échoue, envoie-moi le log au réveil.

---

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

## ⏭️ Ce qu'il reste à faire ensemble (besoin de toi / décisions produit)

- **Frontend des nouveaux outils Studio** : les endpoints existent, mais **pas encore d'interface**.
  Claude n'a pas pu toucher au frontend cette nuit (npm indisponible dans son shell → risque de casser le build
  sans pouvoir le tester). À faire ensemble : pages/boutons « Générer flashcards / carte mentale / fiche / FAQ »
  dans Hi! Studio.
- **Phase 8 — Broker LLM** : gros chantier avec décisions produit (modèle de clés, quotas, ACL par utilisateur).
  Le point d'insertion est prêt (tous les appels passent par `get_llm_provider()`). À cadrer ensemble.
- **Comptes stores** (pour l'app mobile, plus tard) : Apple Developer (99 $/an) + Google Play (25 $ une fois).

---

*Voir [ROADMAP.md](ROADMAP.md) pour la vue d'ensemble des phases.*
