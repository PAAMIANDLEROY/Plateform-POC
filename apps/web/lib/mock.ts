export const MOCK_USER = {
  id: "mock-admin-1",
  first_name: "Admin",
  last_name: "Démo",
  email: "admin@polytechnique.edu",
  role: "admin",
  is_verified: true,
};

export const MOCK_VIDEOS = [
  {
    id: "1",
    title: "Introduction au Machine Learning",
    duration: "42:18",
    category: "IA & Data",
    school: "Polytechnique",
    views: 1240,
    thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&h=450&q=80",
    tags: ["Machine Learning", "Scikit-learn", "Débutant"],
    rating: 4.7,
    ratingsCount: 89,
    youtubeId: "aircAruvnKk",
    description: "Découvrez les fondements du machine learning : régression, classification et évaluation de modèles. Ce cours s'adresse aux étudiants souhaitant acquérir les bases théoriques et pratiques avec scikit-learn.",
  },
  {
    id: "2",
    title: "Deep Learning avec PyTorch",
    duration: "1:12:05",
    category: "IA & Data",
    school: "Télécom Paris",
    views: 890,
    thumbnail: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=800&h=450&q=80",
    tags: ["Deep Learning", "PyTorch", "CNN", "Avancé"],
    rating: 4.5,
    ratingsCount: 64,
    youtubeId: "IHZwWFHWa-w",
    description: "Implémentation complète de réseaux de neurones profonds avec PyTorch. Ce cours couvre la rétropropagation, les CNNs, RNNs et les techniques de régularisation modernes.",
  },
  {
    id: "3",
    title: "Statistiques bayésiennes",
    duration: "55:30",
    category: "Mathématiques",
    school: "ENSAE",
    views: 654,
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&h=450&q=80",
    tags: ["Statistiques", "Probabilités", "MCMC", "Intermédiaire"],
    rating: 4.8,
    ratingsCount: 103,
    youtubeId: "aircAruvnKk",
    description: "Introduction rigoureuse aux statistiques bayésiennes : théorème de Bayes, distributions a priori/a posteriori, inférence variationnelle et méthodes MCMC appliquées à des cas réels.",
  },
  {
    id: "4",
    title: "Optimisation convexe",
    duration: "38:44",
    category: "Mathématiques",
    school: "Polytechnique",
    views: 412,
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&h=450&q=80",
    tags: ["Optimisation", "Gradient", "Convexité", "Avancé"],
    rating: 4.2,
    ratingsCount: 41,
    youtubeId: "aircAruvnKk",
    description: "Bases mathématiques de l'optimisation convexe et ses applications en machine learning : conditions KKT, descente de gradient stochastique et méthodes proximales.",
  },
  {
    id: "5",
    title: "NLP : Transformers de A à Z",
    duration: "1:28:10",
    category: "IA & Data",
    school: "Télécom Paris",
    views: 2100,
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&h=450&q=80",
    tags: ["NLP", "Transformers", "BERT", "Avancé"],
    rating: 4.9,
    ratingsCount: 156,
    youtubeId: "aircAruvnKk",
    description: "Du mécanisme d'attention à BERT et GPT : architecture Transformer complète, fine-tuning et applications en production. Le cours NLP le plus complet de la plateforme.",
  },
  {
    id: "6",
    title: "Finance quantitative",
    duration: "49:22",
    category: "Finance",
    school: "HEC",
    views: 780,
    thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&h=450&q=80",
    tags: ["Finance", "Options", "Risk Management", "Intermédiaire"],
    rating: 4.3,
    ratingsCount: 58,
    youtubeId: "aircAruvnKk",
    description: "Introduction à la finance quantitative : pricing d'options (Black-Scholes), gestion des risques et modélisation stochastique pour les marchés financiers modernes.",
  },
  {
    id: "7",
    title: "Reinforcement Learning : des bases à AlphaGo",
    duration: "1:05:40",
    category: "IA & Data",
    school: "Polytechnique",
    views: 1560,
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&h=450&q=80",
    tags: ["Reinforcement Learning", "Q-Learning", "Avancé"],
    rating: 4.6,
    ratingsCount: 72,
    youtubeId: "aircAruvnKk",
    description: "Du Q-Learning classique aux Policy Gradients modernes, en passant par les algorithmes derrière AlphaGo et ChatGPT (RLHF). Implémentations pratiques avec Gymnasium.",
  },
  {
    id: "8",
    title: "Computer Vision & Détection d'objets",
    duration: "58:12",
    category: "IA & Data",
    school: "Télécom Paris",
    views: 1840,
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&h=450&q=80",
    tags: ["Computer Vision", "YOLO", "CNN", "Intermédiaire"],
    rating: 4.7,
    ratingsCount: 95,
    youtubeId: "aircAruvnKk",
    description: "Détection et segmentation d'objets avec YOLO, Mask R-CNN et SAM. Applications concrètes en imagerie médicale, véhicules autonomes et surveillance.",
  },
  {
    id: "9",
    title: "LLMs : fine-tuning et RLHF",
    duration: "1:35:00",
    category: "IA & Data",
    school: "Polytechnique",
    views: 3200,
    thumbnail: "https://images.unsplash.com/photo-1686191128892-3b37add4c844?auto=format&fit=crop&w=800&h=450&q=80",
    tags: ["LLM", "RLHF", "LoRA", "Avancé"],
    rating: 4.9,
    ratingsCount: 210,
    youtubeId: "aircAruvnKk",
    description: "Fine-tuning efficace de grands modèles de langage : LoRA, QLoRA, RLHF, DPO. De la théorie à la mise en production sur GPU cloud. Exercices pratiques inclus.",
  },
];

