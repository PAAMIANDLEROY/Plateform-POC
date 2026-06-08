library(openxlsx2)

OUT <- "C:/Users/Pierre-AntoineAMIAND/3D Objects/test-plateforme/HiPlatform_Architecture_Audit.xlsx"

wb <- wb_workbook(creator = "Hi! Platform")

# ── Couleurs brand ──────────────────────────────────────────────────────────
CLR_PRIMARY  <- "1A3A8F"   # bleu Hi!
CLR_NAVY     <- "0B1D3A"   # footer navy
CLR_DANGER   <- "D72638"   # rouge
CLR_SURFACE  <- "F4F6FA"   # fond gris clair
CLR_WHITE    <- "FFFFFF"
CLR_GRAY     <- "4A4A6A"
CLR_HEADER   <- "E8EDF7"   # header ligne tableau
CLR_SUCCESS  <- "D1FAE5"   # vert léger
CLR_WARN     <- "FEF3C7"   # jaune léger

# ── Helpers ─────────────────────────────────────────────────────────────────
navy_fill   <- wb_color(hex = CLR_NAVY)
blue_fill   <- wb_color(hex = CLR_PRIMARY)
red_fill    <- wb_color(hex = CLR_DANGER)
white_txt   <- wb_color(hex = CLR_WHITE)
header_fill <- wb_color(hex = CLR_HEADER)
surf_fill   <- wb_color(hex = CLR_SURFACE)
gray_txt    <- wb_color(hex = CLR_GRAY)

style_title <- wb_cell_style(
  font = list(bold = TRUE, size = 18, color = wb_color(hex = CLR_NAVY)),
  fill = list(type = "solid", fgColor = wb_color(hex = CLR_SURFACE)),
  alignment = list(horizontal = "left", vertical = "center")
)

style_subtitle <- wb_cell_style(
  font = list(bold = FALSE, size = 11, color = wb_color(hex = "6B7280")),
  fill = list(type = "solid", fgColor = wb_color(hex = CLR_SURFACE)),
  alignment = list(horizontal = "left", vertical = "center")
)

style_section <- wb_cell_style(
  font = list(bold = TRUE, size = 12, color = white_txt),
  fill = list(type = "solid", fgColor = blue_fill),
  alignment = list(horizontal = "left", vertical = "center"),
  border = list(top = list(style = "thin", color = white_txt))
)

style_col_header <- wb_cell_style(
  font = list(bold = TRUE, size = 10, color = wb_color(hex = CLR_NAVY)),
  fill = list(type = "solid", fgColor = header_fill),
  alignment = list(horizontal = "center", vertical = "center", wrapText = TRUE),
  border = list(bottom = list(style = "medium", color = blue_fill))
)

style_cell <- wb_cell_style(
  font = list(size = 10),
  alignment = list(vertical = "top", wrapText = TRUE)
)

style_cell_center <- wb_cell_style(
  font = list(size = 10),
  alignment = list(horizontal = "center", vertical = "top", wrapText = TRUE)
)

style_cell_code <- wb_cell_style(
  font = list(size = 9, name = "Consolas"),
  alignment = list(vertical = "top", wrapText = TRUE),
  fill = list(type = "solid", fgColor = wb_color(hex = "F8FAFC"))
)

style_yes <- wb_cell_style(
  font = list(bold = TRUE, size = 10, color = wb_color(hex = "065F46")),
  fill = list(type = "solid", fgColor = wb_color(hex = CLR_SUCCESS)),
  alignment = list(horizontal = "center", vertical = "center")
)

style_no <- wb_cell_style(
  font = list(bold = TRUE, size = 10, color = wb_color(hex = "92400E")),
  fill = list(type = "solid", fgColor = wb_color(hex = CLR_WARN)),
  alignment = list(horizontal = "center", vertical = "center")
)

style_mvp <- wb_cell_style(
  font = list(bold = TRUE, size = 9, color = wb_color(hex = "065F46")),
  fill = list(type = "solid", fgColor = wb_color(hex = "D1FAE5")),
  alignment = list(horizontal = "center", vertical = "center")
)

# Helper: write a title block on a sheet
add_title_block <- function(wb, sheet, title, subtitle, row = 1) {
  wb <- wb_add_cell_style(wb, sheet, dims = paste0("A", row), style = style_title)
  wb <- wb_add_data(wb, sheet, x = title, dims = paste0("A", row))
  wb <- wb_merge_cells(wb, sheet, dims = paste0("A", row, ":H", row))
  wb <- wb_set_row_heights(wb, sheet, rows = row, heights = 32)

  wb <- wb_add_cell_style(wb, sheet, dims = paste0("A", row+1), style = style_subtitle)
  wb <- wb_add_data(wb, sheet, x = subtitle, dims = paste0("A", row+1))
  wb <- wb_merge_cells(wb, sheet, dims = paste0("A", row+1, ":H", row+1))
  wb <- wb_set_row_heights(wb, sheet, rows = row+1, heights = 20)
  wb
}

# Helper: section row (blue)
add_section <- function(wb, sheet, text, row, ncol = 8) {
  dims <- paste0("A", row, ":", LETTERS[ncol], row)
  wb <- wb_merge_cells(wb, sheet, dims = dims)
  wb <- wb_add_cell_style(wb, sheet, dims = paste0("A", row), style = style_section)
  wb <- wb_add_data(wb, sheet, x = text, dims = paste0("A", row))
  wb <- wb_set_row_heights(wb, sheet, rows = row, heights = 22)
  wb
}

# Helper: column headers
add_col_headers <- function(wb, sheet, headers, row, cols = NULL) {
  if (is.null(cols)) cols <- seq_along(headers)
  for (i in seq_along(headers)) {
    col_letter <- LETTERS[cols[i]]
    dims <- paste0(col_letter, row)
    wb <- wb_add_cell_style(wb, sheet, dims = dims, style = style_col_header)
    wb <- wb_add_data(wb, sheet, x = headers[i], dims = dims)
  }
  wb <- wb_set_row_heights(wb, sheet, rows = row, heights = 28)
  wb
}

# ============================================================================
# ONGLET 1 — Vue d'ensemble
# ============================================================================
wb <- wb_add_worksheet(wb, "1. Vue d'ensemble", tab_color = CLR_NAVY)

wb <- add_title_block(wb, "1. Vue d'ensemble",
  "Hi! Platform — Architecture Technique · MVP v1.0 · Juin 2026",
  "Plateforme pédagogique mutualisée Hi! PARIS (Hi! PACE)", 1)

