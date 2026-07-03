import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from alembic.config import Config
from alembic import command

from core.config import settings
from core.logging_config import configure_logging
from core.domains import load_domains_from_db
from routers import auth, users, videos, courses, moocs, apps, studio, learning, analytics, insights, cohorts, moderation, submissions

configure_logging()
logger = logging.getLogger(__name__)


def run_migrations():
    """Lance alembic upgrade head au démarrage — idempotent."""
    try:
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        logger.info("✅ Migrations OK")
    except Exception as e:
        logger.warning("⚠️  Migrations skipped: %s", e)


def bootstrap_super_admin():
    """
    Promeut l'utilisateur portant SUPER_ADMIN_EMAIL au rôle `super_admin`.
    Idempotent, rejoué à chaque démarrage (permet de définir l'env après coup).
    Ne crée pas le compte : l'email doit d'abord s'être connecté via OTP.
    """
    email = (settings.SUPER_ADMIN_EMAIL or "").strip().lower()
    if not email:
        return
    try:
        from database import SessionLocal
        from models.user import User, UserRole

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                logger.info("Super admin bootstrap: %s pas encore inscrit — ignoré", email)
                return
            if user.role != UserRole.super_admin:
                user.role = UserRole.super_admin
                db.commit()
                logger.info("✅ Super admin bootstrap: %s promu super_admin", email)
        finally:
            db.close()
    except Exception as e:
        logger.warning("⚠️  Super admin bootstrap skipped: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_migrations()
    bootstrap_super_admin()  # Promeut le fondateur (SUPER_ADMIN_EMAIL) si présent
    load_domains_from_db()  # Charge les domaines autorisés depuis Supabase
    yield


app = FastAPI(
    title="Hi! Platform API",
    version="0.1.0",
    description="API for Hi! Platform — Hi! PARIS pedagogical platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.CORS_VERCEL_REGEX or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(videos.router)
app.include_router(courses.router)
app.include_router(moocs.router)
app.include_router(apps.router)
app.include_router(studio.router)
app.include_router(learning.router)
app.include_router(analytics.router)
app.include_router(insights.router)
app.include_router(cohorts.router)
app.include_router(moderation.router)
app.include_router(submissions.router)


@app.get("/health")
def health():
    return {"status": "ok"}