export const MOCK_COURSES = [
  { id: "1", title: "Fondamentaux du ML", description: "Régression, classification, évaluation de modèles.", category: "IA & Data", level: "Débutant", school: "Polytechnique", duration: 180, blocks: 12, status: "published" },
  { id: "2", title: "Python pour la Data Science", description: "NumPy, Pandas, Matplotlib, Scikit-learn.", category: "Programmation", level: "Débutant", school: "Télécom Paris", duration: 240, blocks: 18, status: "published" },
  { id: "3", title: "Réseaux de neurones profonds", description: "Architectures CNN, RNN, Transformer.", category: "IA & Data", level: "Avancé", school: "Polytechnique", duration: 360, blocks: 24, status: "published" },
  { id: "4", title: "Séries temporelles", description: "ARIMA, Prophet, forecasting avec ML.", category: "IA & Data", level: "Intermédiaire", school: "ENSAE", duration: 150, blocks: 10, status: "published" },
  { id: "5", title: "Introduction à R", description: "Analyse statistique et visualisation avec R.", category: "Statistiques", level: "Débutant", school: "ENSAE", duration: 120, blocks: 8, status: "draft" },
  { id: "6", title: "Cloud Computing & MLOps", description: "Docker, Kubernetes, pipelines CI/CD ML.", category: "DevOps", level: "Avancé", school: "Télécom Paris", duration: 300, blocks: 20, status: "published" },
  { id: "7", title: "Reinforcement Learning", description: "Q-Learning, Policy Gradients, AlphaGo et applications modernes.", category: "IA & Data", level: "Avancé", school: "Polytechnique", duration: 270, blocks: 18, status: "published" },
  { id: "8", title: "Computer Vision avancée", description: "Détection d'objets, segmentation, YOLO et Vision Transformers.", category: "IA & Data", level: "Intermédiaire", school: "Télécom Paris", duration: 210, blocks: 14, status: "published" },
  { id: "9", title: "NLP from Scratch", description: "Tokenisation, embeddings, attention et construction d'un LLM miniature.", category: "IA & Data", level: "Intermédiaire", school: "Télécom Paris", duration: 240, blocks: 16, status: "published" },
  { id: "10", title: "Éthique et gouvernance de l'IA", description: "Biais algorithmiques, RGPD, explicabilité et régulation européenne.", category: "Société & Éthique", level: "Débutant", school: "HEC", duration: 90, blocks: 6, status: "published" },
  { id: "11", title: "Modèles génératifs & diffusion", description: "GANs, VAEs, diffusion models et leurs applications en génération de données.", category: "IA & Data", level: "Avancé", school: "ENSAE", duration: 330, blocks: 22, status: "draft" },
  { id: "12", title: "LLMs — Fine-tuning & mise en prod", description: "LoRA, QLoRA, RLHF, DPO et déploiement GPU sur cloud.", category: "IA & Data", level: "Avancé", school: "Polytechnique", duration: 360, blocks: 24, status: "published" },
];