# Bloc architecture
wb <- add_section(wb, "1. Vue d'ensemble", "DESCRIPTION GÉNÉRALE", 4)
wb <- wb_add_data(wb, "1. Vue d'ensemble", x = "Nom du projet", dims = "A5")
wb <- wb_add_data(wb, "1. Vue d'ensemble", x = "Hi! Platform (Hi! PACE)", dims = "B5")
wb <- wb_add_data(wb, "1. Vue d'ensemble", x = "Commanditaire", dims = "A6")
wb <- wb_add_data(wb, "1. Vue d'ensemble", x = "Hi! PARIS — Institut Polytechnique de Paris", dims = "B6")
wb <- wb_add_data(wb, "1. Vue d'ensemble", x = "Objectif", dims = "A7")
wb <- wb_add_data(wb, "1. Vue d'ensemble", x = "Remplacer Moodle et les LMS externes par une solution moderne, open source, contrôlée en interne", dims = "B7")
wb <- wb_add_data(wb, "1. Vue d'ensemble", x = "Version documentée", dims = "A8")
wb <- wb_add_data(wb, "1. Vue d'ensemble", x = "MVP v1.0 — commit f6334e2", dims = "B8")
wb <- wb_add_data(wb, "1. Vue d'ensemble", x = "Date document", dims = "A9")
wb <- wb_add_data(wb, "1. Vue d'ensemble", x = "Juin 2026", dims = "B9")
wb <- wb_add_data(wb, "1. Vue d'ensemble", x = "Dépôt", dims = "A10")
wb <- wb_add_data(wb, "1. Vue d'ensemble", x = "https://github.com/paamiandleroy/Plateform-POC", dims = "B10")
wb <- wb_add_data(wb, "1. Vue d'ensemble", x = "URL déployée", dims = "A11")
wb <- wb_add_data(wb, "1. Vue d'ensemble", x = "https://paamiandleroy.github.io/Plateform-POC/", dims = "B11")

# Architecture
wb <- add_section(wb, "1. Vue d'ensemble", "ARCHITECTURE GLOBALE", 13)
arch_data <- data.frame(
  Couche = c("Frontend", "Backend", "Base de données", "Authentification", "IA Génération", "IA Transcription",
             "Certificats PDF", "CI/CD", "Hébergement frontend"),
  Technologie = c("Next.js 14 (App Router)", "FastAPI 0.115 — ASGI (Uvicorn 0.30)", "PostgreSQL 16 / SQLAlchemy 2.0 / Alembic 1.13",
                  "OTP email + JWT HS256 (aucun mot de passe)", "Anthropic Claude Sonnet 4.6",
                  "OpenAI Whisper", "fpdf2 + qrcode", "GitHub Actions (3 jobs)", "GitHub Pages (export statique)"),
  Notes = c("Static export — basePath /Plateform-POC", "Python 3.12 — dockerisé", "3 migrations Alembic",
            "Access 15min / Refresh 30j — httpOnly cookie", "Quiz + cours auto-générés",
            "Transcription vidéo → Markdown", "QR code de vérification inclus", "backend-tests → frontend-build → deploy",
            "HTML/CSS/JS statiques — CDN GitHub")
)
wb <- wb_add_data_table(wb, "1. Vue d'ensemble", arch_data, start_row = 14, start_col = 1,
                        table_style = "TableStyleMedium2")
wb <- wb_set_row_heights(wb, "1. Vue d'ensemble", rows = 14:23, heights = 20)

# Institutions partenaires
wb <- add_section(wb, "1. Vue d'ensemble", "INSTITUTIONS PARTENAIRES (domaines autorisés MVP)", 26)
institutions <- data.frame(
  Institution = c("École Polytechnique", "Télécom Paris", "ENSAE Paris", "ENSTA Paris",
                  "HEC Paris", "AgroParisTech", "Mines Paris", "Inria"),
  Domaine = c("polytechnique.edu", "telecom-paris.fr", "ensae.fr", "ensta-paris.fr",
               "hec.fr", "agroparistech.fr", "minesparis.psl.eu", "inria.fr"),
  Groupe = c("Institut Polytechnique de Paris", "Institut Polytechnique de Paris", "Institut Polytechnique de Paris",
              "Institut Polytechnique de Paris", "Paris Saclay / HEC", "Paris Saclay",
              "PSL Research University", "Organisme de recherche")
)
wb <- wb_add_data_table(wb, "1. Vue d'ensemble", institutions, start_row = 27, start_col = 1,
                        table_style = "TableStyleMedium2")

wb <- wb_set_col_widths(wb, "1. Vue d'ensemble", cols = 1:8, widths = c(28, 40, 40, 20, 20, 20, 20, 20))

# ============================================================================
# ONGLET 2 — Stack Technique
# ============================================================================
wb <- wb_add_worksheet(wb, "2. Stack Technique", tab_color = CLR_PRIMARY)
wb <- add_title_block(wb, "2. Stack Technique", "Stack technique complète — dépendances et versions", 1)

stack_data <- data.frame(
  Couche = c(
    "Frontend", "Frontend", "Frontend", "Frontend",
    "Backend", "Backend", "Backend", "Backend", "Backend",
    "Auth", "Auth", "Auth",
    "IA / LLM", "IA / LLM",
    "PDF & QR", "PDF & QR",
    "Tests", "Tests",
    "CI/CD", "CI/CD",
    "Conteneurisation", "Conteneurisation"
  ),
  Technologie = c(
    "Next.js", "React", "Tailwind CSS", "TypeScript",
    "FastAPI", "Uvicorn (ASGI)", "SQLAlchemy", "Alembic", "Pydantic",
    "python-jose", "cryptography", "passlib + bcrypt",
    "Anthropic Claude", "OpenAI Whisper",
    "fpdf2", "qrcode",
    "pytest + pytest-asyncio", "Playwright",
    "GitHub Actions", "actions/deploy-pages",
    "Docker", "Docker Compose"
  ),
  Version = c(
    "14.2.15", "18.3.1", "3.4.13", "5.6.2",
    "0.115.0", "0.30.6", "2.0.35", "1.13.3", "2.9.2",
    "3.3.0", "43.0.1", "1.7.4",
    "claude-sonnet-4-6", "API v1",
    "2.8.1", "8.0",
    "8.3.3", "1.48.0",
    "—", "v4",
    "latest", "3.x"
  ),
  Role = c(
    "Rendu frontend — App Router statique", "Bibliothèque UI", "Framework CSS utilitaire", "Typage statique",
    "API REST asynchrone", "Serveur ASGI Python", "ORM Python → PostgreSQL", "Migrations schéma DB", "Validation données I/O",
    "Génération/vérification JWT", "Chiffrement", "Hachage tokens de refresh",
    "Génération quiz & cours depuis fichiers", "Transcription audio/vidéo → texte",
    "Génération certificats PDF", "QR code de vérification embarqué dans PDF",
    "Tests unitaires backend (39 tests)", "Tests E2E frontend",
    "Pipeline CI/CD automatisé", "Déploiement GitHub Pages",
    "Conteneurisation services", "Orchestration multi-services"
  ),
  Criticite = c(
    "Haute", "Haute", "Haute", "Haute",
    "Haute", "Haute", "Haute", "Haute", "Haute",
    "Haute", "Haute", "Haute",
    "Moyenne", "Moyenne",
    "Basse", "Basse",
    "Moyenne", "Basse",
    "Haute", "Haute",
    "Haute", "Haute"
  )
)

wb <- wb_add_data_table(wb, "2. Stack Technique", stack_data, start_row = 4, start_col = 1,
                        table_style = "TableStyleMedium2")
wb <- wb_set_row_heights(wb, "2. Stack Technique", rows = 4:30, heights = 20)
wb <- wb_set_col_widths(wb, "2. Stack Technique", cols = 1:5, widths = c(20, 28, 22, 55, 15))

