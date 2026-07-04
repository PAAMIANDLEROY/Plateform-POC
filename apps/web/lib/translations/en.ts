/**
 * @file lib/translations/en.ts
 * @description Dictionnaire de traductions **anglais** pour Hi! Platform.
 *
 * Implémente le type `Translations` exporté depuis `fr.ts`.
 * TypeScript garantit à la compilation que toutes les clés de `fr.ts` sont présentes
 * et que les types des valeurs correspondent (toutes `string`).
 *
 * ## Règles de traduction
 *
 * - Les clés sont identiques au fichier `fr.ts` — ne jamais en ajouter ni en supprimer ici.
 * - Les variables dynamiques `{{name}}` sont conservées telles quelles — le remplacement
 *   est effectué côté composant.
 * - Les références légales "RGPD" deviennent "GDPR" en anglais (Article numéros inchangés).
 * - Les noms propres (Hi! PARIS, Hi! Platform, Hi! Tube, etc.) ne sont pas traduits.
 *
 * @see fr.ts — source de vérité du type `Translations` et dictionnaire français.
 */

import type { Translations } from "./fr";

export const en: Translations = {
  // ── Libellés communs ──────────────────────────────────────────────────────────
  common: {
    seeAll:    "See all",
    loading:   "Loading...",
    saving:    "Saving...",
    save:      "Save",
    cancel:    "Cancel",
    edit:      "Edit",
    delete:    "Delete",
    export:    "Export",
    create:    "Create",
    search:    "Search...",
    filter:    "Filter",
    publish:   "Publish",
    draft:     "Draft",
    published: "Published",
    archived:  "Archived",
    min:       "min",
    error:     "An error occurred",
  },

  // ── Niveaux de difficulté ─────────────────────────────────────────────────────
  levels: {
    beginner:     "Beginner",
    intermediate: "Intermediate",
    advanced:     "Advanced",
  },

  // ── Rôles utilisateurs ────────────────────────────────────────────────────────
  roles: {
    student:   "Student",
    teacher:   "Teacher",
    admin:     "Administrator",
    super_admin: "Super Admin",
    public:    "Visitor",
  },

  // ── Navigation ────────────────────────────────────────────────────────────────
  nav: {
    insights:       "Insights",
    about:          "NeuriPP",
    myLearning:     "My learning",
    studio:         "Studio",
    lms:            "LMS",
    admin:          "Admin",
    login:          "Log in",
    profile:        "My profile",
    logout:         "Log out",
    administration: "Administration",
    sections: {
      learningAI: {
        label:       "Learning AI",
        description: "AI fundamentals and research",
      },
      learningWith: {
        label:       "Learning With AI",
        description: "Learn using AI as a tool",
      },
      learningEdge: {
        label:       "Learning at the Edge",
        description: "AI frontiers and challenges",
      },
    },
    items: {
      tube:   "Educational videos",
      course: "Interactive courses",
      mooc:   "Structured pathways",
      app:    "Interactive apps",
    },
  },

  // ── Pied de page ─────────────────────────────────────────────────────────────
  footer: {
    description:
      "Hi! PARIS shared educational platform — Institut Polytechnique de Paris, HEC Paris, Télécom Paris, ENSAE.",
    contact: "Contact",
    sections: {
      platform: "Platform",
      info:     "Information",
    },
    links: {
      insights:  "Insights",
      videos:    "Videos",
      courses:   "Courses",
      moocs:     "MOOCs",
      apps:      "Apps",
      privacy:   "Privacy",
      cgu:       "Terms of Use",
      account:   "My account",
      myLearning: "My learning",
    },
    copyright: "All rights reserved.",
  },

  // ── Dashboard / Page d'accueil ────────────────────────────────────────────────
  dashboard: {
    hero: {
      badge:            "Hi! PARIS · Hi! PACE",
      title:            "AI research",
      titleAccent:      "within your reach",
      description:
        "Research articles, courses, videos and MOOCs produced by Hi! PARIS researchers — all in one place.",
      discoverInsights: "Discover Insights",
      exploreCourses:   "Explore courses",
    },
    greeting: "Hello",
    modules: {
      insights: { name: "Insights",    desc: "Research & news" },
      tube:     { name: "Hi! Tube",    desc: "Educational videos" },
      course:   { name: "Hi! Course",  desc: "Interactive courses" },
      mooc:     { name: "Hi! MOOC",    desc: "Structured pathways" },
      app:      { name: "Hi! App",     desc: "Interactive apps" },
    },
    banners: {
      insights: {
        title: "Hi! PARIS Research & Insights",
        desc:  "Interactive articles published by Hi! PARIS, Polytechnique, Télécom Paris and HEC researchers.",
        cta:   "Read Insights",
      },
      courses: {
        title: "Learn AI fundamentals",
        desc:  "Courses designed by Hi! PARIS, Polytechnique and Télécom Paris researchers.",
        cta:   "Explore courses",
      },
      apps: {
        title: "Experiment in real time",
        desc:  "Access interactive apps to test your models directly in the browser.",
        cta:   "Launch an app",
      },
    },
    sections: {
      latestInsights:   "Latest Insights",
      insightsSubtitle: "Articles published by Hi! PARIS",
      popularVideos:    "Popular videos",
      recentCourses:    "Recent courses",
    },
  },

  // ── Page de connexion (flux OTP) ──────────────────────────────────────────────
  login: {
    tagline:       "Hi! PARIS educational platform",
    quote:
      '"The platform that brings together AI research and the education of tomorrow."',
    title:         "Sign in",
    subtitle:
      "Enter your institutional email to receive a 6-digit code.",
    emailLabel:    "Institutional email",
    emailPlaceholder: "firstname.lastname@ip-paris.fr",
    sendCode:      "Get my code",
    codeSentTitle: "Code sent ✓",
    codeSentTo:    "Code sent to",
    verify:        "Verify",
    resend:        "Resend code",
    disclaimer:    "Restricted to members of Hi! PARIS partner institutions.",
    errorDefault:  "An error occurred",
    errorCode:     "Invalid or expired code",
  },

  // ── Complétion du profil (première connexion) ─────────────────────────────────
  completeProfile: {
    title:              "Welcome to Hi! Platform",
    subtitle:           "Complete your profile to get started.",
    firstName:          "First name *",
    lastName:           "Last name *",
    school:             "School / Institution",
    selectSchool:       "— Select —",
    bio:                "Biography",
    optional:           "(optional)",
    networks:           "Networks",
    bioPlaceholder:     "A few words about you, your interests...",
    linkedinPlaceholder: "linkedin.com/in/marie-curie",
    githubPlaceholder:  "github.com/marie-curie",
    submit:             "Access the platform →",
    firstNamePlaceholder: "Marie",
    lastNamePlaceholder:  "Curie",
    requiredError:      "First name and last name are required.",
  },

  // ── Page profil ───────────────────────────────────────────────────────────────
  profile: {
    editBtn:    "Edit",
    cancelBtn:  "Cancel",
    saveBtn:    "Save",
    success:    "Profile updated successfully.",
    incomplete: "Incomplete profile",
    fields: {
      firstName:         "First name",
      lastName:          "Last name",
      email:             "Email",
      school:            "Institution",
      bio:               "Biography",
      linkedin:          "LinkedIn",
      github:            "GitHub",
      avatarUrl:         "Profile picture URL",
      avatarPlaceholder: "https://...",
    },
    // Section RGPD → GDPR en anglais
    rgpd: {
      title:         "Your data & privacy",
      exportTitle:   "Export my data",
      exportDesc:    "Download all your data as JSON (Art. 20 GDPR)",
      exportBtn:     "Export JSON",
      consentTitle:  "Manage my consents",
      consentDesc:   "Analytics, behavioural tracking (Art. 21 GDPR)",
      consentLink:   "View policy →",
      deleteTitle:   "Delete my account",
      deleteDesc:    "Anonymisation within 30 days (Art. 17 GDPR)",
      deleteBtn:     "Delete",
      deleteConfirm:
        "Permanently delete your account? Your data will be anonymised within 30 days. This action is irreversible.",
    },
  },

  // ── Page "Mon parcours" → "My learning" ──────────────────────────────────────
  myLearning: {
    title:         "My learning",
    subtitle:      "Hello {{name}} — here is your progress on Hi! Platform",
    subtitleGuest: "Here is your progress on Hi! Platform",
    stats: {
      started:      "Courses started",
      completed:    "Courses completed",
      badges:       "Badges earned",
      certificates: "Certificates",
    },
    tabs: {
      progress:     "My progress",
      badges:       "Badges",
      certificates: "Certificates",
    },
    progress: {
      empty:       "No courses started",
      emptyDesc:   "Explore the catalogue to start learning.",
      explore:     "Explore courses →",
      markDone:    "Mark as done",
      getCert:     "Get certificate",
      completedOn: "✓ Completed on",
      startedOn:   "Started on",
      quizScore:   "Quiz score:",
    },
    badges: {
      earned: "Badges earned",
      locked: "Badges to unlock",
      empty:  "No badges available",
    },
    certificates: {
      empty:     "No certificates yet",
      emptyDesc: "Complete a course to get your first certificate.",
      issuedOn:  "Issued on",
      verify:    "Verify authenticity →",
      download:  "Download PDF",
    },
    toast: {
      completed:     "Course marked as complete!",
      issued:        "Certificate issued!",
      downloadError: "Error downloading",
    },
  },

  // ── Bannière cookies ──────────────────────────────────────────────────────────
  cookie: {
    title:       "🍪 Cookies & privacy",
    description:
      "We use cookies necessary for the platform to function. With your consent, we also collect anonymised usage data to improve your experience.",
    privacyLink: "Privacy policy",
    customize:   "Customize",
    refuseAll:   "Refuse all",
    acceptAll:   "Accept all",
    preferences: "Manage my preferences",
    saveChoices: "Save my choices",
    necessary: {
      title: "Necessary cookies",
      desc:  "Authentication, security, session. Required for the platform to work.",
    },
    analytics: {
      title: "Analytics cookies",
      desc:  "Anonymised usage statistics (page views, time spent). 6 months.",
    },
    tracking: {
      title: "Behavioural tracking",
      desc:  "Detailed tracking of your learning journey. 6 months max.",
    },
  },

  // ── Page de vérification email ────────────────────────────────────────────────
  verifyEmail: {
    title:       "Code-based authentication",
    description:
      "Hi! Platform now uses a 6-digit code sent by email. Log in directly from the login page.",
    loginBtn:    "Go to login",
  },
};