export const MOCK_MOOCS = [
  { id: "1", title: "Parcours Data Scientist", description: "De Python aux modèles en production. 6 cours, ~40h.", school: "Polytechnique", courses: 6, enrolled: 320, status: "published" },
  { id: "2", title: "IA pour les managers", description: "Comprendre l'IA sans coder. Idéal pour les décideurs.", school: "HEC", courses: 4, enrolled: 510, status: "published" },
  { id: "3", title: "MLOps & mise en production", description: "Déployer et monitorer des modèles ML en entreprise.", school: "Télécom Paris", courses: 5, enrolled: 180, status: "published" },
];

export const MOCK_APPS = [
  { id: "1", title: "Playground ML", description: "Entraîne et visualise des modèles interactivement.", url: "https://playground.tensorflow.org", tags: ["ML", "Visualisation"], school: "Polytechnique" },
  { id: "2", title: "Explorateur de datasets", description: "Analyse statistique et visualisation de jeux de données CSV.", url: "https://datasette.io", tags: ["Data", "Statistiques"], school: "ENSAE" },
  { id: "3", title: "NLP Demo", description: "Testez des modèles de traitement du langage naturel.", url: "https://huggingface.co/spaces", tags: ["NLP", "Transformers"], school: "Télécom Paris" },
  { id: "4", title: "Chatbot RAG", description: "Posez des questions sur vos documents grâce à un chatbot avec Retrieval-Augmented Generation.", url: "https://huggingface.co/spaces/deepset/retrieval-augmented-generation", tags: ["RAG", "NLP", "Génération"], school: "Télécom Paris" },
  { id: "5", title: "Classifieur CNN Interactif", description: "Entraînez et évaluez un CNN sur vos propres images directement dans le navigateur.", url: "https://teachablemachine.withgoogle.com", tags: ["CNN", "Computer Vision", "Classification"], school: "Polytechnique" },
  { id: "6", title: "Générateur d'images IA", description: "Générez des images à partir d'une description textuelle avec Stable Diffusion.", url: "https://huggingface.co/spaces/stabilityai/stable-diffusion", tags: ["Diffusion", "Génération", "Multimodal"], school: "ENSAE" },
  { id: "7", title: "Détecteur d'anomalies", description: "Identifiez des valeurs aberrantes dans vos datasets avec des algorithmes non-supervisés.", url: "https://playground.tensorflow.org", tags: ["Anomaly Detection", "Non-supervisé", "Data"], school: "ENSAE" },
  { id: "8", title: "Visualiseur d'embeddings", description: "Explorez les espaces vectoriels de vos modèles NLP avec des projections t-SNE et UMAP.", url: "https://projector.tensorflow.org", tags: ["Embeddings", "NLP", "Visualisation"], school: "Polytechnique" },
];

// ─── LMS / Cohort management ────────────────────────────────────────────────

export interface Cohort {
  id: string;
  name: string;
  description: string;
  school: string;
  status: "active" | "archived" | "draft";
  createdAt: string;
  startDate: string;
  endDate: string;
  enrolledCount: number;
  completionRate: number;
  avgScore: number;
  avgTimeSpent: number;
  assignedCourseIds: string[];
}

