from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from alembic.config import Config
from alembic import command

from core.config import settings
from routers import auth, users, videos, courses, moocs, apps, studio, learning, analytics


def run_migrations():
    """Lance alembic upgrade head au démarrage — idempotent."""
    try:
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        print("✅ Migrations OK")
    except Exception as e:
        print(f"⚠️  Migrations skipped: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_migrations()
    yield


app = FastAPI(
    title="Hi! Platform API",
    version="0.1.0",
    description="API for Hi! Platform — Hi! PARIS pedagogical platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
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


@app.get("/health")
def health():
    return {"status": "ok"}