# ============================================================================
# ONGLET 3 — Modules Fonctionnels
# ============================================================================
wb <- wb_add_worksheet(wb, "3. Modules", tab_color = "059669")
wb <- add_title_block(wb, "3. Modules", "Modules fonctionnels — périmètre MVP", 1)

modules_data <- data.frame(
  Module = c("Hi! Tube", "Hi! Course", "Hi! MOOC", "Hi! App", "Hi! Studio",
             "Hi! Cert", "Inside Insight", "LMS Dashboard", "Analytics Admin"),
  Route_Frontend = c("/tube", "/courses", "/moocs", "/apps", "/studio",
                     "/my-learning", "/insights", "/lms", "/admin"),
  Description = c(
    "Vidéothèque style YouTube — lecture, commentaires, filtres par école/catégorie",
    "Catalogue de cours en Markdown + blocs quiz interactifs, progression par bloc",
    "Parcours multi-cours structurés avec modules prérequis et scoring progressif",
    "Catalogue d'applications interactives (Streamlit, Gradio, Observable, Jupyter…)",
    "Builder de cours pour enseignants — import Excel → quiz IA, vidéo → cours Markdown",
    "Badges gamifiés + certificats PDF avec QR de vérification publique (Art.15 RGPD)",
    "Bibliothèque d'articles de recherche avec moteur de recherche et tags",
    "Tableau de bord enseignant : cohortes, progression apprenants, alertes à risque",
    "KPIs plateforme, exports CSV, tableau de bord superuser"
  ),
  Router_API = c("/api/v1/videos", "/api/v1/courses", "/api/v1/moocs", "/api/v1/apps",
                 "/api/v1/studio", "/api/v1/learning", "—", "/api/v1/analytics", "/api/v1/analytics"),
  Nb_Endpoints = c(7, 7, 6, 5, 5, 14, 0, 2, 2),
  Statut = rep("MVP ✅", 9),
  Roles_Acces = c(
    "Tous rôles (lecture) / teacher+ (création)",
    "Tous rôles (lecture) / teacher+ (création)",
    "Tous rôles (lecture/inscription) / teacher+ (création)",
    "Tous rôles (lecture) / teacher+ (création)",
    "teacher+",
    "Tous rôles",
    "Tous rôles",
    "teacher+",
    "admin+"
  )
)

wb <- wb_add_data_table(wb, "3. Modules", modules_data, start_row = 4, start_col = 1,
                        table_style = "TableStyleMedium9")
wb <- wb_set_row_heights(wb, "3. Modules", rows = 4:14, heights = 50)
wb <- wb_set_col_widths(wb, "3. Modules", cols = 1:7, widths = c(18, 22, 60, 22, 18, 14, 35))

# ============================================================================
# ONGLET 4 — API Endpoints
# ============================================================================
wb <- wb_add_worksheet(wb, "4. API Endpoints", tab_color = "7C3AED")
wb <- add_title_block(wb, "4. API Endpoints",
  "Inventaire complet des 48 endpoints — préfixe global /api/v1/", 1)

wb <- add_section(wb, "4. API Endpoints", "Légende : Auth ✅ = JWT requis | ❌ = public | Rôle = rôle minimum requis", 3, ncol = 7)

endpoints <- data.frame(
  Router = c(
    # Auth
    "Auth","Auth","Auth","Auth",
    # Users
    "Users","Users","Users","Users","Users","Users","Users","Users",
    # Videos
    "Videos","Videos","Videos","Videos","Videos","Videos","Videos",
    # Courses
    "Courses","Courses","Courses","Courses","Courses","Courses","Courses",
    # MOOCs
    "MOOCs","MOOCs","MOOCs","MOOCs","MOOCs","MOOCs",
    # Apps
    "Apps","Apps","Apps","Apps","Apps",
    # Studio
    "Studio","Studio","Studio","Studio","Studio",
    # Learning
    "Learning","Learning","Learning","Learning","Learning","Learning","Learning","Learning","Learning","Learning","Learning","Learning","Learning","Learning",
    # Analytics
    "Analytics","Analytics","Analytics","Analytics"
  ),
  Methode = c(
    "POST","POST","POST","POST",
    "GET","PUT","DELETE","GET","GET","PUT","GET","POST",
    "GET","GET","POST","PUT","DELETE","POST","GET",
    "GET","GET","GET","POST","PUT","PUT","POST",
    "GET","GET","POST","PUT","POST","GET",
    "GET","GET","POST","PUT","DELETE",
    "POST","POST","POST","POST","GET",
    "GET","GET","GET","POST","POST","POST","GET","POST","GET","GET","GET","POST","POST","GET",
    "GET","GET","GET","GET"
  ),
  Route = c(
    "/auth/request-code","/auth/verify-code","/auth/refresh","/auth/logout",
    "/users/me","/users/me","/users/me","/users/me/data","/users/me/export","/users/me/consent","/users/me/consent","/users/import",
    "/videos","/videos/{id}","/videos","/videos/{id}","/videos/{id}","/videos/{id}/comments","/videos/{id}/comments",
    "/courses","/courses/mine","/courses/{id}","/courses","/courses/{id}","/courses/{id}/blocks","/courses/{id}/progress",
    "/moocs","/moocs/{id}","/moocs","/moocs/{id}","/moocs/{id}/enroll","/moocs/{id}/progress",
    "/apps","/apps/{id}","/apps","/apps/{id}","/apps/{id}",
    "/studio/excel-to-quiz","/studio/save-quiz","/studio/video-to-course","/studio/save-course","/studio/health",
    "/learning/dashboard","/learning/progress","/learning/progress/{course_id}","/learning/progress/{course_id}",
    "/learning/complete/{course_id}","/learning/badges","/learning/certificates","/learning/certificates/{course_id}",
    "/learning/certificates/{cert_id}/verify","/learning/certificates/{cert_id}/download",
    "/learning/mooc/{id}","/learning/mooc/{id}/enroll","/learning/mooc/{id}/module/{mid}/check-unlock",
    "/learning/mooc/{id}/module/{mid}/complete",
    "/analytics/platform","/analytics/at-risk","/analytics/export/users","/analytics/export/courses"
  ),
  Auth_Requis = c(
    "❌","❌","❌ (cookie)","✅",
    "✅","✅","✅","✅","✅","✅","✅","✅",
    "✅","✅","✅","✅","✅","✅","✅",
    "✅","✅","✅","✅","✅","✅","✅",
    "✅","✅","✅","✅","✅","✅",
    "✅","✅","✅","✅","✅",
    "✅","✅","✅","✅","❌",
    "✅","✅","✅","✅","✅","✅","✅","✅","❌","✅","✅","✅","✅","✅",
    "✅","✅","✅","✅"
  ),
  Role_Minimum = c(
    "—","—","—","any",
    "any","any","any","any","any","any","any","admin",
    "any","any","teacher","créateur/admin","créateur/admin","any","any",
    "any","teacher","any","teacher","créateur/admin","créateur/admin","any",
    "any","any","teacher","créateur/admin","any","any",
    "any","any","teacher","créateur/admin","créateur/admin",
    "teacher","teacher","teacher","teacher","—",
    "any","any","any","any","any","any","any","any","—","propriétaire","any","any","any","any",
    "admin","teacher","admin","teacher"
  ),
  Description = c(
    "Envoi code OTP 6 chiffres à l'email institutionnel","Vérification OTP → access_token + refresh_token","Rotation tokens (access + refresh)","Révocation session courante",
    "Profil utilisateur connecté","Mise à jour profil (nom, école, bio, liens)","Effacement compte (anonymisation 30j) — Art.17 RGPD","Export données personnelles — Art.15 RGPD","Export JSON portable — Art.20 RGPD","Mise à jour consentement cookies — Art.21 RGPD","Lecture consentement actuel","Import en masse utilisateurs via fichier Excel",
    "Catalogue vidéos (filtres: category, school, search)","Détail vidéo (incrémente view_count)","Créer une vidéo","Modifier une vidéo","Supprimer une vidéo","Poster un commentaire","Lister les commentaires d'une vidéo",
    "Catalogue cours (filtres: category, level, school, search)","Mes cours créés","Détail cours + liste des blocs","Créer un cours","Modifier métadonnées cours","Remplacer tous les blocs d'un cours","Mettre à jour la progression apprenant",
    "Catalogue MOOCs","Détail MOOC + modules","Créer un MOOC","Modifier un MOOC","S'inscrire à un MOOC","Récupérer ma progression dans un MOOC",
    "Catalogue applications interactives","Détail application","Créer une app","Modifier une app","Supprimer une app",
    "Upload .xlsx → Claude Sonnet → quiz JSON","Sauvegarder quiz en brouillon","Vidéo/PPTX/PDF → Whisper+Claude → cours Markdown","Publier un cours généré par IA","Statut des services IA (health check)",
    "Tableau de bord complet apprenant (KPIs, badges, prochain cours)","Toutes mes progressions","Progression pour un cours spécifique","Mettre à jour progression (progress_pct + score)","Marquer un cours terminé (100%)","Badges obtenus + badges à débloquer","Liste de mes certificats","Émettre un certificat pour un cours terminé","Vérification publique d'un certificat par QR","Télécharger le PDF du certificat","Progression globale dans un MOOC","S'inscrire à un MOOC (via learning router)","Vérifier si un module est débloqué (prérequis)","Marquer un module MOOC comme terminé",
    "KPIs plateforme (users, contenus, actifs 30j)","Liste apprenants à risque (inactivité + score bas)","Export CSV utilisateurs","Export CSV cours + progressions"
  )
)