export interface CourseProgress {
  courseId: string;
  title: string;
  progress: number;
  score: number | null;
  completedAt: string | null;
}

export interface StudentEnrollment {
  userId: string;
  cohortId: string;
  name: string;
  initials: string;
  email: string;
  school: string;
  enrolledAt: string;
  lastActive: string;
  daysInactive: number;
  coursesCompleted: number;
  totalCourses: number;
  videosWatched: number;
  totalVideos: number;
  quizAvg: number;
  timeSpent: number;
  status: "active" | "at-risk" | "completed" | "inactive";
  courseProgress: CourseProgress[];
}

export const MOCK_COHORTS: Cohort[] = [
  {
    id: "1",
    name: "Master IA — Promo 2026",
    description: "Cohorte principale M2 Data Science & IA. Parcours complet : fondamentaux ML, deep learning et NLP.",
    school: "Polytechnique",
    status: "active",
    createdAt: "2026-01-15",
    startDate: "3 févr. 2026",
    endDate: "25 juil. 2026",
    enrolledCount: 24,
    completionRate: 67,
    avgScore: 78,
    avgTimeSpent: 840,
    assignedCourseIds: ["1", "2", "3"],
  },
  {
    id: "2",
    name: "Formation Executive IA",
    description: "Programme intensif pour managers et décideurs. Focus usages, éthique et ROI de l'IA en entreprise.",
    school: "HEC",
    status: "active",
    createdAt: "2026-02-10",
    startDate: "1 mars 2026",
    endDate: "30 mai 2026",
    enrolledCount: 12,
    completionRate: 82,
    avgScore: 85,
    avgTimeSpent: 420,
    assignedCourseIds: ["1", "5"],
  },
  {
    id: "3",
    name: "Data Engineering Bootcamp",
    description: "Formation intensive sur les pipelines de données, MLOps et cloud computing. Niveau avancé.",
    school: "Télécom Paris",
    status: "active",
    createdAt: "2026-03-01",
    startDate: "7 avr. 2026",
    endDate: "30 sept. 2026",
    enrolledCount: 18,
    completionRate: 34,
    avgScore: 71,
    avgTimeSpent: 360,
    assignedCourseIds: ["2", "4", "6"],
  },
  {
    id: "4",
    name: "ML Fondamentaux — Automne 2025",
    description: "Cohorte archivée. 92 % de taux de complétion final, meilleure promotion à ce jour.",
    school: "ENSAE",
    status: "archived",
    createdAt: "2025-09-01",
    startDate: "15 sept. 2025",
    endDate: "31 janv. 2026",
    enrolledCount: 31,
    completionRate: 92,
    avgScore: 81,
    avgTimeSpent: 980,
    assignedCourseIds: ["1", "3", "4"],
  },
];

