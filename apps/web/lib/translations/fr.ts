/**
 * @file lib/translations/fr.ts
 * @description Dictionnaire de traductions **français** pour Hi! Platform.
 *
 * Ce fichier est la source de vérité du type `Translations` exporté en bas de fichier.
 * Le type est dérivé via `typeof fr` pour garantir que toutes les clés de `en.ts`
 * correspondent exactement à ce dictionnaire (vérification TypeScript à la compilation).
 *
 * ## Structure des namespaces
 *
 * | Namespace        | Contenu                                                     |
 * |------------------|-------------------------------------------------------------|
 * | `common`         | Libellés communs (boutons, états, messages d'erreur)        |
 * | `levels`         | Niveaux de difficulté (beginner / intermediate / advanced)  |
 * | `roles`          | Rôles utilisateurs (student / teacher / admin / ...)        |
 * | `nav`            | Navigation : items, sections, dropdown labels               |
 * | `footer`         | Pied de page : description, liens, copyright                |
 * | `dashboard`      | Page d'accueil : hero, modules, banners, titres de sections |
 * | `login`          | Flux de connexion OTP (email → code à 6 chiffres)          |
 * | `completeProfile`| Formulaire de complétion du profil (première connexion)     |
 * | `profile`        | Page profil (boutons, labels, section RGPD)                 |
 * | `myLearning`     | Page "Mon parcours" (stats, onglets, badges, certificats)   |
 * | `cookie`         | Bannière de consentement cookies (3 catégories)             |
 * | `verifyEmail`    | Page rétro-compat liens email anciens                       |
 *
 * ## Convention
 *
 * - Toutes les valeurs sont des chaînes statiques.
 * - Les variables dynamiques utilisent la syntaxe `{{name}}` (ex: `"Bonjour {{name}}"`).
 *   Le remplacement est effectué côté composant consommateur via `replace("{{name}}", value)`.
 * - Les clés sont en camelCase, les namespaces en camelCase ou dotNotation.
 *
 * @example
 * // Consommation dans un composant
 * import { useLanguage } from "@/lib/LanguageContext";
 * const { t } = useLanguage();
 * <p>{t.dashboard.greeting}, {user.firstName}</p>
 * // → "Bonjour, Marie"
 */