wb <- wb_add_data_table(wb, "4. API Endpoints", endpoints, start_row = 4, start_col = 1,
                        table_style = "TableStyleMedium12")
wb <- wb_set_row_heights(wb, "4. API Endpoints", rows = 4:64, heights = 40)
wb <- wb_set_col_widths(wb, "4. API Endpoints", cols = 1:6,
                        widths = c(14, 10, 45, 16, 18, 65))

# ============================================================================
# ONGLET 5 — Schéma de données
# ============================================================================
wb <- wb_add_worksheet(wb, "5. Schéma de données", tab_color = "D97706")
wb <- add_title_block(wb, "5. Schéma de données", "Modèles SQLAlchemy — PostgreSQL 16 — 3 migrations Alembic", 1)

# Table Users
wb <- add_section(wb, "5. Schéma de données", "TABLE : users", 4)
users_fields <- data.frame(
  Colonne = c("id","email","first_name","last_name","role","is_active","is_verified",
               "hashed_password","verification_token","refresh_token","created_at","updated_at"),
  Type_SQL = c("UUID","VARCHAR(255)","VARCHAR(100)","VARCHAR(100)",
                "ENUM","BOOLEAN","BOOLEAN","VARCHAR(255)","VARCHAR(100)","VARCHAR(512)",
                "TIMESTAMPTZ","TIMESTAMPTZ"),
  Contraintes = c("PK — auto-généré","UNIQUE, INDEXED, NOT NULL","NOT NULL","NOT NULL",
                   "student|teacher|admin|superuser|public — NOT NULL","DEFAULT true","DEFAULT false",
                   "Stocke hash token refresh — NOT NULL","nullable","nullable","DEFAULT now()","auto-update"),
  Notes = c("UUID v4","Email institutionnel validé à l'inscription","—","—",
             "Contrôle d'accès basé sur les rôles (RBAC)","Désactivation sans suppression","Vérification OTP obligatoire",
             "⚠️ Aucun mot de passe utilisateur — hash du refresh token uniquement","Legacy — remplacé par OTP",
             "Token de session courante — révoqué au logout","—","Trigger SQL auto-update")
)
wb <- wb_add_data_table(wb, "5. Schéma de données", users_fields, start_row = 5, start_col = 1,
                        table_style = "TableStyleLight11")
wb <- wb_set_row_heights(wb, "5. Schéma de données", rows = 5:18, heights = 20)

# Table Videos
wb <- add_section(wb, "5. Schéma de données", "TABLE : videos (+ video_comments)", 20)
videos_fields <- data.frame(
  Colonne = c("id","title","description","youtube_id","thumbnail_url","category","school",
               "tags","visibility","view_count","created_by","created_at"),
  Type_SQL = c("UUID","VARCHAR(255)","TEXT","VARCHAR(20)","TEXT","VARCHAR(100)",
                "VARCHAR(100)","JSON","ENUM","INTEGER","UUID FK → users","TIMESTAMPTZ"),
  Contraintes = c("PK","NOT NULL","nullable","NOT NULL","nullable","nullable",
                   "nullable","nullable — array de strings","public|institution|restricted",
                   "DEFAULT 0","NOT NULL","DEFAULT now()"),
  Notes = rep("", 12)
)
wb <- wb_add_data_table(wb, "5. Schéma de données", videos_fields, start_row = 21, start_col = 1,
                        table_style = "TableStyleLight11")
wb <- wb_set_row_heights(wb, "5. Schéma de données", rows = 21:33, heights = 20)

# Table Courses
wb <- add_section(wb, "5. Schéma de données", "TABLE : courses (+ course_blocks + user_course_progress)", 35)
courses_fields <- data.frame(
  Colonne = c("id","title","description","category","level","status","cover_url",
               "created_by","course_blocks.type","course_blocks.content",
               "user_course_progress.progress_pct","user_course_progress.score"),
  Type_SQL = c("UUID","VARCHAR(255)","TEXT","VARCHAR(100)","VARCHAR(50)",
                "ENUM","TEXT","UUID FK → users","ENUM","JSON","FLOAT","FLOAT"),
  Notes = c("PK","NOT NULL","nullable","nullable","beginner|intermediate|advanced",
             "draft|published|archived","URL image de couverture","NOT NULL",
             "text|video|quiz|code — blocs ordonnés","Contenu JSON structuré",
             "0.0 à 100.0","Score quiz moyen — 0.0 à 100.0")
)
wb <- wb_add_data_table(wb, "5. Schéma de données", courses_fields, start_row = 36, start_col = 1,
                        table_style = "TableStyleLight11")