export const MOCK_STUDENTS: StudentEnrollment[] = [
  {
    userId: "u1",
    cohortId: "1",
    name: "Alice Moreau",
    initials: "AM",
    email: "a.moreau@polytechnique.edu",
    school: "Polytechnique",
    enrolledAt: "3 févr. 2026",
    lastActive: "22 avr. 2026",
    daysInactive: 1,
    coursesCompleted: 2,
    totalCourses: 3,
    videosWatched: 5,
    totalVideos: 6,
    quizAvg: 88,
    timeSpent: 920,
    status: "active",
    courseProgress: [
      { courseId: "1", title: "Fondamentaux du ML", progress: 100, score: 92, completedAt: "15 mars 2026" },
      { courseId: "2", title: "Python pour la Data Science", progress: 100, score: 85, completedAt: "1 avr. 2026" },
      { courseId: "3", title: "Réseaux de neurones profonds", progress: 68, score: null, completedAt: null },
    ],
  },
  {
    userId: "u2",
    cohortId: "1",
    name: "Thomas Bernard",
    initials: "TB",
    email: "t.bernard@polytechnique.edu",
    school: "Polytechnique",
    enrolledAt: "3 févr. 2026",
    lastActive: "20 avr. 2026",
    daysInactive: 3,
    coursesCompleted: 1,
    totalCourses: 3,
    videosWatched: 3,
    totalVideos: 6,
    quizAvg: 74,
    timeSpent: 560,
    status: "active",
    courseProgress: [
      { courseId: "1", title: "Fondamentaux du ML", progress: 100, score: 74, completedAt: "20 mars 2026" },
      { courseId: "2", title: "Python pour la Data Science", progress: 45, score: null, completedAt: null },
      { courseId: "3", title: "Réseaux de neurones profonds", progress: 0, score: null, completedAt: null },
    ],
  },
  {
    userId: "u3",
    cohortId: "1",
    name: "Sofia Ramos",
    initials: "SR",
    email: "s.ramos@polytechnique.edu",
    school: "Polytechnique",
    enrolledAt: "3 févr. 2026",
    lastActive: "10 avr. 2026",
    daysInactive: 13,
    coursesCompleted: 0,
    totalCourses: 3,
    videosWatched: 1,
    totalVideos: 6,
    quizAvg: 0,
    timeSpent: 120,
    status: "at-risk",
    courseProgress: [
      { courseId: "1", title: "Fondamentaux du ML", progress: 22, score: null, completedAt: null },
      { courseId: "2", title: "Python pour la Data Science", progress: 0, score: null, completedAt: null },
      { courseId: "3", title: "Réseaux de neurones profonds", progress: 0, score: null, completedAt: null },
    ],
  },
  {
    userId: "u4",
    cohortId: "1",
    name: "Julien Petit",
    initials: "JP",
    email: "j.petit@polytechnique.edu",
    school: "Polytechnique",
    enrolledAt: "3 févr. 2026",
    lastActive: "23 avr. 2026",
    daysInactive: 0,
    coursesCompleted: 3,
    totalCourses: 3,
    videosWatched: 6,
    totalVideos: 6,
    quizAvg: 91,
    timeSpent: 1100,
    status: "completed",
    courseProgress: [
      { courseId: "1", title: "Fondamentaux du ML", progress: 100, score: 95, completedAt: "10 mars 2026" },
      { courseId: "2", title: "Python pour la Data Science", progress: 100, score: 88, completedAt: "28 mars 2026" },
      { courseId: "3", title: "Réseaux de neurones profonds", progress: 100, score: 91, completedAt: "18 avr. 2026" },
    ],
  },
  {
    userId: "u5",
    cohortId: "1",
    name: "Inès Dupont",
    initials: "ID",
    email: "i.dupont@polytechnique.edu",
    school: "Polytechnique",
    enrolledAt: "3 févr. 2026",
    lastActive: "1 avr. 2026",
    daysInactive: 22,
    coursesCompleted: 0,
    totalCourses: 3,
    videosWatched: 0,
    totalVideos: 6,
    quizAvg: 0,
    timeSpent: 45,
    status: "inactive",
    courseProgress: [
      { courseId: "1", title: "Fondamentaux du ML", progress: 8, score: null, completedAt: null },
      { courseId: "2", title: "Python pour la Data Science", progress: 0, score: null, completedAt: null },
      { courseId: "3", title: "Réseaux de neurones profonds", progress: 0, score: null, completedAt: null },
    ],
  },
  {
    userId: "u6",
    cohortId: "1",
    name: "Marc Lefèvre",
    initials: "ML",
    email: "m.lefevre@polytechnique.edu",
    school: "Polytechnique",
    enrolledAt: "3 févr. 2026",
    lastActive: "21 avr. 2026",
    daysInactive: 2,
    coursesCompleted: 2,
    totalCourses: 3,
    videosWatched: 4,
    totalVideos: 6,
    quizAvg: 79,
    timeSpent: 810,
    status: "active",
    courseProgress: [
      { courseId: "1", title: "Fondamentaux du ML", progress: 100, score: 82, completedAt: "18 mars 2026" },
      { courseId: "2", title: "Python pour la Data Science", progress: 100, score: 76, completedAt: "5 avr. 2026" },
      { courseId: "3", title: "Réseaux de neurones profonds", progress: 32, score: null, completedAt: null },
    ],
  },
];

