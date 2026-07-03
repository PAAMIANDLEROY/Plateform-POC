/**
 * @file api.ts
 * @description Client HTTP centralisé pour communiquer avec le backend FastAPI de Hi! Platform.
 * Toutes les requêtes passent par la fonction `request()` qui gère l'authentification via
 * cookie httpOnly, la sérialisation JSON et la remontée d'erreurs typées (`ApiError`).
 * Les namespaces exportés (`authApi`, `videosApi`, etc.) regroupent les appels par domaine
 * métier et correspondent aux routers FastAPI montés sous `/api/v1/`.
 */

/** URL de base de l'API — pointe vers localhost en développement, variable d'env en prod. */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Erreur HTTP typée renvoyée par `request()` quand le backend répond avec un statut non-2xx.
 * Permet aux appelants de distinguer les erreurs réseau des erreurs métier (ex. 401, 403, 404).
 */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Fonction interne générique pour tous les appels HTTP vers le backend.
 * Inclut automatiquement les cookies (session JWT) et le header `Content-Type: application/json`.
 *
 * @template T - Type de la réponse attendue après désérialisation JSON.
 * @param path - Chemin relatif de l'endpoint, ex. `/api/v1/auth/refresh`.
 * @param init - Options `RequestInit` supplémentaires (method, body, headers...).
 * @returns La réponse désérialisée sous le type `T`.
 * @throws {ApiError} Si le statut HTTP est non-2xx.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    // Les cookies httpOnly (JWT refresh) doivent être envoyés en cross-origin
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    // On tente de lire le détail d'erreur Pydantic ; fallback sur le statusText HTTP
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail ?? "Unknown error");
  }

  return res.json();
}

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Représentation d'un utilisateur renvoyée par l'API.
 * Utilisée aussi bien pour le profil courant (`/users/me`) que dans les listes admin.
 *
 * @property id - UUID unique de l'utilisateur.
 * @property first_name - Prénom.
 * @property last_name - Nom de famille.
 * @property email - Adresse email institutionnelle (domaine vérifié).
 * @property role - Rôle sur la plateforme : `student`, `teacher`, `admin`, `super_admin`.
 * @property is_verified - Indique si l'email a été confirmé via OTP.
 * @property school - École/institution d'appartenance (ex. "Polytechnique").
 * @property bio - Courte biographie affichée sur le profil public.
 * @property avatar_url - URL de l'avatar (OVH Object Storage), ou `null` si non défini.
 * @property linkedin - URL du profil LinkedIn.
 * @property github - Nom d'utilisateur GitHub.
 * @property is_profile_complete - Vrai si l'utilisateur a complété les champs obligatoires du profil.
 */
export interface UserResponse {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_verified: boolean;
  school: string;
  bio: string;
  avatar_url: string | null;
  linkedin: string;
  github: string;
  is_profile_complete: boolean;
}

/**
 * Réponse standard lors d'une authentification réussie (utilisé en interne, voir `AuthResponse`).
 *
 * @property access_token - JWT access token (durée de vie courte, 15 min).
 * @property token_type - Toujours `"bearer"`.
 * @property user - Données complètes de l'utilisateur authentifié.
 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

/**
 * Représentation d'une vidéo de Hi! Tube renvoyée par l'API.
 *
 * @property id - UUID de la vidéo.
 * @property title - Titre affiché dans le catalogue.
 * @property description - Description longue, ou `null` si non renseignée.
 * @property url - URL directe du fichier vidéo (OVH Storage), ou `null` si YouTube.
 * @property youtube_id - Identifiant YouTube (ex. `"aircAruvnKk"`), ou `null` si hébergé.
 * @property thumbnail_url - URL de la miniature, ou `null` si non générée.
 * @property category - Catégorie thématique (ex. "IA & Data").
 * @property school - École propriétaire du contenu.
 * @property tags - Liste de tags pour la recherche et le filtrage.
 * @property visibility - Visibilité : `"public"`, `"restricted"` ou `"private"`.
 * @property duration_seconds - Durée totale en secondes.
 * @property view_count - Nombre total de vues.
 * @property created_by - UUID du créateur.
 * @property created_at - Date de création ISO 8601.
 */