wb <- wb_set_row_heights(wb, "5. Schéma de données", rows = 36:49, heights = 20)

# Migrations
wb <- add_section(wb, "5. Schéma de données", "MIGRATIONS ALEMBIC (chronologie)", 51)
migrations <- data.frame(
  Migration = c("0001_init_auth","0002_add_content_models","0003_mooc_prerequisites"),
  Contenu = c(
    "Tables : users, allowed_domains — Auth OTP + domaines institutionnels",
    "Tables : videos, video_comments, courses, course_blocks, user_course_progress, moocs, mooc_modules, mooc_module_courses, user_mooc_enrollments, apps",
    "Colonnes : mooc_modules.min_score_to_unlock (FLOAT, default 0.0) + mooc_modules.prerequisite_module_id (UUID FK auto-référent nullable)"
  ),
  Date_estimee = c("Sprint 1", "Sprint 2", "Sprint 3")
)
wb <- wb_add_data_table(wb, "5. Schéma de données", migrations, start_row = 52, start_col = 1,
                        table_style = "TableStyleMedium3")
wb <- wb_set_row_heights(wb, "5. Schéma de données", rows = 52:55, heights = 40)
wb <- wb_set_col_widths(wb, "5. Schéma de données", cols = 1:4, widths = c(30, 20, 70, 18))

# Note InMemory
wb <- add_section(wb, "5. Schéma de données", "⚠️ NOTE IMPORTANTE POUR L'AUDIT", 57)
wb <- wb_add_data(wb, "5. Schéma de données",
  x = "La couche de persistance en développement utilise un store Python en mémoire (core/store.py). Les modèles SQLAlchemy et migrations Alembic existent et sont prêts. En l'état actuel, un redémarrage du serveur efface toutes les données. La connexion SQLAlchemy directe vers PostgreSQL est prévue pour le déploiement staging/production.",
  dims = "A58")
wb <- wb_merge_cells(wb, "5. Schéma de données", dims = "A58:D58")
wb <- wb_set_row_heights(wb, "5. Schéma de données", rows = 58, heights = 60)

# ============================================================================
# ONGLET 6 — Sécurité & Authentification
# ============================================================================
wb <- wb_add_worksheet(wb, "6. Sécurité & Auth", tab_color = CLR_DANGER)
wb <- add_title_block(wb, "6. Sécurité & Auth", "Authentification OTP + JWT — Contrôle d'accès — CORS", 1)

# Flux Auth
wb <- add_section(wb, "6. Sécurité & Auth", "FLUX D'AUTHENTIFICATION OTP", 4)
auth_flow <- data.frame(
  Etape = paste0("Étape ", 1:7),
  Acteur = c("Frontend","Backend","Backend","Email","Utilisateur","Backend","Backend"),
  Action = c(
    "Saisie email institutionnel → POST /api/v1/auth/request-code",
    "Validation domaine contre allowed_domains (fichier ou var env)",
    "Génération OTP 6 chiffres aléatoires — TTL 10 minutes en mémoire",
    "Envoi OTP via SMTP (noreply@hi-paris.fr)",
    "Saisie code OTP → POST /api/v1/auth/verify-code",
    "Vérification OTP — Génération access_token JWT (15min, HS256) + refresh_token (30j)",
    "Set-Cookie: refresh_token httpOnly; SameSite=Lax — Retourne access_token en JSON"
  ),
  Securite = c(
    "HTTPS obligatoire","Blocage immédiat si domaine non autorisé","OTP à usage unique — invalide après vérification",
    "Email transactionnel — pas de lien cliquable","Code masqué dans l'UI","Vérification en temps constant (anti-timing attack)",
    "Cookie httpOnly — inaccessible au JavaScript — SameSite=Lax (protection CSRF partielle)"
  )
)
wb <- wb_add_data_table(wb, "6. Sécurité & Auth", auth_flow, start_row = 5, start_col = 1,
                        table_style = "TableStyleMedium6")
wb <- wb_set_row_heights(wb, "6. Sécurité & Auth", rows = 5:13, heights = 40)

# Tokens
wb <- add_section(wb, "6. Sécurité & Auth", "CONFIGURATION JWT", 14)
tokens <- data.frame(
  Token = c("Access Token","Refresh Token"),
  Duree = c("15 minutes","30 jours"),
  Algorithme = c("HS256","HS256"),
  Transport = c("Header HTTP : Authorization: Bearer <token>","Cookie httpOnly — SameSite=Lax"),
  Contenu_Payload = c("user_id, email, role, exp","user_id, exp"),
  Rotation = c("À chaque appel authentifié (sliding window)","POST /auth/refresh — révoque l'ancien")
)
wb <- wb_add_data_table(wb, "6. Sécurité & Auth", tokens, start_row = 15, start_col = 1,
                        table_style = "TableStyleMedium6")
wb <- wb_set_row_heights(wb, "6. Sécurité & Auth", rows = 15:18, heights = 30)

# RBAC
wb <- add_section(wb, "6. Sécurité & Auth", "CONTRÔLE D'ACCÈS (RBAC)", 21)
rbac <- data.frame(
  Role = c("public","student","teacher","admin","superuser"),
  Description = c("Visiteur non inscrit","Apprenant standard","Créateur de contenu","Gestionnaire plateforme","Configuration système"),
  Peut_Voir_Contenus = c("Limité (public uniquement)","✅ Tous","✅ Tous","✅ Tous","✅ Tous"),
  Peut_Creer_Contenus = c("❌","❌","✅","✅","✅"),
  Peut_Voir_Analytics = c("❌","❌","Partiels (ses cours)","✅ Complets","✅ Complets"),
  Peut_Gerer_Users = c("❌","❌","❌","✅","✅"),
  Peut_Config_Plateforme = c("❌","❌","❌","Partiel","✅")
)
wb <- wb_add_data_table(wb, "6. Sécurité & Auth", rbac, start_row = 22, start_col = 1,
                        table_style = "TableStyleMedium6")
wb <- wb_set_row_heights(wb, "6. Sécurité & Auth", rows = 22:28, heights = 22)

# CORS
wb <- add_section(wb, "6. Sécurité & Auth", "CONFIGURATION CORS ET SÉCURITÉ RÉSEAU", 30)
security_items <- data.frame(
  Parametre = c("CORS Origins","CORS Methods","CORS Headers","CORS Credentials",
                 "Rate Limiting","HTTPS","Headers sécurité"),
  Valeur = c("FRONTEND_URL (var env — single origin)","GET, POST, PUT, DELETE, OPTIONS",
              "Content-Type, Authorization, Cookie","allow_credentials = True",
              "Non implémenté dans le MVP — prévu via reverse proxy (Nginx/Traefik)",
              "Obligatoire en production (TLS 1.2+)","Non configurés explicitement (prévu: HSTS, X-Frame-Options)"),
  Risque_Si_Absent = c("Faible (single origin)","—","—","Nécessaire pour les cookies httpOnly",
                        "Moyen — brute force OTP possible","Critique","Moyen — clickjacking")
)
wb <- wb_add_data_table(wb, "6. Sécurité & Auth", security_items, start_row = 31, start_col = 1,
                        table_style = "TableStyleMedium6")