export const fr = {
  // ── Libellés communs ──────────────────────────────────────────────────────────
  common: {
    seeAll:    "Voir tout",
    loading:   "Chargement...",
    saving:    "Enregistrement...",
    save:      "Enregistrer",
    cancel:    "Annuler",
    edit:      "Modifier",
    delete:    "Supprimer",
    export:    "Exporter",
    create:    "Créer",
    search:    "Rechercher...",
    filter:    "Filtrer",
    publish:   "Publier",
    draft:     "Brouillon",
    published: "Publié",
    archived:  "Archivé",
    min:       "min",
    error:     "Une erreur est survenue",
  },

  // ── Niveaux de difficulté ─────────────────────────────────────────────────────
  levels: {
    beginner:     "Débutant",
    intermediate: "Intermédiaire",
    advanced:     "Avancé",
  },

  // ── Rôles utilisateurs ────────────────────────────────────────────────────────
  roles: {
    student:   "Étudiant",
    teacher:   "Enseignant",
    admin:     "Administrateur",
    super_admin: "Super Admin",
    public:    "Visiteur",
  },

  // ── Navigation ────────────────────────────────────────────────────────────────
  nav: {
    insights:       "Insights",
    about:          "NeuriPP",
    myLearning:     "Mon parcours",
    studio:         "Studio",
    lms:            "LMS",
    admin:          "Admin",
    login:          "Connexion",
    profile:        "Mon profil",
    logout:         "Se déconnecter",
    administration: "Administration",
    // Sections du mega-menu (3 piliers pédagogiques Hi! PARIS)
    sections: {
      learningAI: {
        label:       "Learning AI",
        description: "Fondamentaux et recherche en IA",
      },
      learningWith: {
        label:       "Learning With AI",
        description: "Apprendre en utilisant l'IA comme outil",
      },
      learningEdge: {
        label:       "Learning at the Edge",
        description: "Frontières et enjeux de l'IA",
      },
    },
    // Items de navigation par module dans les dropdowns
    items: {
      tube:   "Vidéothèque pédagogique",
      course: "Cours interactifs",
      mooc:   "Parcours structurés",
      app:    "Applications interactives",
    },
  },

  // ── Pied de page ─────────────────────────────────────────────────────────────
  footer: {
    description:
      "Plateforme pédagogique mutualisée Hi! PARIS — Institut Polytechnique de Paris, HEC Paris, Télécom Paris, ENSAE.",
    contact: "Contact",
    sections: {
      platform: "Plateforme",
      info:     "Informations",
    },
    links: {
      insights:  "Insights",
      videos:    "Vidéos",
      courses:   "Cours",
      moocs:     "MOOCs",
      apps:      "Applications",
      privacy:   "Confidentialité",
      cgu:       "CGU",
      account:   "Mon compte",
      myLearning: "Mon parcours",
    },
    copyright: "Tous droits réservés.",
  },

  // ── Dashboard / Page d'accueil ────────────────────────────────────────────────
  dashboard: {
    hero: {
      badge:            "Hi! PARIS · Hi! PACE",
      title:            "La recherche IA",
      titleAccent:      "à votre portée",
      description:
        "Articles de recherche, cours, vidéos et MOOCs produits par les chercheurs de Hi! PARIS — tout en un seul endroit.",
      discoverInsights: "Découvrir les Insights",
      exploreCourses:   "Explorer les cours",
    },
    greeting: "Bonjour",
    modules: {
      insights: { name: "Insights",    desc: "Recherche & actualité" },
      tube:     { name: "Hi! Tube",    desc: "Vidéothèque pédagogique" },
      course:   { name: "Hi! Course",  desc: "Cours interactifs" },
      mooc:     { name: "Hi! MOOC",    desc: "Parcours structurés" },
      app:      { name: "Hi! App",     desc: "Applications interactives" },
    },
    banners: {
      insights: {
        title: "Recherche & Insights Hi! PARIS",
        desc:  "Articles interactifs publiés par les chercheurs de Hi! PARIS, Polytechnique, Télécom Paris et HEC.",
        cta:   "Lire les Insights",
      },
      courses: {
        title: "Apprenez les fondamentaux de l'IA",
        desc:  "Des cours conçus par les chercheurs de Hi! PARIS, Polytechnique et Télécom Paris.",
        cta:   "Explorer les cours",
      },
      apps: {
        title: "Expérimentez en temps réel",
        desc:  "Accédez à des applications interactives pour tester vos modèles directement dans le navigateur.",
        cta:   "Lancer une app",
      },
    },
    sections: {
      latestInsights:   "Derniers Insights",
      insightsSubtitle: "Articles publiés par Hi! PARIS",
      popularVideos:    "Vidéos populaires",
      recentCourses:    "Cours récents",
    },
  },

  // ── Page de connexion (flux OTP) ──────────────────────────────────────────────
  login: {
    tagline:       "Plateforme pédagogique Hi! PARIS",
    quote: '"La plateforme qui réunit la recherche en IA et la formation de demain."',
    title:         "Connexion",
    subtitle:
      "Entrez votre email institutionnel pour recevoir un code à 6 chiffres.",
    emailLabel:    "Email institutionnel",
    emailPlaceholder: "prenom.nom@ip-paris.fr",
    sendCode:      "Recevoir le code",
    codeSentTitle: "Code envoyé ✓",
    codeSentTo:    "Code envoyé à",
    verify:        "Vérifier",
    resend:        "Renvoyer le code",
    disclaimer:    "Réservé aux membres des institutions partenaires d'Hi! PARIS.",
    errorDefault:  "Une erreur est survenue",
    errorCode:     "Code invalide ou expiré",
  },

  // ── Complétion du profil (première connexion) ─────────────────────────────────
  completeProfile: {
    title:              "Bienvenue sur Hi! Platform",
    subtitle:           "Complétez votre profil pour commencer.",
    firstName:          "Prénom *",
    lastName:           "Nom *",
    school:             "École / Institution",
    selectSchool:       "— Sélectionner —",
    bio:                "Biographie",
    optional:           "(optionnel)",
    networks:           "Réseaux",
    bioPlaceholder:     "Quelques mots sur vous, vos centres d'intérêt...",
    linkedinPlaceholder: "linkedin.com/in/marie-curie",
    githubPlaceholder:  "github.com/marie-curie",
    submit:             "Accéder à la plateforme →",
    firstNamePlaceholder: "Marie",
    lastNamePlaceholder:  "Curie",
    requiredError:      "Le prénom et le nom sont requis.",
  },

  // ── Page profil ───────────────────────────────────────────────────────────────
  profile: {
    editBtn:   "Modifier",
    cancelBtn: "Annuler",
    saveBtn:   "Enregistrer",
    success:   "Profil mis à jour avec succès.",
    incomplete: "Profil incomplet",
    fields: {
      firstName:        "Prénom",
      lastName:         "Nom",
      email:            "Email",
      school:           "Institution",
      bio:              "Biographie",
      linkedin:         "LinkedIn",
      github:           "GitHub",
      avatarUrl:        "URL photo de profil",
      avatarPlaceholder: "https://...",
    },
    // Section RGPD de la page profil
    rgpd: {
      title:        "Vos données & vie privée",
      exportTitle:  "Exporter mes données",
      exportDesc:   "Téléchargez l'intégralité de vos données en JSON (Art. 20 RGPD)",
      exportBtn:    "Exporter JSON",
      consentTitle: "Gérer mes consentements",
      consentDesc:  "Analytics, tracking comportemental (Art. 21 RGPD)",
      consentLink:  "Voir la politique →",
      deleteTitle:  "Supprimer mon compte",
      deleteDesc:   "Anonymisation sous 30 jours (Art. 17 RGPD)",
      deleteBtn:    "Supprimer",
      deleteConfirm:
        "Supprimer définitivement votre compte ? Vos données seront anonymisées sous 30 jours. Cette action est irréversible.",
    },
  },

  // ── Page "Mon parcours" ───────────────────────────────────────────────────────
  myLearning: {
    title:         "Mon parcours",
    // {{name}} est remplacé côté composant par le prénom de l'utilisateur
    subtitle:      "Bonjour {{name}} — voici votre progression sur Hi! Platform",
    subtitleGuest: "Voici votre progression sur Hi! Platform",
    stats: {
      started:      "Cours commencés",
      completed:    "Cours complétés",
      badges:       "Badges obtenus",
      certificates: "Certificats",
    },
    tabs: {
      progress:     "Ma progression",
      badges:       "Badges",
      certificates: "Certificats",
    },
    progress: {
      empty:       "Aucun cours commencé",
      emptyDesc:   "Explorez le catalogue pour commencer à apprendre.",
      explore:     "Explorer les cours →",
      markDone:    "Marquer terminé",
      getCert:     "Obtenir certificat",
      completedOn: "✓ Complété le",
      startedOn:   "Commencé le",
      quizScore:   "Score quiz :",
    },
    badges: {
      earned: "Badges obtenus",
      locked: "Badges à débloquer",
      empty:  "Aucun badge disponible",
    },
    certificates: {
      empty:     "Aucun certificat encore",
      emptyDesc: "Complétez un cours pour obtenir votre premier certificat.",
      issuedOn:  "Délivré le",
      verify:    "Vérifier l'authenticité →",
      download:  "Télécharger PDF",
    },
    toast: {
      completed:     "Cours marqué comme complété !",
      issued:        "Certificat émis !",
      downloadError: "Erreur lors du téléchargement",
    },
  },

  // ── Bannière cookies ──────────────────────────────────────────────────────────
  cookie: {
    title:       "🍪 Cookies & confidentialité",
    description:
      "Nous utilisons des cookies nécessaires au fonctionnement de la plateforme. Avec votre accord, nous collectons aussi des données d'usage anonymisées pour améliorer votre expérience.",
    privacyLink: "Politique de confidentialité",
    customize:   "Personnaliser",
    refuseAll:   "Refuser tout",
    acceptAll:   "Accepter tout",
    preferences: "Gérer mes préférences",
    saveChoices: "Enregistrer mes choix",
    // Catégorie 1 : cookies obligatoires
    necessary: {
      title: "Cookies nécessaires",
      desc:  "Authentification, sécurité, session. Obligatoires au fonctionnement.",
    },
    // Catégorie 2 : analytics anonymisés
    analytics: {
      title: "Cookies analytiques",
      desc:  "Statistiques d'usage anonymisées (pages vues, temps passé). 6 mois.",
    },
    // Catégorie 3 : tracking comportemental du parcours
    tracking: {
      title: "Tracking comportemental",
      desc:  "Suivi détaillé de votre parcours d'apprentissage. 6 mois max.",
    },
  },

  // ── Page de vérification email (rétro-compat liens anciens) ──────────────────
  verifyEmail: {
    title:       "Authentification par code",
    description:
      "Hi! Platform utilise désormais un code à 6 chiffres envoyé par email. Connectez-vous directement depuis la page de connexion.",
    loginBtn:    "Aller à la connexion",
  },
};

/**
 * Type dérivé de l'objet `fr`.
 * Importé dans `en.ts` pour forcer la parité des clés entre les deux langues.
 *
 * @example
 * // en.ts
 * import type { Translations } from "./fr";
 * export const en: Translations = { ... }; // Erreur TS si une clé manque
 */
export type Translations = typeof fr;