export interface VideoResponse {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  youtube_id: string | null;
  thumbnail_url: string | null;
  category: string | null;
  school: string | null;
  tags: string[];
  visibility: string;
  duration_seconds: number;
  view_count: number;
  created_by: string;
  created_at: string;
}

/**
 * Bloc de contenu d'un cours (texte, quiz, vidéo...).
 *
 * @property id - UUID du bloc.
 * @property course_id - UUID du cours parent.
 * @property position - Ordre d'affichage dans le cours (0-indexed).
 * @property type - Type de bloc : `"text"`, `"video"`, `"quiz"`, `"code"`, etc.
 * @property content - Contenu structuré du bloc, schéma variable selon `type`.
 */
export interface CourseBlockResponse {
  id: string;
  course_id: string;
  position: number;
  type: string;
  content: Record<string, unknown>;
}

/**
 * Représentation complète d'un cours Hi! Course renvoyée par l'API.
 *
 * @property id - UUID du cours.
 * @property title - Titre du cours.
 * @property description - Description courte, ou `null`.
 * @property cover_url - URL de l'image de couverture, ou `null`.
 * @property category - Catégorie thématique.
 * @property tags - Tags pour la recherche.
 * @property level - Niveau requis : `"Débutant"`, `"Intermédiaire"`, `"Avancé"`.
 * @property school - École propriétaire.
 * @property status - État de publication : `"draft"` ou `"published"`.
 * @property estimated_duration_minutes - Durée estimée en minutes.
 * @property created_by - UUID de l'auteur.
 * @property created_at - Date de création ISO 8601.
 * @property updated_at - Date de dernière modification ISO 8601.
 * @property blocks - Liste ordonnée des blocs de contenu du cours.
 */
export interface CourseResponse {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  category: string | null;
  tags: string[];
  level: string;
  school: string | null;
  status: string;
  estimated_duration_minutes: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  blocks: CourseBlockResponse[];
}

/**
 * Représentation d'un parcours Hi! MOOC.
 *
 * @property id - UUID du MOOC.
 * @property title - Titre du parcours.
 * @property description - Description longue, ou `null`.
 * @property cover_url - URL de la couverture, ou `null`.
 * @property school - École propriétaire.
 * @property status - `"draft"` ou `"published"`.
 * @property is_linear - Si `true`, les modules doivent être suivis dans l'ordre.
 * @property created_by - UUID du créateur.
 * @property created_at - Date de création ISO 8601.
 * @property updated_at - Date de dernière modification ISO 8601.
 * @property modules - Liste des modules (schéma détaillé à venir).
 * @property enrolled_count - Nombre total d'apprenants inscrits.
 */
export interface MOOCResponse {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  school: string | null;
  status: string;
  is_linear: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  modules: Array<{
    id: string;
    title: string;
    position: number;
    courses: Array<{ course_id: string; position: number }>;
  }>;
  enrolled_count: number;
}

/**
 * Représentation d'une application Hi! App (Streamlit, etc.) hébergée sur la plateforme.
 *
 * @property id - UUID de l'application.
 * @property title - Nom affiché.
 * @property description - Description courte, ou `null`.
 * @property url - URL d'accès à l'application.
 * @property thumbnail_url - Miniature illustrative, ou `null`.
 * @property tags - Tags pour la recherche.
 * @property school - École propriétaire.
 * @property visibility - `"public"`, `"restricted"` ou `"private"`.
 * @property created_by - UUID du créateur.
 * @property created_at - Date de création ISO 8601.
 */
export interface AppResponse {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  tags: string[];
  school: string | null;
  visibility: string;
  created_by: string;
  created_at: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

/**
 * Réponse renvoyée lors d'une authentification via OTP (request-code / verify-code).
 * Étend `TokenResponse` avec le flag `is_new` pour détecter les nouvelles inscriptions.
 *
 * @property access_token - JWT access token court-terme.
 * @property token_type - Toujours `"bearer"`.
 * @property user - Données de l'utilisateur authentifié.
 * @property is_new - `true` si c'est la première connexion de l'utilisateur (onboarding à afficher).
 */
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
  is_new: boolean;
}