wb <- wb_set_row_heights(wb, "6. Sécurité & Auth", rows = 31:39, heights = 30)
wb <- wb_set_col_widths(wb, "6. Sécurité & Auth", cols = 1:6, widths = c(25, 12, 60, 60, 30, 35))

# ============================================================================
# ONGLET 7 — RGPD
# ============================================================================
wb <- wb_add_worksheet(wb, "7. RGPD", tab_color = "059669")
wb <- add_title_block(wb, "7. RGPD", "Conformité RGPD — Droits des personnes — Consentement", 1)

rgpd_data <- data.frame(
  Article_RGPD = c("Art. 13/14","Art. 15","Art. 16","Art. 17","Art. 20","Art. 21","Art. 7","Art. 32","Art. 33","Art. 37"),
  Droit_Obligation = c("Information","Accès","Rectification","Effacement (droit à l'oubli)",
                        "Portabilité","Opposition / Retrait consentement","Consentement explicite",
                        "Sécurité des traitements","Notification violation","DPO"),
  Endpoint_Implementation = c(
    "Pages /privacy et /cgu — mentions légales",
    "GET /api/v1/users/me/data",
    "PUT /api/v1/users/me",
    "DELETE /api/v1/users/me (anonymisation sous 30j)",
    "GET /api/v1/users/me/export (format JSON)",
    "PUT /api/v1/users/me/consent + bannière cookies",
    "Bannière CookieBanner.tsx — cookie 13 mois — opt-in analytics",
    "JWT httpOnly — HTTPS — hachage tokens — aucun mot de passe clair",
    "Procédure non documentée dans le MVP",
    "À désigner — Hi! PARIS DSI"
  ),
  Implemente = c("✅","✅","✅","✅","✅","✅","✅","✅","⚠️ À documenter","⚠️ À désigner"),
  Donnees_Concernees = c(
    "Email, nom, école, rôle",
    "Toutes données utilisateur + progressions",
    "Profil complet",
    "Email (→ anonymisé), progression, certificats",
    "Profil + progressions + badges en JSON",
    "Cookies analytics (6 mois) + tracking comportemental",
    "Analytics, tracking — nécessaires exclus du consentement",
    "Tokens, sessions, logs",
    "Tout traitement",
    "Tous traitements"
  ),
  Duree_Conservation = c("Durée du compte","Sur demande","Immédiat","30 jours","Immédiat",
                          "13 mois (cookie)","—","Durée de vie session","—","—")
)
wb <- wb_add_data_table(wb, "7. RGPD", rgpd_data, start_row = 4, start_col = 1,
                        table_style = "TableStyleMedium9")
wb <- wb_set_row_heights(wb, "7. RGPD", rows = 4:15, heights = 45)
wb <- wb_set_col_widths(wb, "7. RGPD", cols = 1:6, widths = c(18, 30, 55, 22, 45, 22))

# Cookies
wb <- add_section(wb, "7. RGPD", "CATÉGORIES DE COOKIES", 18)
cookies <- data.frame(
  Categorie = c("Cookies nécessaires","Cookies analytiques","Tracking comportemental","Cookie de session JWT"),
  Finalite = c(
    "Authentification, sécurité, maintien de session",
    "Statistiques d'usage anonymisées — pages vues, temps passé",
    "Suivi détaillé du parcours d'apprentissage",
    "Refresh token — maintien connexion"
  ),
  Base_Legale = c("Intérêt légitime / Nécessaire au service","Consentement","Consentement","Nécessaire au service"),
  Duree = c("Session","6 mois","6 mois","30 jours"),
  Opt_in_Requis = c("Non — obligatoire","Oui","Oui","Non — obligatoire"),
  Tier = c("First-party","First-party","First-party","First-party")
)
wb <- wb_add_data_table(wb, "7. RGPD", cookies, start_row = 19, start_col = 1,
                        table_style = "TableStyleMedium9")
wb <- wb_set_row_heights(wb, "7. RGPD", rows = 19:24, heights = 30)

# ============================================================================
# ONGLET 8 — CI/CD et Infra
# ============================================================================
wb <- wb_add_worksheet(wb, "8. CI/CD & Infra", tab_color = "6366F1")
wb <- add_title_block(wb, "8. CI/CD & Infra", "Pipeline GitHub Actions — Docker Compose — Déploiement", 1)

# Pipeline
wb <- add_section(wb, "8. CI/CD & Infra", "PIPELINE CI/CD — GitHub Actions (.github/workflows/deploy.yml)", 4)
pipeline <- data.frame(
  Job = c("backend-tests","frontend-build","deploy"),
  Declencheur = c("push/PR → main","push/PR → main (après backend-tests)","push → main uniquement (après les 2 jobs)"),
  Environnement = c("ubuntu-latest — Python 3.12","ubuntu-latest — Node.js 20","ubuntu-latest"),
  Etapes = c(
    "1. Checkout\n2. pip install requirements.txt\n3. pytest tests/ -v --tb=short\n(DB : sqlite+aiosqlite:///:memory:)",
    "1. Checkout\n2. npm install --legacy-peer-deps\n3. npm run lint (ESLint next/core-web-vitals)\n4. npm run build (Next.js static export)\n5. Upload artifact apps/web/out/",
    "1. Download artifact\n2. actions/deploy-pages@v4 → GitHub Pages"
  ),
  Tests = c("39 tests (34 auth + 5 analytics)","Lint + build complet","—"),
  URL_Prod = c("—","—","https://paamiandleroy.github.io/Plateform-POC/")
)
wb <- wb_add_data_table(wb, "8. CI/CD & Infra", pipeline, start_row = 5, start_col = 1,
                        table_style = "TableStyleMedium12")
wb <- wb_set_row_heights(wb, "8. CI/CD & Infra", rows = 5:9, heights = 80)

# Docker
wb <- add_section(wb, "8. CI/CD & Infra", "DOCKER COMPOSE — Environnement de développement local", 12)
docker_services <- data.frame(
  Service = c("postgres","api","web"),
  Image = c("postgres:16-alpine","Dockerfile local (python:3.12-slim)","Dockerfile local (node:20-alpine)"),
  Port = c("5432","8000","3000"),
  Depends_On = c("—","postgres (healthy)","api"),
  Healthcheck = c("pg_isready — interval 5s, retries 5","—","—"),
  Variables_Env = c(
    "POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB",
    "DATABASE_URL, SECRET_KEY, ALLOWED_DOMAINS, SMTP_*, ANTHROPIC_API_KEY, OPENAI_API_KEY",
    "NEXT_PUBLIC_API_URL"
  )
)
wb <- wb_add_data_table(wb, "8. CI/CD & Infra", docker_services, start_row = 13, start_col = 1,
                        table_style = "TableStyleMedium12")
wb <- wb_set_row_heights(wb, "8. CI/CD & Infra", rows = 13:17, heights = 40)

