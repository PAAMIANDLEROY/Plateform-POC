"""
Tests des blocs de contenu éditables — brouillon / publication.
"""
import os
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_hi_platform.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("ALLOWED_DOMAINS", "polytechnique.edu,hec.fr,test.com")
os.environ.setdefault("ANTHROPIC_API_KEY", "")
os.environ.setdefault("OPENAI_API_KEY", "")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")

import uuid
import pytest
from fastapi.testclient import TestClient

from database import Base, engine, SessionLocal
import models  # noqa: F401
Base.metadata.create_all(bind=engine)

from main import app
from core.deps import get_current_user, get_current_user_optional
from core.store import CurrentUser
from models.user import User, UserRole

client = TestClient(app)


def _mk_user(role: UserRole = UserRole.student) -> str:
    db = SessionLocal()
    try:
        u = User(id=str(uuid.uuid4()), email=f"{uuid.uuid4().hex[:8]}@test.com",
                 first_name="T", last_name="U", hashed_password="", role=role,
                 is_active=True, is_verified=True)
        db.add(u); db.commit(); return u.id
    finally:
        db.close()


def _act(role: str, user_id: str = "actor") -> None:
    cu = CurrentUser({"id": user_id, "email": f"{user_id}@test.com", "role": role, "is_verified": True})
    app.dependency_overrides[get_current_user] = lambda: cu
    app.dependency_overrides[get_current_user_optional] = lambda: cu


def _anon() -> None:
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides[get_current_user_optional] = lambda: None


@pytest.fixture(autouse=True)
def _reset():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


def _get_block(key: str):
    return next((b for b in client.get("/api/v1/content").json() if b["key"] == key), None)


def test_list_content_is_public():
    r = client.get("/api/v1/content")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_edit_requires_admin():
    assert client.put("/api/v1/content/neuripp.intro", json={"value": "x"}).status_code == 401
    _act("teacher", _mk_user(UserRole.teacher))
    assert client.put("/api/v1/content/neuripp.intro", json={"value": "x"}).status_code == 403


def test_put_creates_draft_hidden_from_public():
    key = f"test.block.{uuid.uuid4().hex[:6]}"
    _act("admin", _mk_user(UserRole.admin))
    r = client.put(f"/api/v1/content/{key}", json={"value": "Bonjour"})
    assert r.status_code == 200
    assert r.json()["has_draft"] is True
    assert r.json()["draft_value"] == "Bonjour"
    assert r.json()["value"] == ""   # pas encore publié

    # Public : ne voit pas le brouillon
    _anon()
    b = _get_block(key)
    assert b is not None and b["value"] == "" and b["draft_value"] is None


def test_publish_makes_draft_public():
    key = f"test.block.{uuid.uuid4().hex[:6]}"
    _act("admin", _mk_user(UserRole.admin))
    client.put(f"/api/v1/content/{key}", json={"value": "v1"})
    r = client.post(f"/api/v1/content/{key}/publish")
    assert r.status_code == 200
    assert r.json()["value"] == "v1"
    assert r.json()["has_draft"] is False

    _anon()
    b = _get_block(key)
    assert b is not None and b["value"] == "v1"


def test_publish_unknown_block():
    _act("admin", _mk_user(UserRole.admin))
    assert client.post("/api/v1/content/nope.block/publish").status_code == 404


def test_invalid_key_rejected():
    _act("admin", _mk_user(UserRole.admin))
    assert client.put("/api/v1/content/Bad Key!", json={"value": "x"}).status_code == 400