/**
 * Namespace regroupant tous les appels liés à l'authentification et au profil utilisateur.
 * L'auth est sans mot de passe : envoi d'un code OTP par email institutionnel puis vérification.
 */
export const authApi = {
  /**
   * Demande l'envoi d'un code OTP à l'adresse email institutionnelle fournie.
   *
   * @param email - Adresse email dont le domaine doit figurer dans `ALLOWED_DOMAINS`.
   * @returns Message de confirmation de l'envoi.
   * @throws {ApiError} 400 si le domaine n'est pas autorisé.
   */
  requestCode: (email: string) =>
    request<{ message: string }>("/api/v1/auth/request-code", { method: "POST", body: JSON.stringify({ email }) }),

  /**
   * Vérifie le code OTP saisi par l'utilisateur et ouvre une session JWT.
   *
   * @param email - Email utilisé lors de `requestCode`.
   * @param code - Code OTP à 6 chiffres reçu par email.
   * @returns Données d'auth incluant l'access token et les infos utilisateur.
   * @throws {ApiError} 401 si le code est invalide ou expiré.
   */
  verifyCode: (email: string, code: string) =>
    request<AuthResponse>("/api/v1/auth/verify-code", { method: "POST", body: JSON.stringify({ email, code }) }),

  /**
   * Invalide la session côté serveur et supprime le cookie de refresh token.
   *
   * @returns Message de confirmation.
   */
  logout: () => request<{ message: string }>("/api/v1/auth/logout", { method: "POST" }),

  /**
   * Renouvelle l'access token à partir du refresh token (cookie httpOnly).
   * Appelé automatiquement au montage de `AuthProvider` pour restaurer la session.
   *
   * @returns Nouvelles données d'auth avec access token rafraîchi.
   * @throws {ApiError} 401 si le refresh token est absent ou expiré (session terminée).
   */
  refresh: () => request<AuthResponse>("/api/v1/auth/refresh", { method: "POST" }),

  /**
   * Récupère le profil de l'utilisateur actuellement connecté.
   *
   * @returns Données complètes du profil utilisateur.
   */
  me: () => request<UserResponse>("/api/v1/users/me"),

  /**
   * Met à jour les champs du profil de l'utilisateur connecté.
   *
   * @param data - Champs à modifier (mise à jour partielle acceptée).
   * @returns Profil mis à jour.
   */
  updateProfile: (data: Partial<UserResponse>) =>
    request<UserResponse>("/api/v1/users/me", { method: "PUT", body: JSON.stringify(data) }),

  /**
   * Récupère l'ensemble des données personnelles de l'utilisateur (RGPD Art. 15).
   *
   * @returns Objet JSON contenant toutes les données stockées.
   */
  getMyData: () => request<Record<string, unknown>>("/api/v1/users/me/data"),

  /**
   * Télécharge les données personnelles sous forme de fichier ZIP/JSON (RGPD Art. 20 — portabilité).
   * Utilise `fetch` directement car la réponse est un binaire (Blob), pas du JSON.
   *
   * @returns Blob du fichier d'export.
   */
  exportMyData: () =>
    fetch(`${API_URL}/api/v1/users/me/export`, { credentials: "include" }).then((r) => r.blob()),

  /**
   * Supprime définitivement le compte de l'utilisateur connecté (RGPD Art. 17 — droit à l'oubli).
   *
   * @throws {ApiError} 403 si des ressources liées empêchent la suppression.
   */
  deleteMe: () => request<void>("/api/v1/users/me", { method: "DELETE" }),

  /**
   * Met à jour les préférences de consentement aux cookies analytiques/tracking.
   *
   * @param analytics - Consentement aux cookies d'analyse (ex. Matomo).
   * @param tracking - Consentement au suivi comportemental.
   * @returns Profil utilisateur mis à jour avec les nouveaux consentements.
   */
  updateConsent: (analytics: boolean, tracking: boolean) =>
    request<UserResponse>("/api/v1/users/me/consent", {
      method: "PUT",
      body: JSON.stringify({ analytics, tracking }),
    }),

  /**
   * Récupère les préférences de consentement actuelles de l'utilisateur.
   *
   * @returns Objet avec les flags de consentement et la date de dernière mise à jour.
   */
  getConsent: () => request<{ analytics: boolean; tracking: boolean; updated_at: string | null }>("/api/v1/users/me/consent"),
};