# Frontend deployment
wb <- add_section(wb, "8. CI/CD & Infra", "DÉPLOIEMENT FRONTEND", 20)
deploy_data <- data.frame(
  Parametre = c("Mode de rendu","basePath","Output directory","CDN","Limitations"),
  Valeur = c(
    "output: 'export' — HTML/CSS/JS statiques — aucun SSR",
    "/Plateform-POC (GitHub Pages subdirectory)",
    "apps/web/out/ — servi tel quel",
    "GitHub Pages CDN (Fastly) — HTTPS automatique",
    "Pas de server-side API routes — pas de middleware Next.js — pas de ISR/SSG dynamique"
  )
)
wb <- wb_add_data_table(wb, "8. CI/CD & Infra", deploy_data, start_row = 21, start_col = 1,
                        table_style = "TableStyleLight11")
wb <- wb_set_row_heights(wb, "8. CI/CD & Infra", rows = 21:27, heights = 30)
wb <- wb_set_col_widths(wb, "8. CI/CD & Infra", cols = 1:6, widths = c(22, 55, 65, 28, 22, 55))

# ============================================================================
# ONGLET 9 — Variables d'environnement
# ============================================================================
wb <- wb_add_worksheet(wb, "9. Variables Env", tab_color = "D97706")
wb <- add_title_block(wb, "9. Variables Env", "Variables d'environnement requises — Backend et Frontend", 1)

# Backend
wb <- add_section(wb, "9. Variables Env", "BACKEND — apps/api/.env", 4)
env_backend <- data.frame(
  Variable = c("DATABASE_URL","SECRET_KEY","ALGORITHM","ACCESS_TOKEN_EXPIRE_MINUTES",
                "REFRESH_TOKEN_EXPIRE_DAYS","ALLOWED_DOMAINS","SMTP_HOST","SMTP_PORT",
                "SMTP_USER","SMTP_PASSWORD","FRONTEND_URL","ANTHROPIC_API_KEY","OPENAI_API_KEY"),
  Exemple = c("postgresql://user:pass@localhost/hiplatform","[32+ chars aléatoires sécurisés]","HS256",
               "15","30","polytechnique.edu,telecom-paris.fr,hec.fr",
               "smtp.example.com","587","noreply@hi-paris.fr","[secret]",
               "https://hiplatform.hi-paris.fr","sk-ant-...","sk-..."),
  Obligatoire = c("Oui","Oui","Oui","Oui","Oui","Oui","Oui","Oui","Oui","Oui","Oui","Oui (Studio IA)","Oui (transcription)"),
  Description = c(
    "URL complète PostgreSQL avec credentials",
    "Clé secrète JWT — NE PAS COMMITER — rotation annuelle recommandée",
    "Algorithme JWT — HS256 uniquement dans le MVP",
    "Durée de vie access token en minutes",
    "Durée de vie refresh token en jours",
    "Liste de domaines email autorisés séparés par des virgules (ou fichier allowed_domains.txt)",
    "Serveur SMTP sortant",
    "Port SMTP (587 STARTTLS ou 465 SSL)",
    "Adresse email expéditrice OTP",
    "Mot de passe SMTP — stocker dans vault",
    "URL du frontend — utilisé pour CORS et liens emails",
    "Clé API Anthropic — pour Hi! Studio (génération quiz/cours)",
    "Clé API OpenAI — pour transcription Whisper"
  )
)
wb <- wb_add_data_table(wb, "9. Variables Env", env_backend, start_row = 5, start_col = 1,
                        table_style = "TableStyleMedium3")
wb <- wb_set_row_heights(wb, "9. Variables Env", rows = 5:19, heights = 30)

# Frontend
wb <- add_section(wb, "9. Variables Env", "FRONTEND — apps/web/.env.local", 22)
env_frontend <- data.frame(
  Variable = c("NEXT_PUBLIC_API_URL"),
  Exemple = c("https://api.hiplatform.hi-paris.fr"),
  Obligatoire = c("Oui"),
  Description = c("URL de base de l'API backend — exposée côté client (NEXT_PUBLIC_) — HTTPS en production")
)
wb <- wb_add_data_table(wb, "9. Variables Env", env_frontend, start_row = 23, start_col = 1,
                        table_style = "TableStyleMedium3")

# Secrets
wb <- add_section(wb, "9. Variables Env", "SECRETS GITHUB ACTIONS (à configurer dans Settings > Secrets)", 27)
secrets <- data.frame(
  Secret = c("DATABASE_URL","SECRET_KEY","SMTP_PASSWORD","ANTHROPIC_API_KEY","OPENAI_API_KEY"),
  Utilise_Dans = c("backend-tests (DB SQLite en CI — non requis)","Job backend-tests",
                    "Job backend-tests","Job backend-tests","Job backend-tests"),
  Niveau_Sensibilite = c("Critique","Critique","Élevé","Élevé","Élevé")
)
wb <- wb_add_data_table(wb, "9. Variables Env", secrets, start_row = 28, start_col = 1,
                        table_style = "TableStyleMedium3")
wb <- wb_set_row_heights(wb, "9. Variables Env", rows = 28:34, heights = 25)
wb <- wb_set_col_widths(wb, "9. Variables Env", cols = 1:4, widths = c(35, 35, 18, 70))

# ============================================================================
# ONGLET 10 — Roadmap V2
# ============================================================================
wb <- wb_add_worksheet(wb, "10. Roadmap V2", tab_color = CLR_GRAY)
wb <- add_title_block(wb, "10. Roadmap V2", "Fonctionnalités hors MVP — Planification post-V1", 1)

roadmap <- data.frame(
  Fonctionnalite = c(
    "SSO / SAML 2.0 (Renater)",
    "Déploiement OVH Cloud",
    "Lecteur vidéo auto-hébergé",
    "Import/Export SCORM",
    "Connexion SQLAlchemy directe (suppression InMemoryStore)",
    "Mode PWA + offline",
    "Internationalisation FR/EN",
    "Analytics temps réel (WebSocket)",
    "Rate limiting (Nginx/Traefik)",
    "Headers de sécurité HTTP (HSTS, X-Frame-Options, CSP)",
    "Notification violation données (Art. 33 RGPD)",
    "Désignation DPO (Art. 37 RGPD)",
    "Import PDF/PPTX vers cours",
    "Hi! Cert avancé (badging Open Badges 3.0)"
  ),
  Priorite = c("Haute","Haute","Moyenne","Moyenne","Critique","Basse","Basse","Basse","Haute","Haute","Haute","Haute","Moyenne","Basse"),
  Justification = c(
    "Fédération d'identité académique française — simplification connexion IPP/HEC/Inria",
    "Souveraineté des données — RGPD — scalabilité — SLA",
    "Indépendance de YouTube — stockage OVH S3 — contrôle des données",
    "Interopérabilité Moodle — migration des contenus existants",
    "Persistance réelle en production — actuellement données perdues au redémarrage",
    "Accessibilité apprenants sans connexion stable",
    "Ouverture internationale Hi! PARIS",
    "Dashboard LMS temps réel pour enseignants",
    "Protection brute force OTP — sécurité production",
    "Protection clickjacking, XSS, MITM — sécurité production",
    "Obligation légale RGPD Art.33 — 72h après détection",
    "Obligation légale RGPD Art.37 pour organismes publics",
    "Conversion présentations existantes — adoption enseignants",
    "Standard international Open Badges — reconnaissance externe"
  ),
  Sprint_Estime = c("V2 Sprint 1","V2 Sprint 1","V2 Sprint 2","V2 Sprint 3",
                     "URGENT — avant production","V2 Sprint 4","V2 Sprint 3","V2 Sprint 4",
                     "URGENT — avant production","URGENT — avant production",
                     "URGENT — avant production","URGENT — avant production",
                     "V2 Sprint 2","V2 Sprint 4"),
  Complexite = c("Élevée","Moyenne","Moyenne","Élevée","Faible","Moyenne","Élevée","Élevée",
                  "Faible","Faible","Faible","—","Moyenne","Élevée")
)
wb <- wb_add_data_table(wb, "10. Roadmap V2", roadmap, start_row = 4, start_col = 1,
                        table_style = "TableStyleMedium2")
