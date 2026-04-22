export const MOCK_USER = {
  id: "mock-admin-1",
  first_name: "Admin",
  last_name: "Démo",
  email: "admin@polytechnique.edu",
  role: "admin",
  is_verified: true,
};

export const MOCK_VIDEOS = [
  { id: "1", title: "Introduction au Machine Learning", duration: "42:18", category: "IA & Data", school: "Polytechnique", views: 1240, thumbnail: "https://picsum.photos/seed/ml1/400/225" },
  { id: "2", title: "Deep Learning avec PyTorch", duration: "1:12:05", category: "IA & Data", school: "Télécom Paris", views: 890, thumbnail: "https://picsum.photos/seed/dl2/400/225" },
  { id: "3", title: "Statistiques bayésiennes", duration: "55:30", category: "Mathématiques", school: "ENSAE", views: 654, thumbnail: "https://picsum.photos/seed/stat3/400/225" },
  { id: "4", title: "Optimisation convexe", duration: "38:44", category: "Mathématiques", school: "Polytechnique", views: 412, thumbnail: "https://picsum.photos/seed/opt4/400/225" },
  { id: "5", title: "NLP : Transformers de A à Z", duration: "1:28:10", category: "IA & Data", school: "Télécom Paris", views: 2100, thumbnail: "https://picsum.photos/seed/nlp5/400/225" },
  { id: "6", title: "Finance quantitative", duration: "49:22", category: "Finance", school: "HEC", views: 780, thumbnail: "https://picsum.photos/seed/fin6/400/225" },
];

export const MOCK_COURSES = [
  { id: "1", title: "Fondamentaux du ML", description: "Régression, classification, évaluation de modèles.", category: "IA & Data", level: "Débutant", school: "Polytechnique", duration: 180, blocks: 12, status: "published" },
  { id: "2", title: "Python pour la Data Science", description: "NumPy, Pandas, Matplotlib, Scikit-learn.", category: "Programmation", level: "Débutant", school: "Télécom Paris", duration: 240, blocks: 18, status: "published" },
  { id: "3", title: "Réseaux de neurones profonds", description: "Architectures CNN, RNN, Transformer.", category: "IA & Data", level: "Avancé", school: "Polytechnique", duration: 360, blocks: 24, status: "published" },
  { id: "4", title: "Séries temporelles", description: "ARIMA, Prophet, forecasting avec ML.", category: "IA & Data", level: "Intermédiaire", school: "ENSAE", duration: 150, blocks: 10, status: "published" },
  { id: "5", title: "Introduction à R", description: "Analyse statistique et visualisation avec R.", category: "Statistiques", level: "Débutant", school: "ENSAE", duration: 120, blocks: 8, status: "draft" },
  { id: "6", title: "Cloud Computing & MLOps", description: "Docker, Kubernetes, pipelines CI/CD ML.", category: "DevOps", level: "Avancé", school: "Télécom Paris", duration: 300, blocks: 20, status: "published" },
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
];
