import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from alembic.config import Config
from alembic import command

from core.config import settings
from core.logging_config import configure_logging
from core.domains import load_domains_from_db
from routers import auth, users, videos, courses, moocs, apps, studio, learning, analytics, insights

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_migrations()
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


@app.get("/health")
def health():
    return {"status": "ok"}