// ─── Videos ──────────────────────────────────────────────────────────────────

/**
 * Namespace pour les opérations CRUD sur les vidéos Hi! Tube.
 * La liste supporte le filtrage multi-critères via query params.
 */
export const videosApi = {
  /**
   * Récupère la liste des vidéos avec filtres optionnels et pagination.
   *
   * @param params - Filtres optionnels : catégorie, école, recherche texte, pagination.
   * @returns Liste de vidéos correspondant aux critères.
   */
  list: (params?: { category?: string; school?: string; search?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    // On n'ajoute que les filtres effectivement fournis pour éviter des params vides dans l'URL
    if (params?.category) q.set("category", params.category);
    if (params?.school) q.set("school", params.school);
    if (params?.search) q.set("search", params.search);
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    return request<VideoResponse[]>(`/api/v1/videos?${q}`);
  },

  /**
   * Récupère le détail d'une vidéo par son identifiant.
   *
   * @param id - UUID de la vidéo.
   * @returns Données complètes de la vidéo.
   * @throws {ApiError} 404 si la vidéo n'existe pas ou n'est pas accessible.
   */
  get: (id: string) => request<VideoResponse>(`/api/v1/videos/${id}`),

  /**
   * Crée une nouvelle vidéo (réservé aux enseignants et admins).
   *
   * @param data - Données de la vidéo à créer.
   * @returns La vidéo créée avec son UUID assigné.
   */
  create: (data: Partial<VideoResponse>) =>
    request<VideoResponse>("/api/v1/videos", { method: "POST", body: JSON.stringify(data) }),

  /**
   * Met à jour une vidéo existante.
   *
   * @param id - UUID de la vidéo à modifier.
   * @param data - Champs à modifier.
   * @returns La vidéo mise à jour.
   */
  update: (id: string, data: Partial<VideoResponse>) =>
    request<VideoResponse>(`/api/v1/videos/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  /**
   * Supprime une vidéo (réservé à son créateur ou un admin).
   *
   * @param id - UUID de la vidéo à supprimer.
   */
  delete: (id: string) => request<void>(`/api/v1/videos/${id}`, { method: "DELETE" }),

  /**
   * Ajoute un commentaire sur une vidéo.
   *
   * @param id - UUID de la vidéo.
   * @param content - Texte du commentaire.
   */
  addComment: (id: string, content: string) =>
    request(`/api/v1/videos/${id}/comments`, { method: "POST", body: JSON.stringify({ content }) }),

  /**
   * Récupère les commentaires d'une vidéo.
   *
   * @param id - UUID de la vidéo.
   * @returns Liste des commentaires.
   */
  listComments: (id: string) => request(`/api/v1/videos/${id}/comments`),
};

// ─── Courses ─────────────────────────────────────────────────────────────────

/**
 * Namespace pour les opérations CRUD sur les cours Hi! Course.
 * Inclut la gestion des blocs de contenu et le suivi de progression.
 */
export const coursesApi = {
  /**
   * Récupère la liste des cours avec filtres optionnels.
   *
   * @param params - Filtres : catégorie, niveau, école, recherche texte.
   * @returns Liste des cours correspondant aux critères.
   */
  list: (params?: { category?: string; level?: string; school?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.level) q.set("level", params.level);
    if (params?.school) q.set("school", params.school);
    if (params?.search) q.set("search", params.search);
    return request<CourseResponse[]>(`/api/v1/courses?${q}`);
  },

  /**
   * Récupère uniquement les cours créés par l'utilisateur connecté (vue enseignant Hi! Studio).
   *
   * @returns Liste des cours de l'auteur courant.
   */
  mine: () => request<CourseResponse[]>("/api/v1/courses/mine"),

  /**
   * Récupère le détail complet d'un cours, blocs inclus.
   *
   * @param id - UUID du cours.
   * @returns Cours avec tous ses blocs de contenu.
   */
  get: (id: string) => request<CourseResponse>(`/api/v1/courses/${id}`),

  /**
   * Crée un nouveau cours (réservé aux enseignants).
   *
   * @param data - Données du cours à créer.
   * @returns Le cours créé.
   */
  create: (data: unknown) =>
    request<CourseResponse>("/api/v1/courses", { method: "POST", body: JSON.stringify(data) }),

  /**
   * Met à jour les métadonnées d'un cours (titre, description, niveau...).
   *
   * @param id - UUID du cours.
   * @param data - Champs à modifier.
   * @returns Le cours mis à jour.
   */
  update: (id: string, data: unknown) =>
    request<CourseResponse>(`/api/v1/courses/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  /**
   * Remplace la liste complète des blocs d'un cours (opération de sauvegarde du builder Hi! Studio).
   * L'opération est non incrémentale : tous les blocs existants sont remplacés.
   *
   * @param id - UUID du cours.
   * @param blocks - Nouvelle liste ordonnée de blocs.
   */
  updateBlocks: (id: string, blocks: unknown[]) =>
    request(`/api/v1/courses/${id}/blocks`, { method: "PUT", body: JSON.stringify(blocks) }),

  /**
   * Signale la complétion d'un bloc par l'apprenant pour mettre à jour sa progression.
   *
   * @param id - UUID du cours.
   * @param completedBlockId - UUID du bloc terminé.
   */
  updateProgress: (id: string, completedBlockId: string) =>
    request(`/api/v1/courses/${id}/progress`, { method: "POST", body: JSON.stringify({ completed_block_id: completedBlockId }) }),
};

// ─── MOOCs ───────────────────────────────────────────────────────────────────

/**
 * Namespace pour les opérations sur les parcours Hi! MOOC.
 * Un MOOC regroupe plusieurs cours en modules séquentiels ou libres.
 */
export const moocsApi = {
  /**
   * Récupère la liste des MOOCs avec filtres optionnels.
   *
   * @param params - Filtres : école, recherche texte.
   * @returns Liste des MOOCs.
   */
  list: (params?: { school?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.school) q.set("school", params.school);
    if (params?.search) q.set("search", params.search);
    return request<MOOCResponse[]>(`/api/v1/moocs?${q}`);
  },

  /**
   * Récupère le détail d'un MOOC, modules inclus.
   *
   * @param id - UUID du MOOC.
   * @returns Données complètes du MOOC.
   */
  get: (id: string) => request<MOOCResponse>(`/api/v1/moocs/${id}`),

  /**
   * Crée un nouveau MOOC (réservé aux enseignants).
   *
   * @param data - Données du MOOC à créer.
   * @returns Le MOOC créé.
   */
  create: (data: unknown) =>
    request<MOOCResponse>("/api/v1/moocs", { method: "POST", body: JSON.stringify(data) }),

  /**
   * Met à jour un MOOC existant.
   *
   * @param id - UUID du MOOC.
   * @param data - Champs à modifier.
   * @returns Le MOOC mis à jour.
   */
  update: (id: string, data: unknown) =>
    request<MOOCResponse>(`/api/v1/moocs/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  /**
   * Inscrit l'utilisateur connecté à un MOOC.
   *
   * @param id - UUID du MOOC.
   */
  enroll: (id: string) =>
    request(`/api/v1/moocs/${id}/enroll`, { method: "POST" }),

  /**
   * Récupère la progression de l'utilisateur dans un MOOC.
   *
   * @param id - UUID du MOOC.
   * @returns Données de progression par module.
   */
  getProgress: (id: string) =>
    request(`/api/v1/moocs/${id}/progress`),
};

// ─── Learning (progress, badges, certificates) ────────────────────────────────

/**
 * Progression d'un apprenant sur un cours donné.
 *
 * @property course_id - UUID du cours.
 * @property progress_pct - Pourcentage de complétion (0–100).
 * @property completed - `true` si le cours est entièrement terminé.
 * @property completed_at - Date de complétion ISO 8601, ou `null` si en cours.
 * @property score - Score final obtenu aux quiz (optionnel, absent si non évalué).
 * @property started_at - Date de début ISO 8601.
 */
export interface LearningProgress {
  course_id: string;
  progress_pct: number;
  completed: boolean;
  completed_at: string | null;
  score?: number;
  started_at: string;
}

/**
 * Badge de réussite décerné à un apprenant (Hi! Cert).
 *
 * @property id - UUID du badge.
 * @property name - Intitulé du badge (ex. "Premier cours complété").
 * @property icon - Nom ou URL de l'icône du badge.
 * @property description - Description des conditions d'obtention.
 * @property awarded_at - Date d'attribution ISO 8601 (absent si badge verrouillé).
 */
export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  awarded_at?: string;
}

/**
 * Certificat de complétion d'un cours, vérifiable publiquement.
 *
 * @property id - UUID du certificat.
 * @property user_id - UUID de l'apprenant titulaire.
 * @property course_id - UUID du cours certifié.
 * @property course_title - Titre du cours au moment de l'émission.
 * @property user_name - Nom complet de l'apprenant au moment de l'émission.
 * @property issued_at - Date d'émission ISO 8601.
 * @property verification_url - URL publique de vérification de l'authenticité du certificat.
 */
export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  course_title: string;
  user_name: string;
  issued_at: string;
  verification_url: string;
}

/**
 * Tableau de bord d'apprentissage consolidé pour l'apprenant connecté.
 * Agrège compteurs, progressions, badges et certificats en un seul appel.
 *
 * @property total_courses_started - Nombre total de cours commencés.
 * @property total_courses_completed - Nombre total de cours terminés.
 * @property total_badges - Nombre de badges obtenus.
 * @property total_certificates - Nombre de certificats émis.
 * @property progress - Progression sur tous les cours actifs.
 * @property badges - Badges obtenus par l'apprenant.
 * @property certificates - Certificats émis.
 * @property in_progress - Sous-ensemble des cours actuellement en cours.
 * @property completed - Sous-ensemble des cours terminés.
 */
export interface LearningDashboard {
  total_courses_started: number;
  total_courses_completed: number;
  total_badges: number;
  total_certificates: number;
  progress: LearningProgress[];
  badges: Badge[];
  certificates: Certificate[];
  in_progress: LearningProgress[];
  completed: LearningProgress[];
}

/**
 * Namespace regroupant tous les appels liés au suivi pédagogique de l'apprenant :
 * progression, badges, certificats et inscriptions MOOC.
 */
export const learningApi = {
  /**
   * Récupère le tableau de bord d'apprentissage complet de l'utilisateur connecté.
   *
   * @returns Dashboard avec toutes les statistiques et listes pédagogiques.
   */
  dashboard: () => request<LearningDashboard>("/api/v1/learning/dashboard"),

  /**
   * Récupère la progression sur l'ensemble des cours de l'utilisateur.
   *
   * @returns Liste de progressions par cours.
   */
  getAllProgress: () => request<LearningProgress[]>("/api/v1/learning/progress"),

  /**
   * Récupère la progression sur un cours spécifique.
   *
   * @param courseId - UUID du cours.
   * @returns Données de progression pour ce cours.
   */
  getCourseProgress: (courseId: string) => request<LearningProgress>(`/api/v1/learning/progress/${courseId}`),

  /**
   * Met à jour la progression de l'utilisateur sur un cours.
   *
   * @param courseId - UUID du cours.
   * @param progress_pct - Pourcentage de complétion (0–100).
   * @param score - Score optionnel (résultat d'un quiz).
   */
  updateProgress: (courseId: string, progress_pct: number, score?: number) =>
    request(`/api/v1/learning/progress/${courseId}`, { method: "POST", body: JSON.stringify({ progress_pct, score }) }),

  /**
   * Marque un cours comme entièrement complété et déclenche la logique de récompense (badge, certificat).
   *
   * @param courseId - UUID du cours à marquer comme terminé.
   */
  completeCourse: (courseId: string) =>
    request(`/api/v1/learning/complete/${courseId}`, { method: "POST" }),

  /**
   * Récupère les badges de l'utilisateur, séparés en obtenus et verrouillés.
   *
   * @returns Objet avec `earned` (badges obtenus), `locked` (badges à débloquer) et `total`.
   */
  getBadges: () => request<{ earned: Badge[]; locked: Badge[]; total: number }>("/api/v1/learning/badges"),

  /**
   * Récupère la liste des certificats émis pour l'utilisateur connecté.
   *
   * @returns Liste des certificats.
   */
  listCertificates: () => request<Certificate[]>("/api/v1/learning/certificates"),

  /**
   * Émet un certificat pour un cours complété.
   *
   * @param courseId - UUID du cours.
   * @param courseTitle - Titre du cours à inscrire sur le certificat.
   * @returns Le certificat nouvellement créé.
   */
  issueCertificate: (courseId: string, courseTitle: string) =>
    request<Certificate>(`/api/v1/learning/certificates/${courseId}?course_title=${encodeURIComponent(courseTitle)}`, { method: "POST" }),

  /**
   * Télécharge un certificat au format PDF.
   * Utilise `fetch` direct car la réponse est un Blob binaire, pas du JSON.
   * La variable d'env est relue ici pour éviter la dépendance à la constante `API_URL` du module.
   *
   * @param certId - UUID du certificat.
   * @returns Blob du fichier PDF.
   */
  downloadCertificate: (certId: string) =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/learning/certificates/${certId}/download`, { credentials: "include" }).then((r) => r.blob()),

  /**
   * Vérifie publiquement l'authenticité d'un certificat (accessible sans auth).
   *
   * @param certId - UUID du certificat à vérifier.
   * @returns Données de vérification du certificat.
   */
  verifyCertificate: (certId: string) =>
    request(`/api/v1/learning/certificates/${certId}/verify`),

  /**
   * Inscrit l'utilisateur à un MOOC depuis le contexte learning.
   *
   * @param moocId - UUID du MOOC.
   */
  enrollMOOC: (moocId: string) =>
    request(`/api/v1/learning/mooc/${moocId}/enroll`, { method: "POST" }),

  /**
   * Marque un module d'un MOOC comme complété pour avancer dans le parcours.
   *
   * @param moocId - UUID du MOOC.
   * @param moduleId - UUID du module complété.
   */
  completeModule: (moocId: string, moduleId: string) =>
    request(`/api/v1/learning/mooc/${moocId}/module/${moduleId}/complete`, { method: "POST" }),
};

// ─── Analytics (admin/teacher) ───────────────────────────────────────────────

/**
 * KPIs globaux de la plateforme, disponibles pour les admins.
 *
 * @property users - Statistiques utilisateurs : total, répartition par rôle, actifs 30 derniers jours.
 * @property content - Compteurs de contenus publiés (cours, vidéos, MOOCs, apps).
 * @property generated_at - Horodatage de génération du rapport ISO 8601.
 */
export interface PlatformKPIs {
  users: { total: number; by_role: Record<string, number>; active_last_30d: number };
  content: { courses_total: number; courses_published: number; videos: number; moocs: number; apps: number };
  generated_at: string;
}

/**
 * Résultat de la détection d'apprenants à risque (inactifs ou en difficulté).
 *
 * @property thresholds - Seuils utilisés pour le calcul (jours d'inactivité, score minimal).
 * @property count - Nombre d'apprenants identifiés comme à risque.
 * @property students - Liste réduite des apprenants concernés (id, email, école).
 */
export interface AtRiskResult {
  thresholds: { inactivity_days: number; score_threshold: number };
  count: number;
  students: { id: string; email: string; school: string }[];
}

/**
 * Namespace pour les fonctionnalités analytiques réservées aux admins et enseignants.
 * Inclut KPIs plateforme, détection d'apprenants à risque et exports CSV.
 */
export const analyticsApi = {
  /**
   * Récupère les KPIs globaux de la plateforme (nombre d'utilisateurs, contenus, etc.).
   *
   * @returns Objet KPI complet.
   */
  platformKPIs: () => request<PlatformKPIs>("/api/v1/analytics/platform"),

  /**
   * Identifie les apprenants à risque selon des seuils d'inactivité et de score.
   *
   * @param inactivityDays - Nombre de jours sans activité pour considérer un apprenant inactif (défaut : 7).
   * @param scoreThreshold - Score minimal en dessous duquel un apprenant est en difficulté (défaut : 60).
   * @returns Liste des apprenants à risque avec leurs identifiants.
   */
  atRisk: (inactivityDays = 7, scoreThreshold = 60) =>
    request<AtRiskResult>(`/api/v1/analytics/at-risk?inactivity_days=${inactivityDays}&score_threshold=${scoreThreshold}`),

  /**
   * Exporte la liste des utilisateurs au format CSV.
   * Utilise `fetch` direct car la réponse est un Blob binaire.
   *
   * @returns Blob du fichier CSV.
   */
  exportUsersCSV: () =>
    fetch(`${API_URL}/api/v1/analytics/export/users`, { credentials: "include" }).then((r) => r.blob()),

  /**
   * Exporte les statistiques des cours au format CSV.
   * Utilise `fetch` direct car la réponse est un Blob binaire.
   *
   * @returns Blob du fichier CSV.
   */
  exportCoursesCSV: () =>
    fetch(`${API_URL}/api/v1/analytics/export/courses`, { credentials: "include" }).then((r) => r.blob()),
};

// ─── Apps ────────────────────────────────────────────────────────────────────

/**
 * Namespace pour les opérations CRUD sur les applications Hi! App.
 * Ces applications (Streamlit, Gradio...) sont hébergées sur OVH et référencées ici.
 */
export const appsApi = {
  /**
   * Récupère la liste des applications avec filtres optionnels.
   *
   * @param params - Filtres : école, recherche texte.
   * @returns Liste des applications correspondant aux critères.
   */
  list: (params?: { school?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.school) q.set("school", params.school);
    if (params?.search) q.set("search", params.search);
    return request<AppResponse[]>(`/api/v1/apps?${q}`);
  },

  /**
   * Récupère le détail d'une application.
   *
   * @param id - UUID de l'application.
   * @returns Données complètes de l'application.
   */
  get: (id: string) => request<AppResponse>(`/api/v1/apps/${id}`),

  /**
   * Crée une nouvelle application (réservé aux enseignants et admins).
   *
   * @param data - Données de l'application à créer.
   * @returns L'application créée.
   */
  create: (data: unknown) =>
    request<AppResponse>("/api/v1/apps", { method: "POST", body: JSON.stringify(data) }),

  /**
   * Met à jour une application existante.
   *
   * @param id - UUID de l'application.
   * @param data - Champs à modifier.
   * @returns L'application mise à jour.
   */
  update: (id: string, data: unknown) =>
    request<AppResponse>(`/api/v1/apps/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  /**
   * Supprime une application (réservé à son créateur ou un admin).
   *
   * @param id - UUID de l'application à supprimer.
   */
  delete: (id: string) => request<void>(`/api/v1/apps/${id}`, { method: "DELETE" }),
};

// ─── Insights (articles éditoriaux) ──────────────────────────────────────────

/**
 * Représentation d'un article Hi! Insights renvoyée par l'API.
 * Les `blocks` sont hétérogènes (heading/text/code/quote/key-insight/figure/divider) ;
 * typés en `Record<string, unknown>[]` ici, castés au rendu côté page de détail.
 */
export interface InsightResponse {
  id: string;
  title: string;
  abstract: string | null;
  authors: string[];
  tags: string[];
  school: string | null;
  category: string | null;
  cover: string | null;
  read_time: number;
  published_at: string | null;
  status: string;
  blocks: Record<string, unknown>[];
  created_by: string;
  created_at: string;
}

/** Namespace pour les opérations sur les articles Hi! Insights. */
export const insightsApi = {
  /** Liste les articles (filtres optionnels : catégorie, école, recherche). */
  list: (params?: { category?: string; school?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.school) q.set("school", params.school);
    if (params?.search) q.set("search", params.search);
    return request<InsightResponse[]>(`/api/v1/insights?${q}`);
  },

  /** Récupère un article par son id (blocs inclus). */
  get: (id: string) => request<InsightResponse>(`/api/v1/insights/${id}`),

  /** Crée (publie) un nouvel article. */
  create: (data: unknown) =>
    request<InsightResponse>("/api/v1/insights", { method: "POST", body: JSON.stringify(data) }),
};