export type InsightBlock =
  | { type: "text"; content: string }
  | { type: "heading"; content: string; level: 2 | 3 }
  | { type: "code"; content: string; language: string }
  | { type: "quote"; content: string; author?: string }
  | { type: "key-insight"; content: string }
  | { type: "figure"; url: string; caption: string }
  | { type: "divider" };

export interface Insight {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  tags: string[];
  school: string;
  category: string;
  cover: string;
  published_at: string;
  read_time: number;
  blocks: InsightBlock[];
}

export const MOCK_INSIGHTS: Insight[] = [
  {
    id: "1",
    title: "LLMs multimodaux : vers une compréhension unifiée texte-image",
    abstract: "Nous explorons les architectures récentes qui permettent aux grands modèles de langage de traiter simultanément texte et images, et leurs implications pour l'enseignement.",
    authors: ["Pr. Sophie Martin", "Dr. Lucas Durand"],
    tags: ["LLM", "Multimodal", "Vision"],
    school: "Polytechnique",
    category: "IA & Cognition",
    cover: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
    published_at: "2026-04-18",
    read_time: 8,
    blocks: [
      { type: "heading", content: "Introduction", level: 2 },
      { type: "text", content: "Les modèles de langage de grande taille (LLMs) ont connu une évolution rapide ces dernières années. L'intégration de modalités visuelles ouvre de nouvelles perspectives pour l'IA générale." },
      { type: "key-insight", content: "Les architectures multimodales atteignent désormais des performances surhumaines sur des benchmarks de compréhension visuelle comme MMMU et MathVista." },
      { type: "heading", content: "Architecture Vision-Language", level: 2 },
      { type: "text", content: "Les modèles comme GPT-4o et Gemini Ultra utilisent un encodeur visuel connecté à un LLM via une couche de projection apprise. Cette approche permet une fusion sémantique profonde entre les deux modalités." },
      { type: "code", content: "# Exemple simplifié d'architecture VLM\nclass VisionLanguageModel(nn.Module):\n    def __init__(self):\n        self.vision_encoder = CLIPEncoder()\n        self.projection = nn.Linear(768, 4096)\n        self.llm = LlamaModel()\n\n    def forward(self, image, text_tokens):\n        visual_features = self.projection(self.vision_encoder(image))\n        return self.llm(text_tokens, visual_prefix=visual_features)", language: "python" },
      { type: "quote", content: "La compréhension multimodale n'est pas la simple concaténation de deux modalités, mais une véritable fusion sémantique.", author: "Pr. Sophie Martin" },
      { type: "heading", content: "Implications pédagogiques", level: 2 },
      { type: "text", content: "Ces avancées permettent d'envisager des tuteurs IA capables d'analyser des schémas, équations manuscrites et graphiques — transformant l'expérience d'apprentissage en ligne." },
    ],
  },
  {
    id: "2",
    title: "Apprentissage fédéré : préserver la confidentialité à grande échelle",
    abstract: "Comment entraîner des modèles performants sur des données sensibles distribuées, sans jamais centraliser les données ? Un enjeu clé pour les données médicales et financières.",
    authors: ["Dr. Amina Benali", "Pr. Jean-Pierre Moreau"],
    tags: ["Federated Learning", "Privacy", "Distributed"],
    school: "Télécom Paris",
    category: "IA & Société",
    cover: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    published_at: "2026-04-10",
    read_time: 6,
    blocks: [
      { type: "heading", content: "Le problème de la centralisation", level: 2 },
      { type: "text", content: "Les modèles d'IA traditionnels requièrent l'agrégation de grandes quantités de données. Or, dans des domaines comme la santé ou la finance, cette centralisation est impossible ou illégale (RGPD)." },
      { type: "key-insight", content: "L'apprentissage fédéré permet d'entraîner un modèle global sans que les données quittent jamais les appareils ou serveurs locaux." },
      { type: "quote", content: "Nous n'apprenons pas sur les données, nous apprenons avec les données — tout en les laissant là où elles appartiennent.", author: "Dr. Amina Benali" },
      { type: "heading", content: "FedAvg et ses variantes", level: 2 },
      { type: "text", content: "L'algorithme FedAvg (McMahan et al., 2017) reste la référence. Chaque client entraîne localement, puis un serveur central agrège les gradients via une moyenne pondérée." },
      { type: "code", content: "# FedAvg simplifié\ndef federated_avg(global_model, client_updates, weights):\n    aggregated = {}\n    for key in global_model.state_dict():\n        aggregated[key] = sum(\n            w * u[key] for w, u in zip(weights, client_updates)\n        )\n    global_model.load_state_dict(aggregated)\n    return global_model", language: "python" },
    ],
  },
  {
    id: "3",
    title: "Modèles de diffusion pour la génération de données synthétiques",
    abstract: "Les diffusion models révolutionnent la génération d'images et de données tabulaires. Nous analysons leur potentiel pour augmenter des jeux de données rares en contexte académique.",
    authors: ["Dr. Claire Fontaine", "Thomas Mercier"],
    tags: ["Diffusion Models", "Data Augmentation", "Generative AI"],
    school: "ENSAE",
    category: "Génération & Synthèse",
    cover: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=800&q=80",
    published_at: "2026-03-28",
    read_time: 10,
    blocks: [
      { type: "heading", content: "Au-delà des GANs", level: 2 },
      { type: "text", content: "Les GANs ont longtemps dominé la génération de données synthétiques. Les modèles de diffusion, apparus avec DDPM (Ho et al., 2020), offrent une stabilité d'entraînement bien supérieure et une qualité de génération remarquable." },
      { type: "key-insight", content: "Sur le benchmark FID (Fréchet Inception Distance), Stable Diffusion 3 atteint un score de 4.2, contre 8.1 pour les meilleurs GANs." },
      { type: "figure", url: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=60", caption: "Visualisation du processus de débruitage itératif d'un modèle de diffusion." },
      { type: "heading", content: "Applications académiques", level: 2 },
      { type: "text", content: "Dans nos expériences, l'augmentation de jeux de données médicaux (imagerie IRM) avec des données synthétiques générées par diffusion améliore la précision de classification de 12 points." },
    ],
  },
  {
    id: "4",
    title: "Raisonnement symbolique et LLMs : une alliance prometteuse",
    abstract: "L'intégration de contraintes logiques dans les LLMs permet de réduire les hallucinations et d'améliorer la fiabilité sur des tâches de raisonnement structuré.",
    authors: ["Pr. Marc Leblanc"],
    tags: ["Symbolic AI", "LLM", "Reasoning"],
    school: "Polytechnique",
    category: "IA & Raisonnement",
    cover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    published_at: "2026-03-15",
    read_time: 7,
    blocks: [
      { type: "heading", content: "Le problème des hallucinations", level: 2 },
      { type: "text", content: "Les LLMs souffrent d'hallucinations — ils produisent des réponses plausibles mais incorrectes. Les approches symboliques, basées sur des règles formelles, offrent une piste de solution." },
      { type: "key-insight", content: "L'approche neurosymbolique réduit les erreurs factuelles de 34% sur des benchmarks de QA à domaine fermé (MMLU Science)." },
      { type: "quote", content: "On ne résout pas le problème de la fiabilité en ajoutant plus de paramètres. Il faut réintégrer la structure.", author: "Pr. Marc Leblanc" },
    ],
  },
];