wb <- wb_set_row_heights(wb, "10. Roadmap V2", rows = 4:19, heights = 45)
wb <- wb_set_col_widths(wb, "10. Roadmap V2", cols = 1:5, widths = c(35, 14, 70, 28, 15))

# ============================================================================
# ONGLET 11 — Structure des dossiers
# ============================================================================
wb <- wb_add_worksheet(wb, "11. Structure Dossiers", tab_color = "0EA5E9")
wb <- add_title_block(wb, "11. Structure Dossiers", "Arborescence du monorepo — rôle de chaque dossier/fichier clé", 1)

structure_data <- data.frame(
  Chemin = c(
    "apps/web/",
    "apps/web/app/(auth)/",
    "apps/web/app/(platform)/",
    "apps/web/app/(platform)/dashboard/",
    "apps/web/app/(platform)/tube/",
    "apps/web/app/(platform)/courses/",
    "apps/web/app/(platform)/moocs/",
    "apps/web/app/(platform)/apps/",
    "apps/web/app/(platform)/studio/",
    "apps/web/app/(platform)/my-learning/",
    "apps/web/app/(platform)/lms/",
    "apps/web/app/(platform)/admin/",
    "apps/web/app/(platform)/insights/",
    "apps/web/app/(platform)/profile/",
    "apps/web/components/platform/",
    "apps/web/components/ui/",
    "apps/web/lib/api.ts",
    "apps/web/lib/auth.tsx",
    "apps/web/lib/mock.ts",
    "apps/web/tailwind.config.ts",
    "apps/api/",
    "apps/api/main.py",
    "apps/api/routers/",
    "apps/api/models/",
    "apps/api/schemas/",
    "apps/api/services/",
    "apps/api/core/config.py",
    "apps/api/core/security.py",
    "apps/api/core/deps.py",
    "apps/api/core/store.py",
    "apps/api/alembic/versions/",
    "apps/api/tests/",
    "packages/shared/",
    ".github/workflows/deploy.yml",
    "docker-compose.yml"
  ),
  Type = c(
    "Dossier","Dossier","Dossier","Page","Page","Page","Page","Page","Page","Page","Page","Page","Page","Page",
    "Dossier","Dossier","Fichier","Fichier","Fichier","Fichier",
    "Dossier","Fichier","Dossier","Dossier","Dossier","Dossier",
    "Fichier","Fichier","Fichier","Fichier","Dossier","Dossier","Dossier","Fichier","Fichier"
  ),
  Role = c(
    "Frontend Next.js 14 complet",
    "Routes publiques (non authentifiées) — login, register, complete-profile, privacy, cgu",
    "Routes protégées — authentification requise via AuthProvider",
    "Tableau de bord utilisateur — KPIs personnels, raccourcis modules",
    "Hi! Tube — lecteur vidéo + catalogue + commentaires",
    "Hi! Course — catalogue + lecteur de cours bloc par bloc",
    "Hi! MOOC — parcours structurés avec modules prérequis",
    "Hi! App — catalogue d'applications interactives",
    "Hi! Studio — builder IA pour enseignants (excel-quiz, video-course)",
    "Mon apprentissage — progression, badges, certificats",
    "LMS — tableau de bord cohorte pour enseignants",
    "Admin — KPIs plateforme, gestion utilisateurs, exports CSV",
    "Inside Insight — bibliothèque d'articles de recherche",
    "Profil utilisateur + gestion RGPD (export, suppression, consentement)",
    "Composants métier partagés : Nav, Footer, VideoCard, CourseCard, MOOCCard, AppCard, CookieBanner",
    "Composants UI : Button, Input, Badge, Avatar, Spinner (design system Hi!)",
    "Client HTTP typé (fetch + credentials) — toutes les fonctions d'appel API",
    "AuthProvider React Context + hook useAuth() — gestion JWT et refresh",
    "Données de démonstration — mode dev sans backend",
    "Configuration Tailwind — couleurs brand Hi!, tokens CSS, polices",
    "Backend FastAPI complet",
    "Point d'entrée — création app, enregistrement routers, configuration CORS middleware",
    "9 routers FastAPI (auth, users, videos, courses, moocs, apps, studio, learning, analytics)",
    "5 fichiers SQLAlchemy models (User, Video+Comment, Course+Block+Progress, MOOC+Module+Enrollment, App)",
    "Schémas Pydantic — validation des données entrantes et sortantes de l'API",
    "Services métier : ai.py (Claude), transcription.py (Whisper), certificate.py (fpdf2), email.py (SMTP)",
    "Configuration globale depuis variables d'environnement",
    "Fonctions JWT : create_access_token, create_refresh_token, verify_token",
    "Dépendances FastAPI : get_current_user(), require_role() — injection dans les routes",
    "Store Python en mémoire (dev) — remplacera SQLAlchemy sessions en staging",
    "3 fichiers de migration Alembic (0001, 0002, 0003)",
    "test_auth.py (34 tests) + test_analytics.py (5 tests)",
    "Types TypeScript partagés entre frontend et backend (interfaces User, Course, Video…)",
    "Pipeline CI/CD — 3 jobs : backend-tests → frontend-build → deploy",
    "Orchestration Docker : postgres 16 + api + web (avec healthcheck)"
  )
)
wb <- wb_add_data_table(wb, "11. Structure Dossiers", structure_data, start_row = 4, start_col = 1,
                        table_style = "TableStyleMedium2")
wb <- wb_set_row_heights(wb, "11. Structure Dossiers", rows = 4:40, heights = 35)
wb <- wb_set_col_widths(wb, "11. Structure Dossiers", cols = 1:3, widths = c(52, 12, 80))

# ============================================================================
# Freeze panes + zoom sur tous les onglets
# ============================================================================
sheets_all <- c("1. Vue d'ensemble","2. Stack Technique","3. Modules","4. API Endpoints",
                "5. Schéma de données","6. Sécurité & Auth","7. RGPD","8. CI/CD & Infra",
                "9. Variables Env","10. Roadmap V2","11. Structure Dossiers")

for (s in sheets_all) {
  wb <- wb_freeze_pane(wb, s, first_row = TRUE)
}

# Tab sur 1. Vue d'ensemble par défaut
wb <- wb_set_active_sheet(wb, which(wb$sheet_names == "1. Vue d'ensemble"))

# Écriture du fichier
wb_save(wb, OUT)
cat("✅ Fichier Excel généré :", OUT, "\n")
